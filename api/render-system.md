# RenderSystem

The `RenderSystem` is an ECS system that collects all visible, renderable entities and pushes them into the `RenderQueue` each frame. It does **not** apply camera transforms or draw directly to the canvas — that is handled by the Scene's `View` pipeline.

## Query

```js
static query = { all: [Transform, Renderable, RenderBounds, Visible] }
static priority = 3
```

The system iterates entities matching `Transform + Renderable + RenderBounds + Visible` each tick and populates the RenderQueue with their draw data (position, image, fill color, shape, layer, etc.).

## Rendering Pipeline

The full render pipeline works as follows:

1. **RenderSystem.update()** — runs at priority 3. Clears the `RenderQueue` and repopulates it with all visible entities.
2. **Scene.render(ctx)** — iterates views in order. For each active view:
   - `view.prepare(ctx)` applies the camera transform (translate to center, scale by zoom, rotate)
   - `queue.execute(ctx, view.config.layers)` draws all queued entities matching the view's layer mask
   - `view.cleanup(ctx)` restores the canvas state

The Camera transform is owned by the View, not the RenderSystem:

```js
class MyScene extends Scene {
  onEnter() {
    this.view.camera.lookAt(400, 300);
    this.view.camera.zoom = 2;
  }
}
```

## Standalone Usage

When using the engine Scene, the render pipeline runs automatically. For custom rendering outside a Scene:

```js
import { World, DefaultWorldBuilder, RenderSystem, RenderQueue, AssetRegistry } from "jygame";

const world = DefaultWorldBuilder.createDefault();
world.setResource(RenderQueue, new RenderQueue());
world.addSystem(RenderSystem);

// Each frame:
world.update(dt);
const queue = world.getResource(RenderQueue);
queue.execute(ctx, 0xFF); // layer mask for all layers
```
