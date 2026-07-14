# In-Game Overlay

<Badge type="info">New in v0.8.2</Badge>

## Overview

The `OverlayHost` renders a real-time diagnostic HUD directly on top of the game canvas. It is toggled with the backtick (`` ` ``) key.

## Access

```js
const overlay = game.debug; // returns OverlayHost, lazily created
overlay.show();
overlay.hide();
overlay.toggle();
```

## Views

| Key | View | Description |
|-----|------|-------------|
| `1` | Performance | FPS, frame time, budget bars |
| `2` | Frame Graph | Metric lines over time with category toggle pills |
| `3` | Timeline | Per-frame event timeline |
| `4` | Metric Browser | Browse all metrics with search |
| `5` | Event Viewer | Frame event log |
| `6` | Capture Browser | Browse saved captures |
| (always) | Settings | Live configuration editing |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `` ` `` | Toggle overlay |
| `1`–`6` | Toggle individual views |
| `Ctrl+I` | Manual frame capture |

## Architecture

The overlay is built on a small internal framework:

| Component | Description |
|-----------|-------------|
| `View` | Abstract base class for overlay views with `update()`, `render()`, `handleInput()` |
| `ViewRegistry` | View class registration by string ID |
| `ViewContext` | Per-view context bag with `history`, `registry`, `analysis`, `theme`, `config` |
| `OverlayLayout` | Recursive split/tab/leaf layout engine with drag-resize support |
| `CommandSystem` | Keyboard shortcut → command dispatch with event hooks |
| `SelectionManager` | Selection state tracking (metric, frame, capture, panel) |
| `TooltipManager` | Delayed tooltip display (300ms) |
| `AnimationSystem` | Property tweening for UI transitions |
| `OffscreenCache` | Canvas-based offscreen rendering cache |
| `PersistenceManager` | Layout and settings save/load via `localStorage` |

### Layout System

The `OverlayLayout` manages a recursive tree of panels:

- **Split nodes** — divide space horizontally or vertically with draggable dividers (ratio clamped 0.1–0.9)
- **Tab nodes** — stack multiple views with tab selection
- **Leaf nodes** — single view panel

Default layout is a 2×2 grid. Layout is persisted to `localStorage` and restored on startup.

### Views

Seven built-in views, all extending `View`:

| View | Tab Key | Description |
|------|---------|-------------|
| `PerformanceView` | `1` | FPS, frame time budget bars, subsystem breakdown |
| `FrameGraphView` | `2` | Metric line charts over time with category toggle |
| `TimelineView` | `3` | Tree view of timer metrics with frame stepping |
| `MetricBrowserView` | `4` | Searchable metric browser with type/category filters |
| `EventViewerView` | `5` | Frame event log with severity and category filters |
| `CaptureBrowserView` | `6` | Saved capture traces with preview graphs |
| `SettingsView` | (always) | Live config: fps target, refresh rate, font size, theme |

## Themes

Two built-in themes:

```js
import { DarkTheme, LightTheme } from "jygame/debug";
```

Themes define colors for all UI elements (background, text, grid lines, metric lines, category colors, etc.). Toggle via the Settings view.

See also: [Getting Started](/api/debug/getting-started), [Diagnostics Engine](/api/debug/diagnostics), [Debug Workspace](/api/debug/workspace).
