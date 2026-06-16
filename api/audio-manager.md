# Audio Manager

The `AudioManager` is the central hub for all audio. It manages sounds, music, groups, effect chains, spatial audio, scenes (snapshots), and backend selection.

## Constructor

```js
const audio = new AudioManager({ backend })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backend` | `AudioBackend` | `new HtmlAudioBackend()` | Audio backend instance |

Creates default groups: `master`, `music`, `sfx`, `ui`, `ambient`.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `listener` | `AudioListener` | Spatial audio listener (read-only) |
| `attenuation` | `string` | Attenuation model: `"linear"`, `"quadratic"`, or `"inverse"` |
| `inverseRolloff` | `number` | Rolloff factor for inverse attenuation (default `4`) |
| `master` | `object` | Returns `{ effects: EffectChain }` proxy for master effects |
| `masterVolume` | `number` | Master volume 0–1 |
| `masterMuted` | `boolean` | Master mute state |
| `transitionVolume` | `number` | Current transition volume (read-only) |
| `supportsGroupGain` | `boolean` | Whether the backend supports per-group gain |

## Methods

### Sound Registration

#### `add(key, asset)`

```js
const sfx = audio.add('explosion', audioElement)
```

Register a loaded HTMLAudioElement or AudioBuffer. Returns the `Sound` instance.

#### `get(key)`

```js
const sound = audio.get('explosion')
```

Get a registered sound by key.

#### `has(key)`

Check if a sound key exists.

#### `remove(key)`

Remove and destroy a registered sound.

### Declarative Definitions

#### `define(key, config)`

```js
audio.define('player_hit', {
  source: 'sounds/hit.mp3',
  group: 'sfx',
  volume: 0.8,
  maxInstances: 3,
  spatial: true,
  minDistance: 32,
  maxDistance: 256,
})
```

Register an `AudioDefinition`. See [Audio Definitions](./audio-definition) for config options.

#### `undefine(key)`

Remove a definition and its associated sound.

#### `hasDefinition(key)`

Check if a definition exists.

#### `getDefinition(key)`

Get the `AudioDefinition` object.

#### `play(name, options)`

```js
audio.play('player_hit')
audio.play('player_hit', { x: 200, y: 300, volume: 0.5 })
```

Play a sound from a definition. Loads the asset if needed. Options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `x` | `number` | — | Spatial position X |
| `y` | `number` | — | Spatial position Y |
| `volume` | `number` | — | Per-instance volume override |
| `loop` | `boolean` | — | Loop override |
| `group` | `string` | — | Group override |
| `minDistance` | `number` | — | Spatial minimum distance |
| `maxDistance` | `number` | — | Spatial maximum distance |

Returns `AudioInstance` or `null` (if max instances reached).

### Groups

#### `group(name)`

```js
const sfxGroup = audio.group('sfx')
sfxGroup.volume = 0.5
sfxGroup.effects.add(new LowPassEffect({ frequency: 1000 }))
```

Get or create a named group. Returns `AudioGroup` with `volume`, `muted`, and `effects` (EffectChain).

#### `getGroup(name)`

Get a group (returns `null` if not found).

#### `getVolumeForGroup(groupName)`

Get effective volume of a group (accounting for mute).

#### `forEachGroup(fn)`

Iterate all groups.

### Music

#### `music(key)`

```js
const bgm = audio.music('bgm')
bgm.play()
bgm.fadeIn(2)
```

Get or create a `Music` instance for a key. Creates from an existing sound or from a definition's source. See [Audio Playback](./audio-playback) for Music API.

#### `hasMusic(key)`

Check if a music instance exists.

#### `getMusic(key)`

Get a music instance (returns `null` if not found).

#### `forEachMusic(fn)`

Iterate all music instances.

### Volume Control

```js
audio.masterVolume = 0.8
audio.mute()
audio.unmute()
```

### Global Playback Control

```js
audio.pauseAll()
audio.resumeAll()
audio.stopAll()
```

### Snapshots & Transitions

See [Audio Scene](./audio-scene).

| Method | Description |
|--------|-------------|
| `snapshot(name)` | Save current audio state |
| `restoreSnapshot(name)` | Restore saved state |
| `transition(name, options)` | Transition to a snapshot |
| `hasSnapshot(name)` | Check snapshot exists |
| `removeSnapshot(name)` | Delete a snapshot |
| `pauseScene(name)` | Pause all sounds/music in a snapshot |
| `resumeScene(name)` | Resume all sounds/music in a snapshot |
| `stopScene(name)` | Stop all sounds/music in a snapshot |

### Lifecycle

```js
audio.update(dt)  // Process spatial updates and music fades
audio.suspend()   // Suspend AudioContext
audio.resume()    // Resume AudioContext
audio.clear()     // Destroy all sounds, music, and definitions
audio.destroy()   // Full teardown
```

### Iteration

```js
audio.forEachSound((sound, key) => { ... })
```

Iterate all registered sounds (from `add()` and `define()`).

## Audio Backends

### AudioBackend

Abstract base class for audio playback backends. Methods:

| Method | Description |
|--------|-------------|
| `createPlayback(asset, effectChain, groupName)` | Create a playback handle |
| `setGroupVolume(name, value)` | Set group gain |
| `setMasterVolume(value)` | Set master gain |
| `setListenerPosition(x, y)` | Update listener position |
| `unlock()` | Unlock audio context (user gesture) |
| `suspend()` | Suspend context |
| `resume()` | Resume context |
| `destroy()` | Clean up |

### HtmlAudioBackend

Uses `HTMLAudioElement` for playback. Does **not** support per-group gain or Web Audio effects. Instances created by constructing `new Audio()` elements and cloning them.

```js
import { HtmlAudioBackend } from 'jygame'
const audio = new AudioManager({ backend: new HtmlAudioBackend() })
```

### WebAudioBackend

Uses the Web Audio API (`AudioContext`, `GainNode`, `PannerNode`). Supports per-group gain, spatial audio, and all built-in effects. Creates `AudioBufferSourceNode` instances.

```js
import { WebAudioBackend } from 'jygame'

const audio = new AudioManager({ backend: new WebAudioBackend() })
```

The backend auto-unlocks on `pointerdown` / `keydown` events.

## Usage

```js
import { AudioManager, WebAudioBackend, AudioLoader } from 'jygame'

const audio = new AudioManager({ backend: new WebAudioBackend() })

await AudioLoader.loadBuffer('sounds/hit.mp3', new AudioContext())

audio.define('hit', {
  source: 'sounds/hit.mp3',
  group: 'sfx',
  volume: 1,
  maxInstances: 5,
})

// Play from a definition
audio.play('hit')

// Or register raw audio and play via Sound
const bgm = audio.music('bgm')
bgm.play()
bgm.fadeIn(3)
```
