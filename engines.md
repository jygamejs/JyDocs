## pygame

**Architecture:** Thin Python binding over SDL2. No engine abstraction — you write the loop, SDL just gives you a window, an event queue, and a pixel surface. There's no scene graph, no node tree, no built-in ECS. It's closer to "graphics library + input polling" than "game engine."

**Minimal example — window, loop, rectangle:**

```python
import pygame

pygame.init()
screen = pygame.display.set_mode((800, 600))
clock = pygame.time.Clock()

rect = pygame.Rect(350, 250, 100, 100)
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill((20, 20, 20))              # clear framebuffer
    pygame.draw.rect(screen, (255, 60, 60), rect)  # rasterize immediately
    pygame.display.flip()                   # present

    clock.tick(60)

pygame.quit()
```

**Drawing model:** `pygame.draw.rect()` is immediate-mode in the strict sense — it rasterizes pixels into the `Surface` buffer *right now*, synchronously, on the CPU. There is no persistent "Rectangle" object in an engine-side scene graph tracking that shape. The `pygame.Rect` you passed is just a plain data struct (x, y, w, h) — it has no draw method, no lifecycle, no parent/child relationship. If you don't call `draw.rect` again next frame, it's gone, because you clear the screen and redraw everything from scratch each iteration.

What *is* retained is the `Surface` itself — the pixel buffer persists across frames (unlike, say, `<canvas>` cleared to transparent by browser compositing rules elsewhere, though same idea). So pygame is best described as: **immediate-mode drawing calls onto a retained framebuffer**, with zero retained scene state above the pixel level.

**Loop model:** Explicit, user-owned, single-threaded, poll-based. `pygame.event.get()` drains a queue you must service every frame or input backs up / the window appears frozen (OS-level "not responding"). There's no callback/event-driven dispatch model like a browser's DOM — you're doing the dispatching yourself with an `if event.type == X` chain. This is architecturally closer to a bare Win32/X11 message loop than to something like Godot's signal system.

**Scalability / control tradeoffs:**
- **Ceiling:** Low, by default. `draw.rect`, `blit`, etc. are CPU-bound software rasterization (SDL2's software renderer path unless you dig into `pygame._sdl2` for the accelerated `Renderer`/`Texture` API, which most people don't). No batching, no instancing, no GPU pipeline exposed at the top-level API.
- **Sprite count:** Hundreds to low thousands of blits/frame at 60fps on CPU before you're rewriting hot paths. `pygame.sprite.Group` gives you rudimentary batch update/draw and dirty-rect tracking (`RenderUpdates`), which helps but caps out fast.
- **Escape hatches:** `surfarray` exposes the surface as a NumPy array for vectorized pixel ops; `pygame._sdl2.video` exposes SDL's hardware-accelerated `Renderer`/`Texture` if you want actual GPU blitting. Both require opting out of the "default" pygame idiom.
- **Control:** Maximal — nothing is hidden, no forced architecture, no scene tree fighting you. You own the loop, the update order, the render order, memory layout of your own game state. This is exactly why it's a common ECS/engine-from-scratch teaching tool — it gets out of your way. Cost is you also own every optimization.

---

## Arcade (Python)

**Architecture:** Built on Pyglet, which wraps OpenGL directly — so unlike pygame's SDL2 software surface, Arcade is hardware-accelerated by default. It sits one abstraction layer higher than pygame: you still write your own loop logic per-object, but the base class structure (`arcade.Window` / `arcade.View`) and event dispatch come from Pyglet underneath.

**Minimal example — window, loop, rectangle:**

```python
import arcade

class GameWindow(arcade.Window):
    def __init__(self):
        super().__init__(800, 600, "Rect Demo")
        self.rect = arcade.LBWH(350, 250, 100, 100)  # left, bottom, width, height

    def on_draw(self):
        self.clear()
        arcade.draw_rect_filled(self.rect, arcade.color.RED)

    def on_update(self, delta_time):
        pass  # game logic goes here

GameWindow()
arcade.run()
```

**Drawing model:** Immediate-mode at the call-site (`draw_rect_filled` issues GPU draw commands each frame, nothing persists automatically), but Arcade 3.x formalized the rectangle itself as a first-class `Rect` value type — constructed via helpers like `LBWH` (left/bottom/width/height), `LRBT` (left/right/bottom/top), `XYWH` (center-based) — rather than pygame's bare tuple-like struct draw_lbwh_rectangle_filled draws a filled rectangle extending from bottom left to top right using left, bottom, width, and height, delegating to draw_rect_filled(LBWH(left, bottom, width, height), color). So you get typed geometry, but drawing is still "call it every frame or it disappears" — same as pygame in that respect.

The real architectural difference from pygame shows up if you want *retained* geometry: creating a filled rectangle returns a Shape object you can draw repeatedly with shape.draw(), built once in setup and drawn in on_draw, with multiple shapes batchable into a ShapeElementList for near-unlimited shape counts at roughly the cost of one draw call. That's Arcade explicitly offering an opt-in retained/batched path (VBO-backed) on top of its default immediate calls — pygame has nothing analogous without dropping to `pygame._sdl2`.

**Loop model:** Event-driven, not manually polled. Pyglet's app loop calls your overridden `on_draw()`, `on_update(dt)`, `on_key_press()`, etc. — you don't write `for event in queue`. This is architecturally closer to a windowing-toolkit callback model (like GLFW/GLUT-style dispatch) than pygame's raw message pump. Less boilerplate, less transparency into the loop's exact ordering.

