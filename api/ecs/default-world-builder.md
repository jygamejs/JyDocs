# DefaultWorldBuilder

`DefaultWorldBuilder` creates a pre-configured `World` ready for immediate use with all built-in components and systems registered.

## Usage

```js
import { DefaultWorldBuilder } from 'jygame'

const world = DefaultWorldBuilder.createDefault()
```

## What It Registers

### Components (12)

| Component | Schema |
|-----------|--------|
| `Transform` | `{ x, y, rotation, scaleX, scaleY }` |
| `Velocity` | `{ x, y }` |
| `Collider` | `{ width, height }` |
| `Renderable` | `{ image, fillColor, shape, layer }` |
| `RenderBounds` | `{ width, height }` |
| `Animation` | `{ clipId, frameIndex, elapsed, isPlaying, speed }` |
| `Visible` | `{ value }` |
| `Trail` | `{ enabled, maxPoints, spacing, width, color, mode }` |
| `EnemyTag` | *(empty)* |
| `PlayerTag` | *(empty)* |
| `ProjectileTag` | *(empty)* |
| `StaticTag` | *(empty)* |

### Resources

| Resource | Description |
|----------|-------------|
| `SpatialHash` | Grid-based spatial partitioning for collision queries |
| `TrailManager` | Per-entity trail buffer registry |
| `RenderQueue` | Batched render command buffer |
| `AnimationClipRegistry` | Named animation clip registry |

### Systems (5)

| System | Priority | Query | Description |
|--------|----------|-------|-------------|
| `MovementSystem` | 0 | `[Transform, Velocity]` | Position += Velocity × dt |
| `AnimationSystem` | 1 | `[Animation, Renderable]` | Frame advancement |
| `CollisionSystem` | 2 | `[Transform, Collider, Visible]` | Rebuild spatial hash |
| `RenderSystem` | 3 | `[Transform, Renderable, RenderBounds, Visible]` | Batched canvas rendering |
| `TrailSystem` | 4 | `[Transform, Trail, Visible]` | Trail accumulation + render |

## Custom Worlds

If you need different components or systems, create a `World` manually:

```js
import { World } from 'jygame'

const world = new World()
world.register(Transform)
world.register(Velocity)
world.register(MyCustomComponent)
world.addSystem(new MovementSystem())
world.addSystem(new MyCustomSystem())
```

## In engine.Scene

The engine `Scene` (from `core/Scene.js`) uses `DefaultWorldBuilder.createDefault()` internally. Each scene gets its own `World` with the default setup.
