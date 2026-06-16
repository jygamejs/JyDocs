# Particle System

The particle system consists of three classes: `Particle` (data object), `ParticleSystem` (engine with modifier pipeline and ActivePool-based lifecycle), and `ParticleEmitter` (rate-based and burst emission with follow support).

## Particle

A lightweight data object holding per-particle state. Particles are pooled and reused by `ParticleSystem` — do not construct them manually.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x` | `number` | `0` | Position X |
| `y` | `number` | `0` | Position Y |
| `vx` | `number` | `0` | Velocity X |
| `vy` | `number` | `0` | Velocity Y |
| `ax` | `number` | `0` | Acceleration X |
| `ay` | `number` | `0` | Acceleration Y |
| `life` | `number` | `0` | Remaining life in seconds |
| `maxLife` | `number` | `0` | Total life duration |
| `size` | `number` | `1` | Render size in pixels |
| `rotation` | `number` | `0` | Current rotation in radians |
| `rotationSpeed` | `number` | `0` | Rotation speed in radians/sec |
| `alpha` | `number` | `1` | Opacity 0–1 |
| `r` | `number` | `255` | Red channel (0–255) |
| `g` | `number` | `255` | Green channel |
| `b` | `number` | `255` | Blue channel |
| `color` | `string` | `"#ffffff"` | Hex color string |
| `texture` | `HTMLImageElement` | `null` | Optional sprite texture |
| `originX` | `number` | `0.5` | Horizontal origin (0–1) |
| `originY` | `number` | `0.5` | Vertical origin (0–1) |
| `width` | `number` | `0` | Override render width (`0` = use `size`) |
| `height` | `number` | `0` | Override render height (`0` = use `size`) |
| `frameX` | `number` | `0` | Sprite-sheet frame X offset |
| `frameY` | `number` | `0` | Sprite-sheet frame Y offset |
| `frameWidth` | `number` | `0` | Sprite-sheet frame width |
| `frameHeight` | `number` | `0` | Sprite-sheet frame height |
| `userData` | `any` | `null` | Custom data slot |
| `ageRatio` | `number` | `0` | Normalized age 0–1 (set by update) |

### Getters

| Getter | Description |
|--------|-------------|
| `lifeRatio` | `life / maxLife` (0–1) |

### Methods

#### `setFrame(x, y, width, height)`

Sets sprite-sheet frame coords. Returns `this`.

#### `clearFrame()`

Resets all frame coords to `0`. Returns `this`.

---

## ParticleSystem

The core engine. Manages a pooled particle lifecycle, modifier pipeline, and rendering. Uses `ActivePool` internally.

### Constructor

```js
const system = new ParticleSystem({ renderParticle })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `renderParticle` | `function` | `null` | Optional custom `(ctx, particle)` render function |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `particles` | `Particle[]` | Read-only reference to active particles array |
| `activeCount` | `number` | Number of currently alive particles |
| `freeCount` | `number` | Number of pooled free particles |
| `capacity` | `number` | Total managed particles (active + free) |
| `isEmpty` | `boolean` | `true` when no particles are active |
| `hasParticles` | `boolean` | `true` when at least one particle is active |
| `modifierCount` | `number` | Number of registered modifiers |
| `peakActive` | `number` | Highest `activeCount` ever reached |
| `peakCapacity` | `number` | Highest `capacity` ever reached |
| `peakFree` | `number` | Highest `freeCount` ever reached |
| `totalCreated` | `number` | Total particles ever allocated |

### Methods

#### `emit(count, initializer, emitter)`

```js
system.emit(50, (p, i, emitter) => {
  p.x = 200
  p.y = 300
  p.maxLife = 2
  p.vx = (Math.random() - 0.5) * 100
})
```

Emit `count` particles. The optional `initializer(p, index, emitter)` is called before modifier `onEmit` hooks.

#### `emitOne(initializer)`

Emit a single particle and return it.

#### `update(dt)`

