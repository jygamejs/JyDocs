# Particle System

The particle system in v0.8.0 has been rewritten around a **backend architecture**. You create a `ParticleSystem` which delegates to a `CpuParticleBackend` (default) or `GpuParticleBackend` (WebGPU). Particle data is stored in a `SoAParticleStorage` (Structure of Arrays) for cache-efficient simulation. Use `ParticleEmitter` for rate-based emission, optionally paired with an `EmitterShape` for spawn placement. `ParticleEffect` and `ParticleAsset` provide an effect‑asset workflow, and `ParticleLayer`/`ParticleLayerManager` organise systems into ordered, toggleable layers.

## Particle (CPU Backend)

A lightweight data object pooled by the storage. Do not construct it manually.

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
| `alpha` | `number` | `1` | Opacity (0–1) |
| `r` | `number` | `255` | Red channel (0–255) |
| `g` | `number` | `255` | Green channel |
| `b` | `number` | `255` | Blue channel |
| `color` | `string` | `"#ffffff"` | Hex color string (setter parses to `r`/`g`/`b`) |
| `depth` | `number` | `0` | Z-depth for painter sorting |
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
| `ageRatio` | `number` | `0` | Normalised age 0–1 (set by update) |
| `seed` | `number` | `0` | Per-particle random seed for modifiers |
| `segment` | `number` | `0` | Trail segment index |

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

## SoAParticleStorage

Structure-of-Arrays storage that keeps particle fields in contiguous typed arrays (`Float32Array`, `Uint8Array`, `Int32Array`). Provides cache-efficient particle updates and fast GPU upload.

### Constructor

```js
const storage = new SoAParticleStorage({ capacity: 1000, maxCapacity: 5000 })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `capacity` | `number` | `1000` | Initial particle slots |
| `maxCapacity` | `number` | `0` | Hard cap (0 = unlimited growth) |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `activeParticles` | `SoAParticleAccessor[]` | Live particle accessors |
| `activeCount` | `number` | Live particle count |
| `freeCount` | `number` | Free slot count |
| `capacity` | `number` | Current total slots |
| `maxCapacity` | `number` | Maximum slots before throwing |
| `dirtyMin` / `dirtyMax` | `number` | Dirty range for partial GPU uploads |

### Methods

| Method | Description |
|--------|-------------|
| `acquire()` | Claim a free slot, return an accessor |
| `release(acc)` | Return slot to free list |
| `clear()` | Release all particles |
| `warmup(count)` | Pre-touch slots |
| `integrateParticle(acc, dt)` | Apply acceleration, velocity, rotation, life decay inline |

The storage auto-grows by doubling when capacity is exhausted.

---

## CpuParticleBackend

The default backend. Runs the modifier pipeline, integrates physics, and renders on the CPU.

### Constructor

```js
const backend = new CpuParticleBackend({ renderParticle, renderer, system, storage })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `renderParticle` | `function` | `null` | Custom `(ctx, particle)` render override |
| `renderer` | `object` | `CanvasParticleRenderer` | Custom renderer instance |
| `system` | `ParticleSystem` | `null` | Owning system (injected) |
| `storage` | `object` | `SoAParticleStorage` | Particle storage instance |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `particles` | `SoAParticleAccessor[]` | Active particle accessors |
| `activeCount` | `number` | Alive particles |
| `freeCount` | `number` | Free slots |
| `capacity` | `number` | Total slots |
| `isEmpty` / `hasParticles` | `boolean` | Particle existence checks |
| `modifierCount` | `number` | Registered modifiers |
| `peakActive` / `peakCapacity` / `peakFree` | `number` | Runtime stats |
| `totalCreated` | `number` | Total particles ever allocated |
| `sortMode` | `string` | `"none"`, `"oldestFirst"`, `"youngestFirst"`, or `"custom"` |
| `sortEveryFrame` | `boolean` | Re-sort every update |
| `capabilities` | `object` | `ParticleBackendCapabilities.CPU` |

### Methods

