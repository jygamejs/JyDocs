# Scene

The `Scene` class organizes your game into distinct states with lifecycle hooks. It extends the ECS `Scene` base class and owns a `World` for all entities and systems.

Scenes are **single-use** — once exited, they must not be re-entered. Create a new scene instance instead.

## Constructor

```js
const scene = new Scene()
```

Creates `scene.root` — a `<div>` element for DOM UI overlays. Sets `blocksUpdateBelow = true` and `blocksRenderBelow = false`.

The engine `Scene` overrides `_createWorld()` to use `DefaultWorldBuilder.createDefault()`, giving each scene a pre-configured World with all built-in components, systems, and resources.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `scene.world` | `World` | | The scene's ECS World (lazily created) |
| `scene.blocksUpdateBelow` | `boolean` | `true` | Pause `update()` on scenes below |
| `scene.blocksRenderBelow` | `boolean` | `false` | Skip `render()` on scenes below |

The scene's `world` is lazily initialized on first access. During `enter()`, the engine Scene:
1. Sets `world` resources: `CanvasContext` (canvas 2D context), `Camera` (viewport)
2. Sets `Sprite._defaultWorld` to the scene's World (so `new Sprite()` uses it)

On `exit()`:
1. Runs all cleanup functions (event listeners, etc.)
2. Restores `Sprite._defaultWorld`
3. Clears systems and resources
4. Destroys the World

## Lifecycle Hooks

All hooks are no-ops by default. Scenes throw if `enter()` or `exit()` is called more than once.

| Hook | Signature | Called When |
|------|-----------|-------------|
| `enter()` | `enter()` | Scene becomes active |
| `exit()` | `exit()` | Scene is exited — runs all cleanup functions |
| `pause()` | `pause()` | Scene is paused by a scene pushed on top |
| `resume()` | `resume()` | Scene is resumed after the scene above is popped |
| `update(dt)` | `update(dt)` | Each fixed timestep tick — `world.update(dt)` is called by the engine |
| `interpolate(alpha)` | `interpolate(alpha)` | After all fixed updates, before render |
| `render(ctx)` | `render(ctx)` | Each frame — receives the canvas 2D context |
| `renderUI()` | `renderUI()` | Returns an HTML string for the DOM overlay |

```js
const scene = new Scene()

scene.enter = function () {
  const world = this.world
  this.player = world.createEntity()
  world.addMany(this.player, Transform, Velocity, Renderable, Visible, Collider, RenderBounds)
  world.set(this.player, Transform, { x: 400, y: 300 })
  world.set(this.player, Renderable, { fillColor: 0x63B44EFF })
}

scene.update = function (dt) {
  const vel = this.world.get(this.player, Velocity)
  if (Input.isDown('RIGHT')) vel.x = 200
  else if (Input.isDown('LEFT')) vel.x = -200
  else vel.x = 0
}

scene.render = function (ctx) {
  ctx.clearRect(0, 0, 800, 600)
}
```

## Scene Stack Transitions

| Method | Description |
|--------|-------------|
| `pushScene(scene)` | Push a scene on top (e.g., pause overlay) |
| `popScene()` | Pop the current scene, resume the one below |
| `replaceScene(scene)` | Replace the current scene in-place |
| `switchScene(scene)` | Reset the entire stack to one scene |
| `transitionTo(scene)` | Alias for `switchScene(scene)` |

```js
this.pushScene(new PauseScene())
this.popScene()
this.replaceScene(new GameOverScene())
this.switchScene(new MenuScene())
```

## Blocking

When `blocksUpdateBelow = true` (default), scenes below are paused via `pause()`/`resume()`. When `blocksRenderBelow = false` (default), all visible scenes render in order bottom to top.

```js
class PauseScene extends Scene {
  constructor() {
    super()
    this.blocksUpdateBelow = true
    this.blocksRenderBelow = false
  }
  renderUI() {
    return '<div class="pause-overlay">PAUSED</div>'
  }
}
```

## DOM UI

The scene's `root` div is appended to the game's DOM overlay when active.

```js
scene.renderUI = function () {
  return `<h1>Score: ${this.score}</h1>`
}
```

## Event Listener Cleanup

| Method | Description |
|--------|-------------|
| `on(target, event, handler)` | DOM listener, auto-cleaned on exit |
| `onSwipe(cb)` | `Input.onSwipe` with auto-cleanup |
| `onTap(cb)` | `Input.onTap` with auto-cleanup |
| `cleanup(fn)` | Manually push to cleanup stack |

```js
scene.enter = function () {
  this.on(document, 'keydown', this.handleKey)
}
```
