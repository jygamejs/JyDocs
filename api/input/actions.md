# Action System

## Overview

The action system maps abstract game actions (e.g., "jump", "move", "shoot") to concrete input bindings. It provides priority-sorted context stacks, typed bindings, signal processors, and full serialization support.

## ActionMap

Maps action names to bindings and `ActionState` objects.

```js
const map = new ActionMap();

// Bind a single key
map.bind("jump", new KeyBinding(KeyCode.SPACE));

// Bind a chord (modifier + key)
map.bind("openDebug", new ChordBinding(KeyCode.F3, { ctrl: true }));

// Bind a composite (WASD → 2D vector)
map.bind("move", new CompositeBinding(ActionKind.VECTOR2, [
  { vector: [-1, 0], binding: new KeyBinding(KeyCode.KEY_A) },
  { vector: [1, 0],  binding: new KeyBinding(KeyCode.KEY_D) },
  { vector: [0, -1], binding: new KeyBinding(KeyCode.KEY_W) },
  { vector: [0, 1],  binding: new KeyBinding(KeyCode.KEY_S) },
]));

// Query state
const jumpState = map.getState("jump");
if (jumpState.justPressed) player.jump();

const moveState = map.getState("move");
player.velocity.x = moveState.vector.x * speed;
player.velocity.y = moveState.vector.y * speed;
```

| Method | Description |
|--------|-------------|
| `bind(name, binding, kind?)` | Register an action with one or more bindings |
| `addBinding(name, binding)` | Add a binding to an existing action |
| `removeBinding(name, binding)` | Remove a binding |
| `getBindings(name)` | Get all bindings for an action |
| `getState(name)` | Get the `ActionState` for an action |
| `has(name)` | Check if action exists |
| `remove(name)` | Remove an action entirely |
| `entries()` | Iterate all actions |
| `serialize()` | Serialize all bindings to plain objects |
| `static deserialize(data)` | Restore from serialized data |

## ActionState

| Property | Description |
|----------|-------------|
| `pressed` | Whether the action is currently active |
| `justPressed` | Whether the action became active this frame |
| `justReleased` | Whether the action became inactive this frame |
| `strength` | Analog strength (0–1), or 0/1 for digital actions |
| `vector` | `{ x, y }` — only meaningful for `VECTOR2` kind |
| `isBuffered` | Whether an input buffer is active |
| `buffer(ms)` | Enable input buffering for N milliseconds |
| `consumeBuffered()` | Returns true if buffer was active (consumes it) |

## ActionKind

| Value | Description |
|-------|-------------|
| `DIGITAL` | On/off actions (jump, shoot, interact) |
| `ANALOG` | 0–1 analog axis (trigger, throttle) |
| `VECTOR2` | 2D analog actions (movement, aim) |

The `kind` parameter defaults to `DIGITAL` in `map.bind(name, binding)`.

## Binding Types

| Binding | Description |
|---------|-------------|
| `KeyBinding(keyCode)` | Single keyboard key |
| `ChordBinding(keyCode, { ctrl?, shift?, alt?, meta? })` | Key + modifier combination |
| `MouseButtonBinding(button)` | Mouse button |
| `WheelBinding(direction?)` | Scroll wheel (`"vertical"`, `"horizontal"`, `"up"`, `"down"`) |
| `CompositeBinding(kind, subBindings)` | Combines sub-bindings with directional vectors |
| `GestureBinding(gestureType)` | Gesture recognizer result |
| `GamepadButtonBinding(button)` | Gamepad button (stub — returns 0) |
| `GamepadAxisBinding(axis)` | Gamepad axis (stub — returns 0) |

## InputContext

Wraps an `ActionMap` with a name, priority, and consume policy.

```js
const ctx = new InputContext(name, actionMap, {
  priority: 10,
  consumePolicy: "block",
});
```

| Property | Description |
|----------|-------------|
| `name` | Context name (used for lookup / pop) |
| `actionMap` | The `ActionMap` instance |
| `priority` | Higher = evaluated first |
| `consumePolicy` | `"block"` prevents lower-priority contexts from using the same action names |
| `serialize()` | Returns `{ name, priority, consumePolicy, actionMap }` |

## ContextStack

A priority-sorted stack of `InputContext` objects. Higher-priority contexts can block lower-priority ones from receiving actions.

```js
const stack = new ContextStack();

// Push a context for the pause menu (high priority, blocks input below)
const pauseCtx = new InputContext("pause", pauseMap, {
  priority: 100,
  consumePolicy: "block",
});
stack.push(pauseCtx);

// Push a context for gameplay (normal priority)
const gameCtx = new InputContext("game", gameMap, {
  priority: 0,
  consumePolicy: "block",
});
stack.push(gameCtx);
// When pause is on top, it blocks "shoot" from reaching the game context
```

| Method | Description |
|--------|-------------|
| `push(context)` | Add a context to the stack |
| `pop(name)` | Remove a context by name |
| `get(name)` | Look up a context by name |
| `has(name)` | Check if context exists |
| `size` | Number of contexts |
| `active` | Context with highest priority |
| `snapshot()` | Snapshot all action states (called before frame) |
| `evaluate(devices)` | Evaluate all contexts sorted by priority, with consume blocking |

## Signal Processors

Processors transform raw binding values before they reach action state:

```js
const binding = new KeyBinding(KeyCode.SPACE);
binding.processors = [
  new DeadZoneProcessor(0.15, 0.95), // ignore noise near 0/1
  new ScaleProcessor(0.5),            // halve the value
];
```

| Processor | Description |
|-----------|-------------|
| `DeadZoneProcessor(inner, outer)` | Zero values below `inner`, saturate above `outer` |
| `ScaleProcessor(factor)` | Multiply by factor |
| `InvertProcessor()` | `1 - value` |
| `SmoothProcessor(samples)` | Moving average over N samples |

## Binding & Processor Registry

Custom binding and processor types can be registered for serialization/deserialization:

```js
import { registerBinding, deserializeBinding } from "jygame/input";
import { registerProcessor, deserializeProcessor } from "jygame/input";

registerBinding("myCustomType", MyCustomBinding);
const binding = deserializeBinding({ type: "myCustomType", ... });

registerProcessor("customFilter", CustomFilterProcessor);
const proc = deserializeProcessor({ type: "customFilter", ... });
```

## Serialization

All bindings, action maps, and contexts support serialization for save/load:

```js
const data = map.serialize();
// store to localStorage, send over network, etc.
const restored = ActionMap.deserialize(data);
```

## Scene Integration

Each `Scene` has its own `_actionMap`. Bindings are set up in `onCreate()` and queried in `update()`:

```js
class GameScene extends Scene {
  onCreate() {
    this._actionMap.bind("jump", new KeyBinding(KeyCode.SPACE));
  }
  update(dt) {
    const jump = this._actionMap.getState("jump");
    if (jump.justPressed) this.player.jump();
  }
}
```

The scene's `InputContext` is automatically pushed on `onEnter()` and popped on `onExit()`.

See also: [InputSystem Overview](/api/input/input-system), [Gesture Recognition](/api/input/gestures), [Input Events & Backends](/api/input/events).
