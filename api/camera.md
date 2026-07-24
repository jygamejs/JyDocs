# Camera

The `Camera` defines the visible region of the world. It controls position, zoom, and rotation. The engine `Scene` creates a default `View` with a Camera — access it via `scene.view.camera`.

## Constructor

```js
const camera = new Camera(x, y, zoom)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | `number` | `0` | Center X in world space |
| `y` | `number` | `0` | Center Y in world space |
| `zoom` | `number` | `1` | Scale factor (`1` = 100%, `2` = 2× zoomed in) |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x` | `number` | `0` | Center X in world space |
| `y` | `number` | `0` | Center Y in world space |
| `zoom` | `number` | `1` | Scale factor |
| `rotation` | `number` | `0` | World rotation in radians (get/set with cached cos/sin) |
| `target` | `object` or `null` | `null` | If set, camera syncs position to `target.x` / `target.y` each frame |

## Methods

### `lookAt(x, y)`

```js
camera.lookAt(400, 300)
```

Moves camera to look at a world point (sets `x` and `y`).

### `translate(dx, dy)`

```js
camera.translate(10, 0)  // pan right by 10px
```

Offsets the camera position.

### `rotate(rad)`

```js
camera.rotate(0.1)  // rotate by 0.1 radians
```

Adds to the current rotation.

### `apply(ctx, vx, vy, vw, vh)`

```js
camera.apply(ctx, 0, 0, 800, 600)
```

Applies the camera transform to a canvas context. Translates to viewport center, scales by zoom, rotates by `-rotation`, then translates by `-x, -y`. Typically called automatically by `View.prepare()`.

### `clone()`

```js
const copy = camera.clone()
```

Returns a new `Camera` with the same position, zoom, and rotation.

### `copy(other)`

```js
camera.copy(otherCamera)
```

Copies all fields (position, zoom, rotation, target) from another camera.

## Usage

The engine Scene sets up a default View with a Camera automatically. Access and modify it through `scene.view`:

```js
import { Game, Scene } from "jygame";

class MyScene extends Scene {
  onEnter() {
    // Default camera is at (0, 0) with zoom = 1
    this.view.camera.lookAt(400, 300);
    this.view.camera.zoom = 2;
  }

  update(dt) {
    // Track a target
    this.view.camera.target = this.player;
  }
}
```

For coordinate conversion (screen ↔ world), use `this.view.screenToWorld()` / `this.view.worldToScreen()`, or the `InputSystem` coordinate system via `game.inputSystem.coordinateSystem`.
