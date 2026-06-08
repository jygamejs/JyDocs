# Rect

Axis-aligned bounding box (AABB) with edge/center accessors and collision methods.

## Constructor

```js
new Rect(x, y, width, height)
```

```js
const r = new Rect(10, 20, 100, 80)
```

## Properties

| Property | Type | Default |
|----------|------|---------|
| `x` | `number` | `0` |
| `y` | `number` | `0` |
| `w` | `number` | `0` |
| `h` | `number` | `0` |

## Edge Getters / Setters

| Getter | Returns | Setter Effect |
|--------|---------|---------------|
| `left` | `x` | Sets `x` |
| `right` | `x + w` | Sets `x = v - w` |
| `top` | `y` | Sets `y` |
| `bottom` | `y + h` | Sets `y = v - h` |

## Anchor Getters / Setters

| Getter | Returns | Setter Effect |
|--------|---------|---------------|
| `centerx` | `x + w / 2` | `x = v - w / 2` |
| `centery` | `y + h / 2` | `y = v - h / 2` |
| `center` | `{ x, y }` | Sets both `centerx` and `centery` |
| `topleft` | `{ x, y }` | Sets `x, y` |
| `topright` | `{ right, y }` | Sets `right, y` |
| `bottomleft` | `{ x, bottom }` | Sets `x, bottom` |
| `bottomright` | `{ right, bottom }` | Sets `right, bottom` |
| `midtop` | `{ centerx, y }` | Sets `centerx, y` |
| `midleft` | `{ x, centery }` | Sets `x, centery` |
| `midbottom` | `{ centerx, bottom }` | Sets `centerx, bottom` |
| `midright` | `{ right, centery }` | Sets `right, centery` |

## Anchor Methods (with optional `out` parameter)

These methods behave like getters but accept an optional `out` object to avoid allocations. If `out` is provided, its properties are set and it is returned. Otherwise a new object is returned.

| Method | Returns | Description |
|--------|---------|-------------|
| `getCenter(out?)` | `{ x, y }` | Same as `center` getter but with `out` param |
| `getTopLeft(out?)` | `{ x, y }` | Same as `topleft` getter but with `out` param |
| `getTopRight(out?)` | `{ x, y }` | Same as `topright` getter but with `out` param |
| `getBottomLeft(out?)` | `{ x, y }` | Same as `bottomleft` getter but with `out` param |
| `getBottomRight(out?)` | `{ x, y }` | Same as `bottomright` getter but with `out` param |
| `getMidTop(out?)` | `{ x, y }` | Same as `midtop` getter but with `out` param |
| `getMidLeft(out?)` | `{ x, y }` | Same as `midleft` getter but with `out` param |
| `getMidBottom(out?)` | `{ x, y }` | Same as `midbottom` getter but with `out` param |
| `getMidRight(out?)` | `{ x, y }` | Same as `midright` getter but with `out` param |

```js
const out = { x: 0, y: 0 }
rect.getCenter(out)   // writes to out, returns it
rect.getCenter()      // allocates and returns new { x, y }
```

## Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `collides(other)` | `collides(rect)` | `boolean` | AABB overlap test |
| `contains(point)` | `contains({x, y})` | `boolean` | Point inside inclusive bounds |
| `overlap(other)` | `overlap(rect)` | `Rect \| null` | Returns overlapping region or `null` |
| `clamp(outer)` | `clamp(boundaryRect)` | `this` | Clamps to stay inside `outer` |
| `inset(n)` | `inset(5)` | `this` | Shrinks by `n` on all sides |
| `move(dx, dy)` | `move(10, 0)` | `this` | Translates by `(dx, dy)` |
| `copy()` | `copy()` | `Rect` | Returns a new clone (no mutation) |

## Usage

```js
const a = new Rect(0, 0, 50, 50)
const b = new Rect(25, 25, 50, 50)

a.collides(b)                // true
a.overlap(b)                 // Rect { x: 25, y: 25, w: 25, h: 25 }
a.contains({ x: 10, y: 10 }) // true

a.center = { x: 100, y: 100 }
a.right                      // 125

const boundary = new Rect(0, 0, 200, 200)
a.clamp(boundary)
```
