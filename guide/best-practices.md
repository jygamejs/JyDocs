# Best Practices

## Project Structure

```
my-game/
├── index.html
├── src/
│   ├── main.js              # Entry point — creates Game, runs initial scene
│   ├── scenes/              # One file per scene
│   ├── entities/            # Prefab definitions, entity factories
│   ├── systems/             # Custom ECS systems
│   ├── components/          # Custom component definitions
│   └── assets/
├── package.json
└── vite.config.js
```

Keep scenes focused. If a scene exceeds 200 lines, extract logic into separate files.

## Scene Lifecycle

### Scenes Are Single-Use

Create a new scene instance each time you enter a state. Never re-use an exited scene.

```js
game.switchScene(new MenuScene())  // ✅
game.switchScene(menuScene)         // ❌ already exited
```

### Setup in `onEnter()`, Teardown in `onExit()`

```js
class GameScene extends Scene {
  onEnter() {
    this.player = new Sprite(100, 100, 32, 32);
    this.player.velocity.x = 200;

    this._actionMap.bind("jump", new KeyBinding(KeyCode.SPACE));
  }
}
```

### Use the Scene Stack

Push overlays (pause, inventory) on top instead of switching scenes:

```js
class GameScene extends Scene {
  onEnter() {
    this._actionMap.bind("pause", new KeyBinding(KeyCode.ESCAPE));
  }
  update(dt) {
    if (this._actionMap.getState("pause").justPressed) {
      this.pushScene(new PauseScene());
    }
  }
}
```

## Sprites

### Creating Sprites

```js
const player = new Sprite(100, 200, 32, 48);
player.style.fill = "#B0DE8E";
```

Sprites are created in the scene's default world automatically. They are processed by all built-in systems (movement, animation, collision, rendering).

### Animation

Use `sprite.animation.play(name)` to start an animation. It is **idempotent** — calling it repeatedly with the same name does not reset the animation.

```js
// Start walking animation
player.animation.play("walk");

// Later, switch to jump — resets to frame 0
player.animation.play("jump");
```

Use `restart(name)` when you need to force a reset even if the same animation is already playing:

```js
// Force restart the hurt animation even if already playing
player.animation.restart("hurt");
```

### Destroy When Done

```js
player.destroy(); // kills entity + cleans up groups
```

## Groups

### Group Types

```js
// Sprite-backed (mutable)
const items = new Group();
items.add(potion);

// Query-backed (read-only, auto-populated)
const enemies = Group.query(world, { all: [Transform, EnemyTag] });
```

### Enable Spatial Hash for Large Groups

```js
group.useSpatialHash(64);
```

### Prefer Callback Collision

```js
bullets.collideGroup(enemies, (bullet, enemy) => {
  bullet.destroy();
  enemy.health--;
});
```

## Camera

Access the camera through `scene.view.camera`. The engine Scene creates a default View automatically.

```js
class GameScene extends Scene {
  onEnter() {
    this.view.camera.lookAt(400, 300);
    this.view.camera.zoom = 2;
  }

  update(dt) {
    // Track a sprite
    this.view.camera.target = this.player;
  }
}
```

For coordinate conversion (screen ↔ world):

```js
// Via the View
const worldPt = this.view.screenToWorld(screenX, screenY);
const screenPt = this.view.worldToScreen(worldX, worldY);

// Or via the InputSystem's CoordinateSystem
const pt = game.inputSystem.coordinateSystem.toWorld({ x: pointer.x, y: pointer.y });
```

## Game Loop

### Never Put Simulation Logic in `render()`

```js
// ❌ Bad — frame-rate dependent
render(ctx) {
  this.player.x += 5;
}

// ✅ Good — runs at fixed timestep
update(dt) {
  this.player.x += 200 * dt;
}
```

## Asset Loading

```js
class BootScene extends Scene {
  async onEnter() {
    const task = ImageLoader.loadAll({
      player: "player.png",
      enemy: "enemy.png",
    });
    task.onProgress((l, t) => console.log(`${Math.round(l/t*100)}%`));
    await task;
    this.switchScene(new MenuScene());
  }
}
```

## Performance

### Use `ActivePool` for Frequently Created/Destroyed Objects

```js
const bulletPool = new ActivePool({
  create: () => new Sprite(0, 0, 4, 4),
  initialSize: 100,
});
```

### Spatial Hash for Large Collision Groups

Enable spatial hash when a group exceeds ~50 sprites to maintain collision performance.

### Pool-Friendly Methods

```js
Vec2.lerpInto(out, a, b, t);
rect.getCenter(out);
```

## Custom ECS Systems

When you need custom game logic that runs on many entities, define a system:

```js
class GravitySystem extends System {
  static query = { all: [Velocity] };
  static priority = 0;

  update(ctx, dt) {
    const vy = ctx.column(Velocity, "y");
    for (let r = 0; r < ctx.entityCount; r++) {
      vy[r] += 500 * dt;
    }
  }
}
```

Register it with your scene's world:

```js
class MyScene extends Scene {
  onEnter() {
    this.world.addSystem(GravitySystem);
  }
}
```
