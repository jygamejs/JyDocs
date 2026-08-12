---
title: Scene
---

# Scene

A `Scene` is a self-contained unit of your game — a menu, a level, a pause overlay, a cutscene. You subclass `Scene`, override the lifecycle hooks the engine calls, and hand instances to the `Game` to run. Scenes own a world of entities, a camera view, an input binding context, and an optional UI root, and the engine mounts, updates, renders, and unmounts them through the scene stack.

```js
import { Game, Scene } from "jygame";

class MenuScene extends Scene {
  onEnter() {
    // set up the menu world
  }

  update(dt) {
    // animate the menu
  }
}

const game = new Game({ width: 1280, height: 720 });
game.run(new MenuScene());
```

## Lifecycle

A scene lives through a fixed sequence of hooks. The engine calls them at well-defined moments in the game loop, and each one has a specific job.

- **`onCreate()`** — called once, the first time the scene's world is accessed. This is where you register systems or add static resources that should exist for the whole lifetime of the world.
- **`onEnter()`** — called when the scene is mounted onto the stack. This is where you set up the game world: spawn entities, reset state, and prepare anything the scene needs while it is on screen.
- **`update(dt)`** — called every fixed tick while the scene runs. `dt` is `1 / fps`, the fixed timestep of the game loop.
- **`pause()`** — called when a scene pushed on top of this one hides it (see `blocksUpdateBelow`). Not to be confused with the game-level pause in `Game.pause()`.
- **`resume()`** — called when the scene becomes the top of the stack again after being hidden.
- **`onExit()`** — called when the scene is unmounted. Runs before the scene's world and resources are torn down.

```js
class LevelScene extends Scene {
  onCreate() {
    // register systems; runs once
  }

  onEnter() {
    // build the level, spawn the player
  }

  update(dt) {
    // advance the simulation
  }

  pause() {
    // the scene is no longer the top of the stack
  }

  resume() {
    // the scene is the top again
  }

  onExit() {
    // save progress, stop timers
  }
}
```

### `onEnter()` can be async

`onEnter()` may be declared `async`. Asset loading in Jygame is promise-based — `Image.load()` and `Image.animate()` return promises that resolve once the assets are ready — so a scene that loads its sprites on entry awaits them:

```js
async onEnter() {
  this.playerImg = await Image.load("player.png");
  this.animations = await Image.animate({
    path: "assets/char",
    idle: 3,
    run: 4,
  });
}
```

The `async` keyword is required only because of the `await` — you cannot `await` inside a method that isn't declared `async`. The engine awaits whatever `onEnter()` returns before the scene is marked `ready`, so the scene never updates or renders before its assets are loaded. A scene that loads nothing can keep `onEnter()` synchronous.

### A note on naming

`pause()` and `resume()` on a `Scene` are **stack-level** hooks — they fire when a scene is hidden or revealed by other scenes. They are unrelated to the game loop's pause in `Game.pause()` / `Game.resume()`, which stops the entire loop.

## Update

`update(dt)` is the heart of a scene. It is called once per fixed tick, in order from the bottom of the stack to the top, but only for scenes that should be running. This is where you read input, drive your sprites each frame, and run gameplay logic.

Because `dt` is always the fixed timestep, this logic behaves identically regardless of how fast the machine is:

```js
update(dt) {
  const move = Input.axis("move");
  this.player.velocity.x = move.x * this.moveSpeed;
  this.player.velocity.y = move.y * this.moveSpeed;

  if (this.player.collides(this.exit)) {
    this.switchScene(new NextLevelScene());
  }

  this.cooldown -= dt;
  if (Input.justPressed("shoot") && this.cooldown <= 0) {
    this.fire();
    this.cooldown = this.fireRate;
  }
}
```

You set velocities on sprites and let the engine integrate them; `update(dt)` is where you decide what those velocities should be and react to what happened since the last tick.

## Rendering