**Scalability / control tradeoffs:**
- **Ceiling:** Meaningfully higher than pygame's default path since you're on real GPU pipelines (OpenGL via Pyglet), not CPU rasterization.
- **Sprite count:** Arcade's `SpriteList` is the real workhorse — it batches sprites into a single VBO and issues one draw call per list, getting you tens of thousands of sprites at 60fps where pygame's `Group.draw()` would choke. This is the retained-batch model applied to sprites specifically, separate from the raw shape-draw functions above.
- **Escape hatches:** Arcade exposes Pyglet's GL context directly (`arcade.get_window().ctx`) via the `arcade.gl` module (an `moderngl`-like wrapper), so you can write custom shaders/framebuffers if the high-level API's abstractions box you in.
- **Control:** Less than pygame at the geometry level (you're handed a `Rect` type and dispatch callbacks rather than raw loop ownership), but more headroom before you hit a wall, because the underlying primitive (GPU buffers) scales differently than CPU blits.

---

## raylib (C)

**Architecture:** A thin C library over OpenGL (with backends for desktop GL, OpenGL ES for mobile/web via Emscripten, and RGFW/GLFW for windowing). Philosophically it's pygame's spiritual sibling — "simple API over a real graphics context" — but compiled, lower-level, and GPU-accelerated from line one rather than CPU-rasterized. No scene graph, no ECS, no retained node tree. Just a window, a frame loop you write, and draw calls.

**Minimal example — window, loop, rectangle:**

```c
#include "raylib.h"

int main(void) {
    InitWindow(800, 600, "Rect Demo");
    SetTargetFPS(60);

    Rectangle rect = { 350, 250, 100, 100 };

    while (!WindowShouldClose()) {
        BeginDrawing();
            ClearBackground((Color){20, 20, 20, 255});
            DrawRectangleRec(rect, RED);
        EndDrawing();
    }

    CloseWindow();
    return 0;
}
```

**Drawing model:** Strict immediate mode, same category as pygame's `draw.rect` — `DrawRectangleRec` issues a GPU draw call *this frame*, and if you don't call it again next frame, nothing is on screen. `Rectangle` is a plain POD struct (`x, y, width, height`), no methods, no lifecycle — you own it exactly like you'd own any C struct. There is zero retained scene state above the GPU command level; raylib doesn't even retain a display list the way Arcade's `ShapeElementList` does. Every `Draw*` call between `BeginDrawing()`/`EndDrawing()` is a fresh immediate command, batched internally by raylib's own render batch system (it coalesces sequential draws with the same texture/shader into fewer GL calls), but that batching is an implementation detail you don't interact with — not an API-level retained object like Arcade's `Shape`.

**Loop model:** Fully explicit and user-owned, more so even than pygame. `WindowShouldClose()` is a poll, not a queue-drain — raylib has no event-object dispatch model at all by default. Input is polled directly via functions like `IsKeyDown(KEY_SPACE)` called wherever you need it, not routed through an event queue you iterate. This is architecturally the most "bare metal" of the three so far: no callbacks, no event structs, just state-query functions you call synchronously inside your own loop, every frame, wherever convenient.

**Scalability / control tradeoffs:**
- **Ceiling:** High relative to pygame's default path — you're on real OpenGL from the start, and raylib exposes `rlgl`, its own thin immediate-mode-style GL abstraction layer, if you want to drop below the `Draw*` API into custom vertex batches, shaders, or render textures.
- **Primitive count:** raylib's internal batching absorbs a lot of the naive-immediate-mode cost (thousands of `DrawRectangleRec`/`DrawTexture` calls per frame are fine), but you're still CPU-bound issuing one logical draw call per shape from your code — there's no sprite-list/instancing abstraction at the high-level API like Arcade's `SpriteList`. For genuinely large counts you drop to `rlgl` and build your own instanced/batched geometry.
- **Escape hatches:** `rlgl` (near-raw GL calls), custom shaders via `Shader`/`LoadShader`, `RenderTexture2D` for offscreen passes/post-processing. Nothing is hidden — raylib is designed so every abstraction layer is optional and inspectable.
- **Control:** Very high — comparable to pygame's "nothing hidden" philosophy, but with actual GPU primitives under your hands instead of a software framebuffer. The cost is the same as pygame's: no engine gives you batching, layering, or depth-sort for free — you build it.

---

## Ursina (Python, built on Panda3D)

**Architecture:** A complete paradigm shift from the previous three. Ursina wraps Panda3D — a Python wrapper around the Panda3D game engine created by Disney and still used for production development — and Panda3D itself is a full retained-mode scene-graph engine (`NodePath`-based), like a lighter Unreal/Unity-adjacent architecture rather than a drawing library. Ursina's job is to make that scene graph ergonomic for Python. There's no manual frame loop to write at all — `app.run()` hands control to the engine's internal loop, and it calls your `update()` function automatically every frame.

**Minimal example — window, loop, rectangle (a flat quad):**

```python
from ursina import *

app = Ursina()

rect = Entity(
    model='quad',
    color=color.red,
    scale=(1, 1),
    position=(0, 0)
)

app.run()
```

No `while` loop, no `BeginDrawing`/`EndDrawing` pair, no draw call at all in your code. You declare the `Entity`, and it exists — persistently, on-screen — until you destroy it or disable it.

**Drawing model:** Fully retained. Every Entity wraps a Panda3D NodePath under the hood — the rectangle you created is a real, addressable node living permanently in a scene graph, not a value you re-issue every frame. Set `rect.color = color.blue` from anywhere, anytime, and it updates — you never call a draw function yourself; the engine's internal render traversal walks the graph and rasterizes whatever's currently in it. This is the mirror image of pygame/Arcade/raylib: there, *absence of a call* means *absence on screen*; here, *presence of an object* means presence on screen, full stop.

**Loop model:** Event/callback-driven, and notably *convention-based* rather than explicit registration — Ursina auto-detects and calls a module-level `def update():` and `def input(key):` if they exist in your script, no `app.on_update = ...` wiring required. Defining an input(key) function that gets called by the app is enough, and per-Entity, subclasses override `self.update()`/`self.input()` and the engine dispatches to *every* entity's method automatically — a Player subclass can define its own update(self) that mutates self.x based on held_keys every frame, with no manual iteration over a list of players required anywhere.

**Scalability / control tradeoffs:**
- **Ceiling:** High on the rendering side — you inherit Panda3D's mature GPU pipeline (shaders, deferred lighting, shadow mapping) essentially for free. Ursina supports many built-in shaders or writing your own with GLSL.
- **Entity count:** This is where retained-mode scene graphs traditionally pay a tax pygame/Arcade/raylib don't: every `Entity` is a real Python object with a NodePath, property system, and (by default) individual draw submission through Panda3D's culling/traversal. Thousands of independently-scripted entities each running Python-level `update()` will bottleneck on Python's per-object overhead before they bottleneck the GPU — this is the classic retained-OOP-node-graph scaling wall that ECS/SoA architectures (like Jygame's) exist specifically to avoid.
- **Escape hatches:** Because Ursina is Panda3D underneath, you can drop to raw Panda3D `NodePath`/`GeomNode` APIs for custom batched geometry, or use Ursina's `Mesh` class for procedural geometry combined manually into fewer draw calls — but this means opting *out* of the Entity-per-object convenience the framework is built around.
- **Control:** Low, deliberately. You're trading control for structure — the framework decides update-order, dispatch, and render traversal. This is the actual "Scene-based, retained-object" reference point you were looking for as a contrast to the immediate-mode trio before it.

