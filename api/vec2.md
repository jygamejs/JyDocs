# Vec2

2D vector class with common math operations. Most methods return `this` for chaining.

## Constructor

```js
new Vec2(x, y)
```

```js
const v = new Vec2(3, 4)
```

## Properties

| Property | Type | Default |
|---|---|---|
| `x` | `number` | `0` |
| `y` | `number` | `0` |

## Instance Methods

Unless noted, all methods **mutate and return `this`**.

| Method | Signature | Returns | Description |
|---|---|---|---|
| `set(x, y)` | `set(3, 4)` | `this` | Sets both components |
| `add(v)` | `add(vec2)` | `this` | Adds another vector in place |
| `sub(v)` | `sub(vec2)` | `this` | Subtracts another vector in place |
| `scale(s)` | `scale(2)` | `this` | Multiplies both components by scalar |
| `dot(v)` | `dot(vec2)` | `number` | Dot product |
| `magnitude()` | `magnitude()` | `number` | `Math.hypot(x, y)` |
| `normalize()` | `normalize()` | `this` | Divides by magnitude (no-op if zero) |
| `angle()` | `angle()` | `number` | `Math.atan2(y, x)` in radians |
| `setAngle(a)` | `setAngle(Math.PI/4)` | `this` | Sets direction preserving magnitude |
| `rotate(a)` | `rotate(radians)` | `this` | Rotates by angle using 2D rotation matrix |
| `perpendicular()` | `perpendicular()` | `this` | 90° CCW rotation (swaps x/y, negates x) |
| `dist(v)` | `dist(vec2)` | `number` | Euclidean distance to another vector |
| `clone()` | `clone()` | `Vec2` | Returns a new copy |

## Static Methods

| Method | Signature | Returns | Description |
|---|---|---|---|
| `fromAngle(angle, length)` | `fromAngle(Math.PI, 50)` | `Vec2` | Creates a vector from angle (radians) and optional length (default 1) |
| `lerp(a, b, t)` | `lerp(v1, v2, 0.5)` | `Vec2` | Linear interpolation between two vectors |

## Usage

```js
const pos = new Vec2(100, 200)
const vel = Vec2.fromAngle(Math.PI / 2, 150)  // pointing down, speed 150

pos.add(vel.clone().scale(1 / 60))  // move by velocity over one frame

const dir = pos.clone().sub(target).normalize()  // unit vector toward target
const d = pos.dist(target)                       // distance to target

const mid = Vec2.lerp(a, b, 0.5)                 // midpoint
```
