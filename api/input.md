---
title: Input
---

# Input

`Input` is the single entry point for everything the player does. It is a global singleton — no instances, no wiring — and it resolves against the game's input system, which includes the action contexts your scenes push and the devices the engine registers for you.

Everything you query goes by **name**, and the name can be either:

- **an action** you bound — in a scene's `input` property or at runtime with `Input.bind()` — or
- **a raw device identifier** — a key like `"Space"` or `"KeyW"`, a mouse button like `"LEFT_MOUSE"`, and so on.

```js
import { Input } from "jygame";

// by action name
if (Input.pressed("jump")) { /* ... */ }

// by raw key
if (Input.pressed("Space")) { /* ... */ }
```

## The essentials

Most of what you write against `Input` is one of these three. They all accept an action name or a raw device identifier, and they all read the input **state at this frame** — no callbacks, no listeners. Query them from your scene's `update(dt)` or anywhere the game loop runs.

### `down(name)`

`boolean` — whether the action or key is currently held down. Level-triggered: `true` for every frame the input stays held, `false` as soon as it is released.

```js
if (Input.down("move")) { /* walking */ }
```

### `pressed(name)`

`boolean` — whether the action or key was pressed **this tick**. Edge-triggered: `true` for exactly one frame, the moment the input goes from up to down. Use it for one-shot events like jumping or firing — a `down()` check there would fire every frame the button is held.

```js
if (Input.pressed("jump")) { player.jump(); }
```

### `released(name)`

`boolean` — whether the action or key was released this tick, the mirror image of `pressed()`. Useful for charge mechanics, or to detect the end of a press.

```js
if (Input.released("shoot")) { chargeShot(); }
```

## The other queries

The remaining query methods follow the same conventions. Raw identifier classification is memoized, so polling `Input.down("KeyW")` in a hot loop does not re-parse the string every call.

### `value(name)`

`number` — the analog strength of the input, from `0` to `1`. For a digital action it is `1` while held and `0` otherwise; for analog inputs (gestures) it reflects magnitude. The natural partner to `axis()` when you need a scalar.

### `axis(name)`

`{ x, y }` — the 2D direction of the input. This is how movement actions are read: bind `move` to the WASD/arrow shorthand and `axis("move")` gives you a normalized direction vector, diagonals included.

```js
const dir = Input.axis("move");        // { x: 0, y: -1 } for up, etc.
this.speed = 300;
this.player.velocity.x = dir.x * this.speed;
this.player.velocity.y = dir.y * this.speed;
```

`axis()` returns `{ x: 0, y: 0 }` when nothing is held or the name isn't a vector. For how to bind keys to a direction — custom layouts, a single key per direction, mixing keyboards and gamepads — see [Vector actions (movement)](#vector-actions-movement).

## Runtime bindings

Scenes declare their bindings declaratively in the `input` property, but you can also manage bindings from anywhere with `Input.bind()`. The binding **values** follow the exact same convention as a scene's `input` — strings, arrays, the `"wasd"`/`"arrowkeys"` movement shorthand, chord objects like `{ key: "Enter", ctrl: true }`, and gesture names.

> **Scope:** `Input.bind()` targets the currently active context — a scene's context when one is mounted, or a shared runtime context otherwise. Bindings made while a scene is active belong to that scene and disappear when it exits; bind from startup code (before `game.run()`) for global bindings.

> **Names shadow.** Actions, raw keys, mouse buttons, gamepad identifiers and
> gesture names all share one string namespace, and a bound action is
> resolved **first**. Naming an action `"PAD_A"` or `"tap"` shadows the
> built-in identifier — `Input.down("PAD_A")` then returns the action, not
> the gamepad button. Jygame warns once when a binding name collides with a
> built-in identifier; rename the action to avoid the collision.

### `bind(name, binding)`

Binds an action, replacing any existing binding for the same name. Use it to register an action outside the scene-declarative flow.

```js
Input.bind("jump", "Space");
Input.bind("move", ["wasd", "arrowkeys"]);
Input.bind("pause", { key: "Escape" });
```