Scenes render into the game's renderer every frame. The game's frame loop composes each scene in this order (see [Rendering Pipeline](game.md#rendering-pipeline)):

1. `render(ctx)` — canvas drawing **behind** the retained objects
2. Retained objects — the entities in `scene.world`, drawn automatically and ordered by `layer`/`depth`
3. `renderUI(ctx)` — canvas drawing **above** the retained objects
4. `renderDOM()` — a DOM layer overlaid on top of the canvas

### `render(ctx)`

An optional hook called before the world's retained objects are drawn. It receives the immediate 2D context and is the place for ad-hoc drawing that isn't represented by entities — debug lines, parallax washes, temporary effects. The context is in screen space: the camera transform is not applied, so nothing drawn here scrolls with the world.

```js
render(ctx) {
  ctx.beginPath();
  ctx.arc(this.turret.x, this.turret.y, 24, 0, Math.PI * 2);
  ctx.stroke();
}
```

### `renderUI(ctx)`

The foreground counterpart to `render(ctx)`, called after the world's retained objects are drawn so it appears on top of them. Like `render(ctx)` it receives the immediate 2D context in screen space and is not affected by the camera. Use it for canvas overlays that must sit above the action — screen-space vignettes, letterbox bars, reticles.

```js
renderUI(ctx) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(0, 0, ctx.canvas.width, 8);
}
```

### `renderDOM()`

Returns an HTML string that is written into the scene's own DOM root (a transparent overlay on top of the canvas). Because it returns a string and the engine diffs on call, the cheapest way to update UI text is `renderDOM()` returning the current values, or `Game.patchUI()` for targeted text updates. Use this layer for interface text, layout, and DOM events.

```js
renderDOM() {
  return `
    <div id="hud">
      <span id="score">${this.score}</span>
      <span id="lives">${this.lives}</span>
    </div>
  `;
}
```

### Scene-based layering

The hooks above make it possible to do everything in one scene, but a common convention is to split layers into their own scenes — a background scene, a world scene, a UI scene — stacked with `pushScene()`. The stack renders bottom-to-top, so ordering comes from the stack itself instead of juggling hooks. Each scene owns one concern, which keeps files small and easy to read and modify, and it sidesteps the retained-vs-immediate tension entirely: a scene draws in one mode and never has to work around the other. Most jygame projects end up this way rather than mixing all three hooks in a single scene.

## Controlling the stack from a scene

Scenes can drive the scene stack directly. Each method mirrors the corresponding `Game` method but is relative to the current scene.

- **`pushScene(scene)`** — push a new scene on top of this one.
- **`popScene()`** — pop the top scene, returning control to this scene.
- **`replaceScene(scene)`** — replace the top scene with a new one.
- **`switchScene(scene)`** — clear the entire stack and run the given scene.

`transitionTo(scene)` is an alias for `switchScene(scene)`.

```js
class MenuScene extends Scene {
  onEnter() {
    // ...
  }

  onTap() {
    this.switchScene(new LevelScene());
  }
}
```

When a transition is requested from inside a scene's `update()`, it is deferred and applied at a safe point after the update pass, so the stack is never mutated mid-iteration.

## `blocksUpdateBelow` and `blocksRenderBelow`

Every scene has two boolean flags that decide what happens to the scenes beneath it on the stack.

### `blocksUpdateBelow`

**Defaults to `true`.** When a scene with `blocksUpdateBelow: true` sits on top of another scene, the scenes below it **stop receiving `update(dt)`**. The top scene pauses the scene beneath it (`below.pause()` is called) and resumes it when it's popped (`below.resume()`).

```js
class PauseMenuScene extends Scene {
  blocksUpdateBelow = true;
}
```

Because it's the default, a scene pushed on top of the gameplay freezes the gameplay underneath automatically — exactly what a pause menu wants. The game world below stays mounted and rendered; it just isn't simulated.

### `blocksRenderBelow`

**Defaults to `false`.** Controls whether the scenes beneath a scene are still **drawn**. With `blocksRenderBelow: false` (the default), the scenes below continue to render, and your top scene's world draws on top of them.

```js
class InventoryOverlayScene extends Scene {
  blocksRenderBelow = false;
}
```

A transparent inventory or dialog overlays the gameplay below — you still see the frozen game behind it. With `blocksRenderBelow: true`, the scenes below are not rendered at all, which is useful for full-screen scenes where drawing what's underneath would be wasted work.

| flag | default | hides below... |
|---|---|---|
| `blocksUpdateBelow` | `true` | update — the scenes below are paused |
| `blocksRenderBelow` | `false` | rendering — the scenes below are not drawn |

## The scene's world

Each scene owns a world of entities and sprites, created lazily on first access and available as `scene.world`. You almost never touch the ECS directly — the higher-level facades (`Sprite`, `Group`, `Particle`, ...) create and manage entities for you and add them to the scene's world automatically. Everything you place in `onEnter()` is retained and rendered by the engine each frame, and the scene's systems run alongside your `update(dt)` every tick.

```js
async onEnter() {
  // load a sprite-sheet as animation set "hero"
  await Image.animate({ name: "hero", path: "assets/hero", v1: 8, v2: 1 });

  this.player = new Sprite(400, 300, "hero");
  this.boss = new Sprite(600, 300, "boss");
  this.player.scale = 2;
}
```

The scene also carries a `view` (or `views` for multiple), which defines the camera and viewport through which the world is drawn, and an `AudioListener` exposed as `scene.listener`.

## Input bindings

A scene can declare an `input` property — an object describing action bindings. The engine compiles it into an `InputContext`, pushes it onto the input context stack when the scene is mounted, and pops it on exit, so the bindings are automatically scoped to the scene's lifetime.

```js
class PlayerScene extends Scene {
  input = {
    jump: "SPACE",
    move: ["wasd", "arrowkeys"],
  };
}
```

The `move` action above is the one genuinely special case in `input`. `"wasd"` and `"arrowkeys"` (or `"arrows"`) are shorthands that expand into separate `up`/`down`/`left`/`right` bindings, so a single action reads as a 2D movement vector. The action name is yours to choose — `"move"` is only an example, any name works (`"movement"`, `"walk"`, `"direction"`, ...) and the shorthand expands the same way. The shorthands exist because nearly every game needs them — and they only expand inside the `input` property. `Input.pressed("wasd")` is not a movement query; the shorthand has no meaning outside scene bindings. No other key combination gets this treatment — `move: ["ijkl"]` does not become movement, it just binds an action that no key will ever produce.

Everything else written in `input` follows the exact same convention as the `Input.pressed()` / `Input.down()` family:

- `"KeyM"` — a **physical key**. The `Key` prefix refers to the key's position in the **US-QWERTY layout**, so this fires wherever M physically sits on the keyboard, no matter what character it types.
- `"M"` — a **character**, matched case-sensitively against the typed key. `"M"` fires only when an uppercase M is produced (Shift held); `"m"` fires for lowercase m.

Long names — `"SPACE"`, `"ENTER"`, `"F3"`, `"ARROW_LEFT"`, `"KeyM"` — resolve to physical keys and are case-insensitive. A single character like `"M"` is never physical; it is the character.

Input handling is covered in its own section of the docs — see [Input](input.md#keyboard) for the query methods and key conventions.

## Registering cleanup

The `on(target, event, handler)` and `onTap(cb)`, `onSwipe(cb)`, and `onGesture(type, cb)` helpers register listeners that are **automatically removed when the scene exits**. Any other resource can be cleaned up with `cleanup(fn)`.

```js
onEnter() {
  this.on(this.game.canvas, "contextmenu", this.blockMenu);
  this.onTap((tap) => this.shoot());
  this.cleanup(() => clearInterval(this.timer));
}
```

`cleanup(fn)` runs `fn` on exit, after `onExit()` returns.

## Readiness & errors

Because `onEnter()` can be async, a scene is not immediately usable.

- **`scene.ready`** — `true` once `onEnter()` has fully settled.
- **`scene.whenReady()`** — returns a promise that resolves when `onEnter()` has settled. Useful for awaiting a scene transition rather than polling `ready`.
- **`scene.failed`** — `true` if initialization threw.
- **`scene.initError`** — the error that caused initialization to fail, or `null`.

If `onEnter()` throws, the scene is not marked ready, it will not update or render, and the failure is logged loudly. Override **`onError(err)`** to handle it yourself — show an error screen, retry, or fall back to another scene:

```js
class BootScene extends Scene {
  async onEnter() {
    await loadAssets();
  }

  onError(err) {
    console.error("Failed to boot:", err);
    this.switchScene(new ErrorScene(err));
  }
}
```
