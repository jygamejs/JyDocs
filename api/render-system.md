# RenderSystem

The `RenderSystem` handles drawing entities to the Canvas 2D context. It applies transform (translate/rotate/scale), delegates drawing to the entity's `Renderable`, and supports optional viewport culling.

A singleton `renderSystem` instance is exported and used internally by `Sprite.render()` and `Group.render()`.

## Constructor

```js
new RenderSystem()
```

## Methods

### `render(ctx, entities, viewport?)`

```js
renderSystem.render(ctx, entities)
renderSystem.render(ctx, entities, viewport)
```

Iterates over an array of entities and calls `renderOne` on each.

### `renderOne(ctx, entity, viewport?)`

```js
renderSystem.renderOne(ctx, entity)
renderSystem.renderOne(ctx, entity, viewport)
```

Renders a single entity. Steps:
1. Skips if `entity.visible` is `false`
2. If a `viewport` is provided, performs culling — skips entities outside the viewport bounds
3. Saves the context, translates to `(transform.x, transform.y)`, rotates by `transform.rotation`, scales by `transform.scale`
4. Calls `entity.renderable.draw(ctx, collider.width, collider.height)`
5. Restores the context

## Viewport Culling

When a `viewport` rect `{ x, y, w, h }` is passed, entities entirely outside the viewport are skipped. For rotated or scaled entities, a bounding radius check is used for conservative culling.

```js
const viewport = { x: camera.x, y: camera.y, w: 800, h: 600 }
renderSystem.render(ctx, allEntities, viewport)
```

## Default Singleton

```js
import { renderSystem } from 'jygame'

// Used automatically by Sprite and Group
sprite.render(ctx)            // calls renderSystem.renderOne(ctx, sprite)
group.render(ctx, viewport)    // calls renderSystem.render(ctx, group._sprites, viewport)
```
