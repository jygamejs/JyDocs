# JyGame Documentation Update Plan — v0.8.0 → v0.8.4

> Based on analysis of 246 changed files (+26k lines) across 4 minor versions.

---

## Scope overview

| Version | Theme | New files | Changed engine files |
|---------|-------|-----------|---------------------|
| v0.8.1 | New Input System | 39 `input/` files | `Game.js`, `Scene.js`, `Camera.js`, `jygame.js` |
| v0.8.2 | Debug System (core) | 25 `debug/` files | `Game.js`, `LoadingTask` moved, `jygame.js` |
| v0.8.3 | Debug System (views) | 25 `debug/core/` files | `Game.js`, `AudioManager.js`, `SpatialHash.js` |
| v0.8.4 | Final polish | 0 | `Game.js`, `package.json` |

---

## Phase 1: Version bump + sidebar updates

Update the shell (version number, nav, sidebar entries).

**Files to modify:**

| File | Changes |
|------|---------|
| `.vitepress/config.js` | `v0.8.0` → `v0.8.4` in nav dropdown. Add sidebar entries for new input/debug pages. |
| `index.md` | Update HeroText version if applicable |

**New sidebar groups to add:**

```
Input System (new top-level group in /api/)
  ├── InputSystem
  ├── InputBackend / BrowserBackend / TestBackend
  ├── Devices (Keyboard, Mouse, PointerManager, TouchSurface, Stylus, TextInput)
  ├── Actions (ActionMap, ActionState, Binding types, ContextStack, ActionEvaluator)
  ├── Gestures (GestureEngine, GestureType, recognizers)
  ├── CoordinateSystem (Screen/Viewport/World/UI spaces)
  └── Event system (InputEvent, InputEventQueue, EventType, Tier)

Debug / Diagnostics (new top-level group in /api/)
  ├── Diagnostics / DiagnosticsConfig
  ├── Metrics (MetricRegistry, MetricDescriptor, MetricType, MetricUnit, MetricCategory)
  ├── Frame System (FrameStorage, FrameSnapshot, FrameHistory, FrameEvent)
  ├── Triggers & Captures (TriggerEngine, TriggerCondition, CaptureResult)
  ├── Analysis
  ├── OverlayHost / OverlayLayout
  ├── WorkspaceHost / DebugBackend
  └── Snapshots (SnapshotBuilder, WorldSnapshot, EntitySnapshot, ComponentSnapshot)

Engine (existing, add new entries)
  ├── Game  ← update to cover debug option, inputSystem, coordinateSystem
  ├── Scene ← update to cover _actionMap, InputContext lifecycle
  ├── Camera ← add project()/unproject() methods
  └── LoadingTask ← update path from core/ to loaders/
```

---

## Phase 2: New top-level input system docs

Create 5–7 new pages covering the new input architecture.

### Page 2a: `api/input/input-system.md` — InputSystem overview

Cover:
- Architecture diagram (event-driven, layered)
- `InputSystem` class: owns DeviceRegistry, ContextStack, CoordinateSystem, InputEventQueue, Backend
- `inputSystem.update()` pipeline: snapshot → poll → consumers → devices → evaluate → clear
- Integration with `Game`: `game.inputSystem`

### Page 2b: `api/input/devices.md` — Input Devices

Cover each device:

| Device | Properties | Use case |
|--------|-----------|----------|
| `Keyboard` | `isDown(keyCode)`, `modifiers`, `reset()` | Key state queries |
| `Mouse` | `isDown(button)`, `position`, `wheel` | Mouse input |
| `PointerManager` | Pointer tracking, pressure, tilt, twist | Multi-touch, stylus |
| `TouchSurface` | `contacts`, `contactCount`, `primary` | Touch input |
| `Stylus` | `position`, `pressure`, `tilt`, `twist` | Pen input |
| `TextInput` | `compositionActive`, `consumeCharacters()` | Text entry |

**Reference:** `input/Keyboard.js`, `input/Mouse.js`, `input/PointerManager.js`, `input/TouchSurface.js`, `input/Stylus.js`, `input/TextInput.js`, `input/KeyCode.js`, `input/PointerType.js`

### Page 2c: `api/input/actions.md` — Action System

