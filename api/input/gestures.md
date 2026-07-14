# Gesture Recognition

<Badge type="info">New in v0.8.1</Badge>

## Overview

The gesture recognition system detects multi-touch and pointer gestures through composable recognizer objects managed by a `GestureEngine`. The `GestureEngine` is registered as a device and runs all recognizers each frame.

## GestureEngine

```js
import { GestureEngine } from "jygame/input";

const engine = new GestureEngine(pointerManager);
// 8 built-in recognizers are created automatically
```

The engine is registered as a device and accessed via the device registry:

```js
const ge = game.inputSystem.devices.get(GestureEngine);
```

| Method | Description |
|--------|-------------|
| `isActive(type)` | Whether a recognizer of the given `GestureType` is currently tracking |
| `last(type)` | Most recent `GestureEvent` for the type, or `null` |
| `consume(type)` | Returns the most recent event and removes it from the map (or `null`) |

The engine's `update()` method runs automatically during `DeviceRegistry.update()`. It reads pointers from `PointerManager`, runs all recognizers, and pushes `GESTURE` events into the queue.

## GestureType

| Type | Description |
|------|-------------|
| `TAP` | Single quick tap |
| `DOUBLE_TAP` | Two taps within interval and distance thresholds |
| `LONG_PRESS` | Press held beyond minimum duration |
| `DRAG` | Press + movement beyond threshold |
| `SWIPE` | Fast directional flick |
| `PINCH` | Two-finger pinch (scale) |
| `ROTATE` | Two-finger rotation |
| `PAN` | Two-finger pan |

## Recognizers

| Recognizer | Parameters | Defaults | Description |
|------------|-----------|----------|-------------|
| `TapRecognizer` | `maxTime`, `maxDistance` | 200ms, 10px | Single tap |
| `DoubleTapRecognizer` | `interval`, `maxDistance`, `maxTapTime` | 300ms, 10px, 200ms | Double tap |
| `LongPressRecognizer` | `minTime`, `maxDistance` | 500ms, 10px | Long press |
| `DragRecognizer` | `threshold` | 10px | Drag gesture |
| `SwipeRecognizer` | `velocityThreshold`, `distanceThreshold` | 500px/s, 30px | Swipe gesture |
| `PinchRecognizer` | — | — | Two-finger pinch (returns scale) |
| `RotateRecognizer` | — | — | Two-finger rotation (returns angle in radians) |
| `PanRecognizer` | `threshold` | 5px | Two-finger pan (returns delta) |

## GestureEvent

| Property | Description |
|----------|-------------|
| `type` | `GestureType` constant |
| `position` | `{ x, y }` — centroid or origin |
| `delta` | `{ x, y }` — movement delta (drag, pan, swipe) |
| `scale` | Scale factor (pinch) |
| `rotation` | Rotation angle in radians (rotate) |
| `velocity` | Pixels/second (swipe) |
| `duration` | Duration in ms |
| `pointerIds` | Array of participating pointer IDs |

## GestureBinding

Gestures can be integrated into the action system:

```js
map.bind("pinch", new GestureBinding(GestureType.PINCH));
const state = map.getState("pinch");
if (state.pressed) camera.zoom *= state.strength;
```

When the gesture is recognised, `GestureBinding.evaluate()` returns `1`; otherwise `0`.

See also: [Action System](/api/input/actions), [Input Devices](/api/input/devices).
