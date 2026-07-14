# Changelog: v0.8.0 → v0.8.4

> What changed in the JyGame codebase since the docs were written.

---

## v0.8.1 — New Input System

### New `input/` directory (39 files)

Complete rewrite of the input architecture. The old `Input` singleton facade is preserved and still functional, but the new system runs in parallel.

**Core infrastructure:**

| File | Purpose |
|------|---------|
| `input/InputSystem.js` | Central orchestrator — owns DeviceRegistry, ContextStack, CoordinateSystem, InputEventQueue, Backend. Runs per-frame pipeline: snapshot → poll → consume → devices → evaluate → clear |
| `input/InputBackend.js` | Abstract base class for platform backends |
| `input/BrowserBackend.js` | Browser DOM listener → produces InputEvent objects into the tiered queue |
| `input/InputEvent.js` | Immutable event envelope with type, data, consumed flag |
| `input/InputEventQueue.js` | Three-tier ring buffer (HIGH/NORMAL/LOW) |
| `input/EventType.js` | Enum: KEY_DOWN, KEY_UP, POINTER_DOWN/MOVE/UP, WHEEL, COMPOSITION_*, etc. |
| `input/Tier.js` | Enum: HIGH, NORMAL, LOW |
| `input/Device.js` | Abstract base for logical input devices |
| `input/DeviceRegistry.js` | Maps device classes to instances (supports multiples) |

**Device implementations:**

| File | Device | State provided |
|------|--------|----------------|
| `input/Keyboard.js` | Keyboard | `isDown(keyCode)`, `modifiers`, `reset()` |
| `input/KeyboardState.js` | Keyboard state container | Key bitfield, modifiers bitfield |
| `input/KeyCode.js` | KeyCode enum | Full DOM key code mapping |
| `input/Modifier.js` | Modifier enum | CTRL, SHIFT, ALT, META |
| `input/Mouse.js` | Mouse | `isDown(button)`, `position`, `wheel`, buttons state |
| `input/MouseButton.js` | MouseButton enum | LEFT, MIDDLE, RIGHT, BACK, FORWARD |
| `input/PointerManager.js` | Pointer manager | Tracks all pointer types, pressure, tilt, twist |
| `input/PointerStorage.js` | Pointer storage | Slot-allocated pointer data with history |
| `input/PointerHistory.js` | Pointer history | Ring buffer of past positions |
| `input/Pointer.js` | Pointer data object | position, delta, velocity, pressure, tilt, twist |
| `input/PointerType.js` | PointerType enum | MOUSE, TOUCH, PEN |
| `input/TouchSurface.js` | Touch surface | `contacts`, `contactCount`, `primary` |
| `input/Stylus.js` | Stylus | `position`, `pressure`, `tilt`, `twist`, `isEraser` |
| `input/TextInput.js` | Text input | `compositionActive`, `compositionString`, `consumeCharacters()` |

**Action system:**

| File | Purpose |
|------|---------|
| `input/ActionKind.js` | Enum: DIGITAL, VECTOR2 |
| `input/actions/ActionMap.js` | Maps action names → bindings + ActionState. Supports `bind()`, `getState()`, `serialize()`/`deserialize()` |
| `input/actions/ActionState.js` | Per-action state: `pressed`, `justPressed`, `justReleased`, `strength`, `vector`, `buffer()`, `consumeBuffered()` |
| `input/actions/ActionEvaluator.js` | Evaluates all bindings for an action, applies processors, updates state |
| `input/actions/InputContext.js` | Named context: `{name, actionMap, priority, consumePolicy}` |
| `input/actions/ContextStack.js` | Priority-sorted stack of InputContexts. Higher priority contexts can block lower ones via `consumePolicy: "block"` |
| `input/actions/Binding.js` | Abstract binding with processor pipeline + serialization registry |
| `input/actions/KeyBinding.js` | Single key binding |
| `input/actions/ChordBinding.js` | Key + modifier combination (e.g., Ctrl+F3) |
| `input/actions/CompositeBinding.js` | Combines sub-bindings with directional vectors (e.g., WASD → 2D analog) |
| `input/actions/MouseButtonBinding.js` | Mouse button binding |
| `input/actions/WheelBinding.js` | Wheel binding (vertical, horizontal, up, down) |
| `input/actions/GestureBinding.js` | Gesture binding (queries GestureEngine) |
| `input/actions/GamepadButtonBinding.js` | Gamepad button stub (returns 0) |
| `input/actions/GamepadAxisBinding.js` | Gamepad axis stub (returns 0) |

