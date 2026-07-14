# Input Events & Backends

<Badge type="info">New in v0.8.1</Badge>

## InputEvent

Event envelope produced by backends and consumed by devices.

```js
const event = new InputEvent(EventType.KEY_DOWN, { code: "Space" });
event.consume(); // mark as consumed
```

| Method/Property | Description |
|----------------|-------------|
| `type` | `EventType` constant |
| `data` | Event-specific payload object |
| `consumed` | `boolean` — whether the event has been consumed |
| `consume()` | Mark the event as consumed |

## EventType

| Type | Description |
|------|-------------|
| `KEY_DOWN` | Key pressed |
| `KEY_UP` | Key released |
| `POINTER_DOWN` | Pointer pressed |
| `POINTER_MOVE` | Pointer moved |
| `POINTER_UP` | Pointer released |
| `WHEEL` | Scroll wheel |
| `GESTURE` | Gesture recognised |
| `TEXT_INPUT` | Text character input |
| `COMPOSITION_START` | IME composition started |
| `COMPOSITION_UPDATE` | IME composition updated |
| `COMPOSITION_END` | IME composition ended |

## InputEventQueue

Three-tier ring buffer for events. Each tier has its own circular buffer; old events are overwritten when capacity is exceeded.

```js
const queue = new InputEventQueue(64); // capacity per tier

queue.push(event, Tier.HIGH);   // critical (key down, pointer up)
queue.push(event, Tier.NORMAL); // standard
queue.push(event, Tier.LOW);    // continuous (pointer move)
```

| Method | Description |
|--------|-------------|
| `push(event, tier)` | Add an event to the specified tier |
| `each(fn)` | Iterate all events in priority order without consuming |
| `drain(fn)` | Iterate and clear all events (HIGH → NORMAL → LOW) |
| `clear()` | Clear all events from all tiers |
| `length` | Total number of events across all tiers |

## Tier

Event priority constants used with `InputEventQueue.push()`.

| Tier | Value | Use Case |
|------|-------|----------|
| `HIGH` | 0 | Key down/up, pointer up, composition events |
| `NORMAL` | 1 | Pointer down, wheel, gesture |
| `LOW` | 2 | Pointer move |

## InputBackend

Abstract base class for platform backends.

| Method | Description |
|--------|-------------|
| `start()` | Begin listening for input events |
| `stop()` | Stop listening |
| `poll(queue)` | Drain pending events into the queue |

## BrowserBackend

Concrete implementation for browser DOM environments. Attached to a target element.

```js
const backend = new BrowserBackend(canvas);
backend.start(); // attaches all listeners
```

- Keyboard events (`keydown`/`keyup`) are attached to `document`
- Pointer (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`), wheel, and composition events are attached to `target`
- Sets `target.style.touchAction = "none"` on start (restored on stop)
- Prevents default on arrow keys, space, and cancelable pointer/wheel events
- Produces `InputEvent` objects with full metadata (pressure, tilt, twist, pointer type, button info, pointer ID, etc.)

## TestBackend

Programmatic event injection for testing and simulation.

```js
const backend = new TestBackend();
backend
  .keyDown("KeyW")
  .keyUp("KeyW")
  .pointerDown({ x: 100, y: 200, button: 0 })
  .pointerMove({ x: 120, y: 210 })
  .pointerUp({ x: 120, y: 210 })
  .wheel({ deltaY: -100 });

backend.poll(queue); // events are now in the system queue
```

| Method | Description |
|--------|-------------|
| `keyDown(key, options?)` | Queue `KEY_DOWN` (tier HIGH, chainable) |
| `keyUp(key, options?)` | Queue `KEY_UP` (tier HIGH, chainable) |
| `pointerDown(options?)` | Queue `POINTER_DOWN` (tier HIGH, chainable) |
| `pointerMove(options?)` | Queue `POINTER_MOVE` (tier LOW, chainable) |
| `pointerUp(options?)` | Queue `POINTER_UP` (tier HIGH, chainable) |
| `wheel(options?)` | Queue `WHEEL` (tier NORMAL, chainable) |
| `compositionStart(data?)` | Queue `COMPOSITION_START` (chainable) |
| `compositionUpdate(data?)` | Queue `COMPOSITION_UPDATE` (chainable) |
| `compositionEnd(data?)` | Queue `COMPOSITION_END` (chainable) |
| `clear()` | Clear all queued events |
| `poll(queue)` | Drain all queued events into the system queue |

See also: [InputSystem Overview](/api/input/input-system), [Input Devices](/api/input/devices), [Action System](/api/input/actions).