| Method | Description |
|--------|-------------|
| `emit(count, initializer, emitter)` | Emit particles with optional initializer |
| `emitOne(initializer)` | Emit single particle |
| `update(dt)` | Advance simulation (physics + modifier phases) |
| `render(ctx)` | Render active particles |
| `addModifier(modifier, priority)` | Register a modifier |
| `removeModifier(modifier)` | Unregister |
| `clearModifiers()` | Remove all |
| `clear()` | Release all particles |
| `warmup(count)` | Pre-allocate |
| `destroy()` | Free resources |
| `setCollisionProvider(provider)` | Assign collision callback |

---

## GpuParticleBackend

WebGPU-accelerated backend. Supports two execution modes:

- **`"operator"`** (default) — runs modifier descriptors per-particle in JS loops, but still uses SoA storage for fast data access.
- **`"compute"`** — compiles modifiers into WGSL compute shaders and dispatches via WebGPU.

### Constructor

```js
const backend = new GpuParticleBackend({ renderer, system, storage, mode, canvas, renderValidationMode, gpuPersistentUpload })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `renderer` | `object` | `GpuParticleRenderer` | GPU renderer instance |
| `system` | `ParticleSystem` | `null` | Owning system |
| `storage` | `object` | `SoAParticleStorage` | Particle storage |
| `mode` | `string` | `"operator"` | `"operator"` or `"compute"` |
| `canvas` | `HTMLCanvasElement` | `null` | Required for `"compute"` mode |
| `renderValidationMode` | `boolean` | `false` | Use CPU fallback render for validation |
| `gpuPersistentUpload` | `boolean` | `false` | Persistent GPU buffer uploads |

### Properties

Same as `CpuParticleBackend` plus:

| Property | Type | Description |
|----------|------|-------------|
| `capabilities` | `object` | `GPU_FULL` (compute) or `GPU_RENDER` (operator) |
| `renderValidationMode` | `boolean` | Toggle render validation |

### Methods

Same API as `CpuParticleBackend`.

### Requirements

- WebGPU support (`navigator.gpu`)
- For `"compute"` mode: canvas must be provided, modifier descriptors must compile to WGSL

---

## ParticleSystem

The public facade. Delegates all operations to the configured backend.

### Constructor

```js
const system = new ParticleSystem({ renderParticle, renderer, backend, storage })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `renderParticle` | `function` | `null` | Custom render function `(ctx, particle)` |
| `renderer` | `object` | `null` | Pre-built renderer instance |
| `backend` | `object` | `null` | Explicit backend instance (overrides others) |
| `storage` | `object` | `null` | Storage override (passed to default CPU backend) |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `activeCount` | `number` | Alive particles |
| `freeCount` | `number` | Free slots |
| `capacity` | `number` | Total slots |
| `maxCapacity` | `number` | Hard cap |
| `isEmpty` / `hasParticles` | `boolean` | Particle existence |
| `modifierCount` | `number` | Registered modifier count |
| `particles` | `SoAParticleAccessor[]` | Active accessors |
| `peakActive` / `peakCapacity` / `peakFree` | `number` | Runtime stats |
| `totalCreated` | `number` | Particles ever allocated |
| `sortMode` | `string` | Sorting mode |
| `sortEveryFrame` | `boolean` | Re-sort every frame |

### Methods

| Method | Description |
|--------|-------------|
| `emit(count, initializer, emitter)` | Emit particles |
| `emitOne(initializer)` | Emit single particle |
| `update(dt)` | Advance simulation |
| `render(ctx)` | Render all particles |
| `addModifier(modifier, priority)` | Register modifier |
| `removeModifier(modifier)` | Unregister |
| `clearModifiers()` | Remove all modifiers |
| `clear()` | Release all particles |
| `warmup(count)` | Pre-allocate |
| `destroy()` | Free resources |
| `setCollisionProvider(provider)` | Set collision handler |

---

## ParticleEmitter

Rate-based and burst particle emission with optional shape-based positioning and target following.

### Constructor

```js
const emitter = new ParticleEmitter({ system, rate, shape, initializer })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `system` | `ParticleSystem` | *(required)* | Target particle system |
| `rate` | `number` | `0` | Particles per second |
| `shape` | `EmitterShape` | `null` | Shape for spawn positioning |
| `initializer` | `function` | `null` | `(p, i, emitter)` callback |

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x` | `number` | `0` | Emitter world X |
| `y` | `number` | `0` | Emitter world Y |
| `vx` | `number` | `0` | Inherited velocity X |
| `vy` | `number` | `0` | Inherited velocity Y |
| `offsetX` | `number` | `0` | Position offset X |
| `offsetY` | `number` | `0` | Position offset Y |
| `velocityInheritance` | `number` | `1` | Fraction of velocity passed to particles |

