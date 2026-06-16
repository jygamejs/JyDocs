# Audio Playback

The audio playback layer consists of `Sound`, `AudioGroup`, `AudioInstance`, `Music`, and `ObjectPool`.

## Sound

Represents a playable audio asset. Manages a pool of `AudioInstance` objects for concurrent playback.

### Constructor

```js
const sound = new Sound(asset, manager, options)
```

Typically created via `AudioManager.add()`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backend` | `AudioBackend` | `manager._backend` | Audio backend |
| `maxPoolSize` | `number` | `64` | Max pooled instance objects |
| `maxInstances` | `number` | `32` | Max concurrent play instances |
| `overflowPolicy` | `string` | `"drop-new"` | `"drop-new"` or `"replace-oldest"` |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `volume` | `number` | Sound volume 0–1 |
| `group` | `string` | Assigned group name (default `"master"`) |
| `persistent` | `boolean` | Whether sound persists in snapshots |
| `isPlaying` | `boolean` | Whether any instances are active |
| `attenuation` | `string` | Attenuation model override (`null` = use manager) |
| `effects` | `EffectChain` | Per-sound effect chain |

### Methods

#### `play(options)`

```js
const inst = sound.play({ x: 200, y: 300, spatial: true, minDistance: 32, maxDistance: 256 })
```

Play a new instance. Returns `AudioInstance` or `null` if max instances reached. Options are forwarded to the instance.

#### `destroy()`

Stop all instances and release resources.

---

## AudioGroup

A named volume group. Sounds assigned to a group are affected by the group's volume and mute state.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `volume` | `number` | Group volume 0–1 |
| `muted` | `boolean` | Mute state |
| `effects` | `EffectChain` | Per-group effect chain (WebAudio backend only) |

Groups are created via `AudioManager.group(name)`.

```js
const sfx = audio.group('sfx')
sfx.volume = 0.7
sfx.muted = false
```

---

## AudioInstance

A single playback handle. Returned by `Sound.play()` and `AudioManager.play()`.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `volume` | `number` | Per-instance volume 0–1 |
| `loop` | `boolean` | Loop playback |
| `muted` | `boolean` | Mute state |
| `currentTime` | `number` | Current playback position (seconds) |
| `duration` | `number` | Total duration (read-only) |
| `paused` | `boolean` | Whether paused (read-only) |
| `ended` | `boolean` | Whether playback ended (read-only) |
| `isPlaying` | `boolean` | `!paused && !ended` (read-only) |
| `x` | `number` | Spatial position X |
| `y` | `number` | Spatial position Y |
| `spatial` | `boolean` | Whether spatial audio is active (read-only) |
| `minDistance` | `number` | Spatial minimum distance |
| `maxDistance` | `number` | Spatial maximum distance |

### Methods

| Method | Description |
|--------|-------------|
| `play()` | Start or resume playback |
| `pause()` | Pause playback |
| `stop()` | Stop and reset position |
| `restart()` | Stop then play from the beginning |
| `destroy()` | Release resources |

Instances are automatically returned to the sound's pool when playback ends.

---

## Music

Long-form audio playback with fade-in, fade-out, and crossfade support. Each `Music` instance manages a single playback track.

### Constructor

```js
const music = new Music(asset, manager, options)
```

Typically created via `AudioManager.music(key)`.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `volume` | `number` | Music volume 0–1 |
| `loop` | `boolean` | Loop playback (default `true`) |
| `isPlaying` | `boolean` | Whether currently playing (read-only) |
| `isPaused` | `boolean` | Whether paused (read-only) |
| `currentTime` | `number` | Current playback position (seconds) |
| `duration` | `number` | Total duration (read-only) |
| `effects` | `EffectChain` | Optional per-track effect chain |

### Methods

| Method | Description |
|--------|-------------|
| `play()` | Start or resume playback |
| `pause()` | Pause playback |
| `stop()` | Stop and destroy internal playback |
| `fadeIn(seconds)` | Fade from silence to full volume |
| `fadeOut(seconds)` | Fade to silence then stop |
| `startFadeIn(seconds)` | Alias for `fadeIn` |
| `crossFade(other, seconds)` | Crossfade between two Music instances |
| `update(dt)` | Process active fades (called by AudioManager) |
| `destroy()` | Release resources |

---

## ObjectPool

A generic object pool used internally by `Sound` for `AudioInstance` objects. Can also be used standalone.

### Constructor

```js
const pool = new ObjectPool(createFn, { maxSize: 64 })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `createFn` | `function` | *(required)* | Factory that returns a new object |
| `maxSize` | `number` | `64` | Maximum free objects to retain |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `freeCount` | `number` | Objects available in the free pool |
| `created` | `number` | Total objects created |
| `acquired` | `number` | Total objects acquired |
| `released` | `number` | Total objects released |
| `evicted` | `number` | Total objects evicted (beyond maxSize) |

### Methods

#### `acquire()`

Returns a free object or creates a new one.

#### `release(obj)`

Returns an object to the pool. If `maxSize` is exceeded, the object is evicted (returns `true`). Calls `obj.destroy()` on evicted objects via `drain()`.

#### `drain()`

Destroys all free objects and clears the pool. Calls `destroy()` on each if the method exists.

## Usage

```js
import { Sound, AudioGroup, Music, ObjectPool } from 'jygame'

// Standalone ObjectPool
const pool = new ObjectPool(() => ({ x: 0, y: 0 }), { maxSize: 100 })
const obj = pool.acquire()
pool.release(obj)

// Music with fade
const bgm = audio.music('theme')
bgm.play()
bgm.fadeIn(3)

// Later:
bgm.fadeOut(2)

// Crossfade to a new track
const other = audio.music('boss_theme')
bgm.crossFade(other, 3)
```