### `unbind(name)`

Removes the entire action from every context. After this, queries for the name no longer resolve.

```js
Input.unbind("jump");
```

### `addBinding(name, binding)`

Adds another binding to an existing action, so more than one input can trigger it. This is how you let players rebind — add a second key without losing the default.

```js
Input.bind("shoot", "LeftMouse");
Input.addBinding("shoot", "Space");   // either fires the action
```

### `removeBinding(name, binding)`

Removes one binding from an action, passing the binding as a key identifier.

```js
Input.removeBinding("shoot", "Space");
```

### `buffer(name, ms)`

Arms an input buffer for the action for `ms` milliseconds. Use it for input leniency — jump buffering (a jump pressed just before landing still counts), or action-queue timing — where a press inside the window should be honored even if the game wasn't ready for it at the instant it happened.

```js
Input.buffer("jump", 120);   // give the jump press a 120ms grace window
```

### `bindings()`

Returns the current bindings as an object keyed by action name. Each value is an array describing the action's bindings — useful for rebinding UIs, debug inspectors, or saving/loading control schemes.

```js
const config = Input.bindings();
```

### Vector actions (movement)

Some actions carry a 2D direction instead of an on/off state. Bind the
**object form** — `{ up, down, left, right }` — and the action becomes a
vector action:

```js
input: {
  move: { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD" },
}
// or at runtime:
Input.bind("move", { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD" });
```

Read it with `axis()`, which returns a
normalized `{ x, y }`:

```js
const dir = Input.axis("move");
// one key held:  { x: -1, y: 0 } for left, { x: 0, y: 1 } for down, ...
// two at once:   { x: -0.707, y: -0.707 } for up+left — a unit diagonal
// nothing held:  { x: 0, y: 0 }
```

The combination is handled for you: every pressed direction contributes its
unit vector and the result is normalized to unit length when it would
otherwise exceed it, so diagonals don't get a speed boost. Pressing two
opposite keys cancels out to `{ x: 0, y: 0 }`.

Each direction accepts a single identifier or an **array** of them, and the
entries can mix physical keys, logical keys, and gamepad buttons:

```js
Input.bind("move", {
  up: ["KeyW", "KeyI"],             // W or I moves up
  down: "KeyS",
  left: ["KeyA", "PAD_DPAD_LEFT"],  // key or d-pad
  right: "KeyD",
});
```

A single direction is enough — bind one key to one direction:

```js
Input.bind("strafe", { left: "KeyJ" });   // axis("strafe") → { x: -1, y: 0 }
```

Or skip the vector machinery and apply the key yourself with a plain digital
action:

```js
Input.bind("goLeft", "KeyJ");
vel.x -= Input.down("goLeft") ? speed : 0;
```

`Input.value("move")` is `1` while any direction is held and `0` otherwise —
it does not report the vector's magnitude. Analog magnitude comes from
gamepad sticks, which feed the same vector action: bind `move:
"PAD_LEFT_STICK"` and `axis("move")` returns a dead-zoned vector whose length
tracks how far the stick is pushed.

> **Use physical keys for movement.** `"KeyW"`, `"KeyJ"`, … refer to the
> key's *position* on the keyboard and work on every layout, no Shift needed.
> A bare letter (`"W"`, `"J"`) is a *logical* key — it matches the character
> the keyboard produces, so `"J"` only fires when the key types an uppercase
> J (Shift held). The movement shorthands — `"wasd"`, `"arrowkeys"`,
> `"padstick"`, `"padd"`, `"pad"` — are just sugar for the object form and
> always expand to physical keys.

### Modifiers (chords)

The object form also makes an input a **chord** — a key plus a set of
required modifiers, all held together:

```js
Input.bind("save", { key: "S", ctrl: true });
Input.bind("fullscreen", { key: "Enter", alt: true });
Input.bind("quickSave", { key: "F5", ctrl: true, shift: true });
```

The `key` follows the usual convention — a physical code (`"KeyS"`, `"F5"`)
or a logical key (`"m"`). The available modifiers are:

