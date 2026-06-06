# Group

The `Group` class manages collections of sprites with batch operations and collision queries.

## Constructor

```js
const group = new Group()
```

## Sprite Collection

| Method | Description |
|---|---|
| `add(sprite)` | Adds a sprite (no duplicates). Pushes `this` to `sprite.groups`. |
| `remove(sprite)` | Removes a sprite and its group reference. |
| `has(sprite)` | Returns `boolean`. |
| `clear()` | Removes all sprites and cleans up group references. |
| `length` (getter) | Returns the number of sprites. |

## Batch Operations

```js
group.update(dt)   // calls update(dt) on every sprite
group.render(ctx)  // calls render(ctx) on every sprite
```

## Collision Queries

All methods automatically skip invisible sprites.

| Method | Signature | Returns | Description |
|---|---|---|---|
| `collideRect(rect)` | `collideRect(rect)` | `Sprite[]` | Sprites whose rects overlap the given `Rect` |
| `collidePoint(point)` | `collidePoint({x, y})` | `Sprite[]` | Sprites whose rects contain the point |
| `collideGroup(other)` | `collideGroup(otherGroup)` | `[spriteA, spriteB][]` | All colliding pairs between two groups |
| `collideSprite(sprite)` | `collideSprite(sprite)` | `Sprite[]` | Sprites colliding with the given sprite |

```js
const hits = group.collideRect(player.rect)
hits.forEach(s => s.kill())

const pairs = bullets.collideGroup(enemies)
pairs.forEach(([bullet, enemy]) => {
  bullet.kill()
  enemy.health--
})
```

## Array Utilities

| Method | Description |
|---|---|
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

function update(dt) {
  enemies.update(dt)
  const hits = enemies.collideRect(player.rect)
  hits.forEach(s => s.kill())
}

function render(ctx) {
  enemies.render(ctx)
}
```