**Signal processors:**

| File | Purpose |
|------|---------|
| `input/actions/processors/Processor.js` | Abstract processor + registry |
| `input/actions/processors/DeadZoneProcessor.js` | Inner/outer dead zone for analog signals |
| `input/actions/processors/ScaleProcessor.js` | Scale factor |
| `input/actions/processors/InvertProcessor.js` | 1 - value |
| `input/actions/processors/SmoothProcessor.js` | Moving average over N samples |

**Gesture recognition:**

| File | Recognizer |
|------|------------|
| `input/GestureEngine.js` | Gesture engine — manages recognizer lifecycle |
| `input/GestureEvent.js` | Gesture event data object |
| `input/GestureRecognizer.js` | Abstract recognizer |
| `input/GestureType.js` | Enum: TAP, DOUBLE_TAP, LONG_PRESS, DRAG, SWIPE, PINCH, ROTATE, PAN |
| `input/recognizers/TapRecognizer.js` | Single tap |
| `input/recognizers/DoubleTapRecognizer.js` | Double tap |
| `input/recognizers/LongPressRecognizer.js` | Long press |
| `input/recognizers/DragRecognizer.js` | Drag |
| `input/recognizers/SwipeRecognizer.js` | Swipe (velocity-based) |
| `input/recognizers/PinchRecognizer.js` | Pinch-to-zoom |
| `input/recognizers/RotateRecognizer.js` | Two-finger rotation |
| `input/recognizers/PanRecognizer.js` | Two-finger pan |

**Coordinate system:**

| File | Purpose |
|------|---------|
| `input/CoordinateSystem.js` | Four-space transform pipeline: Screen → Viewport → World / UI |
| `input/Space.js` | Enum: SCREEN(0), VIEWPORT(1), WORLD(2), UI(3) |

**Test utilities:**

| File | Purpose |
|------|---------|
| `input/TestBackend.js` | Programmatic event injection for tests |

### Modified files (v0.8.1)

| File | Changes |
|------|---------|
| `core/Game.js` | +InputSystem, BrowserBackend, ContextStack, CoordinateSystem, all standard devices. `_frame()` now runs `inputSystem.update()` per frame. Debug action map bound to Ctrl+F3. Focus handler to reset keyboard. |
| `core/Scene.js` | Creates `_actionMap`, pushes scene-specific `InputContext` on `enter()`, pops on `exit()`. Wires camera into CoordinateSystem. |
| `camera/Camera.js` | Added `project()`/`unproject()` methods used by CoordinateSystem. |
| `jygame.js` | `export * from "./input/index.js"` (new system). Old `InputContext` renamed to `OldInputContext`. `LoadingTask` path updated. `DefaultWorldBuilder` export added. |

---

## v0.8.2 — Debug System (Phase 1)

### New `debug/` directory (50+ files)

**Core diagnostics:**