| Option | Key(s) |
|--------|--------|
| `ctrl` | Control |
| `shift` | Shift |
| `alt` | Alt / Option on macOS |
| `meta` | Meta — ⌘ Command on macOS, ⊞ Windows key elsewhere |

How chords behave:

- A chord fires only while the key **and every listed modifier** are held —
  the modifiers are ANDed. `{ key: "S", ctrl: true }` is not the plain
  letter `S`; it needs Ctrl down too.
- Modifiers that are *not* listed are not required and don't block the
  chord. `{ key: "S", ctrl: true }` still fires when Shift is also held.
- On macOS, `ctrl` and `meta` behave differently from Windows/Linux, and game
  menus usually bind `meta` where they'd use `ctrl` elsewhere. To cover both,
  bind the action twice:
  `Input.addBinding("save", { key: "S", ctrl: true })` and
  `Input.addBinding("save", { key: "S", meta: true })` — either chord fires.

The same object form works in a scene's `input`:

```js
input: {
  save: { key: "S", ctrl: true },
  quickSave: { key: "F5", ctrl: true, shift: true },
}
```

## Keyboard

Keys are queried either through actions or directly by name.

The naming convention is the same as in a scene's `input`:

- **`"KeyW"`, `"Space"`, `"F3"`, `"ARROW_LEFT"`** — physical keys, case-insensitive, matched by the key's position in the **US-QWERTY layout**. `"KeyW"` fires wherever W physically sits, no matter what character the layout types.
- **`"M"`, `"m"`, `"1"`** — a single character, matched **case-sensitively** against the typed key. `"M"` fires only when an uppercase M is produced (Shift held); `"m"` fires for lowercase m.

```js
if (Input.pressed("KeyW") || Input.pressed("ArrowUp")) { /* move up */ }
if (Input.pressed("m")) { /* the letter m */ }
```

Every physical key Jygame recognises — `"KeyW"`, `"Digit1"`, `"ArrowUp"`,
`"F5"`, `"Semicolon"`, `"Numpad0"`, … — is listed in the
[keyboard reference](/api/keys).

The `"wasd"`/`"arrowkeys"` movement shorthand only expands inside bindings — `Input.bind("move", ["wasd", "arrowkeys"])` or a scene's `input`. `Input.pressed("wasd")` is not a movement query.

## Mouse & touch

### `pointer`

The pointer facade — mouse, touch, and stylus collapsed into one position/button surface.

`x`/`y`/`worldX`/`worldY` are **persistent**: they always reflect the latest known position of the primary pointer, even when no button is currently held. `down`/`pressed`/`released`/`delta` remain **active-pointer** state — they describe whether a pointer is currently interacting.

| Member | Type | Meaning |
|--------|------|---------|
| `x`, `y` | `number` | Pointer position in canvas coordinates (persistent) |
| `worldX`, `worldY` | `number` | Position projected into world space (camera applied, persistent) |
| `hasPosition` | `boolean` | Whether a real pointer position has been received yet |
| `down` | `boolean` | Primary button currently held |
| `pressed` | `boolean` | Primary button went down this tick |
| `released` | `boolean` | Primary button went up this tick |
| `deltaX`, `deltaY` | `number` | Movement since last tick |
| `pressure` | `number` | Pressure for touch/stylus, `0`–`1` |

`x`/`y` default to `0` before the first pointer event. Because `(0, 0)` is a perfectly valid position (top-left corner), do **not** use `x !== 0 || y !== 0` to test for initialization — use `hasPosition`:

```js
const ptr = Input.pointer;
if (ptr.hasPosition) {
  this.effect.position.x = ptr.x;
  this.effect.position.y = ptr.y;
}
```

```js
if (Input.pointer.pressed) {
  this.shootAt(Input.pointer.worldX, Input.pointer.worldY);
}
```

`hasPosition` becomes `true` on the first `POINTER_MOVE` or `POINTER_DOWN` with valid coordinates (including `(0,0)`), stays `true` after `POINTER_UP`, and remains `true` for subsequent moves. `getPointers()` and `down`/`pressed`/`released` are unaffected — they still describe only **active** pointers.