Cover:
- `ActionMap`: bind actions → `getState()`
- `ActionState`: `pressed`, `justPressed`, `justReleased`, `strength`, `vector`, `buffer()`, `consumeBuffered()`
- Binding types: `KeyBinding`, `ChordBinding`, `CompositeBinding`, `MouseButtonBinding`, `WheelBinding`, `GestureBinding`, `GamepadButtonBinding`, `GamepadAxisBinding`
- `ContextStack`: priority-sorted, `consumePolicy: "block"`
- `ActionEvaluator`: evaluates bindings, applies processors
- Processors: `DeadZoneProcessor`, `ScaleProcessor`, `InvertProcessor`, `SmoothProcessor`
- Serialization: `serialize()` / `deserialize()` for all bindings, ActionMap, InputContext

### Page 2d: `api/input/gestures.md` — Gesture Recognition

Cover:
- `GestureEngine`, `GestureRecognizer` base
- `GestureType`: TAP, DOUBLE_TAP, LONG_PRESS, DRAG, SWIPE, PINCH, ROTATE, PAN
- Recognizers: `TapRecognizer`, `DoubleTapRecognizer`, `LongPressRecognizer`, `DragRecognizer`, `SwipeRecognizer`, `PinchRecognizer`, `RotateRecognizer`, `PanRecognizer`
- `GestureEvent` data

### Page 2e: `api/input/coordinate-system.md` — Coordinate System

Cover:
- `Space`: SCREEN(0), VIEWPORT(1), WORLD(2), UI(3)
- `CoordinateSystem`: `toViewport()`, `toWorld()`, `toUI()`, `toScreen()`, `transform(point, from, to)`
- Camera dependency: wired in `Scene.enter()` via `coordSystem.camera = cam`

### Page 2f: `api/input/events.md` — Input Events & Backends

Cover:
- `InputEvent`: immutable envelope with `type`, `data`, `consumed`
- `EventType`: KEY_DOWN/UP, POINTER_DOWN/MOVE/UP/CANCEL, WHEEL, COMPOSITION_*, etc.
- `InputEventQueue`: three-tier ring buffer (HIGH/NORMAL/LOW)
- `Tier`: priority levels
- `InputBackend`: abstract base
- `BrowserBackend`: DOM listener → event producer
- `TestBackend`: programmatic event injection

### Update existing: `api/input.md`

Document the `InputSystem` approach. The old `Input` singleton is removed from sidebar.

---

## Phase 3: Debug system docs

Create 4–5 new pages covering the debug infrastructure.

### Page 3a: `api/debug/diagnostics.md` — Diagnostics Engine

Cover:
- `Diagnostics` class: per-frame metrics engine
- `DiagnosticsConfig`: enabled, history size, sampling
- `MetricRegistry`, `MetricDescriptor`, `MetricType`, `MetricUnit`, `MetricCategory`
- `CPUTimer`: measure block duration
- `resolveMetricIds()`: batch register metric names
- Custom metrics in game code: `diag.scope(id, fn)`, `diag.count(id)`, `diag.gauge(id, value)` (verify actual API)
- Triggers: `addTrigger({ metricName, operator, threshold, ... })`
- Captures: `CaptureResult` bundling frames around a trigger
- `Analysis`: statistics over history

### Page 3b: `api/debug/overlay.md` — In-Game Overlay

Cover:
- `OverlayHost`: toggle with backtick (`\``)
- 7 views: Performance, FrameGraph, Timeline, MetricBrowser, EventViewer, CaptureBrowser, Settings
- Keyboard shortcuts: `1`–`6` toggle views, `Ctrl+I` capture
- `game.debug` accessor
- `show()`, `hide()`, `toggle()` programmatic control

### Page 3c: `api/debug/workspace.md` — Debug Workspace

Cover:
- `WorkspaceHost`: separate browser window
- Open with `Ctrl+F3`
- Real-time ECS world snapshots via `BroadcastChannel`
- `DebugBackend` abstraction
- `BrowserDebugBackend`, `NullDebugBackend`, `TestDebugBackend`
- Commands: pause, resume, step-frame

### Page 3d: `api/debug/snapshots.md` — World Snapshots

Cover:
- `SnapshotBuilder`: walks ECS worlds
- `WorldSnapshot`, `EntitySnapshot`, `ComponentSnapshot` (pooled)
- Automatic per-frame snapshot (when `debug: true`)
- Sending to workspace backend