**Relative to Jygame:** Ursina is the philosophical opposite of pygame/Arcade/raylib and closer to Unity/Godot in spirit — objects persist, you mutate state on them directly, and the engine figures out what to draw. But it does this the "expensive" way: one Python object + one scene-graph node per entity, no SoA layout, no batched update loop across homogeneous components. Jygame's `(layer, depth)` two-tier depth sort is solving the *same problem* Ursina solves with scene-graph node ordering — but where Ursina pays per-object Python/NodePath overhead per entity, an ECS/SoA approach amortizes that into cache-friendly bulk operations over typed arrays. Ursina is a useful example of "retained mode done the classical/OOP way" to contrast against retained-*data* (ECS) approaches.

---

## LÖVE / Love2D (Lua)

**Architecture:** A callback-driven 2D framework wrapping SDL2 (windowing/input) and OpenGL/Metal/Vulkan depending on platform (via `love.graphics`, an abstraction over the underlying GPU API — you never touch GL directly unless you drop to `love.graphics.newShader`/canvas-level work). Like Arcade, there's no loop to write — you define global callback functions and the engine's internal `love.run()` calls them. No scene graph, no ECS, no retained node tree by default — same "drawing library with structure" philosophy as raylib/Arcade, just in Lua with a stricter callback contract.

**Minimal example — window, loop, rectangle:**

```lua
function love.load()
    rect = { x = 350, y = 250, w = 100, h = 100 }
end

function love.update(dt)
    -- game logic goes here, dt = delta time since last frame
end

function love.draw()
    love.graphics.setColor(1, 0.24, 0.24)  -- 0..1 float, not 0..255
    love.graphics.rectangle("fill", rect.x, rect.y, rect.w, rect.h)
end
```

No `main()`, no window creation call, no `while` loop anywhere in user code. LÖVE's binary (`love.exe` / `love` CLI) loads your directory as a "game," finds these globally-scoped functions, and drives them — window setup happens implicitly (configurable via an optional `conf.lua`) before `love.load()` even runs.

**Drawing model:** Immediate-mode, same category as pygame/raylib — `love.graphics.rectangle("fill", ...)` issues a draw call *this frame only*, inside the `love.draw()` callback, which the engine invokes once per frame after clearing the backbuffer for you automatically. The `rect` table is a plain Lua table — no methods, no draw-self capability, identical in spirit to raylib's `Rectangle` struct or pygame's `Rect`. Nothing persists above "you drew it this frame" unless you build your own list of objects and iterate it inside `love.draw()` yourself — which is exactly what everyone does, functionally reinventing a lightweight scene list in user space (this is a very common intermediate-Lua-game pattern: a global `entities` table, iterated in both `update` and `draw`).

**Loop model:** Fully event/callback-driven, arguably the cleanest of the group so far. `love.update(dt)`, `love.draw()`, `love.keypressed(key)`, `love.mousepressed(x, y, button)`, etc. are all invoked by the engine — you never poll or drain a queue. The entire loop itself (`love.run`) is overridable if you want to hijack frame timing, fixed-timestep physics, or headless-mode logic, which is a level of transparency Unity/Ursina-style engines don't give you — the "black box" loop is documented, standard Lua, and replaceable.

**Scalability / control tradeoffs:**
- **Ceiling:** Solid — LÖVE batches automatically to a real degree via its internal quad/vertex buffering when you use `love.graphics.draw()` with a shared texture (spritesheet-style), and exposes `love.graphics.newSpriteBatch()` explicitly for large counts of textured quads sharing one texture, submitted as a single draw call — conceptually identical to Arcade's `SpriteList` or a manual instancing buffer.
- **Primitive count:** Naive per-shape `love.graphics.rectangle()` calls (no shared texture, no batch) scale similarly to raylib's naive path — thousands are fine, tens of thousands starts costing you Lua-interpreter overhead per call before GPU limits matter. `SpriteBatch` is the explicit escape hatch, same pattern as everywhere else in this list.
- **Escape hatches:** `love.graphics.newShader` (GLSL, cross-compiled per backend), `Canvas` objects for render-to-texture/post-processing, `love.graphics.newMesh` for raw custom vertex data if you want to bypass the shape-drawing API entirely and build your own batched geometry pipeline.
- **Control:** High — comparable to raylib/pygame in that nothing is hidden, but slightly more structured because the callback contract (`load`/`update`/`draw`) imposes a specific separation you don't get to skip, unlike pygame where update-vs-draw ordering is entirely your invention.

**Relative to Jygame:** LÖVE sits almost exactly where Arcade does on your retained-vs-immediate axis — immediate draw calls, opt-in batching via `SpriteBatch`, event-driven dispatch instead of manual polling — but with zero built-in concept of layering/domains at all; z-ordering is 100% "whatever order you called `love.graphics.draw()` in in your own `love.draw()` function," same flat model as raylib. Notably, LÖVE's `dt`-based `love.update(dt)` signature is the standard variable-timestep pattern; if Jygame's `Game` class update loop follows the same delta-time convention, this is a useful concrete comparison point for how minimal a callback-based timestep contract can be while still being fully engine-owned.

---

## Phaser 3 (JavaScript)

**Architecture:** A fully retained, Scene-based engine with a proper display list and update list, running on an auto-detected WebGL or Canvas2D renderer (WebGL preferred, with batching baked in at the renderer level). This is the first JS entry and the first genuinely "engine-shaped" framework in this comparison since Ursina — explicit `Scene` lifecycle (`preload`/`create`/`update`), a `GameObjectFactory` for spawning persistent objects, and an internal display-list/depth system, not user-assembled convention.

**Minimal example — window, loop, rectangle:**

```javascript
class MainScene extends Phaser.Scene {
    create() {
        this.rect = this.add.rectangle(400, 300, 100, 100, 0xff3c3c);
    }

    update(time, delta) {
        // game logic goes here, called automatically every frame
    }
}

const config = {
    type: Phaser.AUTO,          // WebGL, falls back to Canvas
    width: 800,
    height: 600,
    scene: MainScene
};

new Phaser.Game(config);
```

