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

The `Input` global facade provides access to keyboard, pointer, and gesture input. It delegates to the game's default `InputContext` instance.

### Key Concepts

**Key aliases** map multiple raw keys to a logical name. The built-in defaults are directional (`UP`, `DOWN`, `LEFT`, `RIGHT`), `SPACE`, `ESCAPE`, and `ENTER`. You can add your own via `Input.mapKey()` or `Input.bind()` for action-based queries.

**Three-state queries** distinguish between held, just-pressed, and just-released — essential for responsive controls:

| Query | When it returns true |
|-------|---------------------|
| `isDown(key)` | Every frame the key/action is held |
| `justPressed(key)` | Only the first frame after press |
| `justReleased(key)` | Only the first frame after release |

**Action bindings** let you decouple key mappings from gameplay logic. Multiple keys can trigger the same action:

```js
Input.bind('JUMP', 'SPACE')
Input.bind('JUMP', 'W')
Input.bind('JUMP', 'UP')

if (Input.justPressed('JUMP')) player.jump()
```

**Gesture detection** — `onSwipe()` and `onTap()` handle touch and mouse gestures without manual pointer tracking.

```js
Input.onSwipe(dir => player.move(dir))

Input.onTap(({ x, y }) => {
  const worldPos = {}
  camera.screenToWorld(x, y, worldPos)
  bulletPool.acquire().position.set(worldPos.x, worldPos.y)
})
```

**Pointer state** — `Input.x`/`Input.y` give the latest pointer coordinates in canvas-space, and `Input.isPointerDown` checks for active press. Multi-touch is supported via `Input.getPointer(id)` / `Input.getPointers()`.

```js
const dx = Input.x - lastX
const dy = Input.y - lastY
camera.x -= dx / camera.zoom
camera.y -= dy / camera.zoom
```

## Object Pooling

Object pooling reuses short-lived objects to avoid garbage collection pressure. JyGame provides two pool types:

### Pool (simple)

A basic free-list pool for simple reuse. `acquire()` returns a recycled object or creates one; `release()` resets it and returns it to the free list. Objects beyond `maxSize` are discarded.

```js
const bulletPool = new Pool({
  create: () => new Sprite(0, 0, 8, 8),
  reset: (b) => { b.visible = false },
  initialSize: 50,
  maxSize: 200,
})

const b = bulletPool.acquire()
bulletPool.release(b)
```

### ActivePool (with tracking)

`ActivePool` extends the concept by tracking which objects are in use, providing O(1) acquire/release, iteration over active objects, batch operations, and peak-usage instrumentation. It is the preferred pool for most gameplay scenarios.

```js
const bulletPool = new ActivePool({
  create: () => new Sprite(0, 0, 8, 8),
  reset: (b) => { b.visible = false; b.velocity.set(0, 0) },
  initialSize: 50,
  maxSize: 200,
})

// Fire — acquire from pool
function fire() {
  const b = bulletPool.acquire()
  b.transform.x = playerX
  b.transform.y = playerY
  b.velocity.set(0, -300)
  b.visible = true
}

// Update frame — process and release
function update(dt) {
  bulletPool.updateActive(b => {
    b.transform.y += b.velocity.y * dt
    if (b.transform.y < -100) bulletPool.release(b)
  })
}

// Render frame — draw active only
function render(ctx) {
  bulletPool.forEachActive(b => renderSystem.renderOne(ctx, b))
}
```

**Batch operations** help in scenes with many short-lived objects:

```js
// Spawn a wave
const wave = bulletPool.acquireMany(20)
// Release all bullets that went off-screen
bulletPool.releaseInactive(b => b.transform.y < -100)
// Clear everything at once
bulletPool.clearActive()
```

**Instrumentation** — Each pool records peak usage, letting you tune pool sizes:

| Property | Purpose |
|----------|---------|
| `peakActive` | Highest concurrent objects — guide for `initialSize` |
| `peakCapacity` | Total ever allocated — guide for `maxSize` |
| `totalCreated` | Number of allocations — 0 means no GC pressure |

## Prefabs

Prefabs are reusable entity blueprints. You define the component set once and instantiate it many times with per-instance overrides. This avoids repetitive `addComponent` / `setComponent` boilerplate.

### Defining a Prefab

```js
const bulletPrefab = world.createPrefab('bullet')
  .add(Transform, { scaleX: 0.5, scaleY: 0.5 })
  .add(Velocity)
  .add(Renderable, { fillColor: 0xFFFF00FF })
  .tag(ProjectileTag)
```

