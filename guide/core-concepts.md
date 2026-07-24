# Core Concepts

## Architecture

Jygame is a **game engine** built around a Scene-based game loop with an underlying Entity-Component-System (ECS) architecture. Most of the time you'll work with high-level APIs — `Scene`, `Sprite`, `Game`, `Camera`, `View` — while the ECS handles performance-critical entity processing behind the scenes.

```
Game ── runs ──► Scene Stack
                  │
                  ├─ owns World (ECS) ── processes Sprite entities
                  ├─ owns View(s) ── each has Camera + Viewport
                  └─ owns InputContext ── action bindings
```

## Game & Game Loop

`Game` is the top-level entry point. It creates the canvas, manages the scene stack, and drives the game loop at a **fixed timestep**.

```js
import { Game, Scene } from "jygame";

const game = new Game({ width: 800, height: 600 });

const scene = new Scene();
scene.update = function (dt) {
  // dt is always 1/60 — deterministic updates
};
scene.render = function (ctx) {
  // Draw everything here
};

game.run(scene);
```

The loop runs in this order each frame:
1. `requestAnimationFrame` fires — real time is measured
2. Real delta feeds an internal accumulator
3. For each accumulated fixed step: `scene.update(fixedDt)` (calls `world.update(dt)` automatically)
4. `scene.interpolate(alpha)` for smooth rendering between steps
5. `scene.render(ctx)` draws to canvas
6. Input state is reset

## Scene & Scene Stack

Scenes organize your game into distinct states (menu, gameplay, pause, game over). They live on a **stack** managed by `Game`. Only the topmost scene receives updates by default.

### Lifecycle Hooks

| Hook | Called When |
|------|-------------|
| `onEnter()` | Scene becomes active — setup here |
| `onExit()` | Scene is exited — teardown here |
| `pause()` | Another scene is pushed on top |
| `resume()` | The scene above is popped |
| `update(dt)` | Each fixed timestep tick |
| `render(ctx)` | Each frame — receives the canvas 2D context |
| `renderUI()` | Returns an HTML string for the DOM overlay |

```js
import { Game, Scene, Sprite, KeyCode, KeyBinding, ActionKind } from "jygame";

class GameScene extends Scene {
  onEnter() {
    this.player = new Sprite(100, 100, 32, 48);
    this.player.style.fill = "#B0DE8E";

    this._actionMap.bind("move", new KeyBinding(KeyCode.KEY_D));
  }

  update(dt) {
    if (this._actionMap.getState("move").pressed) {
      this.player.x += 200 * dt;
    }
  }

  render(ctx) {
    ctx.fillStyle = this.player.style.fill;
    ctx.fillRect(this.player.x, this.player.y, 32, 48);
  }
}

const game = new Game({ width: 800, height: 600 });
game.run(new GameScene());
```

### Stack Operations

Scenes are **single-use** — create a new instance each time.

```js
this.pushScene(new PauseScene());    // push on top (pauses below)
this.popScene();                      // pop current, resume below
this.replaceScene(new GameOverScene()); // replace current in-place
this.switchScene(new MenuScene());    // reset entire stack
```

### Blocking Behaviour

| Property | Default | Description |
|----------|---------|-------------|
| `blocksUpdateBelow` | `true` | Pause `update()` on scenes below |
| `blocksRenderBelow` | `false` | All scenes render bottom to top |

```js
class PauseScene extends Scene {
  constructor() {
    super();
    this.blocksUpdateBelow = true;
    this.blocksRenderBelow = false;
  }
  renderUI() {
    return '<div class="pause-overlay">PAUSED</div>';
  }
}
```

### DOM UI Layer

Return HTML from `renderUI()` and it gets injected into the scene's DOM overlay:

```js
scene.renderUI = function () {
  return `<h1>Score: ${this.score}</h1>`;
};
```

### Event Listener Cleanup

Auto-cleaned when the scene exits:

```js
this.on(document, "click", onClick);       // DOM listener
this.onSwipe(dir => this.move(dir));       // swipe gesture
this.onTap(({ x, y }) => this.place(x, y)); // tap gesture
this.cleanup(() => myTimer.stop());        // custom cleanup
```

## Sprite

`Sprite` is the main way to create visible, movable objects. It wraps an ECS entity behind a simple getter/setter API.

```js
import { Sprite } from "jygame";

const player = new Sprite(100, 200, 32, 48);
player.style.fill = "#B0DE8E";
player.x = 100;
player.y = 200;
player.velocity.x = 200;
```

When created inside a scene (or after the scene has entered), sprites are registered in the scene's default world and processed by all built-in systems — movement, animation, collision, and rendering happen automatically.

