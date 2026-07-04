# Streaming

The streaming system manages **logical groupings of entities** that can be loaded and unloaded as a unit. Useful for zone-based level streaming.

## Setup

Streaming requires a `StreamingManager` registered as a resource on the World:

```js
import { StreamingManager } from 'jygame'

const manager = new StreamingManager(world)
world.setResource(StreamingManager, manager)
```

## Streaming Cells

A `StreamingCell` is a named group of entities.

### Creating Cells

```js
world.createStreamingCell('zone1')
```

Or directly via the manager:

```js
const cell = manager.createCell('zone1')
```

### Adding Entities

```js
const cell = manager.getCell('zone1')
cell.addEntity(entity)
```

Entities can only belong to one cell at a time. Adding an entity already in another cell throws.

### Cell Properties

| Property | Description |
|----------|-------------|
| `cell.name` | Cell name |
| `cell.loaded` | Whether the cell is currently loaded |
| `cell.entityCount` | Number of entities in the cell |
| `cell.entities` | `Set<entityId>` of entities |

## Loading and Unloading

```js
world.loadCell('zone1')   // Set cell as loaded
world.unloadCell('zone1') // Destroy all cell entities, set as unloaded
```

`unloadCell()` destroys all entities in the cell. The cell remains registered but empty.

### Bulk Operations

```js
manager.loadAll()   // Load all cells
manager.unloadAll() // Unload all cells

manager.loadedCells() // Get array of loaded cells
```

### Destroying Cells

```js
manager.destroyCell('zone1') // Unloads and removes the cell
```

## Entity Cleanup

When an entity in a cell is destroyed (via `world.destroyEntity()` or cell unload), it is automatically removed from the cell's tracking. Uses `world.onEntityDestroyed()` internally.
