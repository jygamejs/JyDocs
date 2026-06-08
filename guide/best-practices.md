# Best Practices

## Project Structure

Organize your game by feature or module, not by file type.

```
my-game/
├── index.html
├── src/
│   ├── main.js              # Entry point — creates Game, runs initial scene
│   ├── scenes/
│   │   ├── MenuScene.js     # One file per scene
│   │   ├── GameScene.js
│   │   └── GameOverScene.js
│   ├── entities/
│   │   ├── Player.js        # Sprites and their behavior
│   │   ├── Enemy.js
│   │   └── PowerUp.js
│   ├── systems/
│   │   ├── spawner.js       # Game logic separated from scenes
│   │   └── score.js
│   └── assets/
│       ├── images/
│       └── fonts/
├── package.json
└── vite.config.js
```

Keep scenes focused. If a scene exceeds 200 lines, extract entities or systems into separate files.

## Scene Lifecycle

### Setup in `enter()`, Teardown in `exit()`

Use `enter()` to create sprites and register listeners. Use `exit()` to clean up — use `this.on()` so cleanup is automatic.

```js
class GameScene extends Scene {
  enter() {
    this.player = new Sprite(100, 100, 32, 32)
    this.on(Input, 'keydown', this.handleInput)
    this.onSwipe(dir => this.player.x += 50)
  }
}
```

### Don't Recreate Sprites Every Frame

Create sprites once in `enter()`, not in `update()`.

```js
// ❌ Bad
enter() {
  this.enemies = new Group()
}
update(dt) {
  this.enemies.clear()
  // add enemies every frame...
}

// ✅ Better — spawn conditionally
update(dt) {
  if (this.spawnTimer.tick(dt)) {
    this.enemies.add(new Enemy())
  }
}
```

## Components & Entities

### Work with Components Directly

Sprites expose `transform`, `collider`, `renderable`, and `velocity`. Access them directly for fine-grained control:

```js
sprite.transform.rotation = Math.PI / 2
sprite.transform.scale.set(2, 1)
sprite.collider.width = 64
sprite.renderable.style.shape = 'ellipse'
```

Note that `x` and `y` getters return the **top-left corner**, while `transform.x` / `transform.y` is **center-based**:

```js
const s = new Sprite(100, 100, 32, 32)
s.x                   // 100 (top-left)
s.transform.x         // 116 (center)
```

### Build Custom Entities

Any object with the right component shape works with the built-in systems:

```js
const bullet = {
  transform: new Transform(x, y),
  collider: new Collider(4, 4),
  renderable: new Renderable(null, { fill: '#ff0', shape: 'circle' }),
  velocity: new Vec2(0, -300),
  visible: true,
}

movementSystem.updateOne(bullet, dt)
renderSystem.renderOne(ctx, bullet)
```

## Sprites

### Use `Pool` for Frequently Spawned Objects

For frequently spawned objects (bullets, particles), use the built-in `Pool` class instead of manual pooling:

```js
const bulletPool = new Pool({
  create: () => new Sprite(0, 0, 4, 4),
  reset: (b) => {
    b.visible = false
    b.velocity.set(0, 0)
    b.transform.x = 0
    b.transform.y = 0
  },
  initialSize: 50,
  maxSize: 200,
})

function fire(x, y, vx, vy) {
  const b = bulletPool.acquire()
  b.transform.x = x
  b.transform.y = y
  b.velocity.set(vx, vy)
  b.visible = true
  return b
}

function update(dt) {
  for (const b of activeBullets) {
    if (outOfBounds(b)) {
      bulletPool.release(b)
    }
  }
}
```

### Use `kill()` to Remove Sprites from Groups

```js
sprite.kill()  // removes from all groups it belongs to
```

## Groups & Spatial Hashing

### Enable Spatial Hash for Large Groups

For groups with more than ~50 sprites, enable spatial hashing to accelerate collision queries:

```js
const enemies = new Group()
enemies.useSpatialHash(64)  // cell size in pixels
enemies.add(enemy1)
// ...
```

The hash is automatically rebuilt when `update()` is called. Without spatial hash, collision queries are O(n) per group.

### Use `collideGroup()` for Group-vs-Group

```js
const hits = this.bullets.collideGroup(this.enemies)
hits.forEach(([bullet, enemy]) => {
  bullet.kill()
  enemy.health--
})
```

### All Collision Methods Accept `out` for Pool Reuse

```js
const out = []
group.collideRect(rect, out)
// use out, then clear
out.length = 0
```

## Input

### Use `justPressed` for One-Shot Actions

Use `justPressed` for actions that should fire once per press (jumping, shooting, confirming).

