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

A continuous fire effect using a cone-shaped emitter. Always specify a backend and storage capacity for performance:

```js
import { Game, Scene, ParticleSystem, ParticleEmitter, ConeShape } from "jygame";
import { GpuParticleBackend } from "jygame/particles/backends/GpuParticleBackend.js";
import { SoAParticleStorage } from "jygame/particles/storage/SoAParticleStorage.js";
import { CanvasParticleRenderer } from "jygame/particles/renderers/CanvasParticleRenderer.js";
import { FadeModifier, ScaleModifier, ColorModifier, VelocityModifier } from "jygame";

class FireScene extends Scene {
  onEnter() {
    this.ps = new ParticleSystem({
      backend: new GpuParticleBackend({
        storage: new SoAParticleStorage({ capacity: 1000 }),
        renderer: new CanvasParticleRenderer({
          renderParticle: (ctx, p) => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = `rgb(${p.r | 0},${p.g | 0},${p.b | 0})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          },
        }),
      }),
    });
    this.ps.addModifier(new VelocityModifier({ drag: 0.3 }));
    this.ps.addModifier(new ColorModifier({ from: "#ffcc00", to: "#ff2200" }));
    this.ps.addModifier(new ScaleModifier({ from: 8, to: 2 }));
    this.ps.addModifier(new FadeModifier({ mode: "out" }));

    this.emitter = new ParticleEmitter({
      system: this.ps,
      rate: 120,
      shape: new ConeShape({
        radius: 15, angle: Math.PI / 3,
        direction: -Math.PI / 2,
        speed: [120, 200],
      }),
      initializer: (p) => {
        p.maxLife = 1 + Math.random() * 1.5;
        p.life = p.maxLife;
        p.size = 4 + Math.random() * 6;
      },
    });
    this.emitter.setPosition(400, 500);
    this.emitter.start();
  }

  update(dt) {
    this.emitter.update(dt);
    this.ps.update(dt);
  }

  render(ctx) {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 800, 600);
    this.ps.render(ctx);
  }
}

const game = new Game({ parent: document.body, width: 800, height: 600 });
game.run(new FireScene());
```

### One-Shot Explosion

Use `rate: 0` and `burst()` for instant effects:

```js
import { ParticleSystem, ParticleEmitter, CircleShape } from "jygame";
import { CpuParticleBackend } from "jygame/particles/backends/CpuParticleBackend.js";
import { SoAParticleStorage } from "jygame/particles/storage/SoAParticleStorage.js";
import { CanvasParticleRenderer } from "jygame/particles/renderers/CanvasParticleRenderer.js";
import { VelocityModifier, WindModifier, ColorModifier, ScaleModifier, FadeModifier } from "jygame";

class ExplosionEffect {
  constructor() {
    this.ps = new ParticleSystem({
      backend: new CpuParticleBackend({
        storage: new SoAParticleStorage({ capacity: 500 }),
        renderer: new CanvasParticleRenderer({
          renderParticle: (ctx, p) => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = `rgb(${p.r | 0},${p.g | 0},${p.b | 0})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          },
        }),
      }),
    });
    this.ps.addModifier(new VelocityModifier({ drag: 0.6 }));
    this.ps.addModifier(new WindModifier({ y: 40 }));
    this.ps.addModifier(new ColorModifier({ from: "#fff5e0", to: "#ff4400" }));
    this.ps.addModifier(new ScaleModifier({ from: 6, to: 0 }));
    this.ps.addModifier(new FadeModifier({ mode: "out" }));

    this.emitter = new ParticleEmitter({
      system: this.ps,
      rate: 0,
      shape: new CircleShape({ radius: 8, direction: "outward", speed: [300, 600] }),
      initializer: (p) => {
        p.maxLife = 0.6 + Math.random() * 0.6;
        p.life = p.maxLife;
      },
    });
  }

  explode(x, y) {
    this.emitter.setPosition(x, y);
    this.emitter.burst(80);
  }

  update(dt) { this.ps.update(dt); }
  render(ctx) { this.ps.render(ctx); }
}
```

Usage inside a scene:

```js
import { Game, Scene, KeyCode, KeyBinding, ActionKind } from "jygame";

class MyScene extends Scene {
  onEnter() {
    this._actionMap.bind("shoot", new KeyBinding(KeyCode.SPACE), ActionKind.DIGITAL);
    this.explosion = new ExplosionEffect();
  }

  update(dt) {
    this.explosion.update(dt);
    if (this._actionMap.getState("shoot").justPressed) {
      this.explosion.explode(400, 300);
    }
  }

  render(ctx) {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, 800, 600);
    this.explosion.render(ctx);
  }
}

const game = new Game({ parent: document.body, width: 800, height: 600 });
game.run(new MyScene());
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

Play sound effects and music with the audio manager. Define each sound with `audio.define()`, load the file with `AudioLoader`, then play it. For looping music, use `define()` with `group: "music"` and `loop: true`, then get a `Music` reference with `audio.music()`:

```js
import { AudioManager, AudioLoader } from "jygame";

const audio = new AudioManager();
audio.define("jump", { source: "sounds/jump.wav" });
audio.define("bgm", { source: "sounds/bg.ogg", group: "music", loop: true });

await AudioLoader.load("sounds/jump.wav");
await AudioLoader.load("sounds/bg.ogg");

const music = audio.music("bgm");
music.volume = 0.5;
music.play();
music.fadeIn(2);

audio.play("jump"); // SFX

// Call audio.update(dt) each frame to advance music fade/transitions
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
