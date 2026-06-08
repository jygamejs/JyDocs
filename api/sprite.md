# Sprite

The `Sprite` class is the basic drawable entity. It is composed of **components** — `Transform` (position/rotation/scale), `Collider` (AABB size), `Renderable` (image/style), and a `velocity` Vec2 — with dedicated systems handling update and render logic.

## Constructor

```js
const sprite = new Sprite(x, y, width, height)
```

Creates a sprite with top-left corner at `(x, y)` and the given size. Internally, `transform` is centered at `(x + w/2, y + h/2)`.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | Top-left X (getter/setter, converts from transform center) |
| `y` | `number` | Top-left Y (getter/setter, converts from transform center) |
| `width` | `number` | Width (delegates to `collider.width`) |
| `height` | `number` | Height (delegates to `collider.height`) |
| `transform` | `Transform` | Spatial state: `x`, `y`, `rotation`, `scale` |
| `collider` | `Collider` | AABB collision volume: `width`, `height` |
| `renderable` | `Renderable` | Visual state: `image`, `style` |
| `velocity` | `Vec2` | Velocity vector (applied each frame by `MovementSystem`) |
| `visible` | `boolean` | `true` — set to `false` to skip rendering |
| `angle` | `number` | Rotation in radians (delegates to `transform.rotation`) |
| `scale` | `Vec2` | Scale factor (delegates to `transform.scale`) |
| `image` | `HTMLImageElement \| null` | Optional image (delegates to `renderable.image`) |
| `style` | `object` | `{ fill, shape }` style config (delegates to `renderable.style`) |
| `groups` | `Sprite[]` | Groups this sprite belongs to |

## Methods

### `update(dt)`

```js
sprite.update(dt)
```

Delegates to `movementSystem.updateOne(this, dt)` — applies `velocity * dt` to `transform.x` and `transform.y`.

### `render(ctx)`

```js
sprite.render(ctx)
```

Delegates to `renderSystem.renderOne(ctx, this)` — applies transform, delegates drawing to `renderable.draw()`.

### `kill()`

```js
sprite.kill()
```

Removes the sprite from all groups it belongs to and clears `this.groups`.

## Style

```js
sprite.style.fill = '#B0DE8E'
sprite.style.shape = 'circle'   // 'rect' | 'circle' | 'ellipse'
```

## Usage with Images

```js
const sprite = new Sprite(0, 0, 64, 64)
sprite.image = await ImageLoader.load('/assets/player.png')
```

## Example

```js
const player = new Sprite(100, 200, 32, 48)
player.style.fill = '#63B44E'
player.velocity.set(200, 0)
player.angle = Math.PI / 4

function update(dt) {
  player.update(dt)
}

function render(ctx) {
  player.render(ctx)
}
```

## Working with Components Directly

```js
// Position — x/y getters return top-left corner
player.x = 100
player.y = 200

// Transform center (used internally for rotation/scale)
player.transform.x = 116   // 100 + 32/2
player.transform.rotation = Math.PI / 2

// Collider
player.collider.width = 64

// Renderable
player.renderable.style.shape = 'ellipse'
player.renderable.image = myImg
```