The builder chain supports `.add(Component, defaults?)` and `.tag(TagComponent)`. Components without defaults are added with zero-initialised values.

### Instantiating

`instantiate(name, overrides)` creates a new entity with the prefab's components and merges the overrides:

```js
const bullet = world.instantiate('bullet', {
  Transform: { x: playerX, y: playerY },
  Velocity: { x: aimX * 500, y: aimY * 500 },
})
```

Override values are spread over the defaults — you only need to specify the fields that differ.

### Use Cases

- **Bullets** — same components, different positions/velocities
- **Enemies** — shared component layout, varying stats per variant
- **Pickups** — common Transform + Renderable + Collider, unique tags per type
- **Particle effects** — instantiate a burst of short-lived entities from a single prefab

## Events

The ECS event system lets systems communicate without direct coupling. Events are stored in ring buffers and read once per frame, then cleared — perfect for one-shot notifications like collisions, spawn requests, and state changes.

### Defining an Event

Events are classes with a static `fields` array declaring the event's data shape:

```js
class CollisionEvent { static fields = ['entityA', 'entityB', 'impulse'] }
class ScoreEvent { static fields = ['amount', 'source'] }
class SpawnEvent { static fields = ['prefab', 'x', 'y'] }

world.registerEvent(CollisionEvent)
world.registerEvent(ScoreEvent)
```

### Emitting

Events can be emitted from anywhere — systems, the scene update, or even other event handlers:

```js
world.events.emit(CollisionEvent, {
  entityA: player,
  entityB: enemy,
  impulse: magnitude,
})
```

### Reading

Event consumers read in a for-of loop. Events are available only until the end of the current frame:

```js
class DamageSystem extends System {
  static query = { all: [Health, Transform] }
  static priority = 5

  update(ctx, dt) {
    for (const evt of world.events.read(CollisionEvent)) {
      if (ctx.hasEntity(evt.entityA)) {
        this.applyDamage(ctx, evt.entityA, 10)
      }
    }
  }
}
```

### Event Lifecycle

1. Events are emitted into a ring buffer (pre-allocated, no allocation on emit)
2. All systems run their `update` — any system can call `events.read()`
3. At the end of the frame, all event buffers are cleared
4. Events emitted during a system update are visible to higher-priority systems in the same frame

### Use Cases

- **Collision responses** — CollisionSystem emits, DamageSystem / SoundSystem consume
- **Score changes** — emit on enemy death, HUD system reads and updates UI
- **Spawn requests** — emit from burst systems, SpawnSystem instantiates prefabs
- **State transitions** — emit when a boss phase changes, other systems react

## Hierarchy

Entity hierarchies let you attach children to a parent so that transformations, visibility, and lifecycle propagate. The `HierarchySystem` (included in the default world) recursively computes world-space transforms from local transforms each frame.

### Setup

`initHierarchy()` registers the hierarchy component and the `HierarchySystem`:

```js
world.initHierarchy()  // called automatically by DefaultWorldBuilder
```

### Attaching & Detaching

```js
// Attach — child moves with the parent
world.attach(child, parent)

// Detach — child becomes a root entity
world.detach(child)

// Query
world.parentOf(entity)    // entity ID or null
world.childrenOf(entity)  // iterable of entity IDs
```

### How It Works

Each entity with a parent stores its **local** transform (relative to the parent). The `HierarchySystem` runs each frame and computes the **world** transform by walking the tree and multiplying local transforms. This means:

- Moving the parent moves all children
- Rotating the parent rotates children around the parent's origin
- Destroying the parent optionally destroys children

### Use Cases

- **Player with attached weapon** — weapon follows the player's position and rotation
- **Vehicle with riders** — riders move with the vehicle
- **UI elements** — panels, buttons, labels that group together
- **Compound entities** — a multi-sprite boss assembled from child entities

```js
// Create a simple vehicle hierarchy
const vehicle = world.createEntity()
world.add(vehicle, Transform, { x: 100, y: 200 })

const turret = world.createEntity()
world.add(turret, Transform)
world.attach(turret, vehicle)

const barrel = world.createEntity()
world.add(barrel, Transform)
world.attach(barrel, turret)

// Moving vehicle moves turret and barrel automatically
world.set(vehicle, Transform, { x: 300, y: 400 })
```

## Asset Loading

