# Particle Modifiers

Modifiers hook into the particle lifecycle to transform particles each frame. Each modifier implements one or more lifecycle methods: `beginFrame`, `update`, `onEmit`, `onDeath`, `endFrame`. The backend runs them in priority order.

Lifecycle execution order per frame:
1. `beginFrame(dt, ctx)` — once, before any particles
2. Physic integration (acceleration → velocity → position, life decay)
3. `update(acc, dt, ctx)` — per alive particle
4. `onDeath(acc, ctx)` — per dying particle
5. `endFrame(dt, ctx)` — once, after all particles

---

## FadeModifier

Fades particle alpha over its lifetime.

```js
new FadeModifier({ mode, easing, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `string` | `"out"` | `"out"`, `"in"`, or `"in-out"` |
| `easing` | `string` | `"linear"` | Easing function name |
| `priority` | `number` | `0` | Execution priority |

### Lifecycle

`update(acc, dt)` — per-particle alpha interpolation.

---

## ScaleModifier

Scales particle size over its lifetime.

```js
new ScaleModifier({ mode, from, to, min, max, easing, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `string` | `null` | `"in-out"` or unset (linear) |
| `from` | `number` | `1` | Start size (linear mode) |
| `to` | `number` | `0` | End size (linear mode) |
| `min` | `number` | `0` | Minimum size (`"in-out"` mode) |
| `max` | `number` | `1` | Maximum size (`"in-out"` mode) |
| `easing` | `string` | `"linear"` | Easing function name |
| `priority` | `number` | `0` | Execution priority |

When `mode` is `"in-out"`, size grows from `min` to `max` over the first half of life, then shrinks back. Otherwise size interpolates from `from` to `to`.

### Lifecycle

`update(acc, dt)` — per-particle size interpolation.

---

## RotationModifier

Controls particle rotation in either velocity or interpolation mode.

```js
new RotationModifier({ speed, from, to, randomStart, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `speed` | `number` | — | Constant rotation speed (rad/s) — velocity mode |
| `from` | `number` | — | Start rotation (rad) — interpolation mode |
| `to` | `number` | — | End rotation (rad) — interpolation mode |
| `randomStart` | `boolean` | `false` | Randomise initial rotation on emit |
| `priority` | `number` | `0` | Execution priority |

Requires either `speed` (velocity mode — sets `rotationSpeed`) or `from` + `to` (interpolation mode — interpolates `rotation` over life).

### Lifecycle

`onEmit(acc)` — sets initial `rotation` or `rotationSpeed`.  
`update(acc, dt)` — interpolates `rotation` in interpolation mode.

---

## ColorModifier

Lerps particle color through a series of stops over its lifetime.

```js
new ColorModifier({ from, to, stops, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `from` | `string` | `"#ffffff"` | Start hex color (when stops is not used) |
| `to` | `string` | `"#000000"` | End hex color |
| `stops` | `array` | `null` | `[position, "#hex"]` tuples; requires ≥ 2 |
| `priority` | `number` | `0` | Execution priority |

### Lifecycle

`update(acc, dt)` — per-particle color lerp.

---

## VelocityModifier

Applies exponential drag to particle velocity.

```js
new VelocityModifier({ drag, affectX, affectY, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `drag` | `number` | `0` | Drag coefficient (higher = faster deceleration) |
| `affectX` | `boolean` | `true` | Apply drag to X velocity |
| `affectY` | `boolean` | `true` | Apply drag to Y velocity |
| `priority` | `number` | `0` | Execution priority |

Uses `velocity *= Math.exp(-drag * dt)`.

### Lifecycle

`beginFrame(dt)` — precomputes decay factor.  
`update(acc)` — scales velocity.

---

## WindModifier

Applies a constant directional force to all particles.

```js
new WindModifier({ x, y, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `x` | `number` | `0` | Wind force X |
| `y` | `number` | `0` | Wind force Y |
| `priority` | `number` | `0` | Execution priority |

### Lifecycle

`beginFrame(dt)` — precomputes frame impulse.  
`update(acc)` — applies `v += wind * dt`.

---

## TurbulenceModifier

Applies chaotic Perlin-like noise to particle velocity using seeded sin/cos.

```js
new TurbulenceModifier({ strength, frequency, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strength` | `number` | `50` | Noise amplitude |
| `frequency` | `number` | `1` | Noise frequency |
| `priority` | `number` | `0` | Execution priority |

Uses per-particle random seeds and time-varying sin/cos for organic-looking turbulence.

### Lifecycle

`onEmit(acc, ctx)` — assigns per-particle random seed.  
`beginFrame(dt)` — advances global time.  
`update(acc, dt, ctx)` — applies noise to velocity.

---

## ForceModifier

Attracts or repels particles from a static or dynamic target point.

```js
new ForceModifier({ x, y, target, strength, falloff, minDistance, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `x` / `y` | `number` | `0` | Static target position (ignored if `target` is set) |
| `target` | `object` | `null` | Dynamic target with `{ x, y }` or `{ transform: { x, y } }` |
| `strength` | `number` | *(required)* | Force strength |
| `falloff` | `string` | `"none"` | `"none"`, `"inverse"`, or `"inverseSquared"` |
| `minDistance` | `number` | `10` | Minimum clamp distance |
| `priority` | `number` | `0` | Execution priority |

When using a static target, `x`/`y` define the point. When using a dynamic `target`, the modifier reads its position each frame. Strength can be positive (attract) or negative (repel).

### Lifecycle

`update(acc, dt)` — computes force and applies to velocity.

---

## AttractionModifier

A specialised `ForceModifier` that always pulls particles toward the target (convenience wrapper).

```js
new AttractionModifier({ x, y, target, strength, falloff, minDistance, priority })
```

Same options as `ForceModifier`. Always applies force along the direction toward the target.

### Lifecycle

`update(acc, dt)` — computes attraction force and applies to velocity.

---

## OrbitModifier

Creates orbital motion around a target point, with optional radius enforcement.

```js
new OrbitModifier({ x, y, target, strength, falloff, minDistance, radius, stiffness, direction, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `x` / `y` | `number` | `0` | Static orbit center |
| `target` | `object` | `null` | Dynamic orbit center |
| `strength` | `number` | *(required)* | Tangential force strength |
| `falloff` | `string` | `"none"` | Distance falloff |
| `minDistance` | `number` | `10` | Minimum clamp distance |
| `radius` | `number` | `null` | Desired orbit radius (optional) |
| `stiffness` | `number` | `2` | Spring stiffness for radius correction |
| `direction` | `string` | `"counterclockwise"` | `"clockwise"` or `"counterclockwise"` |
| `priority` | `number` | `0` | Execution priority |

When `radius` is set, applies a spring correction force to maintain the desired orbit distance.

### Lifecycle

`update(acc, dt)` — computes tangential force + optional radius spring.

---

## AnimationModifier

Animate any numeric particle property using keyframes.

```js
new AnimationModifier({ property, keyframes, easing, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `property` | `string` | *(required)* | Target property: `size`, `alpha`, `rotation`, `rotationSpeed`, `vx`, `vy`, `ax`, `ay`, `originX`, `originY`, `width`, `height` |
| `keyframes` | `array` | *(required)* | `[position, value]` tuples, positions in `[0, 1]`, strictly increasing, ≥ 2 |
| `easing` | `string` | `"linear"` | Easing between keyframes |
| `priority` | `number` | `0` | Execution priority |

Evaluates the keyframe track against `particle.ageRatio`, interpolating between adjacent keyframes with the specified easing.

### Lifecycle

`onEmit(acc, ctx)` — initialises state, sets first keyframe value.  
`update(acc, dt, ctx)` — advances segment, evaluates and writes property.

---

## SpawnModifier

Spawns child particles from a parent particle, either at regular intervals or on death.

```js
new SpawnModifier({ mode, every, count, initializer, offsetX, offsetY, maxPerFrame, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `string` | *(required)* | `"interval"` or `"death"` |
| `every` | `number` | *(required in interval mode)* | Seconds between spawns |
| `count` | `number` | `1` | Particles per spawn event |
| `initializer` | `function` | *(required)* | `(child, parent)` callback |
| `offsetX` / `offsetY` | `number` | `0` | Spawn offset from parent |
| `maxPerFrame` | `number` | `Infinity` | Limit per frame |
| `priority` | `number` | `0` | Execution priority |

In `"interval"` mode, spawns every `every` seconds of the parent's life. In `"death"` mode, spawns `count` particles when the parent dies.

### Lifecycle

`beginFrame()` — resets per-frame counter.  
`onEmit(acc, ctx)` — initialises interval timer.  
`update(acc, dt, ctx)` — interval spawn logic.  
`onDeath(acc, ctx)` — death spawn logic.

---

## TrailModifier

Leaves a trail of child particles behind moving particles.

```js
new TrailModifier({ mode, every, initializer, inheritVelocity, maxPerFrame, maxDistance, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `string` | `"distance"` | `"distance"` or `"interval"` |
| `every` | `number` | *(required)* | Distance units or seconds between trail particles |
| `initializer` | `function` | *(required)* | `(child, parent)` callback |
| `inheritVelocity` | `boolean` | `false` | Copy parent velocity to child |
| `maxPerFrame` | `number` | `Infinity` | Limit per frame |
| `maxDistance` | `number` | `Infinity` | Maximum trail distance before reset |
| `priority` | `number` | `0` | Execution priority |

In `"distance"` mode, spawns trail particles every `every` units of movement. In `"interval"` mode, spawns every `every` seconds.

### Lifecycle

`beginFrame()` — resets per-frame counter.  
`onEmit(acc, ctx)` — records initial position.  
`update(acc, dt, ctx)` — distance/interval trail logic.

---

## AnimatedSpriteModifier

Drives sprite-sheet frame animation over a particle's lifetime.

```js
new AnimatedSpriteModifier({ frames, mode, loops, reverse, randomStart, animationDuration, onAnimationStart, onAnimationLoop, onAnimationComplete, onFrameChange, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `frames` | `object[]` | *(required)* | `{ x, y, width, height, duration? }` frame rects |
| `mode` | `string` | `"once"` | `"once"`, `"loop"`, `"pingpong"`, or `"random"` |
| `loops` | `number` | `1` | Loop count |
| `reverse` | `boolean` | `false` | Reverse frame order |
| `randomStart` | `boolean` | `false` | Random initial frame |
| `animationDuration` | `number` | `null` | Override duration (defaults to `maxLife`) |
| `onAnimationStart` | `function` | `null` | `(acc)` — first frame rendered |
| `onAnimationLoop` | `function` | `null` | `(acc, loopCount)` |
| `onAnimationComplete` | `function` | `null` | `(acc)` — final frame of "once" mode |
| `onFrameChange` | `function` | `null` | `(acc, frameIndex)` |
| `priority` | `number` | `0` | Execution priority |

If no frame has a `duration`, frames are evenly distributed over the animation.

### Lifecycle

`onEmit(acc)` — sets frame and random offset.  
`update(acc)` — advances frame by age ratio.

---

## CollisionModifier

Handles particle collisions with a spatial query provider. Requires a collision provider to be set on the system via `system.setCollisionProvider()`.

```js
new CollisionModifier({ provider, frequency, priority, onParticleCollision })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `provider` | `object` | `null` | Collision provider (falls back to `system._collisionProvider`) |
| `frequency` | `number` | `1` | Check every N frames (1 = every frame) |
| `priority` | `number` | `0` | Execution priority |
| `onParticleCollision` | `function` | `null` | `(acc, hit)` callback |

Particles use these properties for collision:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `collides` | `boolean` | — | Enable collision for this particle |
| `collisionLayer` | `number` | — | Layer mask for collision filtering |
| `collisionResponse` | `string` | — | `"bounce"`, `"slide"`, `"stop"`, or `"kill"` |
| `radius` | `number` | — | Collision radius |
| `restitution` | `number` | — | Bounce restitution (0–1) |
| `onCollision` | `function` | `null` | Per-particle collision callback `(acc, hit)` |

### Lifecycle

`beginFrame()` — increments frame counter.  
`update(acc, dt, ctx)` — queries provider, resolves collision.  
`endFrame()` — records frame collision count.

---

## ModifierStack

Groups multiple modifiers into a single unit. Can be `addModifier`'d as a single entry. Delegates all lifecycle methods to children in priority order.

```js
const stack = new ModifierStack(modifiers)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `modifiers` | `object[]` | `[]` | Array of modifier instances |

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `number` | — | Number of child modifiers |
| `modifiers` | `object[]` | — | Snapshot of child modifiers |
| `enabled` | `boolean` | `true` | Toggle entire stack |
| `priority` | `number` | `0` | Stack execution priority |

### Methods

| Method | Description |
|--------|-------------|
| `add(modifier)` | Add and re-sort |
| `remove(modifier)` | Remove and destroy |
| `clear()` | Remove and destroy all |
| `has(modifier)` | Direct membership |
| `contains(modifier)` | Recursive membership (checks nested stacks) |
| `clone()` | Deep clone (requires `clone()` on all children) |
| `destroy()` | Destroy all children |

Implements `Symbol.iterator` for direct iteration.

---

## ModifierRegistry

Global registry for modifier type serialization/deserialization.

### Static Methods

| Method | Description |
|--------|-------------|
| `register(name, ctor)` | Register a modifier class |
| `unregister(name)` | Remove from registry |
| `has(name)` | Check registration |
| `get(name)` | Get constructor |
| `create(data)` | Deserialise from `{ type, ... }` object |
| `clear()` | Remove all non-builtin registrations |

Built-in registered types: `FadeModifier`, `ScaleModifier`, `ColorModifier`, `RotationModifier`, `VelocityModifier`, `WindModifier`, `TurbulenceModifier`, `ForceModifier`, `AttractionModifier`, `OrbitModifier`, `AnimationModifier`, `SpawnModifier`, `TrailModifier`, `AnimatedSpriteModifier`, `CollisionModifier`, `ModifierStack`.

---

## KeyframeTrack

Evaluates numeric values from keyframes over a 0–1 timeline. Used internally by `AnimationModifier`.

```js
const track = new KeyframeTrack(keyframes, easing)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `keyframes` | `array` | *(required)* | `[position 0–1, value]` tuples, strictly increasing, ≥ 2 |
| `easing` | `string` | `"linear"` | Easing between keyframe pairs |

### Methods

| Method | Description |
|--------|-------------|
| `advance(age, segment)` | Find the correct segment for a given age |
| `evaluate(age, segment)` | Interpolate value at age using current segment |

---

## Easing Reference

Easing functions are available via `EASINGS`. Modifiers accept easing names as strings.

| Name | Formula |
|------|---------|
| `linear` | `t` |
| `quadIn` | `t * t` |
| `quadOut` | `t * (2 - t)` |
| `quadInOut` | `t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)` |

---

## Usage

```js
import {
  ParticleSystem, ParticleEmitter,
  FadeModifier, ScaleModifier, ColorModifier,
  VelocityModifier, WindModifier, TurbulenceModifier,
  AnimationModifier, SpawnModifier, TrailModifier,
  CollisionModifier, ModifierStack
} from 'jygame'

const system = new ParticleSystem()

// Individual modifiers
system.addModifier(new FadeModifier({ mode: 'out' }), 0)
system.addModifier(new ScaleModifier({ from: 3, to: 0, easing: 'quadOut' }), 1)
system.addModifier(new ColorModifier({ from: '#ff4444', to: '#4444ff' }), 2)
system.addModifier(new VelocityModifier({ drag: 2 }), 3)
system.addModifier(new WindModifier({ x: 20 }), 4)
system.addModifier(new TurbulenceModifier({ strength: 30, frequency: 2 }), 5)

// Keyframe animation
system.addModifier(new AnimationModifier({
  property: 'size',
  keyframes: [[0, 0], [0.3, 2], [1, 0]],
  easing: 'quadOut',
}), 6)

// ModifierStack groups
const spawnStack = new ModifierStack([
  new SpawnModifier({
    mode: 'death',
    count: 5,
    initializer: (child, parent) => {
      child.maxLife = 0.5
      child.size = 2
    },
  }),
])
system.addModifier(spawnStack, 10)

// In scene.update:
system.update(dt)

// In scene.render:
system.render(ctx)
```
