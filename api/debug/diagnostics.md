# Diagnostics Engine

<Badge type="info">New in v0.8.2</Badge>

## Overview

The `Diagnostics` class is a per-frame metrics engine that records timers, counters, gauges, and events. It maintains a ring-buffer history, supports configurable triggers and captures, and can export/import full sessions as JSON.

## Metric Types

| Type | Value | Description | Record Method |
|------|-------|-------------|---------------|
| `TIMER` | 0 | Duration measurements (ms) | `recordTimer(id, elapsedMs)` / `scope(id, fn)` / `timer(id)` |
| `COUNTER` | 1 | Incremental counts | `recordCounter(id, incrementBy = 1)` |
| `GAUGE` | 2 | Instantaneous values | `recordGauge(id, value)` |
| `CONSTANT` | 3 | Fixed value that rarely changes | Set at registration time |

## Metric Categories

| Category | Value | Description |
|----------|-------|-------------|
| `FRAME` | 0 | Frame-level metrics (total, delta, FPS) |
| `ECS` | 1 | ECS world updates (systems, queries) |
| `RENDER` | 2 | Rendering pipeline |
| `AUDIO` | 3 | Audio processing |
| `PARTICLES` | 4 | Particle system |
| `PHYSICS` | 5 | Physics simulation |
| `STREAMING` | 6 | Asset streaming |
| `ASSETS` | 7 | Asset loading |
| `SCENE` | 8 | Scene management |
| `INPUT` | 9 | Input processing |
| `USER` | 100 | Custom game-specific metrics |
| `PLUGIN` | 101 | Plugin-contributed metrics |

## Usage

### Getting the Diagnostics instance

`Diagnostics` is stored as an ECS World resource:

```js
const diag = world.getResource(Diagnostics);
// or from Game:
const diag = game._getDiag(); // internal, use carefully
```

### Registering metrics

```js
import { resolveMetricIds } from "jygame";

const mids = resolveMetricIds(diag, {
  physicsStep:  { name: "game.physics.step",  type: MetricType.TIMER,   unit: MetricUnit.MILLISECONDS, category: MetricCategory.USER },
  enemyCount:   { name: "game.enemy.count",   type: MetricType.GAUGE,   unit: MetricUnit.COUNT,        category: MetricCategory.USER },
  hits:         { name: "game.player.hits",   type: MetricType.COUNTER, unit: MetricUnit.COUNT,        category: MetricCategory.USER },
});

// Timer — times the function automatically
diag.scope(mids.physicsStep, () => { /* physics */ });

// Or use a reusable timer:
const timer = diag.timer(mids.physicsStep);
timer.start();
// ... do work ...
timer.stop();

// Gauge
diag.recordGauge(mids.enemyCount, enemies.length);

// Counter
diag.recordCounter(mids.hits);
```

### Per-frame lifecycle

The game loop automatically wraps input, update, render phases with scoped timers:

```
frame.total    = entire frame duration
frame.input    = input processing
frame.update   = scene.world.update()
frame.render   = canvas clear + scene render
frame.canvas   = canvas operations
frame.delta    = dt value
frame.fps      = 1/dt
```

## FrameStorage

ArrayBuffer-backed storage for metric accumulators. Uses a single `ArrayBuffer` with 6 typed array views. Grows to the next power of 2 as metrics are registered.

| View | Type | Description |
|------|------|-------------|
| `timerTotals` | Float64Array | Accumulated timer values (ms) |
| `timerMins` | Float64Array | Per-frame minimum timer values |
| `timerMaxs` | Float64Array | Per-frame maximum timer values |
| `timerCounts` | Uint32Array | Number of timer samples |
| `counters` | Uint32Array | Counter increments this frame |
| `gauges` | Float64Array | Latest gauge values |

| Method | Description |
|--------|-------------|
| `ensureCapacity(minCapacity)` | Grow the buffer, preserving existing data |
| `cloneBuffer()` | Returns a copy of the underlying `ArrayBuffer` for snapshotting |
| `reset()` | Zeroes all accumulators |

## FrameSnapshot

A single frame's metric data, stored as typed arrays.

## FrameHistory

Ring buffer of `FrameSnapshot` objects. Configurable size via `DiagnosticsConfig.historySize`.

## Triggers & Captures

### TriggerCondition

| Property | Description |
|----------|-------------|
| `metricName` | Metric to watch |
| `operator` | `">"`, `"<"`, `">="`, `"<="`, `"=="` |
| `threshold` | Comparison value |
| `preFrames` | Frames before trigger to include in capture |
| `postFrames` | Frames after trigger to include |
| `cooldown` | Minimum frames between triggers |

### TriggerEngine

Evaluates all registered triggers against the latest frame data.

### CaptureResult

Bundles N frames around a trigger event or manual capture request.

## Analysis

Cached computed statistics over the frame history:

| Method | Description |
|--------|-------------|
| `latest(metricName)` | Most recent value for a metric |
| `average(metricName, window = 60)` | Average over the last N frames |
| `max(metricName, window = 60)` | Maximum over the last N frames |
| `min(metricName, window = 60)` | Minimum over the last N frames |
| `percent(numerator, denominator)` | Percentage calculation |
| `stddev(metricName, window = 60)` | Standard deviation over the last N frames |
| `register(name, { compute, format })` | Register a custom computed metric |
| `resolve(name)` | Returns a custom or latest value |

## Export/Import

```js
// Export full session as JSON string
const json = diag.exportSession();
// save to file, send to server, etc.

// Import — static factory
const restored = Diagnostics.importSession(json);

// Or export with options:
const partial = diag.toJSON({ snapshots: true, registry: true, meta: false, extensions: false });
```

See also: [Getting Started](/api/debug/getting-started), [In-Game Overlay](/api/debug/overlay), [Debug Workspace](/api/debug/workspace).