JyGame provides static loaders for images, fonts, and audio. All return promises or `LoadingTask` objects with progress tracking — ideal for loading screens and asset preloading.

### ImageLoader

Loads `HTMLImageElement` instances with optional `img.decode()` for jank-free first paint:

```js
import { ImageLoader } from 'jygame'

// Single image
const img = await ImageLoader.load('player.png')

// Batch — returns a LoadingTask with progress tracking
const task = ImageLoader.loadAll({
  player: 'player.png',
  enemy: 'enemy.png',
  bullet: 'bullet.png',
  bg: 'background.png',
})

task.onProgress((loaded, total) => {
  progressBar.value = loaded / total
})

const assets = await task
// assets.player, assets.enemy, etc.
```

Cached images are retrievable anywhere via `ImageLoader.get('player')`.

### FontLoader

Uses the `FontFace` API to load web fonts before rendering text:

```js
await FontLoader.load('PixelFont', 'fonts/pixel.woff2')

const task = FontLoader.loadAll({
  Pixel: 'fonts/pixel.woff2',
  Retro: 'fonts/retro.ttf',
})
task.onProgress((l, t) => console.log(`Fonts: ${l}/${t}`))
await task

// Safe to render text now
ctx.font = '24px Pixel'
```

### AudioLoader

Loads audio for either `HtmlAudioBackend` or `WebAudioBackend`:

```js
// For HTML Audio backend
await AudioLoader.load('sounds/click.mp3')

// For Web Audio backend
const ctx = new AudioContext()
await AudioLoader.loadBuffer('sounds/music.wav', ctx)

// Batch
const task = AudioLoader.loadAll({
  click: 'sounds/click.mp3',
  hit: 'sounds/hit.mp3',
})
```

### LoadingTask

The `LoadingTask` object returned by batch `loadAll` methods is thenable (`await`-compatible) and provides `onProgress(cb)` for building loading screens, plus `expect(n)`, `done()`, and `fail(err)` for custom loading scenarios.

### Loading Screen Pattern

```js
async function loadGame() {
  const task = ImageLoader.loadAll({ ... })
  task.onProgress((loaded, total) => {
    updateLoadingBar(loaded / total)
  })
  await task

  await FontLoader.loadAll({ ... })
  startGame()
}
```

## Color System

JyGame includes 458 named colors and 96 handpicked palettes, all importable from `Color`, `Colors`, and `Palettes`.

### Color (flat lookup)

Every named color is a property on the `Color` object — fast direct access by name:

```js
import { Color } from 'jygame'

sprite.style.fill = Color.CyberYellow     // '#ffd400'
sprite.style.fill = Color.NeonRose         // '#ff0080'
ctx.fillStyle      = Color.VampireFangs    // '#cb2957'
```

### Colors (organized by family)

`Colors` groups colors into families (`Red`, `Orange`, `Yellow`, `Green`, `Teal`, `Blue`, `Purple`, `Pink`, `Brown`, `Grey`, `Black`, `White`), each with a primary color and named shades:

```js
import { Colors } from 'jygame'

// Family primary
ctx.fillStyle = Colors.Green          // '#d6fb61'

// Specific shade
sprite.style.fill = Colors.GreenShades.MagicalMalachite  // '#00c68d'
sprite.style.fill = Colors.BlueShades.FrostedBlueberries // '#6c6eb2'
```

This makes it easy to iterate by hue — pick a family, then browse its shades for matching tones.

### Palettes (curated combinations)

`Palettes` contains handpicked color combinations that work well together. Each palette is an array of `{ name, hex, family }` objects:

```js
import { Palettes } from 'jygame'

const sunset = Palettes.Terracotta
// [
//   { name: 'TigersEye',     hex: '#DE9440', family: 'yellow' },
//   { name: 'JapaneseCramine', hex: '#99262B', family: 'red' },
//   { name: 'RoseTaupe',     hex: '#8D635A', family: 'rose' },
//   { name: 'GoldCrayola',   hex: '#EDB28C', family: 'yellow' },
//   { name: 'TerraCotta',    hex: '#EC7267', family: 'rose' },
// ]

// Pick at random
const color = Palettes.MangoFire[Math.floor(Math.random() * palette.length)]

// Filter by family
const greens = Palettes.DeepForest.filter(c => c.family === 'green')
```

Palettes are useful for theme selection, level-specific color schemes, or procedurally generating cohesive visuals from a curated set.
