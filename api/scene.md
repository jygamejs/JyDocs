# Scene

The `Scene` class organizes your game into distinct states (menu, gameplay, pause, game over) with lifecycle hooks.

## Constructor

```js
const scene = new Scene()
```

Creates `scene.root` — a `<div>` element used as the DOM UI overlay container.

## Lifecycle Hooks

All hooks are no-ops by default — override them on your scene instance or prototype.

| Hook | Signature | Called When |
|------|-----------|-------------|
| `enter()` | `enter()` | Scene becomes active (via `game.run()` or `switchScene()`) |
| `exit()` | `exit()` | Scene is exited — automatically runs all cleanup functions |
| `pause()` | `pause()` | `game.pause()` is called |
| `resume()` | `resume()` | `game.resume()` is called |
| `update(dt)` | `update(dt)` | Each fixed timestep tick |
| `interpolate(alpha)` | `interpolate(alpha)` | After all fixed updates, before render — for smooth interpolation |
| `render(ctx)` | `render(ctx)` | Each frame — receives the canvas 2D context |
| `renderUI()` | `renderUI()` | Returns an HTML string for the DOM overlay |

```js
const scene = new Scene()

scene.enter = () => {
  this.player = new Sprite(100, 100, 32, 32)
}

scene.update = (dt) => {
  this.player.x += 200 * dt
}

scene.render = (ctx) => {
  ctx.clearRect(0, 0, 800, 600)
  this.player.render(ctx)
}

scene.renderUI = () => {
  return '<div id="hud">HP: 100</div>'
}
```

## DOM UI

The scene's `root` div is appended to `game`'s DOM overlay when the scene is active. `renderUI()` populates it.

```js
scene.renderUI = function () {
  return `<h1>Score: ${this.score}</h1>`
}
```

Call `game.refreshUI()` to re-render, or `game.patchUI({ id: 'Score: 42' })` for efficient partial updates.

## Event Listener Cleanup

Methods that auto-clean on `exit()`:

| Method | Signature | Description |
|--------|-----------|-------------|
| `on(target, event, handler)` | `on(el, 'click', fn)` | Registers a DOM listener, pushes cleanup |
| `onSwipe(cb)` | `onSwipe(dir => ...)` | Wraps `Input.onSwipe` with auto-cleanup |
| `onTap(cb)` | `onTap(({x, y}) => ...)` | Wraps `Input.onTap` with auto-cleanup |
| `cleanup(fn)` | `cleanup(() => ...)` | Manually push a function to `_cleanups` |

```js
scene.enter = function () {
  this.on(document, 'keydown', this.handleKey)
  this.onSwipe(dir => this.move(dir))
}
```

## Scene Transitions

```js
this.transitionTo(nextScene)
// or
this.game.switchScene(nextScene)
```

Calls `exit()` on the current scene (triggering cleanup), then `enter()` on the new scene.
