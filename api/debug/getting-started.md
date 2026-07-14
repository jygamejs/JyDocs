# Debug / Diagnostics — Getting Started

<Badge type="info">New in v0.8.2</Badge>

## Overview

JyGame ships with a built-in debugging and diagnostics suite that provides real-time performance metrics, ECS world snapshots, an in-game overlay HUD, and a separate workspace window for deep inspection.

## Enabling Debug

Debug features are enabled by default. Pass `debug: true` (or omit it) to the `Game` constructor:

```js
const game = new Game({
  parent: document.body,
  width: 800,
  height: 600,
  debug: true,  // enabled by default
});
```

To disable: `debug: false`.

## Quick Start

### In-Game Overlay

Press the **backtick** (`` ` ``) key to toggle the overlay HUD:

| Key | Action |
|-----|--------|
| `` ` `` | Toggle overlay |
| `1`–`6` | Toggle individual views |
| `Ctrl+I` | Manual frame capture |

Views available:
- **Performance** — FPS, frame time budget bars
- **Frame Graph** — Metric lines over time with category toggle pills
- **Timeline** — Per-frame event timeline
- **Metric Browser** — Browse all metrics with search
- **Event Viewer** — Frame event log
- **Capture Browser** — Browse saved captures
- **Settings** — Live configuration editing

Access the overlay programmatically:

```js
game.debug.show();
game.debug.hide();
game.debug.toggle();
```

### Debug Workspace

Press **Ctrl+F3** to open the debug workspace in a separate browser window. This window receives real-time ECS world snapshots and allows pausing, resuming, and stepping through frames.

### Custom Metrics

Register custom metrics in your game code:

```js
import { Diagnostics, MetricType, MetricUnit, MetricCategory, resolveMetricIds } from "jygame";

// In a system or scene:
const diag = world.getResource(Diagnostics);
const mids = resolveMetricIds(diag, {
  aiThink:  { name: "game.ai.think", type: MetricType.TIMER, unit: MetricUnit.MILLISECONDS, category: MetricCategory.USER },
  enemyCount: { name: "game.enemy.count", type: MetricType.GAUGE, unit: MetricUnit.COUNT, category: MetricCategory.USER },
  hits:     { name: "game.player.hits", type: MetricType.COUNTER, unit: MetricUnit.COUNT, category: MetricCategory.USER },
});

// Timer — automatically times the function
diag.scope(mids.aiThink, () => { /* expensive AI logic */ });

// Gauge
diag.recordGauge(mids.enemyCount, enemies.length);

// Counter
diag.recordCounter(mids.hits);
```

### Add Triggers

```js
diag.addTrigger({
  name: "Slow Render",
  metricName: "frame.render",
  operator: ">",
  threshold: 8.33,  // ms
  preFrames: 5,
  postFrames: 5,
  cooldown: 30,
});
```

When the render metric exceeds 8.33ms, a capture of ±5 frames is automatically saved.

See also: [Diagnostics Engine](/api/debug/diagnostics), [In-Game Overlay](/api/debug/overlay), [Debug Workspace](/api/debug/workspace), [World Snapshots](/api/debug/snapshots).