### Page 3e: `api/debug/getting-started.md` — Debug Quick Start

Cover:
- `new Game({ ..., debug: true })` (default)
- Access overlay: press backtick
- Open workspace: `Ctrl+F3`
- Register custom metrics
- Add triggers for automated captures

---

## Phase 4: Update existing engine pages

### Page 4a: `api/game.md` — Update Game

Add:
- `debug` option in constructor
- `game.inputSystem` (new input system)
- `game.inputSystem.coordinateSystem` (coordinate transforms)
- `game.inputSystem.contextStack` (input contexts)
- `game.debug` getter (returns OverlayHost)
- Per-frame diagnostics timing
- Focus handling (keyboard reset on window focus)
- Built-in debug action map (Ctrl+F3)

### Page 4b: `api/scene.md` — Update Scene

Add:
- `scene._actionMap` (scene-specific action bindings)
- `scene._inputContext` auto-pushed on `enter()`, popped on `exit()`
- `scene._inputPriority` (default 0)
- Camera wired into InputSystem CoordinateSystem on enter
- Example: binding actions in `onCreate()`, querying state in `update()`

### Page 4c: `api/camera.md` — Update Camera

Add:
- `camera.project(x, y)` → viewport coords
- `camera.unproject(x, y)` → world coords

### Page 4d: `api/loading-task.md` — Update path

Note: `LoadingTask` moved from `core/LoadingTask.js` to `loaders/LoadingTask.js`. Import path unchanged (`import { LoadingTask } from "jygame"` works via barrel export).

---

## Phase 5: Update guide pages

### Page 5a: `guide/getting-started.md`

Update the code example to show:
- `debug: true` option
- New action system instead of old `Input.isDown()`
- Scene with `_actionMap` bindings

### Page 5b: `guide/core-concepts.md`

Add sections:
- New input architecture (event-driven, devices, actions, contexts)
- Debug/diagnostics overview
- Coordinate spaces

---

## Phase 6: Verify existing pages

Check that existing ECS/component/system pages are still accurate (they should be — ECS core didn't change).

### Verify specifically:

| Page | Risk | Reason |
|------|------|--------|
| `api/input.md` (old) | HIGH | Removed — replaced by InputSystem docs |
| `api/ecs/world.md` | LOW | No ECS changes |
| `api/ecs/entity.md` | LOW | No changes |
| All component pages | LOW | No component changes |
| All system pages | LOW | No system changes |
| `api/collision-system.md` | MEDIUM | SpatialHash had 213-line diff — may have API changes |

---

## Phase 7: Build + verify

1. Run `npm run docs:build` to verify no broken links
2. Check all new sidebar entries resolve to existing files
3. Deploy to Vercel

---

## Summary of new pages needed

| # | Page | Priority |
|---|------|----------|
| 1 | `api/input/input-system.md` | HIGH |
| 2 | `api/input/devices.md` | HIGH |
| 3 | `api/input/actions.md` | HIGH |
| 4 | `api/input/gestures.md` | MEDIUM |
| 5 | `api/input/coordinate-system.md` | MEDIUM |
| 6 | `api/input/events.md` | MEDIUM |
| 7 | `api/debug/diagnostics.md` | HIGH |
| 8 | `api/debug/overlay.md` | HIGH |
| 9 | `api/debug/workspace.md` | MEDIUM |
| 10 | `api/debug/snapshots.md` | LOW |
| 11 | `api/debug/getting-started.md` | HIGH |
| 12 | `api/loading-task.md` (path update) | LOW |

Total: ~12 new pages, 4 updated pages, 2 updated guide pages.

## Estimated effort

| Phase | Pages | Est. time |
|-------|-------|-----------|
| Phase 1: Version bump + sidebar | 1 file | 10 min |
| Phase 2: Input system docs | 6 new + 1 updated | 2–3 hours |
| Phase 3: Debug system docs | 5 new | 2–3 hours |
| Phase 4: Update engine pages | 4 updated | 30 min |
| Phase 5: Update guide pages | 2 updated | 30 min |
| Phase 6: Verify existing pages | ~20 checked | 20 min |
| Phase 7: Build + deploy | 1 build | 5 min |
| **Total** | **12 new + 6 updated** | **~5–7 hours** |