No render loop is written by you at all — `Phaser.Game` owns the RAF (`requestAnimationFrame`) loop internally, walking every active `Scene`'s update list each tick, then its display list for rendering.

**Drawing model:** Fully retained, and explicitly designed to feel this way. `this.add.rectangle(...)` returns a persistent `Phaser.GameObjects.Rectangle` — a Game Object that can be added to a Scene, Group, or Container, and treated like any other Game Object — tweened, scaled, or enabled for input or physics — providing a way to render the shape without a texture while still being fully batched in WebGL. You call `this.add.rectangle` exactly once in `create()`; it then exists indefinitely in the Scene's display list and is redrawn automatically every frame by the renderer's traversal, not by you calling anything again. This is architecturally identical to Ursina's Entity model — object persistence implies visual persistence — but implemented over a 2D WebGL renderer rather than a 3D scene graph.

Depth/z-order is explicit and decoupled from creation order, which raylib/LÖVE/Arcade all lack: the z position doesn't control render order for 2D Game Objects — that's controlled by the object's `depth` property instead. This is a real API-level primitive for layering, closer in spirit to Jygame's `(layer, depth)` sort than anything covered so far — Phaser just does it per-object via a single `depth` field rather than two sort keys.

**Loop model:** Fully engine-owned and callback-driven, one level more structured than LÖVE. You don't define global functions; you subclass `Phaser.Scene` and override lifecycle methods (`preload`, `create`, `update`), and the engine calls them in a defined order, per-scene, with multiple scenes running/paused/stacked simultaneously (Phaser has a `SceneManager` for this — think layered menu/HUD/gameplay scenes coexisting). Object-level lifecycle exists too — a custom `Rectangle` subclass can define `preUpdate(time, delta)` and it's added to the scene's `UpdateList` automatically.

**Scalability / control tradeoffs:**
- **Ceiling:** High for a browser-targeted 2D engine — WebGL renderer batches same-texture/same-pipeline draws automatically (comparable to LÖVE's SpriteBatch, but implicit rather than opt-in), and shape primitives like `Rectangle` are explicitly called out as fully WebGL-batched despite being textureless.
- **Object count:** This is Phaser's real tension point for you specifically: every `GameObject` is a JS class instance with dozens of mixed-in Component properties (Transform, Alpha, Depth, Tint, etc. via Phaser's Component-mixin pattern) — much heavier per-object than an SoA/ECS row. It scales fine for typical 2D game object counts (hundreds to low thousands of independently-logicked entities) but hits the same wall Ursina does at high entity counts: per-object JS property access and per-object `preUpdate` dispatch, not cache-friendly bulk iteration.
- **Escape hatches:** `Container` and `Group` for batch operations on related objects; `Blitter`/`Particle` systems for high-count homogeneous sprites bypassing full GameObject overhead; direct WebGL pipeline access (`Phaser.Renderer.WebGL.Pipelines`) for custom shaders/instancing if you need to step outside the GameObject model entirely.
- **Control:** Lower than anything covered so far except Ursina — Scene lifecycle, update ordering, and render traversal are all engine-owned. You get structure (multi-scene stacking, depth sorting, input/physics integration) in exchange for giving up loop ownership entirely.

**Relative to Jygame:** Phaser's `depth` property is the closest thing yet to Jygame's `(layer, depth)` sort, but it's flat (a single sortable number per object) rather than tiered — Jygame sorts on *two* keys (`layer`, then `depth`) in one pooled `RenderQueue`, which lets a game separate concerns like backgrounds vs. gameplay vs. UI into distinct layer bands and then order within each. Phaser's Component-mixin GameObject is the "retained-OOP" answer to layering and state — same category as Ursina's Entity — which throws into relief that an SoA/ECS approach is solving Phaser's per-object dispatch overhead problem structurally rather than through Container/Group batching workarounds bolted onto an OOP base.

---

## Excalibur.js (TypeScript)

**Architecture:** A full TypeScript ECS-flavored engine — `Actor` extends `Entity`, and Components (including a `GraphicsComponent`) attach data/behavior to entities, with Systems able to operate on them. This is architecturally the closest thing yet in this list to Jygame's own foundations (real ECS terminology, real Component objects) — but layered underneath a classical `Actor` convenience class most users interact with instead of raw Entity/Component composition. Rendering runs over HTML5 Canvas 2D by default via its own `ExcaliburGraphicsContext` abstraction, not raw `<canvas>` calls.

**Minimal example — window, loop, rectangle:**

```typescript
import { Actor, Color, Engine, Rectangle, vec, Scene } from "excalibur";

class Box extends Actor {
    constructor() {
        super({ name: "Box", pos: vec(350, 250), width: 100, height: 100 });
    }
    onInitialize() {
        this.graphics.add(new Rectangle({ width: 100, height: 100, color: Color.Red }));
    }
}

const game = new Engine({ width: 800, height: 600 });
game.add(new Box());
game.start();
```

Same "no loop written by you" pattern as Ursina/Phaser — `game.start()` hands control to Excalibur's internal `Clock`-driven main loop permanently.

**Drawing model:** Fully retained, and structured more explicitly than Phaser or Ursina. A `Rectangle` isn't the Actor itself — it's a `Graphic` object assigned *to* the Actor's `GraphicsComponent`: the GraphicsComponent holds an Excalibur Graphic and draws it to the screen for an entity, and can only show one graphic at a time — to show more you use a GraphicsGroup or child entities with their own graphics components. This is a genuine Entity/Component separation, not a monolithic GameObject like Phaser's `Rectangle` — the Actor is the entity, `Rectangle` is a data-only graphic resource, and `GraphicsComponent` is the glue. For layering multiple shapes on one actor, a GraphicsGroup lets you specify a list of graphics in painter order, first drawn first, — explicit ordered composition rather than Phaser's flat per-object `depth`.

Persistence works the same as Ursina/Phaser: for an Actor to be drawn and updated it needs to be part of the "scene graph," and once added it's redrawn automatically every frame without further calls from you.

