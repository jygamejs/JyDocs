# Renderable

The `Renderable` component holds visual state for an entity — an optional image, fill style, and shape definition. It caches `Path2D` objects for circles and ellipses to avoid rebuilding them each frame.

## Constructor

```js
new Renderable(image, style)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `image` | `HTMLImageElement \| null` | `null` | Optional image to draw |
| `style` | `object` | `{ fill: '#ffffff', shape: 'rect' }` | Style configuration |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | `HTMLImageElement \| null` | `null` | Image drawn centered within the entity bounds |
| `style` | `object` | `{ fill: '#ffffff', shape: 'rect' }` | `{ fill: colorString, shape: 'rect' \| 'circle' \| 'ellipse' }` |

## Methods

### `draw(ctx, w, h)`

Draws the renderable at the origin `(0, 0)` with the given width and height. The caller is responsible for any transform (translate, rotate, scale) applied to the context beforehand.

If `image` is set, draws it centered via `drawImage`. Otherwise draws a shape:
- **`'rect'`** — `fillRect(-w/2, -h/2, w, h)`
- **`'circle'`** — cached `Path2D.arc(0, 0, r, 0, 2π)`
- **`'ellipse'`** — cached `Path2D.ellipse(0, 0, w/2, h/2, 0, 0, 2π)`

Path2D caches are invalidated when the shape type or dimensions change.

```js
renderable.draw(ctx, 32, 48)
```

## Style Configuration

```js
renderable.style.fill = '#B0DE8E'
renderable.style.shape = 'circle'   // 'rect' | 'circle' | 'ellipse'
```
