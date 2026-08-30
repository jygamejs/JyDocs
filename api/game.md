---
title: Game
---

# Game

`Game` is the engine class. A `Game` instance owns the entire runtime of your project: it creates the canvas and renderer, starts and maintains the fixed-timestep game loop, wires up the input system and all its devices, manages the stack of mounted scenes, and drives the UI layer that scenes render into. Everything the engine does — every frame, every tick, every event — flows through the `Game` instance you create.

You configure the instance up front through the constructor's options, then hand it a starting `Scene` and let it take over.

## Constructor

```js
const game = new Game(options)
```

Every part of the initialization process can be customized through the `options` object. The engine ships with the following defaults — configure any of these to suit your game:

```js
const game = new Game({
  parent: document.body,   // where the canvas is inserted
  width: 800,              // canvas width, in pixels
  height: 600,             // canvas height, in pixels
  backgroundColor: null,   // canvas clear color — applied in every scene by default
  fps: 60,                 // fixed simulation ticks per second
  maxTicks: 5,             // how many of those ticks we'll catch up on per frame
  debug: false,            // opt-in: diagnostics overlay + debug workspace
  imageSmoothing: true,    // smooth edges when scaling images
  interpolation: true,     // smooth motion between fixed updates
  autoPause: true,         // pause quietly when the tab hides
  scaleToFit: null,        // auto-scale the canvas to fit the window (off by default)
  renderer: "canvas",      // which drawing backend to use
});
```

### `parent`

A DOM element (or a CSS selector for one) to put the game inside. The engine creates a new `<canvas>` and, alongside it, an invisible `.jygame-ui` layer for the UI built from your scenes, and appends them here.

By default, `parent` is `document.body`, and Jygame makes the container `position: relative` if needed so everything lines up. If you'd rather draw inside an existing section of your page, pass the element:

```js
const game = new Game({ parent: "#game-root" });
```

### `width` & `height`

The logical size of your game, in pixels. This is the resolution your gameplay is authored in — your coordinates, your sprites, your camera all live in this space. 800 × 600 is a sensible default, but pick whatever you like.

### `fps`

How many times per second your game simulation *updates*. This is decoupled from how fast the screen refreshes. Your scene's `update(dt)` runs at this rate — every tick gets a `dt` of `1 / fps`. So with `fps: 60`, every update receives `dt = 1/60`.

Since update happens in fixed-size steps, your physics and movement stay consistent no matter how fast or slow the computer becomes.

### `maxTicks`

This option works together with `fps`. Rendering refreshes as fast as your monitor, while the simulation updates `fps` times per second. These two run at different speeds, and between two screen refreshes there's usually only part of the time needed for one more update. But occasionally, especially when the browser lags, the simulation falls behind by more than one step.

`maxTicks` says: if we're behind, how many updates can we perform during a single rendered frame to catch up?

- **`maxTicks: 0` — never stop catching up.** The engine keeps running updates until its fixed timestep is fully caught up, however many that takes. The simulation always stays exactly in sync with real time. The tradeoff is that if a frame takes very long and the update can't keep pace, the game can enter a *spiral of death* — it keeps grinding out updates trying to catch a time that keeps getting away.
- **`maxTicks: 1` — the opposite extreme.** At most *one* update happens in a single frame, no matter how far behind the simulation is. Any leftover time is dropped. This gives rock-solid determinism, but if the machine is slow the game effectively slows down — the simulation lags rather than spiraling.
- **`maxTicks: 2` and above (including the default `5`)** — a compromise. The engine performs up to `maxTicks` updates per frame, and anything still pending beyond that is discarded. Under normal conditions this is imperceptible; under heavy lag the engine recovers gracefully and cannot spiral out of control, while staying as close to real time as is allowed.

The default of `5` is the best of both worlds for the great majority of games. Tune it down toward `1` for pin-accurate deterministic logic, or to `0` if you truly need the simulation to never fall behind real time.

### `debug`

Turns on the engine's developer tools. It is **off by default** — a shipped game should not carry diagnostics, the debug workspace, or the snapshot machinery. When you're developing, flip it on:

```js
const game = new Game({ debug: true });
```

With it enabled, the engine collects timing and performance metrics — frames, update time, render time, and a range of other measurements — and exposes two debugging interfaces:

- **`` ` `` — the in-game overlay.** Press the backtick key to toggle a live overlay on top of your game showing performance graphs, timelines, and event views.
- **`Ctrl + F3` — the debug panel.** Opens a more detailed debug workspace in a separate window, where you can browse frame history, the world, and your systems.

### `backgroundColor`

The color the canvas is cleared to at the start of every frame, before any scene draws. It is part of the **rendering pipeline** — every scene inherits it automatically, so you set it once on the `Game` and every frame, in every scene, starts from the same background.

`null` (the default) leaves the canvas transparent — the page behind it shows through and each `clear()` simply erases the previous frame. Set it to any CSS color to get a solid backdrop:

```js
const game = new Game({
  backgroundColor: "#0e0e1a",
});

