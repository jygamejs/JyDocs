# Core Concepts

## Architecture

Jygame uses a pure **archetype-based Entity-Component-System (ECS)** model.

- **Entities** are packed 32-bit integer IDs (`(generation << 24) | slot`)
- **Components** are classes with typed schemas (e.g., `Transform { x: f32, y: f32 }`)
- **Systems** extend `System` with static `query` and `priority`
- **World** is the central orchestrator — owns entities, components, tables, queries, systems, and resources

Entities are grouped into **archetypes** — unique sets of component IDs. Each archetype has a dense table of typed arrays (one column per component field). When you add or remove a component, the entity moves to a different archetype.

```
Archetype [Transform, Velocity]
┌─────────┬──────────┬──────────┐
│ entity  │ Transform│ Velocity │
│ (Uint32)│ x,y,...  │ x,y      │
├─────────┼──────────┼──────────┤
│   1     │ 100,200  │ 0,0      │
│   2     │ 300,400  │ -5,10    │
└─────────┴──────────┴──────────┘
```

## World

The `World` is the central hub. Each engine `Scene` creates its own World via `DefaultWorldBuilder.createDefault()`.

```js
import { DefaultWorldBuilder } from 'jygame'

const world = DefaultWorldBuilder.createDefault()
world.update(dt) // runs all systems in priority order
```

## Entities

```js
const entity = world.createEntity()
world.destroyEntity(entity)
world.isAlive(entity) // boolean
```

## Components

Components are classes with a static typed schema:

```js
import { Transform, Velocity } from 'jygame'

world.addComponent(entity, Transform)
world.setComponent(entity, Transform, { x: 100, y: 200 })
world.getComponent(entity, Transform) // live view with getters/setters
world.hasComponent(entity, Velocity)  // boolean
world.removeComponent(entity, Velocity)
```

Shorter aliases:

```js
world.add(entity, Transform)
world.set(entity, Transform, { x: 100 })
world.get(entity, Transform)
world.has(entity, Velocity)
world.remove(entity, Velocity)
```

### Batch Operations

```js
world.addMany(entity, Transform, Velocity, Renderable)
world.removeMany(entity, Velocity)
world.clear(entity)   // remove all components
world.clone(entity)   // deep copy
```

### Builder Pattern

```js
const entity = world
  .entity()
  .with(Transform, { x: 100, y: 200 })
  .with(Velocity)
  .with(Renderable, { fillColor: 0xFF0000FF })
  .create()
```

## Systems

Systems extend `System` with a static `query` and `priority`:

```js
import { System } from 'jygame'

class GravitySystem extends System {
  static query = { all: [Transform, Velocity] }
  static priority = 0

  update(ctx, dt) {
    const vy = ctx.column(Velocity, 'y')
    for (let r = 0; r < ctx.entityCount; r++) {
      vy[r] += 500 * dt // gravity
    }
  }
}
```

Built-in systems with their priorities:

| System | Priority | Query | Description |
|--------|----------|-------|-------------|
| `MovementSystem` | 0 | `[Transform, Velocity]` | `pos += vel * dt` |
| `AnimationSystem` | 1 | `[Animation, Renderable]` | Frame advancement |
| `CollisionSystem` | 2 | `[Transform, Collider, Visible]` | Spatial hash rebuild |
| `RenderSystem` | 3 | `[Transform, Renderable, RenderBounds, Visible]` | Batched canvas draw |
| `TrailSystem` | 4 | `[Transform, Trail, Visible]` | Trail rendering |

## Queries

```js
const enemies = world.query({ all: [Transform, EnemyTag] })
const moving = world.query({ all: [Transform, Velocity], none: [StaticTag] })

for (const entity of enemies.entities()) { ... }
for (const table of moving.tables()) { ... }
```

## Resources

Share singletons across systems:

```js
world.setResource(Camera, new Camera(0, 0, 800, 600))
world.getResource(Camera)
```

## Game Loop

Jygame uses a **fixed timestep** game loop driven by `requestAnimationFrame`.

```js
import { Game, Scene } from 'jygame'

const game = new Game({ width: 800, height: 600, fps: 60 })

const scene = new Scene()
scene.update = function (dt) {
  // dt is always 1/60 — deterministic updates
  // world.update(dt) is called automatically by engine Scene
}
scene.render = function (ctx) {
  // Draw everything here
}

game.run(scene)
```

The loop:
1. `requestAnimationFrame` fires — real time is measured
2. Real delta is fed into an internal `Clock` accumulator
3. For each accumulated fixed step, `scene.update(fixedDt)` is called (which calls `world.update(dt)`)
4. After all updates, `scene.interpolate(alpha)` for smooth rendering
5. `scene.render(ctx)` draws to the canvas
6. Input state is reset

