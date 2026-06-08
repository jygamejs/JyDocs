# Group

The `Group` class manages collections of sprites with batch operations, collision queries, and optional spatial hashing for fast broad-phase collision.

## Constructor

```js
const group = new Group()
```

## Sprite Collection

| Method | Description |
|--------|-------------|
| `add(sprite)` | Adds a sprite (no duplicates). Pushes `this` to `sprite.groups`. |
| `remove(sprite)` | Removes a sprite and its group reference. |
| `has(sprite)` | Returns `boolean`. |
| `clear()` | Removes all sprites and cleans up group references. |
| `length` (getter) | Returns the number of sprites. |

## Batch Operations

```js
group.update(dt)            // delegates to movementSystem.update() — applies velocity to all sprites
group.render(ctx)           // delegates to renderSystem.render() — draws all visible sprites
group.render(ctx, viewport) // same, with viewport culling
```

## Spatial Hash

Enable spatial hashing for accelerated collision detection on large groups:

```js
group.useSpatialHash(cellSize)  // returns this for chaining
```

| Method | Description |
|--------|-------------|
| `useSpatialHash(cellSize = 64)` | Enables spatial partitioning with the given cell size |
| `rebuildSpatialHash()` | Manually rebuilds the spatial hash (automatically rebuilt on `update()`) |

When spatial hashing is active, `update()` automatically rebuilds the hash after applying movement. Collision queries use the hash to only check sprites in nearby cells.

## Collision Queries

All methods automatically skip invisible sprites. Every method accepts an optional `out` array parameter for pool-friendly reuse.

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `collideRect(rect, out?)` | `collideRect(rect)` | `Sprite[]` | Sprites whose AABB overlaps the given `Rect` |
| `collidePoint(point, out?)` | `collidePoint({x, y})` | `Sprite[]` | Sprites whose AABB contains the point |
| `collideGroup(other, out?)` | `collideGroup(otherGroup)` | `[spriteA, spriteB][]` | All colliding pairs between two groups |
| `collideSprite(sprite, out?)` | `collideSprite(sprite)` | `Sprite[]` | Sprites colliding with the given sprite |

```js
const hits = group.collideRect(rect)
hits.forEach(s => s.kill())

const pairs = bullets.collideGroup(enemies)
pairs.forEach(([bullet, enemy]) => {
  bullet.kill()
  enemy.health--
})

// Pool-friendly reuse
const out = []
group.collideRect(rect, out)
// use out, then clear it
out.length = 0
```

## Array Utilities

| Method | Description |
|--------|-------------|
| `forEach(fn)` | `_sprites.forEach(fn)` |
| `filter(fn)` | `_sprites.filter(fn)` |
| `map(fn)` | `_sprites.map(fn)` |

```js
group.forEach(s => s.health -= 1)
const alive = group.filter(s => s.health > 0)
const positions = group.map(s => ({ x: s.x, y: s.y }))
```

## Example

```js
const enemies = new Group()

for (let i = 0; i < 10; i++) {
  const enemy = new Sprite(i * 60, 50, 32, 32)
  enemy.style.fill = '#e8590c'
  enemies.add(enemy)
}

// Enable spatial hashing for large groups
enemies.useSpatialHash(64)

function update(dt) {
  enemies.update(dt)
  const hits = enemies.collideRect(playerRect)
  hits.forEach(s => s.kill())
}

function render(ctx) {
  enemies.render(ctx)
}
```
