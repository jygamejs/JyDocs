# Game

The `Game` class manages the game loop, a **scene stack**, canvas setup, viewport scaling, input, and the DOM UI overlay.

## Constructor

```js
const game = new Game(options)
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `parent` | `string \| HTMLElement` | `document.body` | CSS selector or element to hold the canvas |
| `width` | `number` | `800` | Logical canvas width (game pixels) |
| `height` | `number` | `600` | Logical canvas height (game pixels) |
| `fps` | `number` | `60` | Fixed timestep target |
| `maxTicks` | `number` | `5` | Maximum fixed ticks per frame (spiral-of-death protection) |
| `debug` | `boolean` | `true` | Enable the diagnostics engine, in-game overlay (<code>`</code>), and workspace (<code>Ctrl+F3</code>) |
| `imageSmoothing` | `boolean` | `false` | Whether to enable image smoothing on the canvas context |
| `interpolation` | `boolean` | `true` | Enable positional interpolation between fixed timesteps for smooth rendering |
| `autoPause` | `boolean` | `true` | Auto-pause when the browser tab is hidden |
| `scaleToFit` | `boolean \| object` | `null` | Viewport scaling config |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `canvas` | `HTMLCanvasElement` | The game canvas |
| `ctx` | `CanvasRenderingContext2D` | 2D rendering context |
| `width` | `number` | Logical canvas width |
| `height` | `number` | Logical canvas height |
| `scene` | `Scene \| null` | Current top scene (getter — returns `peekScene()`) |
| `sceneCount` | `number` | Number of scenes on the stack (getter) |
| `clock` | `Clock` | Internal fixed-timestep clock |
| `input` | `InputContext` | The game's input context instance |
| `inputSystem` | `InputSystem` | The input system with device registry, context stack, and coordinate transforms |
| `debug` | `OverlayHost` | The debug overlay host (lazily created) — use `.show()`, `.hide()`, `.toggle()` |
| `fps` | `number` | Smoothed real-time FPS (read-only) |
| `isPaused` | `boolean` | Whether the game is paused (getter) |

## Scene Stack

The game manages a **stack of scenes**. The top scene receives events; scenes below can be optionally blocked from updates/rendering via scene properties (`blocksUpdateBelow`, `blocksRenderBelow`).

### `run(scene)`

Starts the game loop with a scene as the initial stack entry. Validates the scene is a fresh instance (not previously entered). Sets `scene.game = this`, mounts the scene, calls `scene.enter()` (which invokes your `onEnter()` hook — supports `async` for awaiting asset loading), and begins the loop.

```js
game.run(new MenuScene())
```

### `pushScene(scene)`

Pushes a scene onto the stack on top of the current one. If the current scene has `blocksUpdateBelow = true` (default), it is paused. Scene operations are deferred if called during an update cycle.

```js
// Pause overlay on top of gameplay
game.pushScene(new PauseScene())
```

### `popScene()`

Pops the top scene from the stack. If the popped scene had `blocksUpdateBelow = true`, the scene below is resumed. Throws if only one scene remains.

```js
game.popScene()
```

### `replaceScene(scene)`

Replaces the top scene without changing stack depth. Exits the current scene and mounts the new one.

```js
game.replaceScene(new GameOverScene())
```

### `peekScene()`

Returns the top scene without removing it. `game.scene` is an alias for this.

### `switchScene(scene)`

Resets the entire stack to a single scene. Clears input, resets the clock, exits all current scenes.

```js
game.switchScene(new MenuScene())
```

### Scene Inspection

```js
game.getScene(index)      // Scene at index, or null
game.getScenes()           // Copy of the stack array
game.containsScene(scene)  // boolean
game.isTopScene(scene)     // boolean
```

## Lifecycle Methods

### `pause()`

Pauses the entire game loop. No input processing, updates, or rendering will occur while the game is paused. This method is intended for programmatic or engine-level pausing (for example, debugging or browser visibility handling).

Do not bind `pause()` directly to an in-game key unless you have an external mechanism that calls `resume()`.

