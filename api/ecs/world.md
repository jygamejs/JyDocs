# World

The `World` is the central orchestrator of the ECS. It owns the component registry, entity manager, archetype tables, query engine, system scheduler, events, resources, prefabs, hierarchy, and streaming.

```js
import { World } from 'jygame'

const world = new World({ initialTableCapacity: 128 })
```

## Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialCapacity` | `number` | `64` | Initial entity slot capacity |
| `maxEntities` | `number` | `1_000_000` | Maximum alive entities |
| `initialTableCapacity` | `number` | `64` | Initial rows per archetype table |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `world.registry` | `ComponentRegistry` | Registered component types |
| `world.entityManager` | `EntityManager` | Entity ID allocation |
| `world.archetypeSystem` | `ArchetypeSystem` | Archetype ↔ table mapping |
| `world.queryEngine` | `QueryEngine` | Archetype-matching queries |
| `world.scheduler` | `SystemScheduler` | System ordering and execution |
| `world.events` | `Events` | Typed event channels |
| `world.hierarchy` | `HierarchyGraph\|null` | Parent-child hierarchy (if initialized) |

## Component Registration

Register component classes before creating entities. Registration is automatically locked after the first entity creation.

```js
world.register(Transform)
world.register(Velocity, { reservedId: 5 }) // Optional reserved ID 1-63
```

## Entity Lifecycle

Entities are **packed 32-bit integers**: `(generation << 24) | slot`

```js
const entity = world.createEntity()
world.isAlive(entity) // true
world.destroyEntity(entity)
world.isAlive(entity) // false
```

### Component Management

```js
world.addComponent(entity, Transform)
world.removeComponent(entity, Transform)
world.hasComponent(entity, Transform) // boolean
world.getComponent(entity, Transform) // { x, y, rotation, scaleX, scaleY } (live view)
world.setComponent(entity, Transform, { x: 100, y: 200 })
```

For convenience, shorter aliases exist:

```js
world.add(entity, Transform)
world.remove(entity, Transform)
world.has(entity, Transform)
world.get(entity, Transform)
world.set(entity, Transform, { x: 100 })
```

### Batch Operations

```js
world.addMany(entity, Transform, Velocity, Renderable)
world.removeMany(entity, Velocity, Renderable)

world.clear(entity)      // Remove all components
world.clone(entity)      // Deep copy entity + all components
```

### Builder Pattern

Fluent API for creating entities with initial components:

```js
const entity = world.entity()
  .with(Transform, { x: 100, y: 200 })
  .with(Velocity, { x: 0, y: 0 })
  .with(Renderable, { shape: 1, fillColor: 0xFF0000FF })
  .create()
```

## Systems

```js
world.addSystem(new MovementSystem())
world.addSystem(new RenderSystem())
world.removeSystem(system)
world.clearSystems()

world.update(dt) // Runs all systems in priority order, then clears events
```

## Resources

Share singleton objects across systems:

```js
world.setResource(MyResource, new MyResource())
world.getResource(MyResource)
world.hasResource(MyResource)
world.removeResource(MyResource)
world.clearResources()
```

## Queries

```js
const view = world.query({ all: [Transform, Velocity], none: [StaticTag] })
for (const entity of view.entities()) { ... }
```

## Hierarchy

```js
world.initHierarchy()
world.attach(childEntity, parentEntity)
world.detach(childEntity)
world.parentOf(entity)    // entity or null
world.childrenOf(entity)  // array or null
world.isDescendant(descendant, ancestor)
world.rootOf(entity)
```

## Events

```js
world.registerEvent(CollisionEvent)
world.events.emit(CollisionEvent, { a: e1, b: e2 })
for (const evt of world.events.read(CollisionEvent)) { ... }
```

## Prefabs

```js
const prefab = world.createPrefab('bullet')
prefab.add(Transform, { scaleX: 0.5, scaleY: 0.5 })
prefab.tag(ProjectileTag)

const entity = world.instantiate('bullet')
const entity2 = world.instantiate('bullet', { Transform: { x: 50, y: 50 } })
```

## Serialization

```js
const json = world.serialize()
const idMap = world.deserialize(json)
```

## Streaming

```js
world.createStreamingCell('zone1')
world.loadCell('zone1')
world.unloadCell('zone1')
```
