# Group

`Group` is an iterable container for sprites or entities. It supports two modes:

- **Sprite-backed** (mutable) — manually add/remove sprites
- **Query-backed** (read-only) — auto-populated by an ECS query

## Constructor

```js
const group = new Group(world?)
```

If no `world` is provided, `Sprite._defaultWorld` is used.

## Query-Backed (Static Factory)

```js
const enemies = Group.query(world, { all: [Transform, EnemyTag] })
```

Creates a read-only group backed by a `QueryView`. The group's contents reflect the current ECS state automatically — no manual `add()`/`remove()` needed.

Query-backed groups throw on `add()`, `remove()`, and `clear()`.

## Sprite Collection (`add`/`remove`)

| Method | Description |
|--------|-------------|
| `add(sprite)` | Adds a sprite (no duplicates). Pushes `this` to `sprite.groups` |
| `remove(sprite)` | Removes a sprite and its group reference |
| `has(sprite)` | Returns `boolean` |
| `clear()` | Removes all sprites and cleans up group references |
| `dispose()` | Calls `clear()` |
| `size` | Number of sprites/entities |
| `length` | Alias for `size` |
| `[Symbol.iterator]()` | Makes the group iterable |

```js
for (const sprite of group) {
  console.log(sprite.x, sprite.y)
}
```

## Accessors

| Method | Description |
|--------|-------------|
| `group.children` | Returns `Sprite[]` copy of all members |
| `group.first` | First sprite or `null` |
| `group.last` | Last sprite or `null` |

## Array Utilities

| Method | Description |
|--------|-------------|
| `forEach(fn)` | `fn(sprite, index)` |
| `map(fn)` | Returns transformed array |
| `filter(fn)` | Returns filtered `Sprite[]` |
| `find(fn)` | Returns first match or `undefined` |
| `some(fn)` | Returns `boolean` |
| `every(fn)` | Returns `boolean` |

## Spatial Hash

```js
group.useSpatialHash(64)
```

Enables spatial hashing for accelerated collision queries.

## Collision Queries

| Method | Description |
|--------|-------------|
| `collideRect(rect, out?)` | Sprites colliding with a `Rect` |
| `collidePoint(point, out?)` | Sprites containing a point |
| `collideCircle(cx, cy, radius, out?)` | Sprites colliding with a circle |
| `collideGroup(other, callback?)` | Pairs between two groups |
| `collideSprite(sprite, out?)` | Sprites colliding with a given sprite |
| `raycast(ox, oy, dx, dy, maxDist, out?)` | Ray intersection |

```js
const hits = group.collideRect(rect)
hits.forEach(s => s.destroy())

// Zero-alloc callback style
bullets.collideGroup(enemies, (bullet, enemy) => {
  bullet.destroy()
  enemy.health--
})

// Raycast
const rayHits = group.raycast(0, 0, 1, 0, 500)
```

## Internal Architecture

**Sprite-backed** groups store sprites in an internal array and track entity IDs in a `Set` for O(1) deduplication.

**Query-backed** groups store a `QueryView`. Iteration wraps each entity ID in a lightweight Sprite via `Sprite._wrap(world, entityId)`, which reuses cached wrappers per entity.

```js
// Query-backed iteration:
for (const entityId of queryView.entities()) {
  const sprite = Sprite._wrap(world, entityId) // cached
  yield sprite
}
```

## Example

```js
import { Scene, Group, Sprite } from 'jygame'
import { EnemyTag } from 'jygame'

const enemies = new Group()

for (let i = 0; i < 10; i++) {
  const enemy = new Sprite(i * 60, 50, 32, 32)
  enemy.style.fill = '#e8590c'
  enemies.add(enemy)
}

enemies.useSpatialHash(64)

const scene = new Scene()
scene.update = function (dt) {
  const hits = enemies.collideRect(playerRect)
  hits.forEach(s => s.destroy())
}
```
