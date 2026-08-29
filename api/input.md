---
title: Input
---

# Input

`Input` is the single entry point for everything the player does. It is a global singleton — no instances, no wiring — and it resolves against the game's input system, which includes the action contexts your scenes push and the devices the engine registers for you.

Everything you query goes by **name**, and the name can be either:

- **an action** you bound — usually in a scene's `input` property, or at runtime with `Input.bind()` — or
- **a raw device identifier** — a key like `"Space"` or `"KeyW"`, a mouse button like `"LEFT_MOUSE"`, and so on.

For scene-local controls, the declarative `input` property is the usual approach. It gives physical inputs a stable meaning once, so gameplay code can work with names such as `jump`, `shoot`, and `move` instead of device-specific keys and buttons.

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

## Scene bindings

A scene can declare its controls directly with an `input` property. This is the
preferred form when the controls belong to that scene:

```js
class MyScene extends Scene {
  input = {
    idle: "KeyI",
    jump: "Space",
    shoot: "LEFT_MOUSE",
    move: ["wasd", "arrowkeys"],
  };
}
```

The binding name is the semantic name used everywhere else in the input API.
Multiple physical inputs can drive one action, so gameplay code does not need
to know whether `shoot` came from a mouse, keyboard, or gamepad:

```js
class GameScene extends Scene {
  input = {
    shoot: ["LEFT_MOUSE", "KeyJ", "PAD_X"],
  };

  update() {
    if (Input.pressed("shoot")) this.fire();
  }
}
```

This separation is intentional: `input` defines **what an input means**; the
rest of the API lets gameplay decide what to do with that meaning.

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

Arms an input buffer for the action for `ms` milliseconds. Use it for input leniency — jump buffering (a jump pressed just before landing still counts), or action-queue timing — where a press inside the window should be honored even if the game wasn't ready for it at the instant it happened. Coyote time is a gameplay rule built on top of movement state, not an input buffer.

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

## Events

The three essential queries read **state** — what is true this frame. `events()` and `presses()` read **history** — what happened, and in what order, this tick.

They are the right tool when one frame can contain more than one press. Holding `W` then tapping `D` then `S` in the same tick still produces three distinct presses, and the order is preserved.

### `events()`

`InputEvent[]` — every normalized input event this tick, frozen, in the order the engine received them. Useful for custom dispatch or logging; most games read `presses()` instead.

```js
for (const e of Input.events()) {
  // e.type, e.device, e.timestamp, e.data
}
```

### `presses(name)`

`object[]` — the presses for one action or raw identifier **this tick**, in order. For an action it returns the physical events that triggered it (with vector info for `VECTOR2`); for a raw key it returns the raw events.

```js
// action "move" bound to WASD — returns one entry per press this tick
for (const p of Input.presses("move")) { /* ... */ }

const snake = Input.presses("move"); // [{x:0,y:-1}, ...] in WASD→arrow order
```

`presses()` is the Snake-friendly query: one tick with `W → D → S` yields three entries, not just the last held key.

This is useful when input order matters inside a single tick. For example, a
Snake game can consume every turn without losing a quick series of inputs:

```js
for (const turn of Input.presses("move")) {
  this.snake.turn(turn.x, turn.y);
}
```

### `anyPressed()` / `anyDown()` / `anyReleased()`

`boolean` — whether **any** keyboard press / hold / release happened this tick. Quick gates when you don't care which key.

```js
if (Input.anyPressed()) { /* a key went down */ }
```

### `Input.keyboard.lastPressed` / `lastReleased`

The most recent keyboard press or release **this tick**, or `null` if none. A convenient shortcut when you only need the last event's `code`/`key`/`timestamp`.

```js
const last = Input.keyboard.lastPressed;
if (last) console.log(last.code, last.key);
```

## History, queues & buffers

These read **across ticks**, not just this frame. They all consume the same ordered history the engine keeps for you — you don't need to store your own timestamps.

### `history(limitOrOptions)`

`InputEvent[]` — the recent press history, oldest to newest. Without arguments it returns everything the engine retains (bounded, 128 by default). Pass a number for the last N, or `{ within: ms }` for the last window, or `{ limit: N }`.

```js
Input.history();              // all retained
Input.history(5);             // last 5
Input.history({ within: 300 }); // last 300ms
```

History is **not** mutated by reading it. Consuming happens elsewhere.

### `queue(name)` / `next(name)`

An explicit per-action FIFO for inputs you want to handle **once** in order. `queue()` peeks, `next()` pops.

```js
// press queue
if (Input.next("jump")) player.jump();

// vector queue — entries are {x, y}
const step = Input.next("move"); // {x:0, y:-1} etc.
```

Each action has its own queue (capacity 16). Presses are enqueued automatically from history; you just read them.