| File | Purpose |
|------|---------|
| `debug/Diagnostics.js` | Per-frame metrics engine — timers, counters, gauges, events, triggers, captures, history, export/import |
| `debug/DiagnosticsConfig.js` | Configuration: enabled, history size, sampling, per-category groups |
| `debug/MetricRegistry.js` | Registry of metric descriptors |
| `debug/MetricDescriptor.js` | Metric definition: id, name, displayName, type, category, unit, budget |
| `debug/MetricType.js` | Enum: TIMER, COUNTER, GAUGE, EVENT |
| `debug/MetricUnit.js` | Enum: MILLISECONDS, BYTES, PERCENT, COUNT, FRAMES, NONE |
| `debug/MetricCategory.js` | Enum: FRAME, INPUT, UPDATE, RENDER, CANVAS, GPU, MEMORY, NETWORK, GAME, OVERLAY, WORKSPACE |
| `debug/CPUTimer.js` | Start/stop timer writing to Diagnostics |
| `debug/FrameStorage.js` | ArrayBuffer-backed storage for metric accumulators |
| `debug/FrameSnapshot.js` | Single frame's metric data |
| `debug/FrameHistory.js` | Ring buffer of FrameSnapshots |
| `debug/FrameEvent.js` | Named event with category and metadata |
| `debug/TriggerCondition.js` | Trigger rule: metric + operator + threshold |
| `debug/TriggerEngine.js` | Evaluates trigger conditions, fires callbacks |
| `debug/CaptureResult.js` | Bundles N frames around a trigger/capture |
| `debug/Analysis.js` | Statistics over frame history |
| `debug/resolveMetricIds.js` | Batch-resolve or auto-register metric names |

**World snapshots:**

| File | Purpose |
|------|---------|
| `debug/snapshots/SnapshotBuilder.js` | Walks ECS worlds, builds pooled WorldSnapshot |
| `debug/snapshots/WorldSnapshot.js` | Poolable snapshot of full ECS state |
| `debug/snapshots/EntitySnapshot.js` | Poolable snapshot of one entity |
| `debug/snapshots/ComponentSnapshot.js` | Poolable snapshot of one component |

**Overlay (in-game HUD):**

| File | Purpose |
|------|---------|
| `debug/overlay/OverlayHost.js` | In-game canvas HUD, toggle with backtick (`\``), 7 views, keyboard shortcuts |
| `debug/overlay/OverlayLayout.js` | Panel layout management |

**Workspace (debug window):**

| File | Purpose |
|------|---------|
| `debug/workspace/WorkspaceHost.js` | Separate browser window for debugging |
| `debug/workspace/WorkspaceState.js` | State management |
| `debug/workspace/WorkspaceSnapshotStore.js` | Ingest and index snapshots |
| `debug/workspace/backend/DebugBackend.js` | Abstract transport |
| `debug/workspace/backend/BrowserDebugBackend.js` | BroadcastChannel transport |
| `debug/workspace/backend/NullDebugBackend.js` | No-op backend |
| `debug/workspace/backend/TestDebugBackend.js` | Test backend |

**Wiring:**

| File | Purpose |
|------|---------|
| `debug/EnableDebugWorkspace.js` | Top-level: creates backend + builder, handles commands, builds+sends snapshots |
| `debug/index.js` | Barrel exports |

### Other changes (v0.8.2)

| File | Changes |
|------|---------|
| `core/LoadingTask.js` | **Moved** to `loaders/LoadingTask.js` |
| `loaders/LoadingTask.js` | New location (no content change) |
| `jygame.js` | `LoadingTask` import path updated. `debug/index.js` and `debug/overlay/index.js` wildcard exports added. |

---

## v0.8.3 — Debug System (Phase 2)

### Overlay views and renderers (added to debug/core/)

