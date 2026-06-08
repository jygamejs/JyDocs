# Game

The `Game` class is the main entry point. It manages the game loop, canvas setup, scene management, viewport scaling, input, and the DOM UI overlay.

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
| `autoPause` | `boolean` | `true` | Auto-pause when the browser tab is hidden |
| `scaleToFit` | `boolean \| object` | `null` | Viewport scaling config |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `canvas` | `HTMLCanvasElement` | The game canvas |
| `ctx` | `CanvasRenderingContext2D` | 2D rendering context |
| `width` | `number` | Logical canvas width |
| `height` | `number` | Logical canvas height |
| `scene` | `Scene \| null` | Current active scene |
| `clock` | `Clock` | Internal fixed-timestep clock |
| `input` | `InputContext` | The game's input context instance |
| `fps` | `number` | Smoothed real-time FPS (read-only) |
| `isPaused` | `boolean` | Whether the game is paused (getter) |

The `Game` constructor creates an `InputContext`, binds it to the game container, and sets it as the global default — so `Input.isDown()` etc. work without extra setup.

## Lifecycle Methods

### `run(scene)`

Starts the game loop with a `Scene` instance. Sets `scene.game = this`, appends `scene.root` to the DOM overlay, calls `scene.enter()`, and begins the game loop.

```js
game.run(new MenuScene())
```

### `switchScene(scene)`

Exits the current scene, removes its DOM root, resets pause state, clears input, resets the clock, and enters the new scene.

```js
game.switchScene(new GameScene())
```

### `pause()`

Pauses the game loop. Calls `scene.pause()`. Updates stop but rendering continues.

### `resume()`

Resumes the game loop. Resets the clock accumulator and `_lastTime` to prevent a delta-time spike. Calls `scene.resume()`.

### `togglePause()`

Toggles between paused and resumed states.

### `destroy()`

Stops the game loop, cancels `requestAnimationFrame`, disconnects the `ResizeObserver`, removes visibility and resize listeners, exits the current scene, and destroys the input context.

## UI / DOM Methods

### `refreshUI()`

Re-renders the current scene's `renderUI()` output into `scene.root`.

### `patchUI(updates)`

Efficiently patches text content of DOM elements by id. Only updates elements where the content has changed.

```js
game.patchUI({
  score: 'Score: 42',
  lives: 'Lives: 3',
})
```

## Interpolation

The game loop calls `scene.interpolate(alpha)` after all fixed updates and before rendering, where `alpha = clock.alpha` (the fraction of a fixed step remaining in the accumulator). This allows smooth visual interpolation between fixed timesteps.

```js
scene.interpolate = function (alpha) {
  // smoothly interpolate sprite positions between updates
}
```

## Auto-Pause

When `autoPause` is enabled (default), the game automatically pauses when the browser tab is hidden (`visibilitychange` event) and resumes when the tab becomes visible again. Uses `_pausedByVisibility` flag to avoid conflicting with manual `pause()`/`resume()` calls.

## Viewport Scaling

When `scaleToFit` is enabled, the canvas automatically scales to fill the viewport using CSS `transform`.

```js
const game = new Game({
  width: 800,
  height: 600,
  scaleToFit: true,
})
```

Also supports custom config via `{ width, height, padding, element }` and exposes CSS custom properties `--jygame-scale` and `--jygame-margin-v`.

## Example

```js
const game = new Game({
  width: 800,
  height: 600,
  parent: '#game-container',
  fps: 60,
})

const scene = new Scene()
scene.update = dt => { /* ... */ }
scene.render = ctx => { /* ... */ }

game.run(scene)
```