### `buffer(name, ms)` / `buffered(name)` / `consumeBuffered(name)`

A time-window buffer: arm it, then check it.

```js
Input.buffer("jump", 150);          // arm for 150ms
if (Input.buffered("jump")) { /* ... */ }
Input.consumeBuffered("jump");       // clear after using
```

`buffer()` arms the action for `ms` from now (uses the monotonic clock, not frame count). `buffered()` is `true` while the window is still live, `consumeBuffered()` returns `true` once and clears it. Unlike `history`, a buffer is intentional leniency — jump buffering, coyote time — not a log.

## Repeat

`pressed()` is an edge: `true` for exactly one tick. `repeated()` is the typematic version — the initial press plus timed repeats while held, like a key repeating in a text field.

### `repeated(name, { delay?, rate? })`

`boolean` — `true` on the initial press and again every `rate` ms after `delay` ms, while the input stays down. Both options are per-call overrides; otherwise the global keyboard settings apply.

```js
if (Input.repeated("moveLeft")) player.stepLeft();
```

The same mechanism is useful for controls that should fire repeatedly while a
button is held. Per-call options make this useful for gameplay-specific rates
without changing the global keyboard settings:

```js
if (Input.repeated("shoot", { delay: 150, rate: 80 })) {
  this.fire();
}
```

For example, a scene can keep the binding device-independent:

```js
input = {
  shoot: ["LEFT_MOUSE", "KeyJ", "PAD_X"],
};
```

`repeated("shoot")` then works with any of those inputs. Use `pressed()` when
you want one shot per press; use `repeated()` when holding the control should
produce additional activations.

### `Input.keyboard.repeatDelay` / `repeatRate`

Global repeat settings. `repeatDelay` is the initial wait (default `400` ms), and `repeatRate` is the interval (default `50` ms).

```js
Input.keyboard.repeatDelay = 300;
Input.keyboard.repeatRate = 40;
```

Setting them propagates to existing actions. Per-call `{ delay, rate }` in `repeated()` overrides for that query only, and for an action it also adjusts the live `ActionState` if the key is already held and the next repeat hasn't yet been scheduled. Slow frames produce at most one repeat and stay aligned; browser `e.repeat` is ignored and `pressed()` remains edge-only.

`repeated()` works for actions, chords (modifier release stops it), and raw identifiers (`"KeyA"`, `"LEFT_MOUSE"`, ...). `VECTOR2` actions never repeat.

## Mouse & pointer

Jygame keeps two related surfaces: the **mouse** and the **pointer**.

- **`Input.pointer`** — the unified pointer: mouse, touch, and stylus collapsed into one primary position and button state. Use it for cross-device gameplay.
- **`Input.mouse`** — mouse-only: position, buttons, wheel, and the browser behaviors — cursor and pointer lock. Use it when the semantics are specific to a mouse.

Both derive from the same normalized pointer stream; there is no second pipeline.

### `Input.mouse` — position

Mouse position is mouse-specific — a touch contact does not move it — and it shares the coordinate logic of `Input.pointer`.

| Member | Type | Meaning |
|--------|------|---------|
| `x`, `y` | `number` | Viewport position (persistent) |
| `worldX`, `worldY` | `number` | World position (camera applied, persistent) |
| `hasPosition` | `boolean` | Whether a real mouse position has been received yet |
| `deltaX`, `deltaY` | `number` | Movement since last tick (relative while pointer-locked) |
| `wheel`, `wheelX` | `number` | Vertical / horizontal scroll delta this tick |

```js
if (Input.mouse.hasPosition) {
  this.reticle.x = Input.mouse.worldX;
  this.reticle.y = Input.mouse.worldY;
}
this.camera.panBy(Input.mouse.deltaX, Input.mouse.deltaY);
```

`hasPosition` becomes `true` on the first mouse `POINTER_MOVE` or `POINTER_DOWN` (including `(0,0)`), stays `true` after release, and `(0,0)` is always a valid initialized position — use `hasPosition` to test for initialization, not `x !== 0`.

### Buttons

Each button exposes `down` / `pressed` / `released`, and the facade also offers a generic form. Either style works — the named properties are ergonomic for common cases, the generic form for dynamic handling. Both resolve to the same mouse state, and raw queries like `Input.pressed("LEFT_MOUSE")` remain compatible.

```js
if (Input.mouse.left.pressed) this.select();
if (Input.mouse.right.down) this.aim();

// generic
if (Input.mouse.isDown("left")) { /* ... */ }
if (Input.mouse.pressed("right")) { /* ... */ }
Input.mouse.button("middle").down;
```

| Button | Members |
|--------|---------|
| `left`, `right`, `middle`, `back`, `forward` | `{ down, pressed, released }` |
| `isDown(name)` / `pressed(name)` / `released(name)` | `boolean` by name (`"left"` etc., case-insensitive) |
| `button(name)` | the same `{ down, pressed, released }` object or `null` |