const game2 = new Game({
  backgroundColor: "rgb(14, 14, 26)",
});

const game3 = new Game({
  backgroundColor: "rgba(14, 14, 26, 0.8)",
});
```

Like `imageSmoothing`, it is global and pipeline-level: you don't set it per scene and you don't fill the canvas yourself in `render()`. The engine applies it in `clear()` on every backend (Canvas 2D `fillRect`, WebGL `clearColor`, WebGPU `clearValue`), and a `RenderConfig` per world carries it for WebGL/WebGPU so the clear stays consistent even when scenes change or the renderer falls back.

It is also live — change it at runtime and the next frame uses the new color:

```js
game.backgroundColor = "#1a2a4a";
```

`backgroundColor` accepts any CSS color string — hex (`"#RRGGBB"`, `"#RGB"`, `"#RRGGBBAA"`), `rgb(...)`, or `rgba(...)`. An invalid string is treated as transparent. Scenes that need a different backdrop can still override it locally via their own `RenderConfig` or by drawing a full-screen primitive, but the `Game` value remains the default.

### `imageSmoothing`

When you draw a sprite that's scaled up or down from its natural size, you choose whether the edges blend smoothly or snap into crisp, pixelated steps.

`imageSmoothing: true` (the default) blends and lerps, so images look smooth and soft when resized — usually what you want. In a pixel art game you'll often want `imageSmoothing: false` to preserve sharp pixel edges.

This is a global switch, but you get finer control per sprite:

```js
sprite.imageSmoothing = false;
```

The engine carries your global choice into every sprite as a starting point, and a setting on an individual sprite overrides it for just that sprite.

### `interpolation`

Modern displays often refresh faster than the simulation updates. For example, a monitor might run at 144 Hz while the game updates at 60 ticks per second.

Without interpolation, entities only change position on each simulation tick, which can make motion appear slightly uneven on high refresh-rate displays.

With `interpolation: true` (the default), the engine doesn't just render each entity at its latest position. Between two updates it computes how far along it is toward the next step (`alpha`), and renders each entity at a position blended smoothly between where it was and where it's going. The render queue stores both the previous and the current position per command, so the blend is a single pass that never mutates the simulation state.

The result is smooth motion with no rounding errors accumulating in the simulation state. Turn it off (`interpolation: false`) and everything snaps to the exact tick positions — fully deterministic and frame-locked.

### `autoPause`

When enabled, the engine automatically pauses when the browser tab becomes hidden and resumes when it becomes visible again.

This prevents unnecessary CPU usage while the game is running in the background. Set it to `false` if your game should keep running in the background for some reason.

### `scaleToFit`

Automatically scales the game to fit its available space while preserving its aspect ratio. This is a CSS `transform`-based scale: the canvas keeps its full logical resolution, only its displayed size changes.

It is **off by default** (`null`). To turn it on:

```js
const game = new Game({ scaleToFit: true });
```

You can pass an object for finer control instead of `true`, for example to pad the edges or target a particular element:

```js
const game = new Game({
  scaleToFit: {
    width: 800,
    height: 600,
    padding: 16,           // space between the canvas and window edges
    element: "#game-root", // the element to scale (defaults to the page)
  },
});
```

This is useful for games that should adapt to any window size.

### `renderer`

Jygame supports multiple rendering backends, each with the same `beginFrame` / `clear` / `endFrame` / `resize` lifecycle, and chooses one when the game starts.

The choice is made by a resolver with a priority order:

- **`"auto"`** — prefers **WebGPU** when the browser supports it, then falls back to **WebGL**, and finally to plain **canvas 2D**. You get the fast hardware path when available and a working fallback when not. This is almost always what you want.
- **`"webgpu"`**, **`"webgl"`**, **`"canvas"`** — force a specific backend. Use this when you want to author for a specific one, or when `auto` picks something you don't want.
- Or pass any **renderer instance** directly, if you've constructed one yourself.

> **Note:** the *default* is `"canvas"`, not `"auto"`. To pick the best backend automatically, pass `renderer: "auto"`.

Regardless of the backend, your game code remains the same. Scenes render the same way in every backend, so you can tune hardware usage without changing game logic.

### `host`

An advanced option. The engine routes every environment interaction — element creation, frame scheduling, timers, window and document events — through a *host*. By default it uses the browser host, but a headless host can run the engine under Node with no DOM at all. This keeps the engine testable and lets it run in environments a browser game would never touch.

Most games will never set this option.

## Methods

The methods below control the game loop and its scenes. They are called on the `Game` instance you created.

### Lifecycle Methods

These methods control the game loop itself.

#### `pause()`

Pauses the entire game loop. No input processing, updates, or rendering will occur while the game is paused. This method is intended for programmatic or engine-level pausing (for example, debugging or browser visibility handling).

Do not bind `pause()` directly to an in-game key unless you have an external mechanism that calls `resume()`.

#### `resume()`

Resumes the game loop and resets the internal clock accumulator to prevent delta-time spikes when returning from a paused state.

#### `togglePause()`

Programmatically toggles between the paused and running states of the game loop.

Because a paused game loop does not process input, `togglePause()` should not be bound directly to an in-game pause key (such as `Escape`) unless another system outside the paused game loop is responsible for calling it again.

For in-game pause menus, prefer implementing gameplay-level pause behavior rather than pausing the entire engine.

#### `stepFrame()`

Advances the game by exactly one frame while paused. If the game is running, it is paused first. Useful for inspecting a single frame in the debugger or the debug workspace.

### Scene Management

The game manages a **stack of scenes**. The top scene receives events; scenes below can optionally be blocked from updates/rendering via scene properties (`blocksUpdateBelow`, `blocksRenderBelow`).

#### `run(scene)`

Starts the game loop with the given scene. This is how the first scene is started after initialization. Validates that the scene is a fresh instance (not previously entered), sets `scene.game = this`, mounts the scene, calls `scene.enter()` (which invokes your `onEnter()` hook, possibly `async`, and awaits its promise), and begins the loop.

```js
const game = new Game();
game.run(new MyScene());
```

Calling `run()` while the game is already running throws an error — use `destroy()` first if you need to start over.

#### `pushScene(scene)`

Adds a scene on top of the current one without removing it. Both scenes stay mounted; the top scene receives updates and rendering, and scenes below continue to run unless the new scene blocks them with `blocksUpdateBelow` (the default). Scenes below resume automatically when the blocking scene is popped.

```js
game.pushScene(new PauseMenuScene());
```

If `pushScene()` is called from inside a scene's `update()`, the operation is deferred and applied at a safe point after the update pass.

#### `popScene()`

Removes the top scene and unmounts it, returning to the scene beneath. If the popped scene had `blocksUpdateBelow = true`, the scene below is resumed. Throws an error if there is only one scene on the stack, since the last scene cannot be popped — use `replaceScene()` or `switchScene()` instead.

```js
game.popScene()
```

#### `replaceScene(scene)`

Replaces the top scene with a new one, without changing stack depth. The old scene is unmounted and the new scene takes its place on the stack. Useful for transitions where the previous scene should not be revisited.

```js
game.replaceScene(new GameOverScene())
```

#### `switchScene(scene)`

Clears the entire scene stack and runs the given scene. This is the hard transition: everything previously on the stack is unmounted, input is cleared, and the clock is reset as part of the switch.

```js
game.switchScene(new MenuScene())
```

#### `peekScene()`

Returns the top scene on the stack, or `null` if the stack is empty. `game.scene` is an alias for this.

```js
const top = game.peekScene();
```

#### `getScene(index)`

Returns the scene at the given index in the stack, or `null` if the index is out of range.

#### `getScenes()`

Returns a copy of the full scene stack as an array.

#### `containsScene(scene)`

Returns `true` if the given scene is currently on the stack.

#### `isTopScene(scene)`

Returns `true` if the given scene is the current top scene.

> **Deferred operations:** Scene mutations (`pushScene`, `popScene`, `replaceScene`, `switchScene`) called during a scene's `update()` are queued and executed after the update cycle completes. This prevents mid-frame stack corruption.

### UI

#### `refreshUI()`

Re-applies the top scene's `renderDOM()` output to its DOM root. Useful after a manual change that should update the UI immediately.

#### `patchUI(updates)`

Applies targeted text updates to the top scene's UI. Pass an object mapping element ids to new text content:

```js
game.patchUI({ score: String(score), lives: String(lives) });
```

Only elements whose text actually changed are touched.

### Size & Teardown

#### `resize(width, height)`

Changes the logical size of the game. The renderer and the input coordinate system are updated to match. Useful when responding to layout changes at runtime.

#### `destroy()`

Tears down the entire game: stops the game loop, disconnects observers, removes visibility/resize listeners, exits all scenes on the stack, and destroys the renderer, the input system, and the input context. After `destroy()`, the game cannot be used again; create a new `Game` instance instead.

> **Focus handling:** When the window regains focus, the keyboard state is reset to prevent stuck keys.

## Rendering Pipeline

Rendering is owned by the `Game`, not the scene. Each frame the game clears the canvas, then walks the scene stack bottom-to-top (scenes with `blocksRenderBelow` hide everything beneath them) and composes each scene in this order:

1. `scene.render(ctx)` — an immediate-mode hook that draws **behind** the world's retained objects. Use it for canvas drawing that isn't an entity: grid lines, parallax washes, custom effects that don't belong in the ECS.
2. Retained objects — the entities in `scene.world`, drawn automatically by the renderer. Their on-screen order is resolved from the `layer` and `depth` fields on `Renderable`, so the painter's algorithm is data-driven rather than tied to creation order or draw calls.
3. `scene.renderUI(ctx)` — a foreground canvas hook, drawn **above** the retained objects. Like `render(ctx)`, it is in screen space: the camera does not transform it. Use it for canvas overlays that must sit on top of the action.
4. `scene.renderDOM()` — returns an HTML string patched into the scene's own DOM root, a transparent overlay above the canvas. This is the layer for HUD and interface text (see [Scene rendering](scene.md#rendering)).
5. Debug overlay (if enabled).

The division of labour is deliberate. `render(ctx)` and `renderUI(ctx)` both draw on the canvas in screen space — they are not transformed by the camera, so they do not scroll with the world — the former behind the entities, the latter in front. Interface elements that need text, layout, or event handling belong in `renderDOM()`, not in a canvas hook; using the canvas for interface elements fights the renderer's retained-object model and leaves you re-drawing text every frame. A scene rarely overrides all three — most draw a custom background in `render()` and let entities run over it, or skip `render()` entirely and let `renderUI(ctx)`/`renderDOM()` own the overlay.

## Properties

These are getters on the `Game` instance. Some are read-only — they describe the current state of the engine — while others expose the underlying objects so you can reach into them when you need something specific.

### `canvas`

`HTMLCanvasElement` — the canvas the game renders into. Returns `null` if no renderer is available.

Use it when you need something the game loop doesn't expose directly: read the backing pixel size, attach a DOM listener for an effect, or take a screenshot with `canvas.toDataURL()`. For ordinary drawing you shouldn't need it — the scene hooks give you the context already.

### `ctx`

`CanvasRenderingContext2D` — the immediate 2D context the engine draws with. This is the same context passed to `render(ctx)` and `renderUI(ctx)`, in screen space: the camera transform is not applied. Returns `null` if no renderer is available.

Reaching for `game.ctx` outside the scene hooks is rare, but handy for one-off canvas work or to share a context with non-scene drawing code.

### `width` & `height`

`number` — the logical canvas size (in game units, before device-pixel scaling). These are plain properties, updated by `resize()`.

Use them for layout math: centering a HUD element in `renderUI(ctx)`, computing camera bounds, or positioning entities relative to the viewport rather than hard-coding pixel values.

### `scene`

`Scene | null` — the current top scene, or `null` when the stack is empty. Equivalent to `peekScene()`.

A convenient way to reach the active scene's code without threading references around:

```js
const top = game.scene;
if (top && top.score) top.score += 10;
```

### `sceneCount`

`number` — the number of scenes currently on the stack. Read-only.

Useful for validating scene-stack state, e.g. asserting a menu is still underneath before deciding whether a `pop` is safe.

### `clock`

`Clock` — the fixed-timestep clock driving the update loop. It owns `fps`, `fixedDt`, `maxTicks`, and the `alpha` interpolation value.

You rarely need it, but it's the source of truth for timestep questions: read `clock.fixedDt` when a system needs the exact step duration, or `clock.alpha` when doing custom interpolation outside the renderer's default path.

### `inputSystem`

`InputSystem` — the fully wired input system, including the device registry, the input-context stack, and the coordinate transforms that map pointer positions to canvas space.

Everyday input goes through the scene's input bindings or the `Input` facade — reach for `inputSystem` when you need low-level control: registering a custom device, inspecting the context stack, or reading the current pointer transform.

### `debug`

`OverlayHost` — the debug overlay host. When the game runs without `debug: true`, `toggle()` and `show()` are safe no-ops, so calling them from game code never breaks the loop.

When `debug: true`, the host is created lazily on first access. The engine also binds two debug keys for you — the backtick `` ` `` toggles the overlay and `Ctrl + F3` opens the workspace — so you usually don't need to touch this at all. Use `show()`/`hide()`/`toggle()` when you want to trigger the overlay from code instead, for example from a menu button or a simple key check:

```js
if (Input.pressed("F3")) game.debug.toggle();
```

Calling `toggle()` or `show()` while the overlay is disabled logs a one-time warning explaining how to enable it, instead of throwing.

### `fps`

`number` — the smoothed real-time frame rate, updated every frame. Read-only in practice; writes are overwritten by the loop's smoothing.

Display it in a `renderDOM()` HUD, use it for adaptive detail levels (drop particle counts when `fps` dips), or log it while profiling.

### `isPaused`

`boolean` — whether the game loop is currently paused. Read-only; change it with `pause()`, `resume()`, or `togglePause()`.

Use it to reflect state in the UI — show a pause indicator, or skip expensive non-essential work when the loop is frozen — without risking desync by pausing from inside an update.