**Loop model:** Engine-owned, but with an explicitly two-phase contract Excalibur is unusually opinionated about: the engine splits the game into two primary responsibilities, updating and drawing, specifically so your game isn't doing logic while drawing or performing logic as it draws — the Update loop runs first, where Actors and Scenes both implement overridable onPreUpdate/onPostUpdate methods, followed by the Draw loop, where a scene loops through its child actors and draws each one. Only one `Scene` is active/updated/drawn at a time — the engine does not update or draw any other scene, meaning actors in a deactivated scene are skipped entirely, unlike Phaser's ability to run multiple scenes concurrently (stacked UI + gameplay scenes simultaneously). This is a real design-philosophy fork between the two engines worth noting for your own `Game`/scene design.

**Scalability / control tradeoffs:**
- **Ceiling:** Canvas2D-based by default (not WebGL), so raw fill-rate ceiling is lower than Phaser's WebGL path — fine for small-to-mid 2D games, a real constraint for particle-heavy or thousands-of-sprite scenes.
- **Entity count:** Real ECS bones underneath (Components, Systems) mean the *architecture* supports scaling toward bulk/batched operations better than Ursina's or Phaser's OOP-mixin model in principle — but the default `Actor` convenience layer still carries per-instance overhead similar to Phaser's, since most users compose via Actor subclassing rather than raw Component/System iteration.
- **Escape hatches:** Direct `ExcaliburGraphicsContext` access via `actor.graphics.onPostDraw(ctx => ...)` for custom low-level draw calls (`ctx.drawLine`, `ctx.drawRectangle`, custom `z` ordering) bypassing the Graphic/GraphicsComponent abstraction; custom renderer plugins registrable on the graphics context for specialized batched rendering.
- **Control:** Moderate — more granular than Phaser because of the real Component separation (you can manipulate graphics, transform, and collision as genuinely separate concerns per entity), but still fundamentally engine-owned scene/update/draw ordering, same tradeoff class as Phaser/Ursina.

**Relative to Jygame:** Excalibur is the first engine in this list that actually *names* Components and Entities the way you do, which makes the comparison sharper rather than looser — its `GraphicsComponent` holding one `Graphic` (or a `GraphicsGroup` for painter-order composition) is functionally similar to attaching a render component per entity in an ECS, but it's still one-Component-instance-per-entity in the classical OOP sense, not a SoA array of packed component data iterated in bulk by a System. Its default Canvas2D renderer (vs. your WebGPU target) also makes it a useful lower-ceiling reference point — Excalibur trades raw throughput for developer ergonomics and TypeScript-native structure, whereas Jygame is explicitly chasing the throughput end of that tradeoff.

---

## KAPLAY.js (formerly Kaboom.js)

**Architecture:** A functional-composition game library rendered over WebGL. This is the sharpest architectural pivot in the whole list so far — no `class` inheritance anywhere in the standard workflow. Game objects aren't subclassed types; they're built by handing `add()` an array of *component functions*, each of which mixes its behavior/data onto a returned object at runtime — genuinely closer to functional mixin composition than to OOP inheritance (Ursina/Phaser/Excalibur `Actor extends`) or to a struct-of-arrays ECS (yours). It's composition-over-inheritance taken to its logical endpoint in JS.

**Minimal example — window, loop, rectangle:**

```javascript
kaplay();

const box = add([
    rect(100, 100),      // renders as a rectangle
    pos(350, 250),       // has a position
    color(255, 60, 60),  // fill color
]);

onUpdate(() => {
    // game logic goes here, called automatically every frame
});
```

Game objects are composed from components — for instance, an object built from rect(40, 40) to render as a rectangle, pos(100, 200) for coordinates, area() for a collider, body() for physics response, and health(8) for hit points, all handed to add() as a flat array, with plain fields and tags mixed in the same array for associated data. No `class Player extends Actor` anywhere — you're composing behavior out of independent, swappable functions per object, decided per-instance rather than per-type.

**Drawing model:** Fully retained, same category as Phaser/Excalibur — `rect(100, 100)` returns a component that gets attached to the object returned by `add()`, and that object persists in KAPLAY's internal scene list until `destroy()`'d. You never call a draw function yourself. Where it diverges from Phaser/Excalibur is *how* the retained visual state is structured: instead of a monolithic Rectangle GameObject class or a GraphicsComponent holding one Graphic, the rect-ness is just one component function's contribution to a composed object — swap `rect()` for `sprite()` and the "same" object renders completely differently, with no subclass hierarchy involved at all.

**Loop model:** Global callback-driven, deliberately minimal — calling kaplay() imports all its functions (add(), onUpdate(), onKeyPress(), vec2(), etc.) to the global scope by default, or, opting out of globals, returns a context handle `k` you call methods on instead (`k.add()`, `k.onUpdate()`) — a nod toward module-safety without sacrificing the terse style. onUpdate() runs every frame — normally 60 times a second — and separately, per-object onUpdate() (like player.onUpdate()) scopes the callback to just that instance, letting you attach update logic either globally or narrowly per game object without ever writing a loop yourself. Events are similarly flat function calls: `onKeyPress`, `onCollide` (contributed by the `area()` component specifically, not a global system).

**Scalability / control tradeoffs:**
- **Ceiling:** WebGL-backed, comparable ballpark to Phaser — batches automatically for shared-texture sprites, fine for typical 2D indie-game object counts.
- **Object count:** This is KAPLAY's actual weak point for scale: every `add([...])` call runs through a component-mixing process at object-creation time, and per-frame iteration walks a flat list of composed objects checking for the presence of relevant component methods (duck-typing style) rather than anything resembling a packed SoA array grouped by component type. It's flexible per-object but structurally the *opposite* of cache-friendly bulk iteration — arguably a step below Phaser's Component-mixin classes in terms of raw scaling headroom, since KAPLAY optimizes for expressiveness/prototyping speed over throughput.
- **Escape hatches:** Custom components are just plain functions returning an object literal with lifecycle hooks (`add()`, `update()`, `draw()` methods on the returned object) — writing your own is trivial, but there's no lower-level "drop to raw batched GL buffer" path exposed the way Excalibur/Phaser expose their graphics context; KAPLAY's philosophy is staying at this abstraction level rather than offering graduated escape hatches.
- **Control:** Moderate-low, but distributed differently than the class-based engines — you have fine per-*object* control (arbitrarily mix components per instance, no fixed taxonomy) but very little control over *how* the engine iterates/batches/schedules those objects internally. This is a genuinely different flavor of "low control" than Ursina's or Phaser's: those hide loop ownership behind a fixed class hierarchy; KAPLAY hides it behind runtime composition instead.