Button names accepted: `"left"`, `"right"`, `"middle"`, `"back"`, `"forward"` and their `"LEFT_MOUSE"` / `"MOUSE_LEFT"` aliases. `pressed`/`released` are edge-triggered for exactly one tick, `down` is level-triggered. Out-of-range queries return `false`/`null`.

### Wheel

`Input.mouse.wheel` / `wheelX` are the canonical per-tick wheel deltas, reset every tick. `Input.wheel` / `Input.wheelX` remain as compatibility aliases.

```js
this.camera.zoom += Input.mouse.wheel * 0.001;
```

### Cursor

The engine owns the browser cursor through `Input.mouse.cursor`. You don't write `canvas.style.cursor` yourself.

| Member | Type | Meaning |
|--------|------|---------|
| `visible` | `boolean` | `false` hides the cursor (`"none"`), `true` restores it |
| `style` | `string` | Any CSS cursor keyword — `"default"`, `"pointer"`, `"crosshair"`, … |
| `image` | `string \| null` | Custom image URL (`"assets/cursor.png"`) or `null` |
| `hotspot` | `{ x, y }` | Tip of the custom image, in pixels from the top-left |
| `setImage(src, hotspot?)` | | Set image + optional hotspot |
| `clearImage()` | | Remove the custom image |
| `reset()` | | Restore `visible: true`, `style: "default"`, no image |

```js
Input.mouse.cursor.visible = false;
Input.mouse.cursor.style = "crosshair";
Input.mouse.cursor.setImage("assets/cursor.png", { x: 4, y: 4 });
Input.mouse.cursor.hotspot = { x: 0, y: 0 };
```

Custom images use the browser's `cursor: url(...)` path: `url("assets/cursor.png") 4 4, <style>`. Browser cursors have practical limits — allowed image size, hotspot clamping, and high-DPI sharpness vary by browser. For full control (size, animation, high-DPI fidelity) the abstraction is designed to accommodate an engine-rendered sprite later without changing the public API — custom cursors are deferrable by design.

Cursor state is desired state; the desired cursor is re-applied automatically after pointer lock is released.

### Pointer lock

Pointer lock is a first-class, stateful engine capability — not a raw DOM call. It targets the game's canvas and is subject to the browser's user-activation rules (it typically only succeeds when called from a valid user interaction such as a click).

| Member | Type | Meaning |
|--------|------|---------|
| `isLocked` | `boolean` | Whether the pointer is currently locked |
| `lock()` | `Promise<boolean>` | Request lock — resolves `true` on success, `false` on rejection |
| `unlock()` | `void` | Release lock |

```js
if (Input.mouse.left.pressed) await Input.mouse.pointerLock.lock();
if (Input.mouse.pointerLock.isLocked) this.player.yaw += Input.mouse.deltaX * 0.2;
Input.mouse.pointerLock.unlock();
```

While locked, `Input.mouse.x`/`y` stay at the last known absolute position and `deltaX`/`deltaY` become relative `movementX`/`movementY`. `Input.pointer` behaves the same — `x`/`y` frozen, `delta` relative — and `hasPosition` is preserved. The engine listens to `pointerlockchange`/`pointerlockerror`, so an external exit (user pressing Esc, tab blur, or the browser denying the request) is synchronized and never leaves `isLocked` as `true` on failure. `Game` cleans up listeners and exits lock on destroy.

## Sequences, combos & matchers

*`input` gives raw inputs meaning; `combo` gives ordered combinations of those meanings a name. Jygame provides the mechanism, not fighting-game semantics like Forward/Back, quarter-circles, or facing.*

### Defining meanings — `input`

Scenes declare what physical inputs mean. This stays the primary way to give input semantics:

```js
class FightingScene extends Scene {
  input = {
    punch: ["KeyJ", "PAD_X"],
    kick:  ["KeyK", "PAD_A"],
    down:  "KeyS",
    right: "KeyD",
  };
}
```

After this, `"punch"` means `KeyJ` *or* `PAD_X` — one semantic name, multiple physical sources.

### Defining order — `combo`

A scene can also declare named **ordered** combinations of those meanings:

```js
class FightingScene extends Scene {
  input = {
    punch: ["KeyJ", "PAD_X"],
    down:  "KeyS",
    right: "KeyD",
  };
  combo = {
    hadoken: ["down", "right", "punch"],
    // object form with options
    hadoken2: { sequence: ["down", "right", "punch"], within: 300, consume: true },
  };
}
```

`input` says *these physical inputs are the action `punch`*; `combo` says *these already-semantic inputs form the sequence named `hadoken`*. A combo consumes action names, not device details, so `hadoken` works regardless of whether `punch` came from a key or a pad.

