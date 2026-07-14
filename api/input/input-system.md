# InputSystem

<Badge type="info">New in v0.8.1</Badge>

## Overview

The `InputSystem` is the central orchestrator of the input architecture introduced in v0.8.1. It provides an event-driven, device-oriented pipeline for processing input.

## Architecture

```
Browser DOM Events
       ↓
BrowserBackend (DOM listeners)
       ↓
InputEventQueue (tiered: HIGH / NORMAL / LOW)
       ↓
InputSystem.update()
  ├── snapshot()     — save previous action states
  ├── backend.poll() — drain queued events
  ├── consumers      — notify raw event listeners
  ├── devices.update() — Keyboard, Mouse, PointerManager, etc.
  └── contextStack.evaluate() — evaluate action maps with priority
```

## Integration

```js
import { InputSystem, BrowserBackend, Keyboard, Mouse, PointerManager, GestureEngine, TextInput } from "jygame/input";

const system = new InputSystem({ queueCapacity: 128 });
system.setBackend(new BrowserBackend(canvas));

// Register standard devices
system.devices.register(new Keyboard());
system.devices.register(new Mouse());
const pm = system.devices.register(new PointerManager());
system.devices.register(new GestureEngine(pm));
system.devices.register(new TextInput());
```

`InputSystem` is also created automatically by `Game` and accessible via `game.inputSystem`:

```js
const game = new Game({ parent: document.body, width: 800, height: 600 });
// game.inputSystem is already set up
```

### Constructor

```js
new InputSystem({ queueCapacity = 64 })
```

| Option | Default | Description |
|--------|---------|-------------|
| `queueCapacity` | `64` | Per-tier capacity of the `InputEventQueue` ring buffer |

## Update Pipeline

`inputSystem.update()` runs every frame and performs these steps in order:

1. **snapshot()** — snapshots all `ActionState` objects (saves current → previous for `justPressed`/`justReleased` detection)
2. **backend.poll(events)** — drains the `BrowserBackend`'s pre-queued DOM events into the system's event queue
3. **consumers** — raw event subscribers receive every unconsumed event
4. **devices.update(events)** — each registered device (`Keyboard`, `Mouse`, `PointerManager`, etc.) reads the queue and updates its internal state
5. **contextStack.evaluate(devices)** — sorts input contexts by priority, evaluates their `ActionMap`s against devices, respecting `consumePolicy: "block"`
6. **events.clear()** — clears the queue for the next frame

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `backend` | `InputBackend` | Platform input source |
| `devices` | `DeviceRegistry` | Registered input devices |
| `contextStack` | `ContextStack` | Priority-sorted stack of input contexts |
| `coordinateSystem` | `CoordinateSystem` | Screen/Viewport/World/UI coordinate transformer |
| `events` | `InputEventQueue` | Tiered event queue |

## Methods

| Method | Description |
|--------|-------------|
| `setBackend(backend)` | Stops the current backend, sets a new one, and calls `backend.start()` |
| `addInputConsumer(fn)` | Registers a callback `fn(event)` invoked for every raw unconsumed event during `update()` |
| `removeInputConsumer(fn)` | Removes a previously registered consumer callback |
| `snapshot()` | Snapshots all context action states (called at the start of each frame's update) |
| `update()` | Main frame update pipeline: snapshot → poll → consumers → devices → contextStack → clear |

See also: [Input Devices](/api/input/devices), [Action System](/api/input/actions), [Coordinate System](/api/input/coordinate-system), [Input Events & Backends](/api/input/events).
