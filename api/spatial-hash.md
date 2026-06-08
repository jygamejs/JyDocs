# SpatialHash

A spatial partitioning data structure for broad-phase collision detection. Divides the world into a grid of cells and only checks pairs of sprites that occupy the same or adjacent cells, significantly reducing collision checks in large groups.

## Constructor

```js
new SpatialHash(cellSize)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cellSize` | `number` | `64` | Width and height of each grid cell in pixels |

Larger cell sizes use more memory but require fewer cell lookups. Smaller cell sizes reduce false-positive pair checks. Default `64` works well for most games.

## Methods

### `rebuild(sprites)`

```js
spatialHash.rebuild(sprites)
```

Clears all cells and re-inserts the given array of sprites. Each sprite is assigned a unique `__shId` for duplicate prevention. Invisible sprites are skipped.

### `collideRect(rect, out?)`

```js
spatialHash.collideRect(rect)       // Sprite[]
spatialHash.collideRect(rect, out)  // Sprite[]
```

Returns sprites whose AABB overlaps the given rect-like object `{ left, right, top, bottom }`.

### `collidePoint(point, out?)`

```js
spatialHash.collidePoint({ x, y })      // Sprite[]
spatialHash.collidePoint({ x, y }, out) // Sprite[]
```

Returns sprites whose AABB contains the given point.

### `collideGroup(other, out?)`

```js
spatialHash.collideGroup(otherHash)      // [spriteA, spriteB][]
spatialHash.collideGroup(otherHash, out) // [spriteA, spriteB][]
```

Returns all colliding sprite pairs between two `SpatialHash` instances. Uses a `Set` to prevent duplicate pairs.

### `collideSprite(sprite, out?)`

```js
spatialHash.collideSprite(sprite)      // Sprite[]
spatialHash.collideSprite(sprite, out) // Sprite[]
```

Returns sprites colliding with the given sprite (excluding the sprite itself when it belongs to the hash).

## Usage with Group

`SpatialHash` integrates with `Group` directly — no manual management needed:

```js
const enemies = new Group()
enemies.useSpatialHash(64)  // enables spatial hashing

// On each update, the hash is automatically rebuilt
enemies.update(dt)

// Collision queries use the spatial hash automatically
const hits = enemies.collideRect(playerRect)
enemies.collideGroup(otherGroup).forEach(([a, b]) => { ... })
```

## Standalone Usage

```js
import { SpatialHash } from 'jygame'

const hash = new SpatialHash(64)
hash.rebuild(allSprites)

const nearby = hash.collideRect({ left: 0, right: 100, top: 0, bottom: 100 })
```