| File | Purpose |
|------|---------|
| `debug/core/View.js` | Base view class |
| `debug/core/ViewRegistry.js` | View registry |
| `debug/core/ViewContext.js` | Context passed to views |
| `debug/core/CommandSystem.js` | Key/mouse command dispatch |
| `debug/core/SelectionManager.js` | Selection tracking |
| `debug/core/TooltipManager.js` | Tooltip rendering |
| `debug/core/AnimationSystem.js` | UI animation (fade, slide) |
| `debug/core/OffscreenCache.js` | Offscreen canvas caching |
| `debug/core/PersistenceManager.js` | Save/load layout + settings to localStorage |
| `debug/core/Rect.js` | Geometry helper |
| `debug/core/renderers/FrameBarRenderer.js` | Per-frame bar chart |
| `debug/core/renderers/HistogramRenderer.js` | Histogram renderer |
| `debug/core/renderers/SparklineRenderer.js` | Sparkline renderer |
| `debug/core/renderers/TextRenderer.js` | Text layout renderer |
| `debug/core/renderers/TimelineRenderer.js` | Timeline renderer |
| `debug/core/search/MetricSearchIndex.js` | Metric name search index |
| `debug/core/structures/Timeline.js` | Timeline data structure |
| `debug/core/theme/DarkTheme.js` | Dark theme |
| `debug/core/theme/LightTheme.js` | Light theme |
| `debug/core/views/PerformanceView.js` | FPS, frame time, budget bars |
| `debug/core/views/FrameGraphView.js` | Metric lines over time + toggle pills |
| `debug/core/views/TimelineView.js` | Frame event timeline |
| `debug/core/views/MetricBrowserView.js` | Browse all metrics, search |
| `debug/core/views/EventViewerView.js` | Frame event log |
| `debug/core/views/CaptureBrowserView.js` | Browse captures |
| `debug/core/views/SettingsView.js` | Settings panel (live edit) |
| `debug/core/widgets/containers/SplitPane.js` | Resizable split panels |
| `debug/core/widgets/display/Badge.js` | Badge component |

### Game integration changes

| File | Changes |
|------|---------|
| `core/Game.js` | Full per-frame diagnostics timing (`_loop()` now wraps `diag.scope()` around input/update/render phases). `game.debug` getter lazily creates OverlayHost. Snapshot builder integrated. |
| `audio/AudioManager.js` | Minor refinements |
| `collision/SpatialHash.js` | Refactored (213-line diff) |

---

## v0.8.4 — Final touches

| File | Changes |
|------|---------|
| `core/Game.js` | Built-in debug toggle with Ctrl+F3 workspace shortcut (final wiring) |
| `package.json` | Version bump to 0.8.4 |

---

## Summary of new exports in jygame.js

### Added via `export * from "./input/index.js"` (39 new exports)

```
InputSystem, DeviceRegistry, Device, InputEvent, InputEventQueue, EventType, Tier,
InputBackend, BrowserBackend, TestBackend,
KeyCode, Modifier, Keyboard, KeyboardState,
PointerType, Pointer, PointerHistory, PointerStorage, PointerManager,
MouseButton, Mouse,
TouchSurface, Stylus,
ActionKind, ActionState, Binding, KeyBinding, MouseButtonBinding, WheelBinding,
ChordBinding, CompositeBinding, GestureBinding, GamepadButtonBinding, GamepadAxisBinding,
ActionEvaluator, Processor, DeadZoneProcessor, ScaleProcessor, InvertProcessor, SmoothProcessor,
ActionMap, InputContext (actions/), ContextStack,
Space, CoordinateSystem,
TextInput,
GestureType, GestureEvent, GestureRecognizer, GestureEngine,
TapRecognizer, DoubleTapRecognizer, LongPressRecognizer, DragRecognizer,
SwipeRecognizer, PinchRecognizer, RotateRecognizer, PanRecognizer
```

### Added via `export * from "./debug/index.js"` (20+ new exports)

```
Diagnostics, DiagnosticsConfig, MetricRegistry, MetricDescriptor, MetricType, MetricUnit,
MetricCategory, CPUTimer, FrameStorage, FrameSnapshot, FrameEvent, FrameHistory,
TriggerCondition, TriggerEngine, CaptureResult, Analysis, resolveMetricIds,
enableDebugWorkspace, takeDebugSnapshot,
DebugBackend, NullDebugBackend, BrowserDebugBackend, TestDebugBackend,
WorkspaceHost, WorkspaceState, WorkspaceSnapshotStore,
SnapshotBuilder, EntitySnapshot, ComponentSnapshot, WorldSnapshot
```

### Added via `export * from "./debug/overlay/index.js"` (2 new exports)

```
OverlayHost, OverlayLayout
```

### Individual new exports

```
DefaultWorldBuilder (from ecs/bootstrap/)
OldInputContext (renamed from old InputContext)
```

### Path change

```
LoadingTask: "./core/LoadingTask.js" → "./loaders/LoadingTask.js"
```
