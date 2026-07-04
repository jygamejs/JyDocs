# Entity Lifecycle

Entities in JyGame are **packed 32-bit integers**, not objects. This design enables efficient typed-array storage and zero garbage collection pressure.

**Format:** `(generation << 24) | slot`

Entity ID `0` is reserved as a null sentinel.

## Creating Entities

```js
const entity = world.createEntity()
```

A newly created entity has no components. You add components to define its behavior.

## Checking if Alive

```js
world.isAlive(entity) // boolean
```

An entity becomes dead after `world.destroyEntity()` is called. Destroyed entity IDs may be recycled with an incremented generation — stale references are safely detected.

## Destroying Entities

```js
world.destroyEntity(entity)
```

Destruction triggers:
1. Hierarchy cleanup (children are detached)
2. Entity destroyed callbacks
3. Swap-remove from its archetype table
4. Slot recycling (generation incremented)

## Adding Components

```js
world.addComponent(entity, Transform)
world.add(entity, Transform) // shorter alias
```

Adding a component the entity already has is a no-op.

## Removing Components

```js
world.removeComponent(entity, Velocity)
world.remove(entity, Velocity)
```

Removing a component the entity does not have is a no-op.

## Checking for Components

```js
world.hasComponent(entity, Renderable) // boolean
world.has(entity, Renderable)
```

## Reading Component Data

```js
const transform = world.getComponent(entity, Transform)
// transform is a live view with getters/setters:
transform.x = 100
console.log(transform.y)
```

The returned view is **live** — reading `.x` accesses the typed array directly, and writing triggers hierarchy dirty tracking if the component is `Transform`.

## Writing Component Data

```js
world.setComponent(entity, Transform, { x: 100, y: 200, rotation: Math.PI })
world.set(entity, Transform, { scaleX: 2 })
```

Only the fields provided are updated; omitted fields keep their current values.

## Batch Operations

```js
// Add multiple components at once (single archetype migration)
world.addMany(entity, Transform, Velocity, Renderable, Collider)

// Remove multiple components
world.removeMany(entity, Velocity, Collider)

// Remove ALL components (entity becomes empty)
world.clear(entity)

// Deep-copy entity and all its component data
const clone = world.clone(entity)
```

## Builder Pattern

For ergonomic entity creation with initial values:

```js
const entity = world
  .entity()
  .with(Transform, { x: 100, y: 200 })
  .with(Renderable, { shape: 1, fillColor: 0xFF0000FF })
  .with(Velocity)
  .create()
```

## Entity ID Internals

The `EntityManager` stores entities in parallel typed arrays:

| Array | Type | Description |
|-------|------|-------------|
| `archetype` | `Uint32Array` | Archetype ID for each slot |
| `row` | `Uint32Array` | Row index within the archetype table |
| `gen` | `Uint8Array` | Generation counter (0-255) |

Supports up to **16M entities** and **256 generations** per slot.
