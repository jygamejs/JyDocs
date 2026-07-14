# Getting Started

## Installation

```bash
npm install jygame
```

Or import directly from a CDN:

```js
import { Game } from 'https://unpkg.com/jygame@latest/jygame.js'
```

## Your First Game

Jygame uses an **Entity-Component-System (ECS)** architecture. Entities are integer IDs, components are typed data containers, and systems process entities matching a component query. The [new InputSystem](/api/input/input-system) (v0.8.1+) provides device-oriented input with action maps and context stacks.

```js
import { Game, Scene } from 'jygame'
import { Transform, Velocity, Renderable, Visible, Collider, RenderBounds } from 'jygame'
import { KeyBinding, CompositeBinding, ActionKind, KeyCode } from 'jygame'

const scene = new Scene()

scene.enter = function () {
  const world = this.world // each Scene has its own World

  const player = world.createEntity()
  world.addMany(player, Transform, Velocity, Renderable, Visible, Collider, RenderBounds)
  world.set(player, Transform, { x: 400, y: 300, scaleX: 1, scaleY: 1 })
  world.set(player, Collider, { width: 32, height: 32 })
  world.set(player, RenderBounds, { width: 32, height: 32 })
  world.set(player, Renderable, { fillColor: 0x63B44EFF, shape: 0 })
  world.set(player, Visible, { value: 1 })

  // Bind WASD movement using the new InputSystem
  this._actionMap.bind("move", new CompositeBinding(ActionKind.VECTOR2, [
    { vector: [-1, 0], binding: new KeyBinding(KeyCode.KEY_A) },
    { vector: [1, 0],  binding: new KeyBinding(KeyCode.KEY_D) },
    { vector: [0, -1], binding: new KeyBinding(KeyCode.KEY_W) },
    { vector: [0, 1],  binding: new KeyBinding(KeyCode.KEY_S) },
  ]));

  this.player = player
}

scene.update = function (dt) {
  const move = this._actionMap.getState("move");
  const vel = this.world.get(this.player, Velocity);
  vel.x = move.vector.x * 200;
  vel.y = move.vector.y * 200;
}

const game = new Game({ width: 800, height: 600, debug: true })
game.run(scene)
```

Press the backtick (`` ` ``) key to open the in-game debug overlay — it shows FPS, frame timing, and lets you browse metrics.

No manual system calls — the `DefaultWorldBuilder` registers `MovementSystem` and `RenderSystem` automatically. Just call `world.update(dt)` inside the scene's update, which is handled by the engine `Scene`.

## Particles

```js
import { ParticleSystem, ParticleEmitter, FadeModifier, ScaleModifier } from 'jygame'
```

## Audio

```js
import { AudioManager, WebAudioBackend, LowPassEffect } from 'jygame'
```

## Project Structure

```
my-game/
├── index.html
├── package.json
└── src/
    ├── main.js         # Entry point
    ├── scenes/         # Scene files
    ├── entities/       # Entity factories / prefabs
    ├── systems/        # Custom ECS systems
    └── assets/         # Images, fonts
```
