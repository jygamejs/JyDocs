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

## Sprites

### Reuse Sprites Instead of Creating New Ones

For frequently spawned objects (bullets, particles), pool sprites:

```js
class BulletPool {
  constructor(size) {
    this.pool = Array.from({ length: size }, () => new Sprite(0, 0, 4, 4))
    this.pool.forEach(b => b.visible = false)
  }

  fire(x, y) {
    const b = this.pool.find(b => !b.visible)
    if (b) {
      b.x = x
      b.y = y
      b.visible = true
    }
    return b
  }

  update(dt) {
    this.pool.forEach(b => {
      if (b.visible) b.update(dt)
    })
  }
}
```

### Use `kill()` to Remove Sprites from Groups

```js
sprite.kill()  // removes from all groups it belongs to
```

### Prefer `sprite.rect` for Direct Manipulation

The sprite's `x`, `y`, `width`, `height` delegate to its internal `Rect`. For bulk operations, work with `sprite.rect` directly:

```js
sprite.rect.move(dx, dy)
sprite.rect.inset(5)
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

## Groups

### Use Groups for Collision Detection

Groups provide built-in collision queries. Use `collideGroup()` for group-vs-group (e.g., bullets vs enemies):

```js
const hits = this.bullets.collideGroup(this.enemies)
hits.forEach(([bullet, enemy]) => {
  bullet.kill()
  enemy.health--
})
```

### Prefer `collideRect` Over Manual Loops

```js
// ❌ Bad
this.sprites.forEach(s => {
  if (s.rect.collides(player.rect)) hit(s)
})

// ✅ Good
this.sprites.collideRect(player.rect).forEach(hit)
```

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

Use `game.pause()` / `game.resume()` instead of manual flags. The loop stops calling `update()` but `render()` still runs (allowing a dimmed overlay).

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
    this.assets = await ImageLoader.loadAll({
      player: 'player.png',
      enemy: 'enemy.png',
      bg: 'background.png',
    })
    await FontLoader.load('Pixel', 'pixel.woff2')
    this.transitionTo(new MenuScene(this.assets))
  }
}
```

### Handle Loading Errors

```js
try {
  await ImageLoader.load('missing.png')
} catch {
  console.warn('Failed to load asset')
}
```

## Performance

### Keep Sprite Count Manageable

Batch static sprites by rendering them to an offscreen canvas. Only update and re-render sprites that change.

### Minimize DOM UI Updates

Use `game.patchUI({ id: value })` instead of `game.refreshUI()` when updating only specific elements. `patchUI` only changes elements where the content differs.

### Clean Up Unused Resources

Sprites removed from groups but still referenced can cause memory leaks. Call `kill()` and remove references:

```js
this.enemies = this.enemies.filter(s => s.health > 0)
```

### Use `visible` to Hide Sprites

Setting `sprite.visible = false` skips rendering without destroying the sprite. Useful for pooling.
