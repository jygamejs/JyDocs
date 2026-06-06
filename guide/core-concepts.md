# Core Concepts

## Game Loop

Jygame uses a **fixed timestep** game loop driven by `requestAnimationFrame`. The `Game` class manages this loop internally.

```js
import { Game, Scene } from 'jygame'

const game = new Game({
  width: 800,
  height: 600,
  fps: 60,
})

const scene = new Scene()
scene.update = function (dt) {
  // dt is always 1/60 (for 60fps) — deterministic updates
}
scene.render = function (ctx) {
  // Draw everything here
}

game.run(scene)
```

The loop works as follows:

1. `requestAnimationFrame` fires — real time elapsed is measured
2. The real delta is fed into an internal **Clock accumulator**
3. For each accumulated fixed step, `scene.update(fixedDt)` is called
4. After all updates, `scene.render(ctx)` draws to the canvas
5. Input state is reset for the next frame

This ensures deterministic physics and simulation regardless of frame rate.

## Scenes

Scenes organize your game into distinct states (menu, gameplay, pause, game over). Each scene has lifecycle hooks:

| Hook | Purpose | Called When |
|---|---|---|
| `enter()` | Setup logic | Scene becomes active |
| `exit()` | Teardown | Scene is exited |
| `pause()` | Pause logic | `game.pause()` is called |
| `resume()` | Resume logic | `game.resume()` is called |
| `update(dt)` | Simulation | Each fixed timestep tick |
| `render(ctx)` | Drawing | Each frame |
| `renderUI()` | HTML UI | Returns HTML string for DOM overlay |

```js
const menu = new Scene()

menu.enter = function () {
  this.selectedOption = 0
}

menu.update = function (dt) {
  if (Input.justPressed('UP')) this.selectedOption--
  if (Input.justPressed('DOWN')) this.selectedOption++
  if (Input.justPressed('ENTER')) this.transitionTo(gameScene)
}

menu.render = function (ctx) {
  ctx.fillStyle = '#2F2F2F'
  ctx.fillRect(0, 0, 800, 600)
}
```

Switch scenes with `game.switchScene(nextScene)` or `this.transitionTo(nextScene)` inside a scene.

### Event Cleanup

Use `this.on()` to register event listeners that are automatically cleaned up on `exit()`:

```js
menu.enter = function () {
  this.on(document, 'click', onClick)
}
```

Also available: `this.onSwipe(cb)`, `this.onTap(cb)`, and `this.cleanup(fn)` for manual cleanup.

### DOM UI Layer

Return an HTML string from `renderUI()` to render into the DOM overlay:

```js
scene.renderUI = function () {
  return '<h1 id="score">Score: 0</h1>'
}
```

Call `game.refreshUI()` to re-render the UI, or `game.patchUI({ score: 'Score: 42' })` for efficient text updates.

## Sprites

`Sprite` is the basic drawable entity. It wraps a `Rect` for position/size and includes velocity, rotation, scale, and visibility.

```js
const player = new Sprite(100, 200, 32, 48)
player.color = '#B0DE8E'
player.style.shape = 'rect'   // 'rect' | 'circle' | 'ellipse'
player.velocity.set(100, 0)   // moves 100px/sec right
```

Update and render manually:

```js
scene.update = function (dt) {
  player.update(dt)  // applies velocity * dt
}

scene.render = function (ctx) {
  player.render(ctx)
}
```

Sprites can display images instead of shapes:

```js
const sprite = new Sprite(0, 0, 64, 64)
sprite.image = await ImageLoader.load('/assets/player.png')
```

Properties: `x`, `y`, `width`, `height`, `angle` (radians), `scale` (Vec2), `visible`, `style.fill`, `style.shape`.

## Groups

`Group` manages collections of sprites with batch operations and collision queries.

```js
const enemies = new Group()
enemies.add(enemy1)
enemies.add(enemy2)

// Batch update and render
enemies.update(dt)
enemies.render(ctx)
```

### Collision Queries

```js
const hits = enemies.collideRect(player.rect)
const overlaps = enemies.collideGroup(walls)
const nearby = enemies.collideSprite(otherSprite)
const points = enemies.collidePoint({ x: 100, y: 200 })
```

### Array Utilities

```js
enemies.forEach(s => s.health++)
const alive = enemies.filter(s => s.health > 0)
const positions = enemies.map(s => ({ x: s.x, y: s.y }))
```

## Input

`Input` is a static class. Call `Input.init()` — it runs automatically when you create a `Game`.

### Key Queries

```js
if (Input.isDown('RIGHT')) player.x += 5
if (Input.justPressed('SPACE')) jump()
if (Input.justReleased('ENTER')) confirm()
```

### Default Mappings