**Relative to Jygame:** KAPLAY's `add([component, component, ...])` syntax reads almost like ECS shorthand, and it's worth being precise about why it isn't one: this is component *composition onto a single retained object instance* (classic Entity-Component pattern, one object per entity, components as mixed-in behavior) — not Entity-Component-*System* with data stored in typed arrays and systems iterating homogeneous component pools. It's the clearest possible real-world illustration of the ECS-vs-EC distinction for you: same vocabulary (`components`), fundamentally different memory layout and iteration story, which is exactly the axis your SoA architecture is optimizing against.

---

## Godot (GDScript, Node/SceneTree architecture)

**Architecture:** Godot is the outlier so far because it genuinely offers *both* paradigms natively, cleanly, at the API level — not as a workaround. It's a fully retained SceneTree of `Node`s (the engine's answer to Ursina's NodePath / Phaser's display list, but far more mature and central to everything: physics, audio, UI, and rendering all hang off Node), yet also exposes a real immediate-mode drawing callback per-node if you want it. This dual nature makes it the best single point of comparison for your retained-vs-immediate axis, since Godot lets you choose per-object rather than forcing an engine-wide philosophy.

**Retained approach — a persistent rectangle node:**

```gdscript
extends Control

func _ready():
    var rect = ColorRect.new()
    rect.color = Color(1, 0.24, 0.24)
    rect.position = Vector2(350, 250)
    rect.size = Vector2(100, 100)
    add_child(rect)
```

ColorRect is a class in Godot 4 for displaying a rectangle filled with a solid color, primarily used to create colorful backgrounds, panels, overlays, buttons, icons, and progress bars. This is a real scene-tree node — reparent it, tween it, query it by path (`$ColorRect`), mutate `.color` from anywhere, and it persists and redraws automatically forever, exactly like Ursina's `Entity` or Phaser's `Rectangle` GameObject. No loop, no draw call, ever, from you.

**Immediate approach — the same rectangle via a draw callback:**

```gdscript
extends Control

func _draw():
    draw_rect(Rect2(350, 250, 100, 100), Color(1, 0.24, 0.24))
```

A CanvasItem-derived script can define _draw() to call draw_rect() once per shape, with the engine invoking _draw() automatically whenever the node needs to redraw. Critically, `_draw()` is *not* called every frame like pygame's loop — Godot calls it once, caches the result, and only re-invokes it when you explicitly call `queue_redraw()` (older API: `update()`) to invalidate it. So this is immediate-mode *syntax* (you issue `draw_rect` calls yourself, nothing persists as an object) riding on a retained-mode *invalidation* trigger underneath — a genuine hybrid that none of the pure-immediate engines (pygame/raylib/LÖVE) or pure-retained engines (Ursina/Phaser) offer as a first-class option.

**Loop model:** Signal/callback-driven, SceneTree-owned, with a notably clean separation Godot enforces engine-wide: `_process(delta)` for per-frame variable-timestep logic, `_physics_process(delta)` for fixed-timestep physics, and `_draw()` for rendering — three distinct engine-invoked callbacks rather than the update/draw pairing most engines here use. Input and inter-node communication run through Godot's `Signal` system (a first-class pub/sub primitive, not an ad-hoc EventEmitter bolted on like Phaser's) — nodes emit signals, other nodes connect to them, fully decoupled, no polling anywhere in idiomatic Godot code.

**Scalability / control tradeoffs:**
- **Ceiling:** High — Godot 4's rendering backend (Vulkan, with GLES3 fallback) does real batching internally for 2D (`CanvasItem` draw calls sharing state get merged), and you can drop to `RenderingServer` for direct, node-free GPU resource manipulation if the Node overhead becomes the bottleneck.
- **Node count:** Same fundamental tax as every retained-node-tree engine (Ursina, Phaser, Excalibur) — each `Node` is a full engine object with signals, a transform, tree-traversal overhead, and (for scripted nodes) a GDScript/C# instance on top. Thousands of independently-scripted nodes each running their own `_process()` will bottleneck before the renderer does. Godot's own docs and community explicitly steer high-count-object games (bullet hells, particle-heavy sims) toward `MultiMeshInstance2D` (GPU instancing, one draw call for thousands of instances, no per-instance Node) or `RenderingServer` calls directly — i.e., Godot's own prescribed escape hatch from Node overhead is "stop using Nodes for this, go bulk/batched."
- **Escape hatches:** `RenderingServer` (direct canvas-item API below the Node layer), `MultiMeshInstance2D`/`MultiMesh` for instanced batch rendering, `_draw()` immediate calls for cheap non-interactive visuals that don't need individual Node identity, GDExtension (C++/Rust) for anything needing to bypass GDScript entirely.
- **Control:** Genuinely tunable per-object — you choose retained Node convenience or immediate `_draw()` economy per case, which is more granular control over the retained/immediate tradeoff than any other engine in this list gives you as a supported, idiomatic choice rather than a workaround.

**Relative to Jygame:** Godot's prescribed answer to "Node overhead doesn't scale" — `MultiMeshInstance2D`, i.e., abandon per-object Nodes for GPU-instanced batches keyed by shared mesh/material — is architecturally the same instinct your SoA/ECS approach encodes from the ground up: don't pay per-object dispatch cost for homogeneous things, batch them. The difference is when you pay that cost. Godot's is opt-in and bolted on for hot paths (most of a Godot game still runs full-Node overhead by default); Jygame's SoA/ECS makes the batched-by-default case the *only* case, with per-object Node-style flexibility as the thing you'd have to opt back into rather than the default you opt out of. Godot's `_draw()`-with-invalidation model is also worth stealing conceptually regardless of architecture — "immediate-mode call syntax, but only re-executed on `queue_redraw()`" is a genuinely different point in the design space than either pure-immediate (redraw every frame, no exceptions) or pure-retained (object persists, no draw calls at all) that you haven't hit yet in this comparison.

---

## Unity (C#)