### Animation

Define animation clips and control playback through `sprite.animation`:

```js
import { AnimationClip } from "jygame";

// Define clips
player.animation.add("idle", new AnimationClip({
  frames: [idleImg], fps: 1, loop: true,
}));
player.animation.add("walk", new AnimationClip({
  frames: [walk1, walk2, walk3, walk4], fps: 12, loop: true,
}));

// Play — idempotent, does not reset if already playing
player.animation.play("walk");

// Switch to jump — resets to frame 0
player.animation.play("jump");

// Force restart even if already playing
player.animation.restart("hurt");

// Control
player.animation.pause();
player.animation.resume();
player.animation.stop();
```

Use `play(name)` for switching between animations (it only resets when the name changes). Use `restart(name)` when you need to force an animation to replay from the beginning, like a "hurt" or "attack" that should restart even if already playing.

For loading animations from spritesheets or atlases:

```js
import { AnimationPack } from "jygame";

// From individual files
const clips = await AnimationPack.load({ dir: "characters/player", fps: 12 });

// From a spritesheet
const clips = AnimationPack.fromSpriteSheet({
  image: sheetImg,
  frameWidth: 32, frameHeight: 48,
  animations: {
    idle: { row: 0, frames: 4 },
    walk: { row: 1, frames: 6 },
  },
  fps: 12,
});

// From a texture atlas
const clips = AnimationPack.fromJSONAtlas({
  image: atlasImg,
  json: atlasData,
  animations: { idle: ["idle_0", "idle_1"], walk: ["walk_0", "walk_1"] },
});

// Register all clips at once
player.animation.addAll(clips);
player.animation.play("idle");
```

## Group

`Group` is an iterable container for sprites.

```js
// Sprite-backed (mutable)
const items = new Group();
items.add(potion);
items.forEach(s => s.x += 10);

// Query-backed (read-only, auto-populated by ECS query)
const enemies = Group.query(world, { all: [Transform, EnemyTag] });
```

### Collision Detection

```js
group.useSpatialHash(64); // enable for large groups

bullets.collideGroup(enemies, (bullet, enemy) => {
  bullet.destroy();
  enemy.health--;
});
```

## Camera & Views

The engine `Scene` creates a default `View` with a camera. Access and control it via `scene.view`:

```js
class GameScene extends Scene {
  onEnter() {
    // Position the camera
    this.view.camera.lookAt(400, 300);
    this.view.camera.zoom = 2;
  }

  update(dt) {
    // Track a sprite by setting the target
    this.view.camera.target = this.player;
  }
}
```

### Camera API

| Property/Method | Description |
|----------------|-------------|
| `camera.x`, `camera.y` | Center position in world space |
| `camera.zoom` | Scale factor (`1` = normal, `2` = 2× zoomed in) |
| `camera.rotation` | Rotation in radians |
| `camera.target` | If set, camera follows `target.x` / `target.y` automatically |
| `camera.lookAt(x, y)` | Move camera to a world point |
| `camera.translate(dx, dy)` | Pan the camera |

### Coordinate Conversion

```js
// Via the View
const worldPt = this.view.screenToWorld(screenX, screenY);
const screenPt = this.view.worldToScreen(worldX, worldY);

// Via the InputSystem's CoordinateSystem
const pt = game.inputSystem.coordinateSystem.toWorld({ x: pointer.x, y: pointer.y });
```

### Multiple Views

For split-screen, minimaps, or different render layers, add additional views:

```js
import { View } from "jygame";

const minimap = new View({
  viewport: new Viewport(600, 10, 180, 180),
  camera: new Camera(400, 300, 0.25),
  config: new RenderConfig({ clearColor: "#222", layers: Layer.ENTITIES }),
  order: 1,
});

scene.addView(minimap);
```

## Input System

The `InputSystem` is the engine's input layer — created automatically by `Game` and accessible via `game.inputSystem`. It provides device polling and an action-based abstraction over raw input.

### Devices

```js
const kb = game.inputSystem.devices.get(Keyboard);
if (kb.isDown(KeyCode.SPACE)) player.jump();
if (kb.justPressed(KeyCode.KEY_E)) player.interact();
```

| Device | Input Types |
|--------|-------------|
| `Keyboard` | Key state: `isDown`, `justPressed`, `justReleased`, `modifiers` |
| `Mouse` | Button state, position, wheel, double-click |
| `PointerManager` | Multi-touch tracking with pressure, tilt, velocity |
| `GestureEngine` | Gesture recognition (tap, swipe, pinch, rotate) |

### Action System

Bind abstract game actions to input using `ActionMap`. Bindings are only active while the scene is on the scene stack:

