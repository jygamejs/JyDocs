# ECS Systems

Systems contain the logic that processes entities matching a component query. They extend the `System` base class and define a static `query` and `priority`.

## System Base Class

```js
import { System } from 'jygame'

class MySystem extends System {
  static query = { all: [Transform, Velocity] }
  static priority = 0

  update(ctx, dt) {
    // Called every frame for all matching entities
  }
}
```

## Static Properties

| Property | Type | Description |
|----------|------|-------------|
| `query` | `{ all?, any?, none? }` | Component filter for entities this system processes |
| `priority` | `number` | Execution order (lower runs first, default `0`) |

### Query Definition

The `query` object supports three filters:

| Filter | Description |
|--------|-------------|
| `all` | Entity must have ALL of these components |
| `any` | Entity must have AT LEAST ONE of these components |
| `none` | Entity must have NONE of these components |

```js
static query = {
  all: [Transform, Renderable],
  any: [EnemyTag, PlayerTag],
  none: [StaticTag],
}
```

## Instance Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `system.enabled` | `boolean` | `true` | If `false`, `update()` is skipped during `world.update()` |
| `system.priority` | `number` | from class | Execution order (can be overridden per-instance) |

## Lifecycle Hooks

```js
class MySystem extends System {
  onAdded(world) {
    // Called when system is added to a world
  }

  onRemoved(world) {
    // Called when system is removed from a world
  }
}
```

## SystemContext API

The `ctx` parameter passed to `update(ctx, dt)` provides:

### Properties

| Property | Description |
|----------|-------------|
| `ctx.world` | The World instance |
| `ctx.deltaTime` | Delta time for this frame |
| `ctx.entityCount` | Number of entities matching the query |
| `ctx.resources` | Resource accessor (`ctx.resources.get(MyResource)`) |
| `ctx.events` | The World's Events manager |

### Iteration

```js
update(ctx, dt) {
  // Iterate over matching tables (archetypes)
  for (const table of ctx.tables()) {
    const xCol = table.getColumn(Transform, 'x')
    const yCol = table.getColumn(Transform, 'y')
    const vxCol = table.getColumn(Velocity, 'x')
    const vyCol = table.getColumn(Velocity, 'y')
    for (let r = 0; r < table.count; r++) {
      xCol[r] += vxCol[r] * dt
      yCol[r] += vyCol[r] * dt
    }
  }
}
```

### Direct Column Access (single archetype)

When your query matches exactly one archetype:

```js
update(ctx, dt) {
  const x = ctx.column(Transform, 'x')
  const y = ctx.column(Transform, 'y')
  const vx = ctx.column(Velocity, 'x')
  const vy = ctx.column(Velocity, 'y')
  for (let r = 0; r < ctx.entityCount; r++) {
    x[r] += vx[r] * dt
    y[r] += vy[r] * dt
  }
}
```

### Entity-level Access

```js
update(ctx, dt) {
  for (const entity of ctx.entities()) {
    const t = ctx.get(entity, Transform)
    t.x += t.x * dt
  }
}
```

### Helper Methods

```js
ctx.has(entity, ComponentClass) // boolean
ctx.get(entity, ComponentClass) // component view

ctx.forEach((table, row) => { ... })
```

## Built-in Systems

| System | Priority | Query | Description |
|--------|----------|-------|-------------|
| `MovementSystem` | 0 | `[Transform, Velocity]` | `pos += vel * dt` |
| `AnimationSystem` | 1 | `[Animation, Renderable]` | Frame advancement |
| `CollisionSystem` | 2 | `[Transform, Collider, Visible]` | Spatial hash rebuild |
| `RenderSystem` | 3 | `[Transform, Renderable, RenderBounds, Visible]` | Batched canvas draw |
| `TrailSystem` | 4 | `[Transform, Trail, Visible]` | Trail accumulation + render |
| `HierarchySystem` | -10 | `[Transform, WorldTransform]` | World-space transform computation |