**Architecture:** The canonical retained GameObject/Component engine most people already have in their head as "what a game engine looks like" — `GameObject` is a lightweight container, behavior/rendering/data attach as `Component`s (`Transform`, `MeshRenderer`, custom `MonoBehaviour` scripts), and a `Scene` holds the hierarchy. This is Entity-Component in its classical OOP form, same family as Excalibur/KAPLAY conceptually — but critically, Unity *also* ships a second, entirely separate architecture (DOTS/Entities, covered below) that is genuinely ECS in your sense of the word. Unity is really two engines wearing one editor.

**Minimal example — window, loop, rectangle (UI):**

```csharp
using UnityEngine;
using UnityEngine.UI;

public class BoxSpawner : MonoBehaviour
{
    void Start()
    {
        GameObject go = new GameObject("Box");
        RectTransform rt = go.AddComponent<RectTransform>();
        Image img = go.AddComponent<Image>();
        img.color = Color.red;

        rt.SetParent(canvasTransform, false);
        rt.sizeDelta = new Vector2(100, 100);
        rt.anchoredPosition = new Vector2(350, 250);
    }

    void Update()
    {
        // game logic goes here, called automatically every frame
    }
}
```

Or, for a world-space quad instead of UI: `GameObject.CreatePrimitive(PrimitiveType.Quad)` plus a material with a solid color shader. Either way — no window creation, no loop, nothing. Unity's editor/runtime owns the frame loop entirely; you never see it.

**Drawing model:** Fully retained, and structurally the most "hidden" of everything covered so far. Once you `AddComponent<Image>()` (or attach a `MeshRenderer`), the object is now the engine's problem — it gets culled, batched, and drawn by Unity's render pipeline (Built-in/URP/HDRP) every frame automatically, forever, until destroyed or disabled. You never write anything resembling a draw call. This is the same category as Ursina/Phaser/Godot's Node approach — but Unity additionally does aggressive automatic batching invisibly underneath: static batching, dynamic batching, and (for URP/HDRP) the SRP Batcher, which coalesces draw calls across GameObjects sharing a material/shader without you doing anything explicit like Phaser's `SpriteBatch` or LÖVE's `SpriteBatch` — it's opt-out, not opt-in.

**Loop model:** `MonoBehaviour` lifecycle callbacks — `Awake`, `Start`, `Update`, `FixedUpdate`, `LateUpdate` — invoked by Unity's engine loop on every component instance that defines them, discovered via reflection/registration at object creation, not manual wiring. This is the same shape as Godot's `_process`/`_physics_process` split (`Update` = variable timestep, `FixedUpdate` = physics-locked timestep), and the same "engine finds and calls your methods" pattern as Ursina's convention-detection — except Unity does it per-Component-instance via its message system rather than per-script-file convention.

**Scalability / control tradeoffs — this is where it gets directly relevant to you:**
- **Classical GameObject/MonoBehaviour path:** Same fundamental wall as every OOP retained engine here — each `GameObject` carries a `Transform`, component list, and per-instance `Update()` dispatched via Unity's internal reflection-based message loop. This scales to thousands of objects fine, strains hard past tens of thousands of independently-scripted `Update()` calls — the classic complaint that drove Unity to build something else entirely.
- **DOTS / Entities package — the "something else":** Unity's own answer to this wall is an actual Entity-Component-*System* architecture: entities are just IDs, components are stored in **Chunks** — contiguous memory blocks holding component data in a packed, SoA-adjacent layout (technically AoS-within-chunk but organized for cache-friendly `SystemBase`/`ISystem` iteration via the Burst compiler and the Job System for multithreaded, SIMD-vectorized bulk processing) — this is architecturally close kin to what you're building with Jygame, down to the explicit rejection of per-object script dispatch in favor of systems iterating homogeneous component arrays in bulk. Rectangle-drawing in DOTS would mean an `Entity` with a `LocalTransform` + rendering components processed by the Entities Graphics package, which uses GPU instancing (batched `DrawMeshInstanced`-style submission) rather than per-entity draw calls.
- **Escape hatches:** `Graphics.DrawMeshInstanced`/`DrawMeshInstancedIndirect` for manual GPU instancing outside both MonoBehaviour and DOTS; `GPU Resident Drawer` (newer Unity versions) for automatic instancing even on MonoBehaviour-based renderers; custom `ScriptableRenderPass` for pipeline-level control.
- **Control:** Deliberately layered — Unity gives you the high-control-cost/low-effort GameObject path by default, and an explicit, separate, lower-level opt-in (DOTS) when you need SoA-style throughput, rather than picking one philosophy engine-wide the way Godot/Phaser/Excalibur do.

