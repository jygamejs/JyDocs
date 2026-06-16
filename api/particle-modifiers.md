# Particle Modifiers

Modifiers hook into the particle lifecycle to transform particles each frame. Each modifier implements one or more lifecycle methods (`beginFrame`, `update`, `onEmit`, `onDeath`, `endFrame`). The `ParticleSystem` runs them in priority order via `addModifier(modifier, priority)`.

## FadeModifier

Fades particle alpha over its lifetime.

### Constructor

```js
new FadeModifier({ mode, easing, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `string` | `"out"` | `"out"`, `"in"`, or `"in-out"` |
| `easing` | `string` | `"linear"` | Easing function name |
| `priority` | `number` | `0` | Modifier execution priority |

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Toggle modifier on/off |

### Lifecycle

| Method | Phase |
|--------|-------|
| `update(particle, dt)` | Per-particle update |

---

## ScaleModifier

Scales particle size over its lifetime.

### Constructor

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
| `priority` | `number` | `0` | Modifier execution priority |

When mode is `"in-out"`, size grows from `min` to `max` over the first half of life, then shrinks back. Otherwise size interpolates from `from` to `to`.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Toggle modifier on/off |

### Lifecycle

| Method | Phase |
|--------|-------|
| `update(particle, dt)` | Per-particle update |

---

## VelocityModifier

Applies exponential drag to particle velocity.

### Constructor

```js
new VelocityModifier({ drag, affectX, affectY, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `drag` | `number` | `0` | Drag coefficient (higher = faster deceleration) |
| `affectX` | `boolean` | `true` | Apply drag to X velocity |
| `affectY` | `boolean` | `true` | Apply drag to Y velocity |
| `priority` | `number` | `0` | Modifier execution priority |

Uses exponential decay: `velocity *= Math.exp(-drag * dt)`.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Toggle modifier on/off |

### Lifecycle

| Method | Phase |
|--------|-------|
| `beginFrame(dt)` | Before any updates — computes the decay factor |
| `update(particle)` | Per-particle velocity scaling |

---

## ColorModifier

Lerps particle color through a series of stops over its lifetime.

### Constructor

```js
new ColorModifier({ from, to, stops, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `from` | `string` | `"#ffffff"` | Start hex color (when `stops` is not used) |
| `to` | `string` | `"#000000"` | End hex color |
| `stops` | `array` | `null` | Array of `[position, "#hex"]` tuples |
| `priority` | `number` | `0` | Modifier execution priority |

If `stops` is provided, each entry is `[position 0–1, hexColor]`. At least 2 stops are required. The modifier interpolates RGB values between stops based on `particle.ageRatio`.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Toggle modifier on/off |

### Lifecycle

| Method | Phase |
|--------|-------|
| `update(particle, dt)` | Per-particle color lerp |

---

## AnimatedSpriteModifier

Drives sprite-sheet frame animation over a particle's lifetime.

### Constructor

```js
new AnimatedSpriteModifier({ frames, mode, loops, reverse, randomStart, animationDuration, onAnimationStart, onAnimationLoop, onAnimationComplete, onFrameChange, priority })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `frames` | `object[]` | *(required)* | Array of `{ x, y, width, height }` frame rects |
| `mode` | `string` | `"once"` | `"once"`, `"loop"`, `"pingpong"`, or `"random"` |
| `loops` | `number` | `1` | Number of loops (for `"loop"` and `"pingpong"` modes) |
| `reverse` | `boolean` | `false` | Reverse frame order |
| `randomStart` | `boolean` | `false` | Start at a random frame |
| `animationDuration` | `number` | `null` | Override duration in seconds (defaults to `maxLife`) |
| `onAnimationStart` | `function` | `null` | `(particle)` — first frame rendered |
| `onAnimationLoop` | `function` | `null` | `(particle, loopCount)` — each loop completed |
| `onAnimationComplete` | `function` | `null` | `(particle)` — final frame of "once" mode |
| `onFrameChange` | `function` | `null` | `(particle, frameIndex)` — every frame change |
| `priority` | `number` | `0` | Modifier execution priority |

Each frame object may include an optional `duration` property for per-frame timing (in seconds). If no frame has `duration`, frames are evenly distributed over the animation.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Toggle modifier on/off |

### Lifecycle

| Method | Phase |
|--------|-------|
| `onEmit(particle)` | Sets initial frame and random offset |
| `update(particle)` | Advances frame based on age ratio |

---

## Easing Reference

Easing functions are available via the `EASINGS` constant in `modifiers/easing.js`. Modifiers accept easing names as strings in their constructor options.

| Name | Formula |
|------|---------|
| `linear` | `t` |
| `quadIn` | `t * t` |
| `quadOut` | `t * (2 - t)` |
| `quadInOut` | `t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)` |

## Usage

```js
import { ParticleSystem, FadeModifier, ScaleModifier, ColorModifier, VelocityModifier, AnimatedSpriteModifier } from 'jygame'

const system = new ParticleSystem()

system.addModifier(new FadeModifier({ mode: 'out' }))
system.addModifier(new ScaleModifier({ from: 3, to: 0, easing: 'quadOut' }))
system.addModifier(new ColorModifier({
  from: '#ff4444',
  to: '#4444ff',
  easing: 'quadIn',
}))
system.addModifier(new VelocityModifier({ drag: 2 }))

system.addModifier(new AnimatedSpriteModifier({
  frames: [
    { x: 0, y: 0, width: 32, height: 32 },
    { x: 32, y: 0, width: 32, height: 32 },
    { x: 64, y: 0, width: 32, height: 32 },
  ],
  mode: 'loop',
}))

// In scene.update:
system.update(dt)
```
