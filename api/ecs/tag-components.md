# Tag Components

Tag components are **empty-schema components** that serve as markers. They have no data fields — their presence on an entity is the information.

Tags are used in **queries** to filter entities by role or type:

```js
class EnemyTag {}
class PlayerTag {}
class ProjectileTag {}
class StaticTag {}
```

## Usage

```js
world.add(entity, EnemyTag)
world.has(entity, EnemyTag) // true
```

## Querying with Tags

```js
// Find all enemies
const enemies = world.query({ all: [Transform, EnemyTag] })

// Find all non-static entities with collision
const dynamicColliders = world.query({
  all: [Transform, Collider],
  none: [StaticTag],
})

// Find either players or enemies
const characters = world.query({
  any: [PlayerTag, EnemyTag],
  all: [Transform, Renderable],
})
```

## Custom Tags

Create your own by defining a class with no schema:

```js
class BossTag {}
class PowerUpTag {}
class DestructibleTag {}

world.register(BossTag)
```

Tags have zero storage overhead — they don't create typed array columns in the archetype tables.
