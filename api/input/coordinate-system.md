# Coordinate System

<Badge type="info">New in v0.8.1</Badge>

## Overview

The `CoordinateSystem` transforms coordinates across four spaces, enabling consistent conversion between screen pixels and world/game coordinates.

## Coordinate Spaces

| Space | Value | Description |
|-------|-------|-------------|
| `Space.SCREEN` | 0 | Raw DOM client coordinates (e.g., `event.clientX/Y`) |
| `Space.VIEWPORT` | 1 | Logical canvas pixels (screen minus canvas offset, divided by `devicePixelRatio`) |
| `Space.WORLD` | 2 | World/game coordinates (viewport projected through the active camera) |
| `Space.UI` | 3 | Screen-space overlay coordinates (same as viewport, no camera transform) |

## Constructor

```js
new CoordinateSystem({
  camera = null,
  canvasRect = { x: 0, y: 0, width: 800, height: 600 },
  devicePixelRatio = 1,
})
```

| Option | Default | Description |
|--------|---------|-------------|
| `camera` | `null` | Camera object with `project`/`unproject` or `worldToScreen`/`screenToWorld` |
| `canvasRect` | `{ x: 0, y: 0, width: 800, height: 600 }` | Canvas bounding rect in screen coordinates |
| `devicePixelRatio` | `1` | Window device pixel ratio (`window.devicePixelRatio`) |

The `CoordinateSystem` is created by `Game` and accessible via `game.inputSystem.coordinateSystem`.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `camera` | `object\|null` | Camera used for world ↔ viewport transforms (get/set) |
| `canvasRect` | `{ x, y, width, height }` | Canvas rect (get/set, returns a copy) |
| `devicePixelRatio` | `number` | Device pixel ratio (get/set) |

## Methods

| Method | Description |
|--------|-------------|
| `toViewport(screenPoint)` | Screen → Viewport: subtract canvas offset, divide by DPR |
| `toWorld(viewportPoint)` | Viewport → World: calls `camera.unproject()` |
| `toUI(viewportPoint)` | Viewport → UI: identity (UI uses viewport coords) |
| `toScreen(worldPoint)` | World → Screen: camera project + DPR scale + canvas offset |
| `transform(point, fromSpace, toSpace)` | Generic transform between any two spaces |

## Camera Integration

The `CoordinateSystem` uses the active scene's camera for world/viewport transforms. This is wired automatically in `Scene.enter()`:

```js
// Inside core/Scene.js enter():
coordSystem.camera = cam;
```

## Example

```js
// Convert a pointer event to world coordinates
const screenPt = { x: event.clientX, y: event.clientY };
const viewportPt = coordSystem.toViewport(screenPt);
const worldPt = coordSystem.toWorld(viewportPt);
// worldPt.x, worldPt.y are now in game world coordinates
```

See also: [InputSystem Overview](/api/input/input-system), [Input Devices](/api/input/devices), [Action System](/api/input/actions).
