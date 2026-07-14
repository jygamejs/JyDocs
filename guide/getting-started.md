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

The particle system uses a **backend architecture** — a `ParticleSystem` manages simulation and rendering, `ParticleEmitter` controls emission with shape-based spawning, and **modifiers** control particle behaviour over their lifetime.

### Fire

A continuous fire effect using a cone-shaped emitter:

```js
import {
  ParticleSystem, ParticleEmitter, ConeShape,
  FadeModifier, ScaleModifier, ColorModifier, VelocityModifier,
} from "jygame";

const ps = new ParticleSystem();
ps.addModifier(new VelocityModifier({ drag: 0.3 }));
ps.addModifier(new ColorModifier({ from: "#ffcc00", to: "#ff2200" }));
ps.addModifier(new ScaleModifier({ from: 8, to: 2 }));
ps.addModifier(new FadeModifier({ mode: "out" }));

const emitter = new ParticleEmitter({
  system: ps,
  rate: 120,
  shape: new ConeShape({
    radius: 15, angle: Math.PI / 3,
    direction: -Math.PI / 2,
    speed: [120, 200],
  }),
  initializer: (p) => {
    p.maxLife = 1 + Math.random() * 1.5;
    p.size = 4 + Math.random() * 6;
  },
});
emitter.setPosition(400, 500);
emitter.start();

// Each frame:
emitter.update(dt);
ps.render(ctx);
```

### One-Shot Explosion

Use `rate: 0` and `burst()` for instant effects:

```js
const boom = new ParticleSystem();
boom.addModifier(new VelocityModifier({ drag: 0.6 }));
boom.addModifier(new ColorModifier({ from: "#fff5e0", to: "#ff4400" }));
boom.addModifier(new ScaleModifier({ from: 6, to: 0 }));
boom.addModifier(new FadeModifier({ mode: "out" }));

const boomEmitter = new ParticleEmitter({
  system: boom,
  rate: 0,
  shape: new CircleShape({ radius: 8, direction: "outward", speed: [300, 600] }),
  initializer: (p) => { p.maxLife = 0.6 + Math.random() * 0.6; },
});

boomEmitter.setPosition(400, 300);
boomEmitter.burst(100);
```

### Available Shapes

| Shape | Description |
|-------|-------------|
| `ConeShape` | Cone/spray (fire, water) |
| `CircleShape` | Circle with radial spawn (explosions) |
| `RectangleShape` | Rectangular area (rain) |
| `RingShape` | Ring (orbit, vortex) |
| `LineShape` | Line segment |
| `PolygonShape` | Custom polygon |
| `PathShape` | Curve path |

### Available Modifiers

| Modifier | Description |
|----------|-------------|
| `FadeModifier` | Fade alpha in/out |
| `ScaleModifier` | Animate size with easing |
| `VelocityModifier` | Apply drag |
| `ColorModifier` | Lerp between two colors |
| `TurbulenceModifier` | Perlin noise force |
| `WindModifier` | Constant directional force |
| `ForceModifier` | Gravity / custom acceleration |
| `AttractionModifier` | Attract to a point |
| `RotationModifier` | Spin particles |
| `AnimatedSpriteModifier` | Sprite-sheet frames |

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