```js
this._actionMap.bind("move", new CompositeBinding(ActionKind.VECTOR2, [
  { binding: new KeyBinding(KeyCode.KEY_D), vector: [1, 0] },
  { binding: new KeyBinding(KeyCode.KEY_A), vector: [-1, 0] },
]));
this._actionMap.bind("jump", new KeyBinding(KeyCode.SPACE));

// Read state
const move = this._actionMap.getState("move");
const jump = this._actionMap.getState("jump");
player.x += move.vector.x * speed;
if (jump.justPressed) player.y -= 100;
```

Action states expose: `pressed`, `justPressed`, `justReleased`, `strength`, `vector`.

### Context Stack

Input contexts are evaluated by priority. Higher-priority contexts can block lower ones:

```js
// Pause menu blocks gameplay input
stack.push(new InputContext("pause", pauseMap, { priority: 100, consumePolicy: "block" }));
```

The engine Scene automatically creates an `InputContext`, pushes it on `enter()`, and pops it on `exit()`.

### Coordinate System

The `CoordinateSystem` transforms between four spaces:

| Space | Description |
|-------|-------------|
| `Space.SCREEN` | Raw DOM client coordinates |
| `Space.VIEWPORT` | Logical canvas pixels (minus offset ÷ DPR) |
| `Space.WORLD` | Game world coordinates (camera-projected) |
| `Space.UI` | Overlay coordinates (identity with viewport) |

```js
const worldPt = game.inputSystem.coordinateSystem.toWorld({ x: 100, y: 200 });
```

### See Also

- [InputSystem](/api/input/input-system) — full API reference
- [Devices](/api/input/devices) — all device types
- [Actions](/api/input/actions) — action maps, bindings, contexts
- [Gestures](/api/input/gestures) — gesture recognition
- [Coordinate System](/api/input/coordinate-system) — space transforms

## Particles

The particle system uses a **backend architecture** — a `ParticleSystem` manages simulation and rendering, `ParticleEmitter` controls emission with shape-based spawning, and **modifiers** control particle behaviour over time.