**Relative to Jygame:** Unity DOTS is the closest real-world validation of your architectural bet that exists in this entire comparison — a major commercial engine concluding independently that per-object OOP dispatch doesn't scale and building a parallel SoA/chunk-based ECS with bulk system iteration as the answer, exactly the problem Jygame's ECS design solves from day one rather than bolting on after the fact. The meaningful difference is that Unity maintains *both* paradigms simultaneously as a design compromise (huge asset/plugin ecosystem depends on MonoBehaviour, so DOTS can't replace it, only supplement it) — Jygame, being greenfield, gets to make the SoA/ECS path the *only* path without carrying GameObject-era legacy weight. Worth noting too: DOTS explicitly separates data (components, pure structs) from logic (`SystemBase`, no state) in a way none of the JS/Python engines above attempt — that's the actual ECS discipline, versus KAPLAY's or Excalibur's looser "component" usage.

---

## Jygame (JavaScript)

**Architecture:** A from-scratch, SoA-layout ECS over a batching renderer that ships three backends behind one API — WebGPU (primary target), WebGL2, and plain Canvas2D fallback — all with the same `beginFrame`/`render(world)`/`endFrame` lifecycle and the same game code, chosen once by a resolver (`"auto"` walks the chain, or you force a backend). Unlike the retained-OOP engines (Ursina/Phaser/Excalibur), entities are just IDs and components are packed typed arrays (SoA) iterated in bulk by systems — the same instinct as Unity DOTS or Godot's `MultiMesh`, but as the *only* path rather than an opt-in hot-path escape. The class-based `Sprite` you actually touch is a thin ergonomic wrapper over an ECS entity, not the engine's model.

**Minimal example — window, loop, rectangle:**

```js
import { Game, Scene, Sprite } from "jygame";

class MainScene extends Scene {
  onEnter() {
    this.rect = new Sprite(350, 250, 100, 100);
    this.rect.style.fill = "#ff3c3c";   // a plain filled rectangle, no texture
  }

  update(dt) {
    // game logic goes here; dt = 1 / fps (fixed timestep, not wall-clock)
  }
}

const game = new Game({ width: 800, height: 600 });
game.run(new MainScene());
```

No `while` loop, no draw call, no `BeginDrawing`/`EndDrawing` pair. You declare the `Sprite` in `onEnter()` and it exists — persistently, on-screen, until destroyed. The engine's `RenderSystem` (priority 3 in the default world) scans the `Transform + Renderable + RenderBounds + Visible` table every tick, resolves each entity's asset through the `AssetRegistry`, and pushes a pooled command into the `RenderQueue`.

**Drawing model:** Retained-*data* — the phrase that separates it from both halves of this survey. Nothing is immediate in the pygame/raylib sense: absence of a draw call never means absence on screen. But unlike the retained-*object* engines, the persistent thing isn't a scene-graph node or a Game Object with mixed-in components — it's a row of plain numbers in typed arrays, and persistence comes from the entity ID, not from an object owning a draw method. The `Sprite` wrapper you hold is a view over that row; kill the entity and the wrapper throws. Render order is resolved data-driven at draw time: the queue sorts each command by `(layer, depth, insertion order)` — a two-tier depth sort in a single pooled buffer, closer in spirit to Phaser's per-object `depth` but keyed off component fields rather than a property you set on a class instance.

The renderer then draws the queue as instanced quads: one SoA instance buffer (position, size, color, UV, depth-as-z) flushed per batch, with interpolation baked in — the queue stores each command's *previous* and *current* tick position, and `applyAlpha(alpha)` blends between them in one allocation-free pass, so motion stays smooth on high-refresh displays while the authoritative simulation state is never mutated. On the GPU backends the world renders in a single pass that clears with the `RenderConfig` clear color, then batched sprites, trails (triangle-strip ribbons), and particles. Canvas2D — for users who pick that backend — is the only one that issues per-command `drawImage`/`fillRect` calls directly, sorted by the same `(layer, depth)` comparator.

The immediate layer is a deliberate hybrid, closest to Godot's `_draw()` but frame-scheduled rather than invalidation-based: `Scene.render(ctx)` and `Scene.renderUI(ctx)` hand you a raw Canvas2D context for non-entity drawing — the former composited *behind* the world, the latter *above* it — and `Scene.renderDOM()` returns HTML patched into a transparent DOM overlay for interface text. On GPU backends those 2D contexts are offscreen surfaces (two of them, background and foreground), uploaded and composited as textures only when something actually drew into them (a dirty flag), so the batched world path never touches canvas2D.

**Loop model:** Engine-owned and *fixed-timestep*, the opposite extreme from pygame's and raylib's user-owned loops and the same "engine finds and calls your methods" shape as Ursina/Phaser — but with an explicit decoupling the OOP engines typically hide: the simulation updates at a fixed `fps` (every `update(dt)` gets `dt = 1/fps`), the renderer refreshes at the monitor's rate, and `maxTicks` bounds how many catch-up updates a slow frame may run (default 5, a compromise between the `0`-spiral-of-death extreme and `1`-deterministic-but-laggy extreme). `interpolation` is a config flag that governs the alpha-blend pass; `autoPause` freezes the loop when the tab hides. Scene lifecycle is `onCreate` (once, world setup) → `onEnter` (may be `async` — asset loads are promise-based) → `update(dt)` → `pause`/`resume` (stack-level hiding) → `onExit`. Scenes stack, with `blocksUpdateBelow`/`blocksRenderBelow` controlling whether scenes beneath keep running.

**Scalability / control tradeoffs:**
- **Ceiling:** The highest in this survey's JS entries. WebGPU-first with instanced, single-batch sprite rendering, SoA storage buffers, and no per-entity draw submission — the throughput end of the tradeoff Excalibur (Canvas2D) and Phaser (per-GameObject dispatch) sit on the other side of. The composite layer and clear are single fullscreen passes, and the two-tier depth sort runs over a pooled array with no per-frame allocation.
- **Entity count:** The whole point. Data lives in packed arrays grouped by component type, so `RenderSystem` walks homogeneous tables and reads column strips (SoA), not per-object property chains — thousands to tens of thousands of entities at 60fps is the design target, not a lucky outcome. The tax paid elsewhere (Ursina/Phaser/KAPLAY per-object dispatch, Godot's per-Node `_process`, Unity's per-`MonoBehaviour` reflection loop) is structurally absent: there is no per-entity script or method dispatch in the render path at all.
- **Escape hatches:** Graduated, and unusual for the ECS family — `render(ctx)`/`renderUI(ctx)` give you raw 2D contexts for canvas work that isn't entity-shaped (a custom parallax wash, a flash effect, debug overlays), and `renderDOM()` a real DOM layer for interface text; `game.ctx` exposes the foreground context directly. Below the facade, the ECS is fully exposed — you can write your own `System`s, register components with SoA schemas, or hand the game any custom `Renderer` instance implementing the lifecycle — so the batched path is not a wall, it's the default you'd have to deliberately step around.
- **Control:** High on data and rendering (you own the component schemas, the sort fields, the renderer choice, the timestep configuration), lower on the loop itself — like Phaser/Ursina/Excalibur, the frame loop, tick scheduling, and render traversal are engine-owned. The distinctive trade is that the control you *do* get is over bulk data and pipeline configuration rather than per-object lifecycle, which is the ECS bargain: you give up the per-entity class ceremony to keep the array-of-structs throughput.

**Where it sits in this comparison:** Jygame is the "retained-*data*" pole, deliberately opposite the immediate trio (pygame/raylib/LÖVE) and the retained-*object* class (Ursina/Phaser/Excalibur/KAPLAY) — architecturally the same bet as Unity DOTS and Godot's batching escape hatches, but greenfield, so the SoA/ECS path is the *only* path rather than a supplement bolted onto an OOP core. Its one nod to immediate mode — the behind/above-world `render`/`renderUI` canvas hooks — is the Godot `_draw()` hybrid idea executed on a frame schedule instead of invalidation. The honest comparison against every engine above: where the others trade per-object overhead for structure or transparency, Jygame trades per-object *identity* (there is no scene-graph node to reach into) for bulk iteration — and that's a real cost, not a free win, which the retained-OOP engines are better at.