```js
if (Input.justPressed('SPACE')) this.player.jump()
if (Input.justPressed('ENTER')) this.transitionTo(nextScene)
```

### Use `isDown` for Continuous Actions

Use `isDown` for actions that repeat every frame (movement, charging).

```js
if (Input.isDown('RIGHT')) this.player.x += 200 * dt
```

### Use Logical Mappings, Not Raw Keys

Don't hardcode raw key checks:

```js
// ❌ Bad
if (Input.isDown('w')) moveUp()

// ✅ Good
Input.mapKey('z', 'JUMP')
if (Input.justPressed('JUMP')) jump()
```

### Reset Input on Scene Switch

`game.switchScene()` clears input state automatically. When using raw DOM listeners, clean them up via `this.on()`.

### Pointer API for Multi-Touch

For multi-touch games, use the pointer API directly:

```js
Input.forEachPointer(p => {
  if (p.pointerType === 'touch') {
    // handle touch input
  }
})
```

## Scene Event Cleanup

Always use `this.on()` instead of raw `addEventListener` to ensure listeners are cleaned up on scene exit:

```js
scene.enter = function () {
  this.on(document, 'keydown', this.handleKey)
  this.onSwipe(dir => this.move(dir))
  this.onTap(({ x, y }) => this.placeItem(x, y))
  this.cleanup(() => {
    // any custom teardown
  })
}
```

No manual `removeEventListener` is needed — `scene.exit()` runs all cleanups automatically.

## Game Loop

### Don't Assume `dt` Consistency

The fixed timestep ensures consistent updates, but `render()` runs at display refresh rate. Never put simulation logic in `render()`:

```js
// ❌ Bad
render(ctx) {
  this.player.x += 5  // frame-rate dependent!
  this.player.render(ctx)
}

// ✅ Good
update(dt) {
  this.player.x += 200 * dt  // 200 px/sec regardless of FPS
}
render(ctx) {
  this.player.render(ctx)
}
```

### Pause the Game Loop Properly

Use `game.pause()` / `game.resume()` instead of manual flags. The loop stops calling `update()` but `render()` still runs (allowing a dimmed overlay). Auto-pause handles tab visibility automatically.

```js
if (Input.justPressed('ESCAPE')) {
  game.isPaused ? game.resume() : game.pause()
}
```

## State

### Keep UI State Separate from Game State

Use `State` for game data (score, health, level) and scene properties for UI state (selected menu option, animation timer):

```js
const gameState = new State({ score: 0, lives: 3, level: 1 })

// In scene
this.selectedOption = 0     // UI state — scene-local
this.flashTimer = 0         // animation state — scene-local
```

### Subscribe to State Changes for UI

Instead of checking state in `update()`, use subscriptions:

```js
gameState.subscribe(state => {
  game.patchUI({ score: `Score: ${state.score}` })
})
```

## Asset Loading

### Preload Assets Before Starting

Load all assets in a boot or menu scene, then switch to gameplay:

```js
class BootScene extends Scene {
  async enter() {
    const task = ImageLoader.loadAll({
      player: 'player.png',
      enemy: 'enemy.png',
      bg: 'background.png',
    })

    task.onProgress((loaded, total) => {
      console.log(`${Math.round(loaded / total * 100)}%`)
    })

    const assets = await task
    await FontLoader.loadAll({ Pixel: 'pixel.woff2' })
    this.transitionTo(new MenuScene(assets))
  }
}
```

### Handle Loading Errors

```js
try {
  const assets = await ImageLoader.loadAll({ ... })
} catch (err) {
  console.warn('Failed to load assets:', err)
}
```

## Performance

### Keep Sprite Count Manageable

For very large numbers of static sprites, batch them by rendering to an offscreen canvas. Only update and re-render sprites that change.

### Enable Spatial Hash for Large Groups

Groups with many sprites benefit significantly from spatial hashing — it reduces collision checks from O(n²) to roughly O(n).

### Minimize DOM UI Updates

Use `game.patchUI({ id: value })` instead of `game.refreshUI()` when updating only specific elements. `patchUI` only changes elements where the content differs.

### Clean Up Unused Resources

Sprites removed from groups but still referenced can cause memory leaks. Call `kill()` and remove references:

```js
this.enemies = this.enemies.filter(s => s.health > 0)
```

### Use `visible` to Hide Sprites

Setting `sprite.visible = false` skips rendering without destroying the sprite. Useful for pooling.

### Use Pool-Friendly Code Paths

Methods like `group.collideRect(rect, out)`, `rect.getCenter(out)`, and `Vec2.lerpInto(out, a, b, t)` accept an optional output parameter to avoid allocations in hot paths.