### `wheel`

`number` — the vertical scroll delta accumulated **this tick**, reset every tick. Positive for scroll-down (typically). `Input.wheelX` is the horizontal counterpart.

```js
this.camera.zoom = Math.max(0.5, this.camera.zoom + Input.wheel * 0.1);
```

### Mouse buttons

Queried by name like keys:

```js
if (Input.pressed("LEFT_MOUSE"))  { /* left click */ }
if (Input.down("RIGHT_MOUSE"))    { /* right held */ }
```

Button names: `"LEFT_MOUSE"` / `"MOUSE_LEFT"`, `"RIGHT_MOUSE"` / `"MOUSE_RIGHT"`, `"MIDDLE_MOUSE"` / `"MOUSE_MIDDLE"`, `"MOUSE_BACK"`, `"MOUSE_FORWARD"`.

### `touch`

The touch facade, for multi-touch. Unlike `pointer`, which collapses to the primary pointer, `touch` exposes every contact.

| Member | Type | Meaning |
|--------|------|---------|
| `count` | `number` | Number of active touches |
| `primary` | `object \| null` | The first touch: `{ id, x, y, down, justPressed, justReleased, pressure }` |
| `contacts` | `array` | Every active touch in the same shape as `primary` |

```js
if (Input.touch.count === 2) {
  // two fingers — pinch zone
}
```

## Gamepad

Controllers are read through the Web Gamepad API and exposed on the facade
both by name and through `Input.gamepad`. The engine never needs to know which
pad or layout — the browser reports `buttons[]` (with a `pressed` flag and an
analog `value` per button) and `axes[]` (-1..1), and Jygame passes both
through.

### By name

A connected pad answers the query methods with `"PAD_*"` identifiers, and
every one has a `"GAMEPAD_*"` alias (`PAD_A` ↔ `GAMEPAD_A`). Names default to
gamepad 0 and are case-insensitive.

```js
if (Input.pressed("PAD_A"))      { this.jump(); }        // face buttons
if (Input.down("PAD_LB"))        { /* shoulder held */ }
if (Input.down("PAD_DPAD_UP"))   { /* d-pad */ }
```

Buttons: `PAD_A/B/X/Y`, `PAD_LB/RB`, `PAD_LT/RT`, `PAD_BACK/START/GUIDE`,
`PAD_LSB/RSB`, `PAD_DPAD_UP/DOWN/LEFT/RIGHT`.

Analog inputs answer through `value()` and `axis()`:

```js
const throttle = Input.value("PAD_RT");        // trigger pull, 0–1
const steer = Input.value("PAD_LEFT_X");       // scalar stick axis, 0–1
const dir = Input.axis("PAD_LEFT_STICK");      // dead-zoned { x, y }
```

Sticks: `PAD_LEFT_STICK` / `PAD_RIGHT_STICK` return a dead-zoned `{ x, y }`
(radial dead zone, 0.2 by default, scaled so the vector ramps smoothly). The
scalar axes `PAD_LEFT_X/Y`, `PAD_RIGHT_X/Y` answer `value()` and `axis()`.

Semantics:

- `pressed(name)` / `released(name)` — button edges, exactly one tick.
- `down(name)` — button held, or a stick/axis pushed past the dead zone.
- `value(name)` — trigger pull / axis magnitude / stick magnitude (0–1).
- `axis(name)` — a stick's `{ x, y }`, or `{ x: axisValue, y: 0 }` for a
  scalar axis.

Gamepad identifiers also work in bindings, with sensible action kinds:
`jump: "PAD_A"` is digital, `throttle: "PAD_RT"` is analog (the trigger's
pull strength), and `move: "PAD_LEFT_STICK"` is a 2D vector action read with
`axis("move")`.

```js
input: {
  jump: "PAD_A",
  throttle: "PAD_RT",
  move: "PAD_LEFT_STICK",
}
```

Movement has shorthands too, mirroring `"wasd"` / `"arrowkeys"`:

```js
input: {
  move: ["padstick", "padd"],   // left stick + d-pad both drive "move"
  nav: "padd",                  // d-pad only
}
```

- `"padstick"` — the left stick: analog 360° movement.
- `"padd"` — the d-pad: digital 4/8-direction (two adjacent buttons give a
  normalized diagonal).
- `"pad"` — left stick and d-pad combined.

They mix freely with the keyboard shorthands — `move: ["wasd", "arrowkeys",
"padstick"]` is one action driven by keyboard and stick alike. The explicit
d-pad object form also works: `move: { up: "PAD_DPAD_UP", down: "PAD_DPAD_DOWN",
left: "PAD_DPAD_LEFT", right: "PAD_DPAD_RIGHT" }`.

### `Input.gamepad`

The structured facade, for multi-pad games and rebinding UIs. Methods take a
`GamepadButton`/`GamepadAxis` index and default to gamepad 0.

```js
if (Input.gamepad.pressed(GamepadButton.A))   { this.jump(); }
const throttle = Input.gamepad.value(GamepadButton.RT, 0);
const dir = Input.gamepad.stick(0, "left");   // dead-zoned { x, y }
```

- `count` — connected pads.
- `connected(index)` — whether pad `index` is present.
- `isDown(button, index, threshold?)` / `pressed(button, index)` / `released(button, index)` — digital button queries. `isDown` with a threshold counts the button as pressed only once its analog value reaches it.
- `value(button, index, threshold?)` — analog button value (0–1); with a threshold, values below it read as 0 (idle trigger drift).
- `stick(index, side)` — dead-zoned `{ x, y }` for `"left"` / `"right"`.
- `axis(index, axisIndex, threshold?)` — raw axis position (-1..1); with a threshold, values inside it read as 0.
- `get(index)` — a plain snapshot of one pad, or `null` if absent:
  `{ id, mapping, buttons: { a: { pressed, value }, b: …, … }, sticks: { left, right } }`.

```js
const pad = Input.gamepad.get(0);
if (pad && pad.buttons.a.pressed) { /* … */ }
```

#### Opt-in, filtering and events

Polling is a per-frame cost. It is on by default, but can be toggled, and the
device can be told to ignore junk controllers (touchpads, mice, web cameras):

```js
Input.gamepad.enabled = false;                 // stop the per-frame poll
Input.gamepad.enabled = true;                  // resume
Input.gamepad.setMinimumGamepadConfiguration({ axis: 4, buttons: 8 });
Input.gamepad.axisMoveThreshold = 0.1;         // below this, "axis" events stay silent
```

`Input.gamepad.on(type, callback)` subscribes and returns an unsubscribe
function — Excalibur-style scripted responses:

```js
const stop = Input.gamepad.on("button", (e) => {
  if (e.gamepadIndex === 0 && e.button === GamepadButton.A) this.jump();
});
Input.gamepad.on("axis", (e) => {
  if (e.axis === GamepadAxis.LEFT_X) this.steer(e.value);
});
stop(); // unsubscribe
```

| Event | Payload | Fires |
|-------|---------|-------|
| `"connect"` | `{ gamepadIndex, id, mapping }` | a pad connects (and passes the minimums) |
| `"disconnect"` | `{ gamepadIndex }` | a pad disconnects |
| `"button"` | `{ gamepadIndex, button, value, pressed }` | a button goes down (`pressed: true`) or up (`pressed: false`) |
| `"axis"` | `{ gamepadIndex, axis, value }` | an axis crosses `axisMoveThreshold` and whenever its value changes past it — not while it sits still |

Multiple gamepads are addressed by index through `Input.gamepad`; named
queries and bindings target gamepad 0.

## Gestures

`Input.onTap()` and `Input.onSwipe()` are the two most common gestures, but the full recognizer set — double tap, long press, drag, pinch, rotate, pan, and every swipe direction — lives behind **`Input.gestures`**, the gesture dispatcher. It bridges the engine's gesture recognizers to callback-style listeners: once per frame, after the input system has updated, whatever gestures were recognized this tick are fanned out to the callbacks registered for them.