| Raw Key | Alias |
|---|---|
| `ArrowUp` / `w` / `W` | `UP` |
| `ArrowDown` / `s` / `S` | `DOWN` |
| `ArrowLeft` / `a` / `A` | `LEFT` |
| `ArrowRight` / `d` / `D` | `RIGHT` |
| `Space` | `SPACE` |
| `Escape` | `ESCAPE` |
| `Enter` | `ENTER` |

### Remap Keys

```js
Input.mapKey('z', 'UP')
Input.mapKey('x', 'FIRE')
Input.setKeyMap({ z: 'UP', x: 'FIRE' })
Input.resetKeyMap()
```

### Touch Input

```js
Input.onSwipe(direction => {
  // direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
})

Input.onTap(({ x, y }) => {
  // x, y: client coordinates
})
```

### Key Buffer

```js
Input.consumeBuffer()  // returns next buffered key or null
Input.peekBuffer()     // peeks without consuming
```

## Math Utilities

### Vec2

2D vector with common operations. Most methods return `this` for chaining.

```js
const v = new Vec2(3, 4)
v.add(new Vec2(1, 2))     // (4, 6)
v.scale(2)                // (8, 12)
v.magnitude()             // ≈ 14.42
v.normalize()             // unit vector
v.dot(other)              // dot product
v.rotate(Math.PI / 2)     // 90° rotation
v.dist(other)             // distance

Vec2.fromAngle(Math.PI, 50)  // vector at angle with length
Vec2.lerp(a, b, 0.5)         // midpoint
```

### Rect

Axis-aligned bounding box with collision and utility methods.

```js
const r = new Rect(10, 20, 100, 80)
r.right        // 110
r.center       // { x: 60, y: 60 }
r.contains({ x: 50, y: 50 })   // true
r.collides(other)               // AABB overlap test
r.overlap(other)                // returns overlapping Rect or null
r.clamp(boundary)               // keep inside boundary
r.inset(5)                      // shrink by 5px on all sides
```

## Collision

Static collision functions for shapes that don't belong to sprites:

```js
Collision.rectRect(a, b)
Collision.circleCircle(a, b)
Collision.circleCircle({ x: 0, y: 0, radius: 30 }, { x: 40, y: 0, radius: 20 })
Collision.pointInRect(point, rect)
Collision.rectCircle(rect, circle)
Collision.groupRect(group, rect)
Collision.groupGroup(groupA, groupB)
```

## Time

### Clock

Used internally by `Game` but can be used standalone:

```js
const clock = new Clock(60)

function loop(time) {
  const realDt = (time - lastTime) / 1000
  lastTime = time

  const steps = clock.tick(realDt)
  for (let i = 0; i < steps; i++) {
    update(clock.fixedDt)
  }

  requestAnimationFrame(loop)
}
```

### Timer

Countdown timer with optional looping:

```js
const timer = new Timer(3, { loop: true, autoStart: true })

function update(dt) {
  if (timer.tick(dt)) {
    // timer completed (or looped)
  }
  timer.progress     // 0.0 to 1.0
  timer.remaining    // seconds left
  timer.done         // boolean
}
```

## State Management

### State

Observable state container:

```js
const state = new State({ score: 0, lives: 3 })

const unsub = state.subscribe(s => {
  console.log('State changed:', s)
})

state.set({ score: 10 })      // merges
state.replace({ score: 0 })   // replaces entirely
state.reset({ score: 0 })     // reset to initial values

state.get()  // returns current state object
```

### Storage

`localStorage` wrapper with JSON serialization:

```js
Storage.set('highscore', 1000)
Storage.get('highscore', 0)        // 1000
Storage.get('nonexistent', 0)      // 0 (default)
Storage.remove('highscore')
Storage.clear()
```

## Asset Loading

### ImageLoader

```js
// Single image
const img = await ImageLoader.load('/assets/player.png')

// Batch load
const assets = await ImageLoader.loadAll({
  player: '/assets/player.png',
  enemy: '/assets/enemy.png',
})

ImageLoader.get('player')   // retrieves cached image
ImageLoader.has('player')   // true/false
```

### FontLoader

```js
await FontLoader.load('PixelFont', '/fonts/pixel.woff2')

// Batch load
await FontLoader.loadAll({
  PixelFont: '/fonts/pixel.woff2',
})

FontLoader.isLoaded('PixelFont')
```

## Color System

Jygame includes 458 named colors organized by family:

```js
import { Color, Colors } from 'jygame'

Color.SuperSilver              // "#eeeeee"
Color.CyberYellow              // "#ffd400"
Color.MagicalMalachite         // "#00c68d"

Colors.Green                   // "#d6fb61"
Colors.GreenShades.UltraMoss   // specific green shade
Colors.BlueShades.FrostedBlueberries
```

Each family (`Red`, `Orange`, `Yellow`, `Green`, `Teal`, `Blue`, `Purple`, `Pink`, `Brown`, `Grey`, `Black`, `White`) has a `Shades` sub-object with named variants.
