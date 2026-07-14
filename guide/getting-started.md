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

Jygame uses an **Entity-Component-System (ECS)** architecture. Entities are integer IDs, components are typed data containers, and systems process entities matching a component query. The [InputSystem](/api/input/input-system) provides device-oriented input with action maps and context stacks.

```js
import {
  Game, Scene,
  Sprite, Colors,
  ActionKind, CompositeBinding, KeyBinding, KeyCode,
} from "jygame";

class MyScene extends Scene {
  onEnter() {
    this.player = new Sprite(100, 100, 32, 32, this.world);
    this.player.style.fill = Colors.GreenShades.MagicalMalachite;

    const move = new CompositeBinding(ActionKind.VECTOR2, [
      { binding: new KeyBinding(KeyCode.KEY_D),        vector: [ 1,  0] },
      { binding: new KeyBinding(KeyCode.KEY_A),        vector: [-1,  0] },
      { binding: new KeyBinding(KeyCode.KEY_W),        vector: [ 0, -1] },
      { binding: new KeyBinding(KeyCode.KEY_S),        vector: [ 0,  1] },
      { binding: new KeyBinding(KeyCode.ARROW_RIGHT),  vector: [ 1,  0] },
      { binding: new KeyBinding(KeyCode.ARROW_LEFT),   vector: [-1,  0] },
      { binding: new KeyBinding(KeyCode.ARROW_UP),     vector: [ 0, -1] },
      { binding: new KeyBinding(KeyCode.ARROW_DOWN),   vector: [ 0,  1] },
    ]);
    this._actionMap.bind("move", move, ActionKind.VECTOR2);
  }

  update(dt) {
    const speed = 400;
    const m = this._actionMap.getState("move").vector;
    this.player.velocity.x = m.x * speed;
    this.player.velocity.y = m.y * speed;
  }

  render(ctx) {
    ctx.fillStyle = this.player.style.fill;
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
  }
}

const game = new Game({ width: 800, height: 600 });
game.run(new MyScene());
```

The engine `Scene` automatically pushes an `InputContext` on enter and pops it on exit, so your action bindings are active only while the scene is on top.

## Particles

Create emitters with modifiers for visual effects:

```js
import { ParticleEmitter, FadeModifier, ScaleModifier } from 'jygame'

const emitter = new ParticleEmitter({
  rate: 60,
  lifetime: { min: 0.5, max: 1.5 },
  speed: { min: 50, max: 150 },
  startColor: '#ffd400',
  endColor: '#ff0080',
  startSize: 8,
  endSize: 2,
});

emitter.position.set(400, 300);
emitter.addModifier(new FadeModifier());
emitter.addModifier(new ScaleModifier());

// In scene update:
emitter.update(dt);
```

## Audio

Play sound effects and music with the audio manager:

```js
import { AudioManager } from 'jygame'

const audio = new AudioManager();

// Load and play a sound
await audio.load('jump', 'sounds/jump.wav');
audio.play('jump');

// Background music with loop
await audio.load('music', 'sounds/bg.ogg');
audio.play('music', { loop: true, volume: 0.5 });
```

## Assets

Load images and fonts with progress tracking:

```js
import { ImageLoader, FontLoader } from 'jygame'

const task = ImageLoader.loadAll({
  player: 'assets/player.png',
  enemy: 'assets/enemy.png',
  bg: 'assets/background.png',
});

task.onProgress((loaded, total) => {
  console.log(`${loaded} / ${total}`);
});

const assets = await task;
// assets.player → HTMLImageElement
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
