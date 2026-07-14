# Input Devices

<Badge type="info">New in v0.8.1</Badge>

## Overview

The input system uses **device objects** that consume `InputEvent` objects from the shared event queue and expose typed state. Devices are registered in the `DeviceRegistry` owned by `InputSystem`.

## Device (abstract base)

All devices extend `Device`, which provides:

| Member | Description |
|--------|-------------|
| `type` | Returns `this.constructor` — used as the registry key |
| `update(queue, dt?)` | Override to process events from the queue each frame |

## DeviceRegistry

Owned by `InputSystem` and accessible via `inputSystem.devices`.

| Method | Description |
|--------|-------------|
| `register(device)` | Register a device (keyed by `device.type`) |
| `unregister(device)` | Remove a device |
| `get(ClassType)` | Get the first device of a given class, or `null` |
| `getAll(ClassType)` | Get all devices of a given class (array) |
| `forEach(fn)` | Iterate all registered devices |
| `update(queue)` | Call `update()` on every registered device |

```js
const kb = game.inputSystem.devices.get(Keyboard);
const allMice = game.inputSystem.devices.getAll(Mouse);
```

## Standard Devices

### Keyboard

```js
const kb = game.inputSystem.devices.get(Keyboard);
if (kb.isDown(KeyCode.SPACE)) { /* jump */ }
if (kb.justPressed(KeyCode.ENTER)) { /* confirm */ }
```

| Member | Description |
|--------|-------------|
| `isDown(keyCode)` | Whether a key is currently held |
| `justPressed(keyCode)` | Whether the key was pressed this frame |
| `justReleased(keyCode)` | Whether the key was released this frame |
| `repeat(keyCode)` | Whether the key is in repeat state (held) |
| `anyDown()` | Whether any key is pressed |
| `modifiers` | Bitfield of active modifiers (`Modifier.CTRL`, `SHIFT`, `ALT`, `META`) |
| `pressedKeys` | Array of currently pressed `KeyCode` values |
| `reset()` | Clear all key state |

See: [KeyCode](/api/input/events) for the full key code enum.

### Mouse

```js
const mouse = game.inputSystem.devices.get(Mouse);
if (mouse.isDown(MouseButton.LEFT)) { /* firing */ }
```

| Member | Description |
|--------|-------------|
| `isDown(button)` | Whether a mouse button is held |
| `justPressed(button)` | Whether the button was pressed this frame |
| `justReleased(button)` | Whether the button was released this frame |
| `position` | `{ x, y }` — current cursor position in screen coordinates |
| `delta` | `{ x, y }` — movement delta this frame |
| `wheel` | Vertical wheel delta (cumulative; call `resetWheel()` to clear) |
| `wheelHorizontal` | Horizontal wheel delta (cumulative) |
| `doubleClicked` | `true` if a double-click was detected (300ms / 10px) |
| `hoverPosition` | `{ x, y }` — last hover position |
| `isHovering` | `true` if the pointer is over the target element |
| `isPointerLocked` | `true` if pointer lock is active |
| `requestPointerLock()` | Request pointer lock |
| `exitPointerLock()` | Exit pointer lock |
| `resetWheel()` | Reset accumulated wheel deltas to zero |

### PointerManager

Tracks all pointer types (mouse, touch, pen) with pooled slot-based storage and per-pointer history.

```js
const pm = game.inputSystem.devices.get(PointerManager);
const pointers = pm.getPointers();
```

| Member | Description |
|--------|-------------|
| `getPointer(id)` | `Pointer` view for the given `pointerId`, or `null` |
| `getPointers()` | Array of `Pointer` objects for all active pointers |
| `count` | Number of active pointers |
| `storage` | Internal `PointerStorage` instance |

Each `Pointer` object exposes:

| Field | Description |
|-------|-------------|
| `id` | Unique pointer ID |
| `type` | `"mouse"`, `"touch"`, or `"pen"` |
| `position` | `{ x, y }` |
| `delta` | `{ x, y }` — change since last frame |
| `velocity` | `{ x, y }` — exponential moving average (alpha 0.3) |
| `pressure` | 0–1 |
| `tilt` | `{ x, y }` — pen tilt angles |
| `twist` | Pen twist angle |
| `radius` | `{ width, height }` — contact geometry |
| `isDown` | Whether the pointer is currently pressed |
| `justDown` / `justUp` | Edge detection |
| `startPosition` | `{ x, y }` at initial press |
| `duration` | How long the pointer has been down (ms) |
| `distance` | Total travel distance (px) |

### GestureEngine

Gesture recognition orchestrator. Registered as a device; runs all recognizers each frame and produces `GestureEvent` results.

```js
const ge = game.inputSystem.devices.get(GestureEngine);
if (ge.last(GestureType.TAP)) { /* handle tap */ }
```

| Member | Description |
|--------|-------------|
| `isActive(type)` | Whether a recognizer of the given `GestureType` is currently active |
| `last(type)` | Last recognised `GestureEvent` for the type, or `null` |
| `consume(type)` | Returns the last event and removes it (or `null`) |

The 8 built-in recognizers are always active. See [Gesture Recognition](/api/input/gestures) for details.

### TouchSurface

Derives touch-specific state from `PointerManager` (filters for `type === "touch"`).

```js
const touch = game.inputSystem.devices.get(TouchSurface);
console.log(touch.contactCount);
```

| Member | Description |
|--------|-------------|
| `contacts` | Array of touch `Pointer` objects |
| `contactCount` | Number of active touch contacts |
| `primary` | Primary touch pointer or `null` |

### Stylus

Derives pen-specific state from `PointerManager` (filters for `type === "pen"`).

```js
const stylus = game.inputSystem.devices.get(Stylus);
if (stylus.active) {
  const p = stylus.pressure;
}
```

| Member | Description |
|--------|-------------|
| `active` | Whether a pen is currently active |
| `position` | `{ x, y }` |
| `pressure` | Pen pressure (0–1) |
| `tilt` | `{ x, y }` tilt angles |
| `twist` | Twist angle |
| `isEraser` | Whether the eraser end is being used |

### TextInput

Handles IME composition and printable character input.

```js
const text = game.inputSystem.devices.get(TextInput);
const chars = text.consumeCharacters(); // ["a", "b", "c"]
```

| Member | Description |
|--------|-------------|
| `compositionActive` | Whether an IME composition is in progress |
| `compositionString` | Current composition text |
| `consumeCharacters()` | Returns and clears buffered printable characters |

See also: [InputSystem Overview](/api/input/input-system), [Action System](/api/input/actions), [Coordinate System](/api/input/coordinate-system).
