# Emitter Shapes

Emitter shapes define where and how particles spawn. Each shape implements `sample(particle)` which sets the particle's initial `x`, `y` and optionally `vx`, `vy`. Shapes are assigned to a `ParticleEmitter` via the `shape` property or the constructor option.

All shapes extend `EmitterShape`.

---

## EmitterShape (Base)

Base class for all emitter shapes. Not used directly.

### Properties (inherited by all shapes)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x` | `number` | `0` | Shape origin X (set by emitter each frame) |
| `y` | `number` | `0` | Shape origin Y |
| `direction` | `string` | `null` | Emission direction mode |
| `spread` | `number` | `0` | Angle spread in radians |
| `minSpeed` | `number` | `0` | Minimum emission speed |
| `maxSpeed` | `number` | `0` | Maximum emission speed |

### Methods

| Method | Description |
|--------|-------------|
| `sample(particle)` | Populates `x`, `y` and optionally `vx`, `vy` on the particle |

---

## RectangleShape

Spawns particles uniformly within a rectangular area.

```js
new RectangleShape(width, height)
new RectangleShape({ width, height, direction, speed, spread })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | *(required)* | Rectangle width |
| `height` | `number` | *(required)* | Rectangle height |
| `direction` | `string` | — | `"up"`, `"down"`, `"left"`, or `"right"` |
| `speed` | `number` | — | Emission speed (required if direction set) |
| `spread` | `number` | `0` | Angle spread in radians |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `width` | `number` | Rectangle width |
| `height` | `number` | Rectangle height |

### Example

```js
const shape = new RectangleShape({ width: 100, height: 200, direction: 'up', speed: 80, spread: 0.2 })
```

---

## CircleShape

Spawns particles uniformly within a circular area.

```js
new CircleShape(radius)
new CircleShape({ radius, direction, speed, spread })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `radius` | `number` | *(required)* | Circle radius |
| `direction` | `string` | — | `"outward"`, `"inward"`, `"clockwise"`, or `"counterclockwise"` |
| `speed` | `number` | — | Emission speed |
| `spread` | `number` | `0` | Angle spread in radians |

Uses `sqrt(random()) * radius` for uniform area distribution.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `radius` | `number` | Circle radius |

---

## RingShape

Spawns particles uniformly within a ring (annulus) area.

```js
new RingShape(innerRadius, outerRadius)
new RingShape({ innerRadius, outerRadius, direction, speed, spread })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `innerRadius` | `number` | *(required)* | Inner ring radius |
| `outerRadius` | `number` | *(required)* | Outer ring radius (must be > innerRadius) |
| `direction` | `string` | — | `"outward"`, `"inward"`, `"clockwise"`, or `"counterclockwise"` |
| `speed` | `number` | — | Emission speed |
| `spread` | `number` | `0` | Angle spread in radians |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `innerRadius` | `number` | Inner radius |
| `outerRadius` | `number` | Outer radius |

---

## LineShape

Spawns particles along a line segment.

```js
new LineShape(x1, y1, x2, y2, options)
```

| Argument | Type | Description |
|----------|------|-------------|
| `x1`, `y1` | `number` | Start point |
| `x2`, `y2` | `number` | End point |
| `options.direction` | `string` | `"along"`, `"reverse"`, `"perpendicular"`, or `"perpendicularReverse"` |
| `options.speed` | `number` | Emission speed |
| `options.spread` | `number` | Angle spread |

---

## ConeShape

Spawns particles in a cone-shaped area.

```js
new ConeShape({ radius, angle, direction, speed, spread })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `radius` | `number` | *(required)* | Cone radius |
| `angle` | `number` | *(required)* | Cone angle in radians `(0, 2π]` |
| `direction` | `number` | `0` | Cone center direction in radians |
| `speed` | `number`/`array` | — | Emission speed or `[min, max]` range |
| `spread` | `number` | `0` | Velocity angle spread |

When `speed` is set, particles automatically receive velocity pointing in the spawn direction within the cone arc.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `radius` | `number` | Cone radius |
| `angle` | `number` | Cone angle |
| `direction` | `number` | Center direction |

---

## PolygonShape

Spawns particles uniformly inside a convex or concave polygon. Uses ear-clipping triangulation for area-weighted sampling.

```js
new PolygonShape(vertices, options)
```

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `vertices` | `[x, y][]` | *(required)* | Polygon vertices (≥ 3, no duplicates) |
| `options.direction` | `string` | — | `"outward"` or `"inward"` |
| `options.speed` | `number` | — | Emission speed |
| `options.spread` | `number` | `0` | Angle spread |

Particle velocity direction is radial from the polygon's origin (the shape's `x`/`y`).

---

## PathShape

Spawns particles along a polyline path (connected line segments).

```js
new PathShape(points, options)
```

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `[x, y][]` | *(required)* | Path points (≥ 2) |
| `options.direction` | `string` | — | `"along"`, `"reverse"`, or `"perpendicular"` |
| `options.speed` | `number` | — | Emission speed |
| `options.spread` | `number` | `0` | Angle spread |

Samples are weighted by segment length — longer segments get more particles.

---

## SplineShape

Spawns particles along a Catmull-Rom spline through the control points. Requires at least 4 points.

```js
new SplineShape(points, options)
```

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `[x, y][]` | *(required)* | Control points (≥ 4) |
| `options.direction` | `string` | — | `"tangent"`, `"reverse"`, or `"normal"` |
| `options.speed` | `number` | — | Emission speed |
| `options.spread` | `number` | `0` | Angle spread |

Internally pre-computes 256 samples per spline segment into a lookup table for efficient arc-length parameterised sampling.

---

## ShapeRegistry

Global registry for emitter shape serialization and deserialization.

### Static Methods

| Method | Description |
|--------|-------------|
| `register(name, ctor)` | Register a custom shape class |
| `unregister(name)` | Remove from registry |
| `has(name)` | Check registration |
| `get(name)` | Get constructor |
| `create(data)` | Deserialise from `{ type, ... }` object |
| `clear()` | Remove all non-builtin registrations |

Built-in registered types: `CircleShape`, `RingShape`, `RectangleShape`, `LineShape`, `ConeShape`, `PolygonShape`, `PathShape`, `SplineShape`.

---

## Usage

```js
import {
  ParticleSystem, ParticleEmitter,
  CircleShape, RectangleShape, ConeShape, LineShape
} from 'jygame'

const system = new ParticleSystem()

// Circle with outward velocity
const burstEmitter = new ParticleEmitter({
  system,
  shape: new CircleShape({ radius: 50, direction: 'outward', speed: 100 }),
  initializer: (p) => { p.maxLife = 2 },
})
burstEmitter.burst(100)

// Cone spray
const sprayEmitter = new ParticleEmitter({
  system,
  rate: 20,
  shape: new ConeShape({ radius: 5, angle: 0.5, speed: [50, 150] }),
  initializer: (p) => { p.maxLife = 1.5, p.size = 4 },
})
sprayEmitter.start()

// Line with perpendicular velocity
const lineEmitter = new ParticleEmitter({
  system,
  shape: new LineShape(0, 0, 200, 0, {
    direction: 'perpendicular',
    speed: 80,
  }),
})
lineEmitter.burst(50)
```