Array shorthand is ergonomic; the object form adds `within` (max per-step gap, ms) and `consume` (whether matching consumes the inputs for that matcher). Both are optional.

### `Input.sequence(sequence, options)`

`boolean` — whether the ordered sequence was satisfied in the recent history.

It accepts either a **combo name** or a **direct sequence**:

```js
if (Input.sequence("hadoken")) fighter.hadoken();
if (Input.sequence(["down", "right", "punch"])) fighter.hadoken();

// raw, mixed — still valid
Input.sequence(["KeyW", "KeyD", "Space"]);
Input.sequence(["KeyW", "move", "PAD_A"]);
```

A string first resolves as a **combo** in the active context (priority order, like `pressed()`); if no combo matches, it is treated as a single-step sequence of that name (so `Input.sequence("punch")` works without a combo). Raw identifiers and action names can be mixed freely.

**Timing** is per-step, using the monotonic event timestamps:

```js
Input.sequence(["down", "right", "punch"], { within: 300 });
```

`within: 300` means every consecutive pair must be at most 300 ms apart. It is not frame count and no timers are involved.

**Consumption** does not mutate `Input.history()` — it is tracked per matcher:

```js
Input.sequence("hadoken", { consume: true });
```

```js
combo = {
  hadoken: { sequence: ["down","right","punch"], within: 300, consume: true }
};
```

History stays intact so multiple matchers can observe the same stream. Overlapping sequences like `A B A` where both `["A","B"]` and `["B","A"]` are valid remain valid — each matcher keeps its own progress and consumed set. History itself is bounded (128 by default) and the oldest entries are evicted naturally.

`Input.sequence()` resolves each step through the same action/raw logic as `pressed()` — no duplicate binding system — and participates in context priority and scene cleanup. A combo belongs to the context that declared it and disappears when that scene exits.

### `Input.match(predicate)`

The escape hatch for **state-dependent** semantics. Some games need `"forward"` to mean different physical inputs depending on the fighter's facing — Jygame must not encode that, but it should give you a way to express it.

```js
const forward = Input.match(event => {
  if (event.action !== "left" && event.action !== "right") return false;
  const dir = event.action === "right" ? 1 : -1;
  return dir === fighter.facing;
});

if (Input.sequence(["down", forward, "punch"])) fighter.hadoken();
```

A more complete fighting-game setup can keep `forward` and `back` out of the
engine entirely. The game decides what those terms mean from its own state:

```js
input = {
  left: ["KeyA", "PAD_DPAD_LEFT"],
  right: ["KeyD", "PAD_DPAD_RIGHT"],
  punch: ["KeyJ", "PAD_X"],
  down: ["KeyS", "PAD_DPAD_DOWN"],
};

const forward = Input.match(event => {
  if (!event.matches("left") && !event.matches("right")) return false;

  const direction = event.matches("right") ? 1 : -1;
  return direction === fighter.facing;
});

if (Input.sequence(["down", forward, "punch"], { within: 300 })) {
  fighter.hadoken();
}
```

The important boundary is that Jygame knows what `left`, `right`, `down`, and
`punch` mean, and knows how to match an ordered sequence. The meaning of
`forward` remains game logic because it depends on `fighter.facing`.

`Input.match()` takes a **function** and returns an opaque matcher that can be
used as a sequence element alongside strings.

- The predicate receives the **historical candidate event** — not just current state — with `type`, `device`, `timestamp`, `data` (`code`, `key`, `button`, ...), plus `action`/`name` (the primary matching action), `actions` (all matching actions), and a `matches(name)` helper. The original timestamp is preserved, so a state-dependent test can evaluate the input that actually occurred in the sequence.
- Keep the predicate stateless — progress, timing, and consumption belong to `Input.sequence`, not the matcher.
- `Input.match("forward")` throws `TypeError` — the argument must be a function.
- If the predicate throws, the error propagates — it is not swallowed to `false`.
- Matchers are for **programmatic** `Input.sequence([...])`; do not put executable predicates inside declarative `combo` — keep `combo` serializable.

Together this gives you the layered model:

```text
physical input
      ↓
     input          (meaning)
      ↓
     combo          (order)
      ↓
 Input.match()     (runtime-dependent meaning, when needed)
      ↓
  gameplay behavior
```

Jygame stops there — facing, quarter-circles, diagonals, attack priority, and cancel windows are game-level semantics you implement with these primitives.

## Gamepad

You can usually stay at the action level and let the same binding work across
keyboard, mouse, and controller. Use the structured facade when you need
controller-specific data, multiple pads, or analog controls.

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

It is `null` until the game creates its input system. Reaching for `raw` is uncommon; prefer the public facade unless you are integrating with an engine-level system.