See [Getting Started → Particles](/guide/getting-started#particles) for full examples with fire and explosion effects.

```js
const ps = new ParticleSystem({
  backend: new GpuParticleBackend({
    storage: new SoAParticleStorage({ capacity: 1000 }),
    renderer: new CanvasParticleRenderer({ renderParticle: ... }),
  }),
});
ps.addModifier(new VelocityModifier({ drag: 0.3 }));
ps.addModifier(new ColorModifier({ from: "#ffcc00", to: "#ff2200" }));

const emitter = new ParticleEmitter({
  system: ps, rate: 120,
  shape: new ConeShape({ radius: 15, angle: Math.PI / 3, speed: [120, 200] }),
});
emitter.setPosition(400, 500);
emitter.start();
```

## Audio

The engine provides `AudioManager` for sound effects and music. Define sounds with `audio.define()`, load files with `AudioLoader`, then play them.

```js
import { AudioManager, AudioLoader } from "jygame";

const audio = new AudioManager();
audio.define("jump", { source: "sounds/jump.wav" });
audio.define("bgm", { source: "sounds/bg.ogg", group: "music", loop: true });

await AudioLoader.load("sounds/jump.wav");
await AudioLoader.load("sounds/bg.ogg");

audio.play("jump");

const music = audio.music("bgm");
music.volume = 0.5;
music.play();
music.fadeIn(2);

// Call audio.update(dt) each frame for fade/transition advancement
```

## Asset Loading

Load images, fonts, and audio with progress tracking:

```js
import { ImageLoader, FontLoader, LoadingTask } from "jygame";

// Images
const img = await ImageLoader.load("player.png");
const assets = await ImageLoader.loadAll({ player: "player.png", bg: "bg.png" });
const cached = ImageLoader.get("player");

// Fonts
await FontLoader.load("PixelFont", "fonts/pixel.woff2");

// Custom loading screen
const task = ImageLoader.loadAll({ /* ... */ });
task.onProgress((loaded, total) => updateBar(loaded / total));
await task;
```

## Color System

```js
import { Color, Colors, Palettes } from "jygame";

// Direct color lookup
ctx.fillStyle = Color.CyberYellow;

// Organized by family
sprite.style.fill = Colors.GreenShades.MagicalMalachite;

// Curated palettes
const palette = Palettes.Terracotta; // array of { name, hex, family }
```

## Debug & Diagnostics

Debug is enabled by default (`debug: true` in `Game`). Press `Ctrl+F3` to open the debug workspace, or toggle the in-game overlay:

```js
game.debug.show();
game.debug.hide();
game.debug.toggle();
```

See [Debug & Diagnostics](/api/debug/getting-started) for custom metrics, triggers, and captures.

## Object Pooling

Reuse short-lived objects to avoid GC pressure with `ActivePool`:

```js
const bulletPool = new ActivePool({
  create: () => new Sprite(0, 0, 8, 8),
  reset: (b) => { b.visible = false; },
  initialSize: 50,
  maxSize: 200,
});

const b = bulletPool.acquire();
bulletPool.release(b);
bulletPool.forEachActive(b => b.update(dt));
```

---

## ECS Architecture (Advanced)

The engine is built on an **archetype-based Entity-Component-System (ECS)** model. You don't need to interact with it directly for most tasks — `Sprite`, `Scene`, and `Group` handle it for you — but understanding it helps when writing custom systems or optimizing performance.

### World

Each `Scene` owns a `World` — the central hub that manages entities, components, systems, queries, and resources.

```js
const world = scene.world; // created automatically by the Scene
world.update(dt);           // runs all systems in priority order
```

### Entities

Entities are integer IDs. Create and destroy them through the World:

```js
const entity = world.createEntity();
world.destroyEntity(entity);
world.isAlive(entity); // boolean
```

### Components

Components are classes with a static typed schema. Built-in components include `Transform`, `Velocity`, `Renderable`, `Visible`, `Collider`, `RenderBounds`, and `Animation`:

```js
import { Transform, Velocity, Renderable } from "jygame";

world.addComponent(entity, Transform);
world.setComponent(entity, Transform, { x: 100, y: 200 });
world.getComponent(entity, Transform); // live view with getters/setters
world.hasComponent(entity, Velocity);  // boolean
world.removeComponent(entity, Velocity);

// Shorter aliases
world.add(entity, Transform);
world.set(entity, Transform, { x: 100 });
world.get(entity, Transform);
```

**Batch operations**:

```js
world.addMany(entity, Transform, Velocity, Renderable);
world.removeMany(entity, Velocity);
world.clear(entity);   // remove all components
world.clone(entity);   // deep copy
```

**Builder pattern**:

```js
const entity = world
  .entity()
  .with(Transform, { x: 100, y: 200 })
  .with(Velocity)
  .with(Renderable, { fillColor: 0xFF0000FF })
  .create();
```

### Systems

Systems process entities matching a component query. Built-in systems are registered automatically by `DefaultWorldBuilder`:

| System | Priority | Query | Description |
|--------|----------|-------|-------------|
| `MovementSystem` | 0 | `[Transform, Velocity]` | `pos += vel * dt` |
| `AnimationSystem` | 1 | `[Animation, Renderable]` | Frame advancement |
| `CollisionSystem` | 2 | `[Transform, Collider, Visible]` | Spatial hash rebuild |
| `RenderSystem` | 3 | `[Transform, Renderable, RenderBounds, Visible]` | Batched canvas draw |

To write a custom system:

```js
import { System } from "jygame";

class GravitySystem extends System {
  static query = { all: [Transform, Velocity] };
  static priority = 0;

  update(ctx, dt) {
    const vy = ctx.column(Velocity, "y");
    for (let r = 0; r < ctx.entityCount; r++) {
      vy[r] += 500 * dt;
    }
  }
}

world.addSystem(GravitySystem);
```

### Queries

Find entities matching a component set:

```js
const enemies = world.query({ all: [Transform, EnemyTag] });
for (const entity of enemies.entities()) { /* ... */ }
```

### Resources

Share singletons across systems:

```js
world.setResource(MyData, new MyData());
world.getResource(MyData);
```

### Prefabs

Reusable entity blueprints:

```js
world.createPrefab("bullet")
  .add(Transform, { scaleX: 0.5 })
  .add(Velocity)
  .add(Renderable, { fillColor: 0xFFFF00FF })
  .tag(ProjectileTag);

const bullet = world.instantiate("bullet", {
  Transform: { x: playerX, y: playerY },
  Velocity: { x: aimX * 500, y: aimY * 500 },
});
```

### Events

ECS events let systems communicate without direct coupling:

```js
class CollisionEvent { static fields = ["entityA", "entityB"]; }
world.registerEvent(CollisionEvent);

// Emit
world.events.emit(CollisionEvent, { entityA: player, entityB: enemy });

// Read (in a system update)
for (const evt of world.events.read(CollisionEvent)) { /* ... */ }
```

### Hierarchy

Parent-child relationships for sprites/entities:

```js
world.attach(child, parent);
world.detach(child);
world.parentOf(entity);   // entity ID or null
world.childrenOf(entity); // iterable
```

Moving the parent moves all children. Rotating the parent rotates children around the parent's origin.
