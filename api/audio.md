---
title: Audio
---

# Audio

`Audio` is the single entry point for everything your game hears. It is a global singleton like `Input` — no instances, no wiring — and it wraps the whole audio system: loading clips, playing one-shot effects, looping music, grouping sounds by category, a spatial listener, and master volume/mute controls.

```js
import { Audio } from "jygame";

const shot = await Audio.load("assets/shot.mp3");
shot.volume = 0.7;
shot.play();

const music = Audio.music("assets/theme.mp3");
music.play();
```

Under the hood there is an `AudioManager`, a listener, per-sound instance pools, and a **backend** — the low-level implementation that actually talks to the browser. The facade hides all of it: `load()` gives you a ready-to-use sound handle and the rest is handled.

## The essentials

Most of what you write is one of these three:

| Call | What it does |
|------|--------------|
| `Audio.load(...)` | Fetch and decode an audio clip, return a **sound handle** |
| `sound.play()` | Fire a **one-shot** sound effect, returning an `AudioInstance` |
| `Audio.music(key)` | Get a **looping** `Music` handle for background tracks |

`load()` is for clips — each one comes back as a reusable **`Sound`** you configure once and play any number of times. `music()` is for long tracks — it returns a single handle you drive with `play()`/`pause()`/`stop()` and fades.

```js
const jump = await Audio.load("assets/jump.mp3");
jump.play();

const theme = Audio.music("assets/theme.mp3");
theme.play();
```

## `Audio.load(...)`

Loads one or more audio clips and resolves to a **`Sound`** handle for each. A sound is the reusable, configured object you play from — set its `volume`/`loop` once and call `play()` whenever you need the sound. Loaded clips are cached by name *and* path; loading the same clip again returns the same handle.

### Single — `load(path)`

Names are optional. If you just want a usable sound object, load by path and keep the handle:

```js
const shot = await Audio.load("assets/shot.mp3");
shot.volume = 0.7;
shot.play();
```

### Named — `load(name, path)`

Provide a `name` when you also want to reach the sound through the global facade — `Audio.play("shot")`, `Audio.get("shot")`, `Audio.has("shot")`:

```js
const shot = await Audio.load("shot", "assets/shot.mp3");
shot.play();

Audio.play("shot");   // same loaded sound, no local handle needed
```

The returned object is the same kind of sound handle either way; the name is only for registry access.

### Batch — `load({ name: path, ... })`

Loads many clips at once and resolves to an object of sound handles keyed by name. Like `Image.load`, the batch returns a **`LoadingTask`** — await it like a promise, or read its progress for a loading bar:

```js
const task = Audio.load({
  coin:   "assets/coin.wav",
  jump:   "assets/jump.mp3",
  theme:  "assets/theme.ogg",
});
task.onProgress((loaded, total) => {
  bar.style.width = (loaded / total * 100) + "%";
});
const { coin, jump } = await task;
coin.play();
jump.play();
```

A `LoadingTask` exposes `promise`, `progress` (`0`–`1`), `loaded`, `total`, and `onProgress(cb)`.

### Choosing a backend per sound

Different sounds can benefit from different backends, so `Audio.load()` lets you choose which one owns an individual sound. Pass `backend` as an options argument — `"web"` (Web Audio) or `"html"` (HTML audio):

```js
const music = await Audio.load("music.mp3", {
  backend: "html",    // stream long tracks — lighter memory
});

const explosion = await Audio.load("explosion.wav", {
  backend: "web",     // low-latency, sample-accurate one-shots
});

music.play();
explosion.play();
```

Both sounds stay alive at the same time, each permanently using its own backend. The choice belongs to the **asset**, not the playback method — `Audio.play()` never switches it, and `Audio.music()` on a loaded clip keeps the same backend.

Omitting `backend` keeps the automatic selection: Web Audio when the browser supports it, HTML audio otherwise.

```js
const sound = await Audio.load("sound.wav");   // automatic
```

To force one backend for **everything** — instead of repeating the option on every load — set `Audio.backend` once. It becomes the default that automatic selection resolves to:

```js
Audio.backend = "html";    // every automatic load now uses HTML audio
const theme = await Audio.load("theme.mp3");                    // html
const shot = await Audio.load("shot.wav", { backend: "web" });  // explicit still wins

Audio.backend;      // "html"
Audio.backend = null;   // back to automatic detection
```

`Audio.backend` reads as `"web"` or `"html"` — the currently effective default (web in any modern browser). Explicit per-load `backend` options always override it.

Named loads take the same options:

```js
const shot = await Audio.load("shot", "assets/shot.wav", {
  backend: "web",
});
Audio.play("shot");   // plays through the web backend it was loaded with
```

Batch loads accept a per-asset backend via an object form:

```js
const sounds = await Audio.load({
  coin:  { path: "coin.wav",  backend: "web" },
  theme: { path: "theme.mp3", backend: "html" },
  jump:  "jump.wav",   // strings keep automatic selection
});
```

An invalid backend name throws instead of silently falling back:

```js
Audio.load("sound.wav", { backend: "something" });
// Error: Audio: unknown backend "something". Expected "web" or "html".
```

A loaded sound's backend is fixed for its lifetime. Requesting a different backend for an already-loaded key throws rather than silently swapping it:

```js
await Audio.load("shot", "assets/shot.wav", { backend: "web" });
await Audio.load("shot", "assets/shot.wav", { backend: "html" });
// Error: "shot" is already loaded with the "web" backend; it cannot be
// reloaded with "html". Remove it first or reuse its backend.
```

### Caching, identity & errors

`load()` caches by name *and* by path, and the cache preserves identity:

```js
const a = await Audio.load("shot", "assets/shot.mp3");
const b = await Audio.load("shot");            // same handle by name
const c = await Audio.load("assets/shot.mp3"); // same handle by path
a === b && b === c;   // true
```

A failed fetch rejects with `Error: Failed to load audio: <path>`.