## Scenes & Scene Stack

Scenes organize your game into distinct states. They live on a **stack** managed by `Game`.

### Lifecycle Hooks

| Hook | Purpose |
|------|---------|
| `enter()` | Setup — called once when mounted |
| `exit()` | Teardown — called once when unmounted |
| `pause()` | Called when a scene is pushed on top |
| `resume()` | Called when the scene above is popped |
| `update(dt)` | Simulation each fixed timestep |
| `interpolate(alpha)` | Smooth rendering between timesteps |
| `render(ctx)` | Drawing each frame |
| `renderUI()` | Returns HTML string for DOM overlay |

### Stack Operations

Scenes are **single-use** — create a new instance each time.

```js
this.pushScene(new PauseScene())
this.popScene()
this.replaceScene(new GameOverScene())
this.switchScene(new MenuScene())
```

### Blocking

By default:
- `blocksUpdateBelow = true` — scenes below are paused
- `blocksRenderBelow = false` — all scenes render (bottom to top)

### Event Cleanup

```js
this.on(document, 'click', onClick)
this.onSwipe(dir => this.move(dir))
this.onTap(({ x, y }) => this.place(x, y))
```

### DOM UI Layer

```js
scene.renderUI = function () {
  return '<h1 id="score">Score: 0</h1>'
}
```

## Sprite (Convenience Wrapper)

`Sprite` wraps an ECS entity for convenience. It creates the entity in a `World` and provides getter/setter access to its components:

```js
import { Sprite } from 'jygame'

const player = new Sprite(100, 200, 32, 48)
player.style.fill = '#B0DE8E'

// Under the hood:
player.world      // the World
player.entity     // the entity ID
player.transform  // live Transform view
player.velocity   // live Velocity view
player.collider   // live Collider view
```

Sprites are processed by the same ECS systems — no manual system calls needed when using the engine Scene.

## Group

`Group` is an iterable container for sprites. It can be **query-backed** (read-only, populated by a `QueryView`) or **sprite-backed** (manually managed):

```js
// Sprite-backed
const enemies = new Group()
enemies.add(enemy1)
enemies.add(enemy2)

// Query-backed (read-only, auto-populated by query)
const allEnemies = Group.query(world, { all: [Transform, EnemyTag] })
```

## Camera

The `Camera` defines the visible world region. The engine Scene sets one up automatically as a resource.

```js
import { Camera } from 'jygame'

const camera = new Camera(400, 300, 800, 600)
camera.zoom = 2
camera.follow(player)

// Coordinate conversion
const world = {}
camera.screenToWorld(mouseX, mouseY, world)
```

## Input

```js
Input.bind('JUMP', 'SPACE')
Input.bind('JUMP', 'W')

Input.isDown('RIGHT')
Input.justPressed('SPACE')
Input.justReleased('ENTER')

Input.x, Input.y
Input.onSwipe(dir => {})
Input.onTap(({ x, y }) => {})
```

## Object Pooling

```js
const pool = new ActivePool({
  create: () => new Sprite(0, 0, 8, 8),
  initialSize: 50,
})

const b = pool.acquire()
pool.release(b)
pool.forEachActive(sprite => { ... })
```

## Prefabs

```js
const bulletPrefab = world.createPrefab('bullet')
  .add(Transform, { scaleX: 0.5, scaleY: 0.5 })
  .add(Velocity)
  .add(Renderable, { fillColor: 0xFFFF00FF })
  .tag(ProjectileTag)

const bullet = world.instantiate('bullet', {
  Transform: { x: playerX, y: playerY },
  Velocity: { x: aimX * 500, y: aimY * 500 },
})
```

## Events

```js
class CollisionEvent { static fields = ['entityA', 'entityB'] }
world.registerEvent(CollisionEvent)

world.events.emit(CollisionEvent, { entityA: e1, entityB: e2 })
for (const evt of world.events.read(CollisionEvent)) { ... }
```

## Hierarchy

```js
world.initHierarchy()
world.attach(child, parent)
world.detach(child)
world.parentOf(entity)
world.childrenOf(entity)
```

## Asset Loading

```js
const task = ImageLoader.loadAll({ player: 'player.png', enemy: 'enemy.png' })
task.onProgress((l, t) => console.log(`${l}/${t}`))
const assets = await task
```

## Color System

458 named colors organized by family:

```js
import { Color, Colors } from 'jygame'

Color.CyberYellow
Colors.Green.Mint
Colors.BlueShades.FrostedBlueberries
```
