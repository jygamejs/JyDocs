# Camera

The `Camera` defines the visible region of the world. It controls position, zoom, and rotation, and is applied by the `RenderSystem` before drawing entities. The first camera created automatically becomes `Camera.main`, used as the default by `RenderSystem`.

## Static Properties & Methods

| Member | Description |
|--------|-------------|
| `Camera.main` | The default camera instance (set automatically on creation, or manually via `setMain`) |
| `Camera.setMain(camera)` | Explicitly set a camera as the main/default |

## Constructor

```js
const camera = new Camera(x, y, width, height)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | `number` | `0` | Center X in world space |
| `y` | `number` | `0` | Center Y in world space |
| `width` | `number` | `0` | Viewport width in pixels |
| `height` | `number` | `0` | Viewport height in pixels |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x` | `number` | `0` | Center X in world space |
| `y` | `number` | `0` | Center Y in world space |
| `width` | `number` | `0` | Viewport width in pixels |
| `height` | `number` | `0` | Viewport height in pixels |
| `zoom` | `number` | `1` | Scale factor (higher = zoomed in) |
| `rotation` | `number` | `0` | World rotation in radians (get/set with cached cos/sin) |

## Methods

### `apply(ctx)`

```js
camera.apply(ctx)
```

Applies the camera transform to the canvas context (translate to center, scale by zoom, rotate by -rotation, translate by -position). Called by `RenderSystem` automatically.

### `follow(entity)`

```js
camera.follow(entity)
```

Sets `camera.x` and `camera.y` to `entity.transform.x` and `entity.transform.y`. Useful for tracking the player.

### `worldToScreen(wx, wy, out)`

```js
camera.worldToScreen(worldX, worldY, out)  // returns out
```

Converts world coordinates to screen pixel coordinates. Writes result into `out` (`{ x, y }`). **`out` is required** — the method does not allocate a new object.

### `screenToWorld(sx, sy, out)`

```js
camera.screenToWorld(screenX, screenY, out)  // returns out
```

Converts screen pixel coordinates to world coordinates. Writes result into `out` (`{ x, y }`). **`out` is required** — the method does not allocate a new object.

## Usage

```js
import { Camera, Game, Scene, Sprite } from 'jygame'

const game = new Game({ width: 800, height: 600 })
const camera = new Camera(400, 300, 800, 600)  // becomes Camera.main automatically
const player = new Sprite(0, 0, 32, 32)

const scene = new Scene()
scene.update = function (dt) {
  camera.follow(player)
}

scene.render = function (ctx) {
  // RenderSystem uses Camera.main automatically
  renderSystem.render(ctx, allEntities)
}
```