---

### `resume()`

Resumes the game loop and resets the internal clock accumulator to prevent delta-time spikes when returning from a paused state.

---

### `togglePause()`

Programmatically toggles between the paused and running states of the game loop.

Because a paused game loop does not process input, `togglePause()` should not be bound directly to an in-game pause key (such as `Escape`) unless another system outside the paused game loop is responsible for calling it again.

For in-game pause menus, prefer implementing gameplay-level pause behavior rather than pausing the entire engine.

### `destroy()`

Stops the game loop, disconnects observers, removes visibility/resize listeners, exits all scenes on the stack, destroys the input system and input context.

> **Focus handling:** When the window regains focus, the keyboard state is reset to prevent stuck keys.

## UI / DOM Methods

### `refreshUI()`

Re-renders the top scene's `renderUI()` output into `scene.root`.

### `patchUI(updates)`

Efficiently patches text content of DOM elements by id.

```js
game.patchUI({ score: 'Score: 42', lives: 'Lives: 3' })
```

## Deferred Scene Operations

Scene mutations (`pushScene`, `popScene`, `replaceScene`, `switchScene`) called during a scene's `update()` are **queued** and executed after the update cycle completes. This prevents mid-frame stack corruption.

## Viewport Scaling

CSS `transform`-based scaling via the `scaleToFit` option. When enabled, the canvas is centered and scaled to fill the viewport while maintaining aspect ratio.

## Rendering Pipeline

Each frame the engine renders in this order:

1. `scene.renderBackground(ctx)` — background layer (behind all sprites)
2. `_renderWorld(ctx)` — automatic sprite/entity rendering (internal)
3. `scene.render(ctx)` — foreground overlay (on top of the world)
4. Debug overlay (if enabled)

Use `renderBackground()` for world backgrounds and `render()` for HUD or on-screen effects.

## Example

```js
import {
  Game, Scene,
  Sprite,
  ActionKind, CompositeBinding, KeyBinding, KeyCode,
  AnimationPack,
} from "jygame";

class MenuScene extends Scene {
  onEnter() {
    this._actionMap.bind("start", new KeyBinding(KeyCode.ENTER), ActionKind.DIGITAL);
  }

  renderBackground(ctx) {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, this.game.width, this.game.height);
  }

  render(ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "32px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Press ENTER to start", this.game.width / 2, this.game.height / 2);
  }

  update(dt) {
    if (this._actionMap.getState("start")?.pressed) {
      this.game.pushScene(new GameScene());
    }
  }
}

class GameScene extends Scene {
  async onEnter() {
    const anims = await AnimationPack.load({
      path: "assets/character",
      v2: 4,
      v1: { frames: 4, prefix: "char_" },
    });

    this.player = new Sprite(400, 300);
    this.player.animation.addAll(anims);
    this.player.animation.play("v1");
    this.player.scale = 3;

    const move = new CompositeBinding(ActionKind.VECTOR2, [
      { binding: new KeyBinding(KeyCode.KEY_D),       vector: [ 1,  0] },
      { binding: new KeyBinding(KeyCode.KEY_A),       vector: [-1,  0] },
      { binding: new KeyBinding(KeyCode.KEY_W),       vector: [ 0, -1] },
      { binding: new KeyBinding(KeyCode.KEY_S),       vector: [ 0,  1] },
    ]);
    this._actionMap.bind("move", move, ActionKind.VECTOR2);
  }

  renderBackground(ctx) {
    ctx.fillStyle = "#16213e";
    ctx.fillRect(0, 0, this.game.width, this.game.height);
  }

  update(dt) {
    const speed = 350;
    const m = this._actionMap.getState("move")?.vector ?? { x: 0, y: 0 };
    this.player.velocity.x = m.x * speed;
    this.player.velocity.y = m.y * speed;
  }
}

const game = new Game({
  width: 800,
  height: 600,
  imageSmoothing: false,
  autoPause: true,
});

game.run(new MenuScene());
```
