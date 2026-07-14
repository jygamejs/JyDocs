# World Snapshots

<Badge type="info">New in v0.8.2</Badge>

## Overview

The snapshot system serializes the full ECS world state each frame for inspection in the debug workspace. All snapshot objects are pooled to avoid GC pressure.

## SnapshotBuilder

Object-pooled builder that walks all archetypes and tables in registered ECS `World` instances and produces a `WorldSnapshot` containing every entity and its component field values.

```js
const builder = new SnapshotBuilder();
builder.registerWorld("main", world);

// Build a snapshot at a given frame
const snapshot = builder.build(frameNumber, performance.now(), diagnosticsSnapshot);
```

| Method | Description |
|--------|-------------|
| `registerWorld(id, world)` | Register an ECS world for snapshotting |
| `unregisterWorld(id)` | Remove a registered world |
| `setupMetricDescriptors(registry)` | Cache metric descriptor metadata |
| `build(frame, timestamp, diagSnapshot)` | Build full `WorldSnapshot` using pooled objects |
| `release(snapshot)` | Return pooled objects to their pools |
| `stats` | Get pool active/free counts |

## Snapshot Types

### WorldSnapshot

| Property | Description |
|----------|-------------|
| `frameNumber` | Frame when captured |
| `timestamp` | `performance.now()` at capture |
| `diagnostics` | Diagnostics snapshot data (metric values at capture time) |
| `metricDescriptors` | Cached metric descriptor metadata |
| `worlds` | Array of world snapshot data |

### EntitySnapshot

| Property | Description |
|----------|-------------|
| `entityId` | Entity ID |
| `archetypeId` | Archetype signature ID |
| `components` | Array of `ComponentSnapshot` |

### ComponentSnapshot

| Property | Description |
|----------|-------------|
| `componentId` | Component type ID |
| `componentName` | Component class name |
| `fields` | Object of field name → value |

## Integration

Snapshots are built automatically each frame when `debug: true` via `enableDebugWorkspace()`:

```js
import { enableDebugWorkspace } from "jygame/debug";

const game = new Game({ debug: true });
// enableDebugWorkspace is called internally; it attaches a SnapshotBuilder
// and BrowserDebugBackend to the game instance
```

Each frame, `takeDebugSnapshot(game)` is called, which builds a `WorldSnapshot` and sends it to the workspace via `DebugBackend.send()`.

## Pooling

All snapshot classes use `ActivePool` internally via `SnapshotBuilder`. Pooled objects are managed transparently — call `builder.build()` to acquire and `builder.release(snapshot)` to return pooled objects.

```js
const snapshot = builder.build(frame, ts, diagSnap);
// ... inspect snapshot ...
builder.release(snapshot); // returns all entities/components to their pools
```

See also: [Debug Workspace](/api/debug/workspace), [Diagnostics Engine](/api/debug/diagnostics), [Getting Started](/api/debug/getting-started).
