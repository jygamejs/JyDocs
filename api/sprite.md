# Sprite

The `Sprite` class is the basic drawable entity. It wraps position, velocity, dimensions, rotation, scale, a shape or image, and rendering.

## Constructor

```js
const sprite = new Sprite(x, y, width, height)
```

Creates a sprite with position `(x, y)` and size `(width, height)`.

### Default Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `x` | `number` | — | Position X (delegates to `rect.x`) |
| `y` | `number` | — | Position Y (delegates to `rect.y`) |
| `width` | `number` | — | Width (delegates to `rect.w`) |
| `height` | `number` | — | Height (delegates to `rect.h`) |
| `rect` | `Rect` | — | The underlying AABB rectangle |
| `position` | `Vec2` | `Vec2(x, y)` | Position vector |
| `velocity` | `Vec2` | `Vec2(0, 0)` | Velocity vector |
| `angle` | `number` | `0` | Rotation in radians |
| `scale` | `Vec2` | `Vec2(1, 1)` | Scale factor |
| `visible` | `boolean` | `true` | Whether to render |
| `image` | `HTMLImageElement` | `null` | Optional image to draw |
| `style` | `object` | — | `{ fill: '#ffffff', shape: 'rect' }` |
| `groups` | `array` | `[]` | Groups this sprite belongs to |

## Methods

### `update(dt)`

Applies `velocity * dt` to position and syncs `position` to `rect.center`.

```js
sprite.velocity.set(200, 0)
sprite.update(dt)  // moves 200 px/sec right
```

### `render(ctx)`

Renders the sprite if `visible`. Saves context, translates to center, rotates by `angle`, scales by `scale`, calls `draw(ctx)`, restores.

### `draw(ctx)`

Internal draw method. If `image` is set, draws it centered via `drawImage`. Otherwise draws a shape using `style.fill`:

- **`'rect'`** — `fillRect(-w/2, -h/2, w, h)`
- **`'circle'`** — `arc(0, 0, min(w/2, h/2), 0, 2π)`
- **`'ellipse'`** — `ellipse(0, 0, w/2, h/2, 0, 0, 2π)`

### `kill()`

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
player.velocity.set(0, 0)
player.angle = Math.PI / 4  // 45-degree rotation

function update(dt) {
  player.update(dt)
}

function render(ctx) {
  player.render(ctx)
}
```
