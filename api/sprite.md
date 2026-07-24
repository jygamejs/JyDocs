# Sprite

`Sprite` is a convenience wrapper around an **ECS entity**. It manages a `World` and entity ID internally, providing familiar getter/setter access to component data.

## Constructor

```js
const sprite = new Sprite(x, y, width, height, world?)
```

Creates a sprite with top-left corner at `(x, y)` and the given size. If no `world` is provided, the static `Sprite._defaultWorld` is used.

The entity is created with: `Transform`, `Collider`, `Renderable`, `Visible`.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `sprite.world` | `World` | The underlying ECS World |
| `sprite.entity` | `number` | The underlying entity ID |
| `sprite.x` | `number` | Top-left X (getter/setter, converts from transform center) |
| `sprite.y` | `number` | Top-left Y (getter/setter, converts from transform center) |
| `sprite.width` | `number` | Collider width |
| `sprite.height` | `number` | Collider height |
| `sprite.transform` | `ComponentView` | Live `Transform` view: `{ x, y, rotation, scaleX, scaleY }` |
| `sprite.collider` | `ComponentView` | Live `Collider` view: `{ width, height }` |
| `sprite.velocity` | `ComponentView` | Live `Velocity` view: `{ x, y }` (added on first access if missing) |
| `sprite.renderable` | `ComponentView` | Live `Renderable` view: `{ image, fillColor, shape, layer }` |
| `sprite.visible` | `boolean` | Visibility flag (wraps `Visible.value`) |
| `sprite.angle` | `number` | Rotation in radians (wraps `transform.rotation`) |
| `sprite.scale` | `{ x, y }` | Scale factor (wraps `transform.scaleX/Y`) |
| `sprite.image` | `number` | Image index (wraps `renderable.image`) |
| `sprite.style` | `{ fill, shape }` | Convenient style access: `'#RRGGBB'` string, `'rect'`/`'circle'` |
| `sprite.animation` | `AnimationWrapper` | Animation controls: `add()`, `play()`, `pause()`, `stop()` |
| `sprite.groups` | `Group[]` | Groups this sprite belongs to |

## Methods

| Method | Description |
|--------|-------------|
| `sprite.kill()` | Removes from all groups |
| `sprite.destroy()` | Kills groups and destroys the underlying entity |

```js
sprite.destroy()  // fully removes from the world
```

## Style

```js
sprite.style.fill = '#B0DE8E'
sprite.style.shape = 'circle'   // 'rect' | 'circle'
```

## Animation

```js
sprite.animation.add('walk', { frames: [img1, img2], fps: 8, loop: true })
sprite.animation.play('walk')
sprite.animation.pause()
sprite.animation.stop()
```

## Internal Architecture

`Sprite` stores a private `#world` (World) and `#entity` (entity ID). All getters/setters delegate to ECS component access:

```js
get transform() {
  return this.#world.get(this.#entity, Transform)
}
set transform(v) {
  const t = this.#world.get(this.#entity, Transform)
  if (v.x != null) t.x = v.x
  if (v.y != null) t.y = v.y
}
```

The static `Sprite._defaultWorld` is used when no World is provided. The engine `Scene` sets `Sprite._defaultWorld` to the scene's World on scene activation and restores it on exit.

## Example

```js
import { Game, Scene, Sprite, ActionKind, CompositeBinding, KeyBinding, KeyCode } from 'jygame'

const player = new Sprite(100, 200, 32, 48)
player.style.fill = '#63B44E'

const scene = new Scene()
scene.onEnter = function () {
  // Sprite._defaultWorld is already set to this.world by engine Scene

  const move = new CompositeBinding(ActionKind.VECTOR2, [
    { binding: new KeyBinding(KeyCode.KEY_D),       vector: [ 1,  0] },
    { binding: new KeyBinding(KeyCode.KEY_A),       vector: [-1,  0] },
    { binding: new KeyBinding(KeyCode.KEY_W),       vector: [ 0, -1] },
    { binding: new KeyBinding(KeyCode.KEY_S),       vector: [ 0,  1] },
  ]);
  this._actionMap.bind("move", move, ActionKind.VECTOR2);
}

scene.update = function (dt) {
  const m = this._actionMap.getState("move").vector;
  player.velocity.x = m.x * 200;
  player.velocity.y = m.y * 200;
}

const game = new Game({ width: 800, height: 600 })
game.run(scene)
```
