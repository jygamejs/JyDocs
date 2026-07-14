# Game

The `Game` class manages the game loop, a **scene stack**, canvas setup, viewport scaling, input, and the DOM UI overlay.

## Constructor

```js
const game = new Game(options)
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `parent` | `string \| HTMLElement` | `document.body` | CSS selector or element to hold the canvas |
| `width` | `number` | `800` | Logical canvas width (game pixels) |
| `height` | `number` | `600` | Logical canvas height (game pixels) |
| `fps` | `number` | `60` | Fixed timestep target |
| `maxTicks` | `number` | `5` | Maximum fixed ticks per frame (spiral-of-death protection) |
| `debug` | `boolean` | `true` | Enable the diagnostics engine, in-game overlay (`\``), and workspace (`Ctrl+F3`) |
| `autoPause` | `boolean` | `true` | Auto-pause when the browser tab is hidden |
| `scaleToFit` | `boolean \| object` | `null` | Viewport scaling config |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `canvas` | `HTMLCanvasElement` | The game canvas |
| `ctx` | `CanvasRenderingContext2D` | 2D rendering context |
| `width` | `number` | Logical canvas width |
| `height` | `number` | Logical canvas height |
| `scene` | `Scene \| null` | Current top scene (getter — returns `peekScene()`) |
| `sceneCount` | `number` | Number of scenes on the stack (getter) |
| `clock` | `Clock` | Internal fixed-timestep clock |
| `input` | `InputContext` | The game's legacy input context instance |
| `inputSystem` | `InputSystem` | The new input system (v0.8.1+), with device registry, context stack, and coordinate transforms |
| `debug` | `OverlayHost` | The debug overlay host (lazily created, v0.8.2+) — use `.show()`, `.hide()`, `.toggle()` |
| `fps` | `number` | Smoothed real-time FPS (read-only) |
| `isPaused` | `boolean` | Whether the game is paused (getter) |

## Scene Stack

The game manages a **stack of scenes**. The top scene receives events; scenes below can be optionally blocked from updates/rendering via scene properties (`blocksUpdateBelow`, `blocksRenderBelow`).

### `run(scene)`

Starts the game loop with a scene as the initial stack entry. Validates the scene is a fresh instance (not previously entered). Sets `scene.game = this`, mounts the scene, calls `scene.enter()`, and begins the loop.

```js
game.run(new MenuScene())
```

### `pushScene(scene)`

Pushes a scene onto the stack on top of the current one. If the current scene has `blocksUpdateBelow = true` (default), it is paused. Scene operations are deferred if called during an update cycle.

```js
// Pause overlay on top of gameplay
game.pushScene(new PauseScene())
```

### `popScene()`

Pops the top scene from the stack. If the popped scene had `blocksUpdateBelow = true`, the scene below is resumed. Throws if only one scene remains.

```js
game.popScene()
```

### `replaceScene(scene)`

Replaces the top scene without changing stack depth. Exits the current scene and mounts the new one.

```js
game.replaceScene(new GameOverScene())
```

### `peekScene()`

Returns the top scene without removing it. `game.scene` is an alias for this.

### `switchScene(scene)`

Resets the entire stack to a single scene. Clears input, resets the clock, exits all current scenes.

```js
game.switchScene(new MenuScene())
```

### Scene Inspection

```js
game.getScene(index)      // Scene at index, or null
game.getScenes()           // Copy of the stack array
game.containsScene(scene)  // boolean
game.isTopScene(scene)     // boolean
```

## Lifecycle Methods

### `pause()`

Pauses the game loop. Calls `scene.pause()` on the top scene. Updates stop but rendering continues.

### `resume()`

Resumes the game loop. Resets the clock accumulator to prevent delta-time spikes.

### `togglePause()`

Toggles between paused and resumed states.

### `destroy()`

Stops the game loop, disconnects observers, removes visibility/resize listeners, exits all scenes on the stack, destroys the input system and input context.

> **Focus handling:** When the window regains focus, the keyboard state is reset to prevent stuck keys.

## UI / DOM Methods

### `refreshUI()`

Re-renders the top scene's `renderUI()` output into `scene.root`.

### `patchUI(updates)`

Efficiently patches text content of DOM elements by id.

```js
game.patchUI({ score: 'Score: 42', lives: 'Lives: 3' })
```

## Interpolation & Auto-Pause

As in v0.4.0: the game loop calls `scene.interpolate(alpha)` after updates and before render. Auto-pause pauses the loop when the tab is hidden.

## Deferred Scene Operations

Scene mutations (`pushScene`, `popScene`, `replaceScene`, `switchScene`) called during a scene's `update()` are **queued** and executed after the update cycle completes. This prevents mid-frame stack corruption.

## Viewport Scaling

As in v0.4.0: CSS `transform`-based scaling via `scaleToFit` option.

## Example

```js
const game = new Game({ width: 800, height: 600 })

class MenuScene extends Scene {
  enter() {
    this.on(document, 'keydown', (e) => {
      if (e.key === 'Enter') game.pushScene(new GameScene())
    })
  }
  render(ctx) {
    ctx.fillStyle = '#2F2F2F'
    ctx.fillRect(0, 0, 800, 600)
  }
}

class GameScene extends Scene {
  enter() {
    this.player = new Sprite(100, 100, 32, 32)
  }
  update(dt) {
    movementSystem.updateOne(this.player, dt)
  }
  render(ctx) {
    ctx.clearRect(0, 0, 800, 600)
    renderSystem.renderOne(ctx, this.player)
  }
}

game.run(new MenuScene())
```
