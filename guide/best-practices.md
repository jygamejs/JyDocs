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

### Setup in `enter()`, Teardown in `exit()`

```js
class GameScene extends Scene {
  enter() {
    const world = this.world
    this.player = world.createEntity()
    world.addMany(this.player, Transform, Velocity, Renderable, Visible, Collider, RenderBounds)
    this.on(Input, 'keydown', this.handleInput)
  }
}
```

### Use the Scene Stack

Push overlays (pause, inventory) on top instead of switching scenes:

```js
class GameScene extends Scene {
  update(dt) {
    if (Input.justPressed('ESCAPE')) {
      this.pushScene(new PauseScene())
    }
  }
}
```

## ECS Best Practices

### Entities Are Data, Not Objects

Entities are integer IDs. Component data lives in typed arrays, not JavaScript objects. Access component data through the World:

```js
// ✅ ECS way
const vel = world.get(entity, Velocity)
vel.x = 200

// ❌ Avoid storing component objects
entity.velocity = { x: 200, y: 0 }
```

### Use Queries Instead of Manual Collections

```js
// ✅ Let the ECS find matching entities
const enemies = world.query({ all: [Transform, EnemyTag] })

// ❌ Manual list
const enemiesList = []
```

### Keep Systems Focused

Each system should do one thing well:

```js
class GravitySystem extends System {
  static query = { all: [Velocity] }
  static priority = 0

  update(ctx, dt) {
    const vy = ctx.column(Velocity, 'y')
    for (let r = 0; r < ctx.entityCount; r++) {
      vy[r] += 500 * dt
    }
  }
}

class LifetimeSystem extends System {
  static query = { all: [Lifetime] }
  static priority = 10

  update(ctx, dt) {
    const remaining = ctx.column(Lifetime, 'remaining')
    for (let r = 0; r < ctx.entityCount; r++) {
      remaining[r] -= dt
      if (remaining[r] <= 0) {
        ctx.world.destroyEntity(ctx.entities()[r])
      }
    }
  }
}
```

### Priority Ordering

Use `static priority` to control execution order. Lower values run first:

| Priority | Typical System |
|----------|----------------|
| -10 | `HierarchySystem` (world transform computation) |
| 0 | Input processing, velocity updates |
| 1 | Animation |
| 2 | Collision detection |
| 3 | Rendering |
| 10 | Cleanup, lifetime management |

### Use Tags for Entity Roles

```js
class BossTag {}
class InvulnerableTag {}

world.add(entity, BossTag)
world.add(entity, InvulnerableTag)

const bosses = world.query({ all: [Transform, BossTag], none: [InvulnerableTag] })
```

### Prefabs for Reusable Entity Templates

```js
world.createPrefab('bullet')
  .add(Transform, { scaleX: 0.5, scaleY: 0.5 })
  .add(Velocity)
  .add(Renderable, { fillColor: 0xFFFF00FF })
  .add(Collider, { width: 8, height: 8 })
  .add(RenderBounds, { width: 8, height: 8 })
  .tag(ProjectileTag)

const bullet = world.instantiate('bullet', {
  Transform: { x: playerX, y: playerY },
})
```

## Sprite Usage

```js
// Sprites wrap ECS entities — use the underlying world for bulk operations
const player = new Sprite(100, 100, 32, 32)
player.velocity.x = 200
```

### Use `destroy()` When Done

```js
player.destroy() // kills entity + cleans up groups
// Don't use the sprite after destroy
```

## Groups

### Group Types

```js
// Sprite-backed (mutable)
const items = new Group()
items.add(potion)

// Query-backed (read-only, auto-populated)
const enemies = Group.query(world, { all: [Transform, EnemyTag] })
```

### Query-Backed Groups Are Read-Only

```js
const enemies = Group.query(world, { all: [Transform, EnemyTag] })
enemies.add(new Sprite()) // ❌ throws — read-only
```

### Enable Spatial Hash for Large Groups

```js
group.useSpatialHash(64)
```

### Prefer Callback Collision

```js
// Zero-alloc
bullets.collideGroup(enemies, (bullet, enemy) => {
  bullet.destroy()
  enemy.health--
})
```

## Camera

```js
const camera = new Camera(400, 300, 800, 600)
camera.follow(player)
```

## Game Loop

### Never Put Simulation Logic in `render()`

```js
// ❌ Bad
render(ctx) {
  world.get(entity, Velocity).x = 5  // frame-rate dependent!
}

// ✅ Good
update(dt) {
  // world.update(dt) is called automatically by engine Scene
}
```

## State

```js
const gameState = new State({ score: 0, lives: 3 })
gameState.subscribe(s => {
  game.patchUI({ score: `Score: ${s.score}` })
})
```

## Asset Loading

```js
class BootScene extends Scene {
  async enter() {
    const task = ImageLoader.loadAll({
      player: 'player.png',
      enemy: 'enemy.png',
    })
    task.onProgress((l, t) => console.log(`${Math.round(l/t*100)}%`))
    await task
    this.switchScene(new MenuScene())
  }
}
```

## Performance

### Use Bulk Column Access in Systems

```js
// ✅ Fast — direct typed array access
update(ctx, dt) {
  const x = ctx.column(Transform, 'x')
  const y = ctx.column(Transform, 'y')
  const vx = ctx.column(Velocity, 'x')
  const vy = ctx.column(Velocity, 'y')
  for (let r = 0; r < ctx.entityCount; r++) {
    x[r] += vx[r] * dt
    y[r] += vy[r] * dt
  }
}
```

### Use `ActivePool` for Hot Objects

```js
const bulletPool = new ActivePool({
  create: () => new Sprite(0, 0, 4, 4),
  initialSize: 100,
})
```

### Spatial Hash for Groups > 50

### Pool-Friendly Methods

```js
Vec2.lerpInto(out, a, b, t)
rect.getCenter(out)
```