Like the query methods, gesture delivery is **per-tick and edge-like** — a recognized gesture belongs to the single frame it was recognized in and is delivered exactly once. The dispatcher holds no pointer state of its own; all recognition happens in the recognizers during the input update, and the fan-out is a cheap no-op when nothing is subscribed.

### `on(type, callback)`

Registers `callback` for a gesture `type` and returns an unsubscribe function.

```js
const stop = Input.gestures.on("pinch", (e) => {
  this.zoom = Math.max(0.5, this.zoom * e.scale);
});
// later...
stop(); // unsubscribe
```

`type` is one of the recognized gesture names. Two of them arrive with a simplified payload; the rest are delivered as a `GestureEvent`:

| `type` | Recognizer | Fires when | Payload |
|--------|-----------|------------|---------|
| `"tap"` | Tap | a finger goes down and up in place | `{ x, y, pointerId }` |
| `"swipe"` | Swipe | a fast flick released after enough travel | direction string, e.g. `"LEFT"` |
| `"double_tap"` | DoubleTap | two taps close in time and place | `GestureEvent` |
| `"long_press"` | LongPress | held still past the hold time | `GestureEvent` |
| `"drag"` | Drag | moved past the threshold while held | `GestureEvent` |
| `"pinch"` | Pinch | two fingers spread or pinched, one lifts | `GestureEvent` |
| `"rotate"` | Rotate | two fingers rotating, one lifts | `GestureEvent` |
| `"pan"` | Pan | two fingers moving together | `GestureEvent` |

The direction-specific names — `"swipe_left"`, `"swipe_right"`, `"swipe_up"`, `"swipe_down"` — are **not** recognized directly. They exist for querying by name and for bindings, both of which resolve them against the plain `"swipe"` recognizer. Subscribing to one with `on()` never fires.

`on()` throws a `TypeError` if `callback` is not a function.

### `off(type, callback)`

Removes a callback directly — the same as calling the unsubscribe function that `on()` returned.

### `clear()` and `listenerCount`

`clear()` drops every registered callback (the game does this for you when it is destroyed). `listenerCount` reports how many callbacks are currently registered, across all types.

### The `GestureEvent`

Every gesture except `"tap"` and `"swipe"` hands its callback a `GestureEvent`. Its fields are the ones the matching recognizer had something to say about; the rest are defaults.

| Field | Type | Meaning |
|-------|------|---------|
| `type` | `string` | The gesture type (`"drag"`, `"pinch"`, …) |
| `position` | `{ x, y }` | Where the gesture happened, in canvas coordinates |
| `delta` | `{ x, y }` | Cumulative movement — the drag/pan travel from start to end |
| `scale` | `number` | Pinch scale: current finger spread ÷ spread when the second finger landed |
| `rotation` | `number` | Cumulative rotation in radians for `"rotate"` |
| `velocity` | `number` | Swipe speed in px/s |
| `duration` | `number` | How long the gesture lasted, in ms |
| `pointerIds` | `array` | Ids of the pointers involved |

```js
Input.gestures.on("drag", (e) => {
  this.selected.moveBy(e.delta.x, e.delta.y);
});
Input.gestures.on("rotate", (e) => {
  this.selected.angle += e.rotation;
});
```

### How the recognizers decide

Each gesture has built-in tolerances. A gesture only produces a result when its recognizer's gates pass — and, except for long press and the multi-finger gestures, results fire when the gesture completes (the pointer lifts).