> **`load()` always returns a `Sound`, no matter the backend.** The bytes behind it differ — on the Web Audio backend the file is fully fetched and decoded into an `AudioBuffer`; on the HTML audio backend the promise resolves once an `HTMLAudioElement` can play through, and the file *streams* rather than being fully decoded. Either way the facade hands you the same jygame abstraction, so your game code never touches backend-specific objects. See [Backends](#backends).

### The sound handle

`Sound` is the reusable loaded sound. It owns a default configuration and `play()` starts a fresh **playback occurrence** (an `AudioInstance`) each time — call it three times and you get three overlapping sounds:

```js
const shot = await Audio.load("shot", "assets/shot.mp3");

shot.volume = 0.7;   // default for every play
shot.loop = false;   // default looping for every play
shot.group = "sfx";  // which group this sound belongs to

shot.play();
shot.play();         // three overlapping gunshots
shot.play();
```

| Member | Type | Meaning |
|--------|------|---------|
| `volume` | `number` | Default volume used when this sound plays, `0`–`1` |
| `loop` | `boolean` | Default looping behavior for playback started from this sound |
| `group` | `string` | Which [`AudioGroup`](#audiogroupname) this sound belongs to (`"master"` by default) |
| `attenuation` | `string` | This sound's spatial falloff (`"linear"`, `"quadratic"`, `"inverse"`), overriding the global `Audio.attenuation` |
| `duration` | `number` | Clip length in seconds (asset-level, read-only) |
| `isPlaying` | `boolean` | Whether **any** occurrence is currently playing |
| `play(options?)` | | Start a new occurrence; returns an `AudioInstance` |

`Sound` is **not** an individual playback occurrence, so it deliberately does *not* expose per-occurrence state like `currentTime`, `paused`, `ended`, or `x`/`y` — a sound can have several instances at once, and those values would be ambiguous. When you need them, grab the `AudioInstance` returned by `play()`:

```js
const shot = await Audio.load("assets/shot.mp3");
const s = shot.play();
s.x = 120;                    // position only this occurrence
s.currentTime = 0.5;          // seek only this occurrence
```

## `Audio.play(key, options)`

The concise registry API. `Audio.play("shot")` is a lookup-and-play in one call — it fetches the loaded sound by name (or path) and plays it. It's exactly `Audio.get(key).play()` with options:

```js
await Audio.load("shot", "assets/shot.mp3");

Audio.play("shot");                        // no handle needed
Audio.play("shot", { volume: 0.3 });       // override one playback
Audio.play("shot", { loop: true, group: "ui" });
```

Use it for fire-and-forget gameplay code that just wants to trigger a sound. When you need to configure the sound itself — set its default `volume`/`loop`, retain it for reuse — load it and keep the handle instead.

If `key` was never loaded, `play()` throws: `Audio: "<key>" not loaded. Call Audio.load() first.`

The options are per-play **overrides**; they apply to that one occurrence without touching the sound's defaults:

| Option | Type | Default | Meaning |
|--------|------|---------|---------|
| `volume` | `number` | sound's volume (`1`) | Per-instance volume, `0`–`1` |
| `loop` | `boolean` | sound's `loop` (`false`) | Repeat this instance forever |
| `group` | `string` | sound's `group` (`"master"`) | Route this instance through a different group |
| `x`, `y` | `number` | — | Spawn the sound at a world position → **spatial audio** |
| `minDistance` | `number` | `32` | Distance at which the sound is at full volume |
| `maxDistance` | `number` | `512` | Distance at which it is silent |

`x`/`y` make the instance spatial automatically. Its volume is then derived from the distance to [`Audio.listener`](#audiolistener) — full inside `minDistance`, silent at/after `maxDistance`, and attenuated in between. The listener is what you move around the world; the sound sits still at its `x`/`y`.

The falloff model is set with `Audio.attenuation` — `"linear"` (default), `"quadratic"`, or `"inverse"` — and `Audio.inverseRolloff` tunes the inverse model:

```js
Audio.attenuation = "quadratic";   // world default: objects fall off faster with distance
Audio.inverseRolloff = 4;          // shape of the "inverse" model
```

A single sound can override the world default with its own `attenuation`:

```js
const whisper = await Audio.load("whisper.wav", { backend: "web" });
whisper.attenuation = "quadratic";   // this sound falls off faster
```

### The returned instance

`play()` (either `sound.play()` or `Audio.play()`) returns an **`AudioInstance`** — a live handle for that one firing:

| Member | Type | Meaning |
|--------|------|---------|
| `volume` | `number` | Per-instance volume, `0`–`1` |
| `muted` | `boolean` | Mute just this instance |
| `loop` | `boolean` | Whether this instance repeats |
| `currentTime` | `number` | Playback position in seconds (read/write) |
| `duration` | `number` | Clip length in seconds |
| `paused` / `ended` | `boolean` | Playback state |
| `isPlaying` | `boolean` | `true` while it's neither paused nor ended |
| `x`, `y` | `number` | Spatial position (only relevant if spatial) |
| `minDistance` / `maxDistance` | `number` | Spatial falloff window |
| `play()` / `pause()` / `stop()` | | Control the instance directly |

```js
const s = Audio.play("wind");
s.loop = true;
s.x = 120;      // move the sound around in the world
s.volume = 0.4;
```

When a non-looping instance reaches the end it is returned to its sound's pool and the handle becomes inert.

> **Before the first user interaction, `play()` returns `null`.** Browsers block audio until the player has clicked or pressed a key. The engine queues those early calls and flushes them on the first gesture (see [Autoplay](#autoplay-and-the-unlock-gate)).

## `Audio.music(key)`

Gets a **`Music`** handle for a loaded clip. Unlike `play()`, `music()` returns the *same* object on every call — there is one handle per key, cached for the lifetime of the page. Music loops by default and is designed to be faded, paused, and resumed.

```js
const theme = Audio.music("assets/theme.ogg");
theme.play();
```

If the clip isn't loaded, `music()` throws: `Audio: music "<key>" not found. Load it first with Audio.load().`

### Driving a track

| Member | Type | Meaning |
|--------|------|---------|
| `play()` | | Start or resume. Idempotent: resumes if paused, restarts only if it ended |
| `pause()` | | Pause in place |
| `stop()` | | Stop and rewind to the start |
| `fadeIn(seconds)` | | Start (or resume) fading in over `seconds` |
| `fadeOut(seconds)` | | Fade out over `seconds`, then stop |
| `crossFade(other, seconds)` | | Fade this out while `other` fades in |
| `volume` | `number` | Track volume, `0`–`1` |
| `loop` | `boolean` | Loop (default `true`) |
| `currentTime` | `number` | Position in seconds (read/write) |
| `duration` | `number` | Track length in seconds |
| `isPlaying` / `isPaused` | `boolean` | Playback state |

```js
const theme = Audio.music("theme");

theme.fadeIn(2);                        // fade the menu music up
// ...
theme.fadeOut(2);                       // fade out over 2s, then stop
theme.play();                           // back to normal
```

`fadeIn`/`fadeOut`/`crossFade` are driven by the engine's update loop, so they keep running even though the `Music` object doesn't own a timer of its own.

> `music()` and `play()` share the same loaded assets. `Audio.music("shot")` on a sound-effect clip is legal — it just means that clip played as a looping track.

## `Audio.group(name)`

Gets the **`AudioGroup`** for `name`, creating it if it doesn't exist. Groups let you turn categories of sound up/down or mute them together — music vs. sfx vs. UI.

```js
Audio.play("menuClick", { group: "ui" });
Audio.play("explosion", { group: "sfx" });

const sfx = Audio.group("sfx");
sfx.volume = 0.5;      // all sfx at half volume
sfx.muted = true;      // ...or off entirely
```

Five groups are created for you: `master`, `music`, `sfx`, `ui`, and `ambient`. `Audio.play()` routes instances to `"master"` by default unless you pass `group`, and `Audio.music()` always routes through `"music"`.

| Member | Type | Meaning |
|--------|------|---------|
| `volume` | `number` | Group volume, `0`–`1` |
| `muted` | `boolean` | Silence the whole group |
| `effects` | `object` | An effect chain applied to every sound in the group |

Group volume multiplies with the master volume and the instance volume — set them at whichever layer fits.

## `Audio.listener`

The point in world space where sound is heard — the ear. Spatial sounds get quieter as this moves away from them.

| Member | Type | Meaning |
|--------|------|---------|
| `x`, `y` | `number` | Listener position in world coordinates |
| `follow(entity)` | | Make the listener track an entity's position automatically |
| `unfollow()` | | Stop tracking |

```js
Audio.listener.follow(this.player);     // the ear rides on the player
```

The engine syncs the listener position every frame from your update loop, so `follow()` is all you need for a first-person-accurate soundscape.

## Master volume & mute

| Member | Behavior |
|--------|----------|
| `Audio.volume` | Master volume, `0`–`1` (read/write). Multiplies against everything |
| `Audio.muted` | `boolean` — whether the master is muted. **Read-only** |
| `Audio.mute()` | Mute everything |
| `Audio.unmute()` | Unmute, restoring the previous `volume` |

```js
Audio.volume = 0.8;          // turn the whole game down
if (Input.pressed("PAD_A")) Audio.mute();
if (Input.pressed("PAD_B")) Audio.unmute();
```

`Audio.volume = 0` and `Audio.mute()` both silence everything, but muted is a switch — it doesn't forget where the volume was.

## `pauseAll()` / `resumeAll()` / `stopAll()`

Global transport controls over every currently-playing sound *and* music track:

```js
game.on("hidden", () => Audio.pauseAll());   // page visibility, window blur, etc.
game.on("visible", () => Audio.resumeAll());
```

| Call | Effect |
|------|--------|
| `pauseAll()` | Pause every playing instance and track, in place |
| `resumeAll()` | Resume whatever `pauseAll()` paused |
| `stopAll()` | Stop and rewind everything |

`pauseAll()`/`resumeAll()` are the pair you want for auto-pausing when the tab loses focus. `stopAll()` is the hard reset — usually before loading a new level or tearing the game down.

## `Audio.get` / `has` / `remove` / `clear`

Cache management, mirroring `Image`:

| Member | Behavior |
|--------|----------|
| `Audio.get(key)` | The cached **sound handle** for a name or path, or `null` |
| `Audio.has(key)` | `true` if a name or path is loaded |
| `Audio.remove(key)` | Drop the asset, its sounds, and its music handle |
| `Audio.clear()` | Drop every asset, stop the update loop, and destroy the manager |

```js
const clip = Audio.get("coin");    // null until loaded
if (Audio.has("coin")) { /* ... */ }
```

`clear()` is total — after it, everything must be loaded again. `remove()` is surgical: it destroys any playing instances of that key and unloads it.

## Effects

Effects are audio processors chained between a sound and the output — filters, delays, reverb, and so on. Jygame ships with seven, all exported from `jygame`. Effects only apply on the **Web Audio** backend; the HTML backend ignores them (with a console warning).

### Where effects live

An effect chain can be attached at four levels, and they compose (master → group → sound):

- **Master** — `Audio.effects`, applies to everything in the game.
- **Group** — `Audio.group("sfx").effects`, applies to everything in that group.
- **Sound** — `sound.effects`, applies to one loaded clip.
- **Music** — `Audio.music("theme").effects`, applies to one music track.

```js
import { Audio, ReverbEffect, LowPassEffect, DelayEffect } from "jygame";

// A touch of reverb across the whole game:
Audio.effects.add(new ReverbEffect({ decay: 1.5 }));

// Muffle every UI click:
Audio.group("ui").effects.add(new LowPassEffect({ frequency: 1200 }));

// Echo on one sound (must be on the web backend):
const gunshot = await Audio.load("gunshot", "assets/gunshot.wav", { backend: "web" });
gunshot.effects.add(new DelayEffect({ time: 0.4, feedback: 0.35 }));
gunshot.play();

// Darken the music track:
Audio.music("theme").effects.add(new LowPassEffect({ frequency: 2200 }));
```

The chain API is the same everywhere: `add(effect)`, `remove(effect)`, `clear()`, and `length`.

> Sound- and music-level effects are wired when a playback is created, so add them **before** `play()`. Group and master chains reconnect live — you can add or remove effects at any time.

### The effects

| Effect | Options | What it does |
|--------|---------|--------------|
| `LowPassEffect` | `{ frequency: 2000, Q: 1 }` | Cuts everything above `frequency` — the classic muffled / underwater sound |
| `HighPassEffect` | `{ frequency: 500, Q: 1 }` | Cuts everything below `frequency` — thin, tinny |
| `BandPassEffect` | `{ frequency: 1000, Q: 1 }` | Keeps only a band around `frequency` — telephone voice |
| `DelayEffect` | `{ time: 0.3, feedback: 0.3, wet: 0.5 }` | Echo: `time` seconds between repeats, `feedback` the loudness of each repeat, `wet` the mix of the delayed signal |
| `ReverbEffect` | `{ decay: 2, reverse: false }` — or an `AudioBuffer` impulse response | Simulated room/space; `decay` in seconds, `reverse` for a reversed impulse response |
| `CompressorEffect` | `{ threshold: -24, ratio: 12, attack: 0.003, release: 0.25, knee: 30 }` | Tames loud peaks so the mix stays even |
| `DistortionEffect` | `{ amount: 0.5 }` | Overdrive / fuzz — `0` is clean, `1` is heavily crushed |

### Tweaking effects live

Every effect exposes `update(params)` to change its parameters while it runs:

```js
const low = new LowPassEffect({ frequency: 2000 });
Audio.effects.add(low);

// a "muffled while hit" vignette:
low.update({ frequency: 500 });
// ...later...
low.update({ frequency: 2000 });
```

## Backends

The engine talks to the browser through a **backend**. Two are provided. By default each sound gets the automatic choice — Web Audio when `AudioContext` is available (every modern browser), HTML audio otherwise. You can override it per sound at load time with `backend: "web"` or `backend: "html"` (see [Choosing a backend per sound](#choosing-a-backend-per-sound)), or set a global default with `Audio.backend`.

| | Web Audio backend | HTML audio backend |
|--|-------------------|--------------------|
| Clip type | `AudioBuffer` (fully decoded) | `HTMLAudioElement` (streams) |
| Latency | Low, sample-accurate | Higher |
| Overlapping instances | Native — pools work per-buffer | Clones the `<audio>` element per instance |
| Group volume | Real gain nodes in the audio graph | Emulated by multiplying per-instance volumes |
| Effects (reverb, filters, …) | Yes | No — ignored with a warning |
| Spatial audio | Web Audio `PannerNode` | Not available |
| Long files (music) | Loads the whole file into memory | Streams — lighter memory |

The trade-off you're choosing between: on the HTML backend, *long* clips are lighter on memory (they stream), while on the Web Audio backend they occupy a decoded buffer — which is exactly why `backend: "html"` suits long music tracks and `backend: "web"` suits one-shot effects. `Audio.load()` always returns the same `Sound` abstraction either way; only the bytes behind it differ.

## Autoplay and the unlock gate

Browsers refuse to play audio before the player has interacted with the page. The engine's default (`autoplay: "gated"`) handles that for you instead of failing silently:

- While the gate is closed, every `play()` (facade or sound handle) and `music().play()` is **queued**.
- `play()` returns `null` in that window — the call is queued but you get no instance handle yet.
- On the **first** `pointerdown` or `keydown`, the gate opens and the whole queue flushes: everything you asked to play starts immediately.

```js
// On game boot, before any input:
const intro = await Audio.load("intro", "assets/intro.mp3");
intro.play();                   // queued; returns null
const theme = Audio.music("theme");
theme.play();                   // queued (returns the handle, isPlaying false)

// The player clicks or presses a key → the intro fires and the theme starts.
```

So "music that should start on its own" doesn't error out on a fresh page — it waits politely for the first click, then begins. If your game already has a guaranteed gesture (a "Press to start" screen, a menu button), the gate opens on that and the queued music follows.

`Audio.autoplay` controls this behavior. The default, `"gated"`, queues playback until the first gesture. Set it to `"none"` to skip the queue and play immediately — the browser's own autoplay policy then decides whether the audio actually sounds:

```js
Audio.autoplay = "gated";   // default — queue until the first user gesture
Audio.autoplay = "none";    // play immediately, let the browser decide
```

`Audio.autoplay` accepts only `"gated"` or `"none"`; anything else throws.