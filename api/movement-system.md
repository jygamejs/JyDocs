# MovementSystem

The `MovementSystem` applies velocity to entity transforms. It operates on any entity with `velocity` and `transform` properties — not just `Sprite`.

A singleton `movementSystem` instance is exported and used internally by `Sprite.update()` and `Group.update()`.

## Constructor

```js
new MovementSystem()
```

## Methods

### `update(entities, dt)`

```js
movementSystem.update(entities, dt)
```

Iterates over an array of entities and calls `updateOne` on each.

### `updateOne(entity, dt)`

```js
movementSystem.updateOne(entity, dt)
```

Applies `entity.velocity * dt` to `entity.transform.x` and `entity.transform.y`. No-op if the entity has no `velocity` property.

## Standalone Usage

```js
import { MovementSystem } from 'jygame'

const system = new MovementSystem()
const entity = {
  transform: { x: 0, y: 0 },
  velocity: { x: 100, y: 0 },
}

system.updateOne(entity, 1 / 60)
// entity.transform.x === 1.66, entity.transform.y === 0
```

## Default Singleton

```js
import { movementSystem } from 'jygame'

// Used automatically by Sprite and Group
sprite.update(dt)       // calls movementSystem.updateOne(sprite, dt)
group.update(dt)         // calls movementSystem.update(group._sprites, dt)
```