### Getters / Setters

| Property | Type | Description |
|----------|------|-------------|
| `active` | `boolean` | Whether emitter is running (read-only) |
| `enabled` | `boolean` | Start/stop via setter |
| `rate` | `number` | Particles per second |
| `shape` | `EmitterShape` | Get/set emitter shape |
| `initializer` | `function` | Particle initializer |
| `emittedCount` | `number` | Total emitted |
| `isFollowing` | `boolean` | Follow target set |
| `isPaused` | `boolean` | Emission paused |

### Methods

| Method | Description |
|--------|-------------|
| `start()` / `stop()` / `toggle()` | Lifecycle control |
| `pause()` / `resume()` | Pause without resetting accumulator |
| `restart()` | Reset then start |
| `emit(count)` / `emitOne()` / `burst(count)` | Burst emission |
| `follow(target, getter?)` | Track a target (getter extracts `{x, y}`) |
| `clearFollow()` | Stop following |
| `setPosition(x, y)` / `move(dx, dy)` | Position control |
| `setVelocity(vx, vy)` | Set inherited velocity |
| `update(dt)` | Accumulate emission, follow target, emit |
| `reset()` | Reset accumulator and count |
| `destroy()` | Cleanup |

When a `shape` is assigned, particles spawn at random positions sampled from the shape (offset by the emitter's position). The shape's `sample(particle)` method populates `x`/`y` and optionally `vx`/`vy`.

---

## ParticleEffect

Combines a `ParticleSystem` and `ParticleEmitter` into a managed effect. Supports one-shot and looping effects with auto-destroy.

### Constructor

```js
const fx = new ParticleEffect({ asset, x, y, renderer, backend })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `asset` | `ParticleAsset` | *(required)* | Asset definition |
| `x` | `number` | `0` | Spawn position X |
| `y` | `number` | `0` | Spawn position Y |
| `renderer` | `object` | `null` | Renderer override |
| `backend` | `object` | `null` | Backend override |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `active` | `boolean` | Effect not destroyed or finished |
| `finished` | `boolean` | All particles dead (auto-destroy mode) |
| `system` | `ParticleSystem` | The internal system |
| `asset` | `ParticleAsset` | Source asset |
| `emitter` | `ParticleEmitter` | The internal emitter |

### Methods

| Method | Description |
|--------|-------------|
| `play()` | Start emitter |
| `stop()` | Stop emitter |
| `pause()` / `resume()` | Pause/resume |
| `emit(count)` | Burst emit |
| `update(dt)` | Advance emitter + system |
| `render(ctx)` | Render particles |
| `destroyWhenFinished(callback?)` | Enable auto-remove when all particles die |
| `destroy()` | Immediate cleanup |

---

## ParticleAsset

A serialisable, reusable particle effect definition. Create once, spawn many times.

### Constructor

```js
const asset = new ParticleAsset({ capacity, modifiers, modifierStack, shape, emitter, initializer, renderParticle, renderer, backend, displayName, description })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `capacity` | `number` | `256` | Initial particle pool size |
| `modifiers` | `object[]` | `[]` | Modifier instances (used to build a ModifierStack) |
| `modifierStack` | `ModifierStack` | `null` | Pre-built stack (takes precedence) |
| `shape` | `EmitterShape` | `null` | Spawn shape |
| `emitter` | `object` | `{}` | Emitter config overrides (rate, etc.) |
| `initializer` | `function` | `null` | Custom initializer (not serialisable) |
| `renderParticle` | `function` | `null` | Custom render function (not serialisable) |
| `renderer` | `object` | `null` | Renderer instance (not serialisable) |
| `backend` | `object` | `null` | Backend instance (not serialisable) |
| `displayName` | `string` | `""` | Human-readable name |
| `description` | `string` | `""` | Description |

### Methods

| Method | Description |
|--------|-------------|
| `spawn(options?)` | Create a `ParticleEffect` from this asset |
| `burst(options?)` | Spawn + emit once + auto-destroy |
| `variant(overrides)` | Create a derived asset with overridden properties |

### Serialisation

`toJSON()` / `fromJSON(data)` enable JSON round-trip. Custom functions (initializer, renderParticle, renderer, backend) prevent serialisation.

### Example

```js
import { ParticleAsset, CircleShape, FadeModifier, ScaleModifier } from 'jygame'

const fireAsset = new ParticleAsset({
  capacity: 200,
  shape: new CircleShape({ radius: 10, direction: 'outward', speed: 80 }),
  modifiers: [
    new FadeModifier({ mode: 'out' }),
    new ScaleModifier({ from: 3, to: 0 }),
  ],
  emitter: { rate: 30 },
})

const fx = fireAsset.spawn({ x: 400, y: 300 })
fx.play()

// In scene.update:
fx.update(dt)
// In scene.render:
fx.render(ctx)
```

---

## ParticleAssetRegistry

Global registry for named `ParticleAsset` instances.

### Methods

| Method | Description |
|--------|-------------|
| `define(name, asset)` | Register an asset |
| `get(name)` | Retrieve by name |
| `spawn(name, options?)` | Lookup + spawn |
| `remove(name)` | Unregister |
| `has(name)` | Check existence |
| `clear()` | Remove all |

### Example

```js
ParticleAssetRegistry.define('fire', fireAsset)
const fx = ParticleAssetRegistry.spawn('fire', { x: 100, y: 200 })
```

---

## ParticleLayer

Groups particle systems for ordered update/render with visibility and pause control.

### Constructor

```js
const layer = new ParticleLayer(name, { order }, onOrderChange)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | *(required)* | Unique layer name |
| `order` | `number` | `0` | Render/update order (lower = earlier) |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Layer name |
| `order` | `number` | Sort order |
| `visible` | `boolean` | Toggle rendering |
| `enabled` | `boolean` | Toggle updating |
| `paused` | `boolean` | Pause state (preserves enabled on resume) |
| `systemCount` | `number` | Registered systems |
| `particleCount` | `number` | Total particles across systems |
| `tags` | `Set` | Arbitrary tags |

### Methods

| Method | Description |
|--------|-------------|
| `add(system)` | Add a particle system |
| `remove(system)` | Remove |
| `has(system)` | Check membership |
| `clear()` | Remove all systems |
| `pause()` / `resume()` | Pause (disables without losing enabled state) |
| `update(dt)` | Update all enabled systems |
| `render(ctx)` | Render all visible systems |
| `destroy()` | Cleanup |

---

## ParticleLayerManager

Manages multiple layers sorted by `order`.

### Constructor

```js
const manager = new ParticleLayerManager()
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `layers` | `ParticleLayer[]` | Layers sorted by order |
| `layerCount` | `number` | Total layers |
| `particleCount` | `number` | Particles across all layers |
| `systemCount` | `number` | Systems across all layers |

### Methods

| Method | Description |
|--------|-------------|
| `create(name, options?)` | Create a new layer |
| `get(name)` | Retrieve layer |
| `has(name)` | Check existence |
| `remove(name)` | Remove layer |
| `clear()` | Remove all layers |
| `update(dt)` | Update all layers in order |
| `render(ctx)` | Render all layers in order |
| `destroy()` | Cleanup |

### Example

```js
const layers = new ParticleLayerManager()
const bg = layers.create('background', { order: 0 })
const fg = layers.create('foreground', { order: 10 })

bg.add(system)
fg.add(otherSystem)

// In scene.update:
layers.update(dt)
// In scene.render:
layers.render(ctx)
```

---

## Usage

```js
import { ParticleSystem, ParticleEmitter, ParticleLayer, ParticleLayerManager, FadeModifier, ScaleModifier } from 'jygame'

// Create a system and add modifiers
const system = new ParticleSystem()
system.addModifier(new FadeModifier({ mode: 'out' }))
system.addModifier(new ScaleModifier({ from: 2, to: 0 }))

// Create an emitter
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

// (Optional) organise into layers
const layers = new ParticleLayerManager()
const fxLayer = layers.create('effects', { order: 5 })
fxLayer.add(system)

// In scene.update:
emitter.update(dt)
layers.update(dt)  // or system.update(dt)

// In scene.render:
layers.render(ctx)  // or system.render(ctx)
```
