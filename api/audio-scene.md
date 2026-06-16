# Audio Scene

The `AudioScene` class captures and restores full audio state — master volume, group settings, music state, and sound instances. Managed through `AudioManager` snapshots and transitions.

## AudioScene

Created internally by `AudioManager.snapshot(name)`. Do not construct directly.

### Methods

#### `save()`

Captures the current state of all audio systems and stores it internally. Called automatically by `AudioManager.snapshot(name)`.

State captured:
- Master volume and mute
- All group volumes and mute states
- All persistent sound instances (playing state, position, volume, loop, current time)
- All music instances (playing state, volume, loop, current time)

#### `restore()`

Restores all audio to the captured state. Stops current music, pauses or resumes sounds as recorded.

---

## Snapshot Management

### `audio.snapshot(name)`

```js
audio.snapshot('menu')
```

Save the current audio state to a named snapshot. Creates the `AudioScene` if it doesn't exist.

### `audio.restoreSnapshot(name)`

```js
audio.restoreSnapshot('menu')
```

Instantly restore audio to the saved snapshot state.

### `audio.hasSnapshot(name)`

Check if a snapshot exists.

### `audio.removeSnapshot(name)`

Delete a snapshot without restoring.

---

## Transitions

### `audio.transition(name, options)`

```js
// Instant switch
audio.transition('battle', { type: 'cut' })

// Fade out current, then restore target
audio.transition('menu', { type: 'fadeOut', duration: 2 })

// Fade in target (current state already matches target)
audio.transition('battle', { type: 'fadeIn', duration: 1.5 })

// Crossfade — fade out current over half duration, then fade in target
audio.transition('menu', { type: 'crossfade', duration: 3 })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `string` | `"cut"` | `"cut"`, `"fadeOut"`, `"fadeIn"`, or `"crossfade"` |
| `duration` | `number` | `1` | Transition duration in seconds |

Transition types:
- **`cut`** — instantly restore the snapshot (no fade)
- **`fadeOut`** — fade volume to 0 over `duration` seconds, then restore snapshot at full volume
- **`fadeIn`** — restore snapshot immediately at volume 0, then fade to full over `duration` seconds
- **`crossfade`** — fade out over `duration/2` seconds, restore snapshot, then fade in over `duration/2` seconds

---

## Per-Scene Control

After a snapshot is saved, individual sounds and music within it can be paused, resumed, or stopped without affecting the rest of the audio system.

```js
audio.pauseScene('menu')   // Pause all sounds/music in the 'menu' snapshot
audio.resumeScene('menu')  // Resume them
audio.stopScene('menu')    // Stop them
```

## Usage

```js
// Save audio state when entering menus
audio.snapshot('menu')
audio.transition('menu', { type: 'fadeOut', duration: 1 })

// When leaving menus, restore gameplay audio
audio.transition('gameplay', { type: 'fadeIn', duration: 1 })

// Pause menu music without affecting game sounds
audio.pauseScene('menu')
```