Advances all particles: applies acceleration to velocity, velocity to position, decrements life, runs all modifier phases, and releases dead particles.

#### `render(ctx)`

Renders all active particles. If `renderParticle` was provided, delegates to it. Otherwise renders via `drawImage` (if `texture` is set) or `fillRect`.

#### `addModifier(modifier, priority)`

```js
system.addModifier(new FadeModifier({ mode: 'out' }), 0)
```

Registers a modifier with optional priority (lower runs first). Must implement at least one lifecycle method.

#### `removeModifier(modifier)`

Removes and destroys the modifier.

#### `clearModifiers()`

Removes and destroys all modifiers.

#### `clear()`

Releases all active particles back to the pool.

#### `warmup(count)`

Pre-allocates `count` particles to avoid mid-game allocation spikes.

#### `destroy()`

Frees all resources.

---

## ParticleEmitter

Rate-based and burst particle emission with optional target following.

### Constructor

```js
const emitter = new ParticleEmitter({ system, rate: 20, initializer })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `system` | `ParticleSystem` | *(required)* | The particle system to emit into |
| `rate` | `number` | `0` | Particles per second |
| `initializer` | `function` | `null` | `(p, i, emitter)` callback |

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x` | `number` | `0` | Emitter world X position |
| `y` | `number` | `0` | Emitter world Y position |
| `vx` | `number` | `0` | Inherited velocity X |
| `vy` | `number` | `0` | Inherited velocity Y |
| `offsetX` | `number` | `0` | Position offset X |
| `offsetY` | `number` | `0` | Position offset Y |
| `velocityInheritance` | `number` | `1` | Fraction of velocity to pass to particles |

### Getters / Setters

| Property | Type | Description |
|----------|------|-------------|
| `active` | `boolean` | Whether the emitter is running (read-only) |
| `enabled` | `boolean` | Start/stop emission via setter |
| `rate` | `number` | Particles per second |
| `initializer` | `function` | Particle initializer callback |
| `emittedCount` | `number` | Total particles emitted so far |
| `isFollowing` | `boolean` | Whether a follow target is set |
| `isPaused` | `boolean` | Whether emission is paused |

### Methods

#### `start()`

Begin automatic emission.

#### `stop()`

Stop automatic emission.

#### `toggle()`

Toggle between started and stopped.

#### `pause()`

Pause emission without resetting accumulator.

#### `resume()`

Resume paused emission.

#### `restart()`

Reset accumulator and count, then start.

#### `emit(count)`

Burst-emit a specific number of particles.

#### `emitOne()`

Burst-emit a single particle.

#### `burst(count)`

Alias for `emit(count)`.

#### `follow(target, getter)`

```js
emitter.follow(player, (t) => t.transform)
```

Follow a target object. The optional `getter` extracts position (default returns `t.transform`).

#### `clearFollow()`

Stop following.

#### `setPosition(x, y)`

Set emitter position.

#### `move(dx, dy)`

Move emitter by delta.

#### `setVelocity(vx, vy)`

Set inherited velocity.

#### `update(dt)`

Accumulates emission based on `rate * dt`. If following, snaps position to target.

#### `reset()`

Reset accumulator and emitted count.

#### `destroy()`

Stop, reset, clear follow, and mark destroyed.

## Usage

```js
import { ParticleSystem, ParticleEmitter, FadeModifier, ScaleModifier } from 'jygame'

const system = new ParticleSystem()
system.addModifier(new FadeModifier({ mode: 'out' }))
system.addModifier(new ScaleModifier({ from: 2, to: 0 }))

const emitter = new ParticleEmitter({
  system,
  rate: 30,
  initializer: (p) => {
    p.x = 400
    p.y = 300
    p.maxLife = 1.5
    p.vx = (Math.random() - 0.5) * 100
    p.vy = (Math.random() - 0.5) * 100
    p.size = 8
  },
})

emitter.start()

// In scene.update:
emitter.update(dt)
system.update(dt)

// In scene.render:
system.render(ctx)
```
