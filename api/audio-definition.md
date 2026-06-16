# Audio Definitions

Declarative audio configuration via `AudioDefinition`, loading via `AudioLoader`, and spatial listener via `AudioListener`.

## AudioDefinition

A declarative configuration object that describes how a sound should be loaded and played. Registered via `AudioManager.define(key, config)`.

### Constructor

```js
const def = new AudioDefinition(config)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source` | `string` | *(required)* | Path to the audio file |
| `group` | `string` | `"master"` | Group name |
| `volume` | `number` | `1` | Default volume 0–1 |
| `loop` | `boolean` | `false` | Loop by default |
| `maxInstances` | `number` | `32` | Max concurrent instances |
| `spatial` | `boolean` | `false` | Enable spatial audio by default |
| `minDistance` | `number` | `32` | Spatial minimum distance |
| `maxDistance` | `number` | `512` | Spatial maximum distance |
| `attenuation` | `string` | `"linear"` | Attenuation model |

```js
audio.define('explosion', {
  source: 'sounds/explosion.mp3',
  group: 'sfx',
  volume: 0.8,
  maxInstances: 5,
  spatial: true,
  minDistance: 64,
  maxDistance: 300,
})
```

---

## AudioLoader

Static utility for loading audio files. Supports both `HTMLAudioElement` and `AudioBuffer` (Web Audio) loading.

### Methods

#### `load(path)`

```js
await AudioLoader.load('sounds/click.mp3')
```

Loads an `HTMLAudioElement` and caches it. Returns a promise.

#### `loadAll(map)`

```js
const task = AudioLoader.loadAll({
  click: 'sounds/click.mp3',
  hit: 'sounds/hit.mp3',
})
await task
```

Loads a map of key-path pairs. Returns a `LoadingTask`.

#### `get(key)`

```js
const audio = AudioLoader.get('sounds/click.mp3')
```

Get a cached `HTMLAudioElement` by path.

#### `has(key)`

Check if a path is cached.

#### `unload(key)`

Remove a cached entry.

#### `clear()`

Clear all caches.

#### `loadBuffer(path, audioContext)`

```js
const buffer = await AudioLoader.loadBuffer('sounds/hit.mp3', audioContext)
```

Loads an audio file as a decoded `AudioBuffer`. Returns a promise.

#### `getBuffer(key)`

```js
const buffer = AudioLoader.getBuffer('sounds/hit.mp3')
```

Get a cached `AudioBuffer` by path.

---

## AudioListener

Represents the listener position for spatial audio. Used by `AudioManager` to compute per-instance attenuation.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x` | `number` | `0` | Listener world X position |
| `y` | `number` | `0` | Listener world Y position |

```js
audio.listener.x = player.transform.x
audio.listener.y = player.transform.y
```

---

## Attenuation

Constants and utility function for spatial audio attenuation.

### Constants

| Constant | Value |
|----------|-------|
| `ATTENUATION_LINEAR` | `"linear"` |
| `ATTENUATION_QUADRATIC` | `"quadratic"` |
| `ATTENUATION_INVERSE` | `"inverse"` |

### `computeAttenuation(distance, minDistance, maxDistance, model, inverseRolloff)`

```js
import { computeAttenuation, ATTENUATION_LINEAR } from 'jygame'

const factor = computeAttenuation(100, 32, 256, ATTENUATION_LINEAR, 4)
```

Computes an attenuation factor (0–1) given the distance parameters.

## Usage

```js
import { AudioManager, AudioLoader, WebAudioBackend } from 'jygame'

const audio = new AudioManager({ backend: new WebAudioBackend() })
const ctx = new AudioContext()

// Load audio buffers
await AudioLoader.loadBuffer('sounds/ambient.wav', ctx)
await AudioLoader.loadBuffer('sounds/footstep.wav', ctx)

// Declare definitions
audio.define('ambient', {
  source: 'sounds/ambient.wav',
  group: 'ambient',
  volume: 0.5,
  loop: true,
})

audio.define('footstep', {
  source: 'sounds/footstep.wav',
  group: 'sfx',
  volume: 0.7,
  maxInstances: 3,
  spatial: true,
})

// Play spatial footsteps
audio.play('footstep', { x: player.x, y: player.y })

// Update listener position each frame
audio.listener.x = camera.x
audio.listener.y = camera.y
```
