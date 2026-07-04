# Prefabs

Prefabs are **reusable entity templates**. Define once, instantiate many times with optional overrides.

## Creating a Prefab

```js
const bullet = world.createPrefab('bullet')
bullet
  .add(Transform, { scaleX: 0.5, scaleY: 0.5 })
  .add(Velocity, { x: 0, y: -500 })
  .add(Renderable, { shape: 1, fillColor: 0xFFFF00FF, layer: 2 })
  .add(Collider, { width: 8, height: 8 })
  .add(RenderBounds, { width: 8, height: 8 })
  .tag(ProjectileTag)
```

Prefab names must be unique — attempting to create a duplicate throws.

## Methods

| Method | Description |
|--------|-------------|
| `prefab.add(Component, values?)` | Add a component with optional initial values |
| `prefab.tag(TagComponent)` | Add an empty-schema tag component |

Both methods return `this` for chaining.

## Instantiating

```js
const entity = world.instantiate('bullet')
```

### With Overrides

Override component values at instantiation time:

```js
const entity = world.instantiate('bullet', {
  Transform: { x: playerX, y: playerY },
  Velocity: { x: aimX * 500, y: aimY * 500 },
})
```

Override values are shallow-merged with the prefab's defaults.

## Multiple Prefabs

```js
const enemy = world.createPrefab('grunt')
  .add(Transform)
  .add(Velocity)
  .add(Renderable, { shape: 2, fillColor: 0xFF0000FF })
  .add(Collider, { width: 32, height: 32 })
  .add(RenderBounds, { width: 32, height: 32 })
  .tag(EnemyTag)

const boss = world.createPrefab('boss')
  .add(Transform, { scaleX: 3, scaleY: 3 })
  .add(Renderable, { shape: 2, fillColor: 0xFFFF00FF })
  .add(Collider, { width: 96, height: 96 })
  .tag(EnemyTag)
```
