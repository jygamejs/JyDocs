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

Jygame uses an **Entity-Component-System (ECS)** architecture. Entities are integer IDs, components are typed data containers, and systems process entities matching a component query.

```js
import { Game, Scene, Input, DefaultWorldBuilder } from 'jygame'
import { Transform, Velocity, Renderable, Visible, Collider, RenderBounds } from 'jygame'
import { MovementSystem, RenderSystem } from 'jygame'

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

  this.player = player
}

scene.update = function (dt) {
  const world = this.world
  const vel = world.get(this.player, Velocity)

  if (Input.isDown('RIGHT')) vel.x = 200
  else if (Input.isDown('LEFT')) vel.x = -200
  else vel.x = 0

  if (Input.isDown('UP')) vel.y = -200
  else if (Input.isDown('DOWN')) vel.y = 200
  else vel.y = 0
}

const game = new Game({ width: 800, height: 600 })
game.run(scene)
```

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