- **Tap** — down and up within **200 ms** and within **10 px** of the down position. Moving more than 10 px while down aborts the tap.
- **Double tap** — two taps within **300 ms** of each other, each within **10 px** and shorter than **200 ms**. The first tap produces nothing; the second produces the `"double_tap"`.
- **Long press** — held still for **500 ms** within **10 px**. Fires **once while the finger is still down**, not on release.
- **Drag** — moved more than **10 px** while held. The result fires on release and carries the full travel in `delta`.
- **Swipe** — released with a velocity of at least **500 px/s** and a total travel of at least **30 px**. The result carries `delta`, `velocity` and `duration`; the direction comes from the dominant axis of `delta`.
- **Pinch** — two fingers. Fires when one lifts, carrying `scale` = current spread ÷ spread when the second finger landed. `1` means no change; `> 1` means the fingers spread apart, `< 1` means they came together.
- **Rotate** — two fingers. Fires when one lifts, carrying the cumulative `rotation` in radians (positive = clockwise). Per-frame angle deltas are wrapped to `[-π, π]` so the total doesn't jump at the seam.
- **Pan** — two fingers. Tracks the centroid of the pair and accumulates movement past a **5 px** step threshold; fires on release with the total centroid travel in `delta`.

### Querying gestures by name

Gesture names resolve as identifiers, so you can also read them like keys and mouse buttons — useful when you want to gate on *which* gesture happened without the callback flow, and for the direction-specific swipes:

```js
if (Input.pressed("double_tap")) { /* second tap landed */ }
if (Input.down("long_press"))    { /* finger still down, hold done */ }
if (Input.pressed("swipe_left")) { /* a swipe that went left */ }
```

The query semantics match the rest of the facade:

- `pressed(name)` — the gesture was recognized **this tick**.
- `down(name)` — recognized this tick **or** currently active (a long press still held, a pinch in progress, a drag underway).
- `released(name)` — always `false` for gestures.
- `value(name)` — the pinch `scale`, the directional swipe's `velocity`, otherwise `1` when present and `0` when not.
- `axis(name)` — the `{ x, y }` delta for `"pan"`/`"drag"` (and directional swipes); `{ x: 0, y: 0 }` otherwise.

A directional swipe is a plain swipe whose last `delta` angle sits within ±60° of the exact left, right, up, or down axis — so a mostly-horizontal flick resolves to exactly one of them.

### Gesture bindings

Gesture names are valid binding values, so a scene's `input` and `Input.bind()` can drive the game off actions instead of callbacks:

```js
Input.bind("fire", "tap");
Input.bind("zoom", "pinch");
Input.bind("camera", "pan");
Input.bind("flick", ["swipe_left", "swipe_right"]);
```

```js
if (Input.pressed("fire")) { this.fire(); }
this.zoom *= Input.value("zoom");        // the pinch scale
const dir = Input.axis("camera");        // pan delta, { x, y }
if (Input.pressed("flick")) { /* either direction */ }
```

Two gesture bindings get special action kinds: `"pinch"` binds as **analog** (its strength is the scale), and `"pan"`/`"drag"` bind as **2D vector** actions read with `axis()`.

### In scenes

`Scene` brings the callbacks into game code with `onTap(cb)`, `onSwipe(cb)`, and `onGesture(type, cb)` — all three are unsubscribed automatically when the scene exits:

```js
class MenuScene extends Scene {
  onEnter() {
    this.onTap((tap) => this.startGame());
    this.onSwipe((dir) => this.navigate(dir)); // dir is "LEFT", "RIGHT", "UP", or "DOWN"
    this.onGesture("pinch", (e) => (this.zoom *= e.scale));
  }
}
```

On `Input` itself, `onTap(cb)`/`onSwipe(cb)` are the same dispatcher subscriptions as `Input.gestures.on("tap", cb)` and `Input.gestures.on("swipe", cb)` — the tap callback receives `{ x, y, pointerId }` and the swipe callback a direction string — and `removeTap(cb)`/`removeSwipe(cb)` are the direct `off()` counterparts.

## `raw`

`Input.raw` is the escape hatch: the live input system internals, in case you need something the facade doesn't cover.

```js
const raw = Input.raw;
raw.devices;          // device registry (Keyboard, Mouse, PointerManager, ...)
raw.contextStack;     // the input context stack
raw.events;           // this tick's input event queue
raw.backend;          // the input backend
raw.coordinateSystem; // pointer → canvas/world transforms
raw.actionMap;        // the active context's action map
```

It is `null` until the game creates its input system. Reaching for `raw` is rare — it exists so the facade never has to be a wall.
