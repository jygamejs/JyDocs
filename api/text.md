---
title: Text
---

# Text

`Text` is the retained, world-space text object. Where [`Font.render(ctx, ...)`](font.md#drawing-with-a-bitmap-font) draws immediately into a 2D context — screen-space, behind or above the world, with no z-order — a `Text` is an **entity**: it lives in the scene's ECS, sorts by `layer` and `depth` alongside sprites, interpolates with the render queue, and renders in one of two selectable representations — by default the whole string is composited into **one rasterized bitmap** drawn with a single textured quad on every backend. It is the engine's answer to "text that behaves like every other renderable."

```js
import { Game, Scene, Text, Font } from "jygame";

const font = await Font.load("spr", {
  image: "assets/spr_font.png",
  characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.?!,[]:",
  gridX: 10,
  gridY: 11,
});

const label = new Text(350, 100, font, "SCORE 0");
label.color = "#ffe600";
label.align = "center";
```

Once created, the text exists in the world until you `destroy()` it. You mutate it through `.value`, `.color`, `.align`, and the engine redraws it — there is no draw call to issue in `render()` or `renderUI()`.

## The essentials

| Call | What it does |
|------|--------------|
| `new Text(x, y, font, content)` | Create a text entity at `(x, y)` using a loaded font |
| `text.value = "..."` | Change the string |
| `text.color` / `text.align` / `text.letterSpacing` | Style it |
| `text.renderMode` | Choose the rendering representation — see [Rendering representations](#rendering-representations) |

```js
const score = new Text(400, 30, font, "SCORE 0");
score.align = "center";

// later, whenever the score changes:
score.value = `SCORE ${points}`;
```

A `Text` is not a canvas draw — it is a small ECS entity (a `Transform`, a `Renderable`, a `Visible`, and a `Text` component) that produces the rendered text from a shared cached layout, using either the rasterized or the glyph representation. Changing it is cheap: content and layout are cached, and the final representation is only rebuilt when something actually changed.

## Rendering representations

`Text` can be rendered using two representations, selected with `text.renderMode`:

| Value | Constant | Meaning |
|-------|----------|---------|
| `"raster"` / `"rasterized"` | `TextRenderMode.RASTERIZED` (default) | The text is composed into a single bitmap before rendering. Best for static or infrequently changing text; minimizes render work — one quad. |
| `"glyph"` | `TextRenderMode.GLYPH` | Glyphs remain individually renderable primitives. Best for animated text and effects that operate per character. |

```js
import { Text, TextRenderMode } from "jygame";

const staticLabel = new Text(100, 100, font, "Score: 0");      // rasterized (default)
const dynamic = new Text(100, 150, font, "Level 1", {
  renderMode: TextRenderMode.GLYPH,
});

dynamic.renderMode = TextRenderMode.GLYPH;   // select the glyph representation
staticLabel.renderMode = "raster";           // back to the cached bitmap
```

Both modes share the entire pipeline until the final representation: the same `Font`/`GlyphRecord` contract, the same `TextLayout` (positions, alignment, advances, offsets, width, height), the same `Transform`, `Renderable`, `Visible`, and `Text` API. They differ **only** in how the shared layout is drawn:

```text
Text
 │
 └─ TextLayout (shared, renderer-independent)
     ├── RASTERIZED → TextRasterizer → one cached surface → one RenderQueue command
     └── GLYPH      → GlyphRenderer  → per-glyph commands → batched rendering
```

Switching `renderMode` is cheap: it only selects the representation. It never rebuilds the layout or the rasterized surface — toggling back to `RASTERIZED` reuses the existing cached bitmap. Changing the layout (content, font, alignment, letter spacing) invalidates both representations together; a color change invalidates the rasterized surface only.

The glyph mode is what the engine needs for future **per-glyph animation** (typewriter effects, per-character reveal, wave or bounce, per-glyph color/rotation/scale). That animation is not implemented yet — this mode establishes the representation that will make it possible without another architectural split. Rasterized text optimizes for minimizing render work; glyph text optimizes for retaining per-glyph control.

## `new Text(x, y, font, content, options)`

Creates the entity in the scene's world. `font` is required and can be a **registered font name** or a `Font` instance; `content` defaults to `""`. The position is the text's **anchor** — the exact meaning depends on `align` (see [Alignment](#align)).

```js
const t = new Text(100, 100, "spr", "hello");   // by registered name
const t2 = new Text(100, 120, font, "hello");   // by Font instance
```

The optional `options` object applies initial styling in one call:

| Option | Type | Default | Meaning |
|--------|------|---------|---------|
| `color` | `string` \| `number` \| `null` | `null` | The text color — `null` (or omitted) keeps the font's natural colors, any hex explicitly tints — see [`color`](#color) |
| `align` | `"left"` \| `"center"` \| `"right"` | `"left"` | How glyphs arrange around the anchor |
| `letterSpacing` | `number` | `0` | Extra horizontal space between every glyph |
| `layer` | `number` | `Layer.WORLD` | The render layer band |
| `depth` | `number` | `0` | The sort value within the layer |
| `scale` | `number` \| `{ x, y }` | `1` | Uniform or per-axis scale of the glyphs |
| `visible` | `boolean` | `true` | Start hidden or shown |
| `renderMode` | `TextRenderMode` | `TextRenderMode.RASTERIZED` | The rendering representation — see [Rendering representations](#rendering-representations) |

```js
const title = new Text(400, 50, font, "LEVEL 1", {
  align: "center",
  color: "#ffe600",
  depth: 10,
});
```

## Fonts — bitmap only

`Text` draws with **bitmap fonts**. The font must be loaded through `Font.load()` (see [the Font facade](font.md)) — pass its registered name or the `Font` instance — and it must be a bitmap font (`gridX`/`gridY` or `separator` slicing). Native system fonts are not supported for world-space text yet:

```js
const t = new Text(0, 0, "spr", "hi");   // ok — "spr" is a bitmap font

const native = await Font.load("System", "/fonts/Inter.ttf");
new Text(0, 0, native, "hi");
// Error: Text: native fonts are not supported for world-space text yet.
// Use Font.render(ctx, ...) in renderUI()/render() for native font drawing.
```

A name that was never loaded throws too: `Text: font "nope" not found. Load it with Font.load() before creating Text.`

For native text — where a `Text` entity isn't needed, or the text is pure UI — keep using `Font.render(ctx, text, x, y, options)` inside `renderUI(ctx)` or `render(ctx)`.

## Changing the string — `value`, `text`, `string`

Three aliases for the same property:

| Member | Meaning |
|--------|---------|
| `value` | The string content (get/set) |
| `text` | Alias of `value` |
| `string` | Alias of `value` |

```js
label.value = "SCORE 120";
label.text = "SCORE 120";    // same thing
label.string = "SCORE 120";  // same thing
```

Setting the value marks the text as changed, and the engine **re-rasterizes** the bitmap the next time the world updates. Rebuilding only happens on an actual change — if nothing touched the text, the cached bitmap is reused and one command is emitted.

## Styling

### `color`

The text color, as a hex string or number. It is an **explicit override**: the moment you set it, the glyphs are recolored to that color at rasterization time using the same tint machinery as `Font.render(ctx, { color })` — which means the font's `colors` option still applies: if the font defines which pixels are the glyph body, only those get recolored and shading is preserved.

```js
label.color = "#ffe600";     // hex string
label.color = 0x00ff00;      // or a number
label.color;                 // "#00ff00" — the active override
```

Setting `color` back to `null` returns the text to the **font's natural colors**:

```js
label.color = null;          // back to the glyphs as sliced from the font image
label.color;                 // null
```

Unset (default) and explicitly-`null` are the same state: the font's own pixels, no tint. Every other value — including `"#ffffff"` — is a real override, so you *can* force pure-white text from a colored font:

### `align`

How the glyphs sit relative to the anchor point `(x, y)`:

| Value | Behavior |
|-------|----------|
| `"left"` | The text starts at the anchor — glyphs extend right |
| `"center"` | The text is centered on the anchor |
| `"right"` | The text ends at the anchor — glyphs extend left |

```js
label.align = "center";   // "left" | "center" | "right"
```

Accepting `0` / `1` / `2` for the same three values.

### `letterSpacing`

Extra horizontal space added after every glyph, in pixels. Defaults to `0`. Useful for titles and UI where the default spacing is too tight:

```js
title.letterSpacing = 2;
```

## Position & transform

A `Text` carries a full `Transform`, so it moves, rotates, and scales like any entity. The transform's `(x, y)` is the **anchor** point the text aligns around — unlike a sprite, it is not the top-left corner and not the center by default; `align` decides.

| Member | Type | Meaning |
|--------|------|---------|
| `x`, `y` | `number` | Anchor position (get/set) |
| `angle` | `number` | Rotation in radians around the anchor |
| `scale` | `number` \| `{ x, y }` | Uniform or per-axis scale of the whole text |

```js
label.x = 400;
label.angle += 0.01;          // spin around the anchor
label.scale = { x: 2, y: 2 }; // or label.scale = 2
```

Scale and rotation apply to the whole rasterized text as a unit at draw time — they never re-rasterize the bitmap, so a large `scale` scales the entire string (spacing included) without glyph overlap.

## Layering

Because the text is one `RenderQueue` command, it sorts with the same `(layer, depth)` keys as sprites — a `Text` can sit behind, between, or in front of sprites, and its `layer` picks the band: `Layer.WORLD` by default, `Layer.UI` for overlay text that should sit above gameplay. There is no "text is always on top" rule.

```js
label.depth = 5;          // draw above sprites at depth < 5 on this layer
label.layer = Layer.UI;   // or move it to the UI band entirely
```

## Measuring — `width`, `height`

The laid-out text size, read back from the cached layout. `width` spans the whole string regardless of `align`; `height` is the tallest glyph in the string.

```js
label.width;    // e.g. 96 for "SCORE 0" at this font/scale
label.height;   // e.g. 12
```

Both are `0` while the text is empty. Note the size is the **glyph box** extent, not the font's line height.

## Visibility

| Member | Type | Meaning |
|--------|------|---------|
| `visible` | `boolean` | Whether the text is drawn (get/set) |

```js
label.visible = false;   // hide, keep state
```

Invisible text is skipped by the render system entirely — no command is emitted.

## `world` & `entity`

| Member | Type | Meaning |
|--------|------|---------|
| `world` | `World` | The ECS world the text lives in |
| `entity` | `number` | The underlying entity id |

Useful when you need the raw ECS row — e.g. to add extra components to the text's entity, or to query it from a custom system.

## `destroy()`

Removes the text from the world and returns its pooled content slot for reuse. After `destroy()`, any access to the text throws.

```js
label.destroy();
```

A `Text` created inside a scene is cleaned up with the scene's world; `destroy()` is for removing an individual label early. Destroying the entity through the ECS directly releases the pool slot too.

## How it works

A `Text` entity renders in the representation its `renderMode` selects (see [Rendering representations](#rendering-representations)). In `RASTERIZED` mode it is **one texture, one region, one `RenderQueue` command** — however many glyphs it has. The whole string is rasterized into a single cached bitmap when its *visual* state changes, and that bitmap is drawn as one quad every frame after that. "Score: 0" and a page of dialogue each cost the renderer a single command. In `GLYPH` mode each glyph is its own command, batched by the renderers; both modes share the same cached layout.

Four pieces work together:

- **`TextResourcePool`** — a handle-based pool owning each text's content, its cached **layout**, and its cached **rasterized surface**. Creating a `Text` allocates a slot; destroying it returns the slot (surface, layout, and content together) for reuse. Two versions are tracked per slot — the layout version and the surface version — so the two caches invalidate independently.
- **`TextLayout`** — the renderer-independent layout stage. It consumes the font's **glyph records** (`getGlyph` — never a concrete image representation) and refills the cached layout in place: the stable glyph records, their surface-local positions, `drawX`, `width`, and `height`. It performs no canvas operations, so the same layout code works whether the glyphs' regions point at individual canvases, a shared atlas, or any future backing.
- **`TextSystem`** — runs after the render queue is cleared (priority 4, after `RenderSystem`'s clear). For each visible text entity it:
  1. recomputes the shared **layout** only when `Text.version` changed (content, font, alignment, letter spacing);
  2. dispatches to the representation chosen by `Text.renderMode`:
     - **RASTERIZED** — re-rasterizes the **surface** only when `Text.surfaceVersion` changed (a color change or a fresh layout), then emits **exactly one** command;
     - **GLYPH** — fills a reusable `GlyphBuffer` from the layout and emits one command per glyph (no surface involved).
  3. `layer`/`depth`/`imageSmoothing` come from `Renderable`, the transform from `Transform`, plus interpolation endpoints — identical for both modes.
- **`TextRasterizer`** — the one place glyphs are drawn into the surface. It consumes each layout placement's glyph record — its `region` (`sourceImage`, `sx`, `sy`, `sw`, `sh`) — so it never cares whether those regions point at individual canvases, a shared atlas, or anything else. Color is applied here, at rasterization time: with `colorEnabled` the glyph bodies are tinted (through the font's own `colors` gate) as they're blitted into the surface.
- **The font** — each glyph is a **glyph record**: a renderable `region` (`{ sourceImage, sx, sy, sw, sh }`) plus `advance` (and `offsetX`/`offsetY`). Layout advances by `font.advance(ch) + letterSpacing`, honoring the font's `spacing` and `spaceWidth`; the region's `sourceImage` is whatever backs the glyph — an implementation detail of the font provider (see [Bitmap glyphs](font.md#bitmap-glyphs)).

Invalidation is per-visual-change, not per-mutation: `value`/`font`/`align`/`letterSpacing` rebuild the shared layout (and therefore the rasterized surface); `color` rebuilds only the surface (positions are unchanged); `renderMode` rebuilds nothing — it only selects the representation; position/rotation/scale/layer/depth/visibility never rebuild anything — they are applied at draw time. Unchanged text is therefore zero work: in `RASTERIZED` mode the cached surface is reused and one command is emitted; in `GLYPH` mode the cached layout is refilled into the reusable glyph buffer.

Because the text is one command in the same queue as sprites, everything sprites get applies to it: the `(layer, depth)` sort, culling, pixel-perfect rounding, interpolation between ticks, and — on the GPU backends — instanced quad batching. The renderers never see glyphs; they draw one texture, which is also why an atlas-backed font (all glyph regions sharing one source) or a future GPU-native font representation slots in with no changes to the Text API, the component, or the renderer.

### The glyph-record contract and the glyph renderer

The font ↔ layout ↔ renderer seam is a deliberate contract, not an accident:

> **`BitmapFont` exposes glyph records, not glyph images. A glyph record contains a source region and font metrics. The source region may currently reference an individual glyph canvas, but the contract also supports multiple glyphs sharing a single atlas. Consumers must depend only on the region/metrics contract.**

Two renderers consume those records, selected by `Text.renderMode`:

```text
BitmapFont
    ↓
GlyphRecord
    ↓
TextLayout
    ↓
    ├── TextRasterizer        ← RASTERIZED mode (default)
    │       ↓
    │   cached text surface   ← one RenderQueue command
    │
    └── GlyphRenderer         ← GLYPH mode
            ↓
        glyph instances       ← per-glyph RenderQueue commands
            ↓
        batched rendering
```

The rasterized renderer copies each glyph region into the text surface; the glyph renderer submits each glyph region directly. Both consume the same records and the same `TextLayout` — neither assumes a Canvas or that `region.sourceImage` is the whole glyph. The two representations have different strengths: **rasterized text** minimizes render work (one quad per string), while **glyph text** retains per-glyph control.

What remains future work is **per-glyph animation** — typewriter effects, per-character reveal, wave/bounce, per-glyph color/rotation/scale — which will build directly on the glyph representation:

```text
TextLayout
    ↓
GlyphBuffer
    ↓
per-glyph animation        ← future work
    ↓
GPU instance data
    ↓
batched text rendering
```

The `renderMode` switch is the architectural seam that makes that possible without another redesign. When it lands, it is a change to the glyph path only — `TextLayout`, `TextRasterizer`, the `Text` component, and the public `Text` API are unaffected.

## Reference

These names are exported from `jygame`:

| Export | Type | What it is |
|--------|------|-----------|
| `Text` | class | The facade you use — `new Text(x, y, font, content, options)` |
| `TextComponent` | component | The SoA component schema (`fontHandle`, `contentHandle`, `align`, `letterSpacing`, `version`, `colorEnabled`, `surfaceVersion`, `renderMode`) |
| `TextRenderMode` | constants | `RASTERIZED` (0) and `GLYPH` (1) |
| `TextSystem` | system | Coordinates layout + representation dispatch, emits the text's `RenderQueue` commands (priority 4) |
| `TextResourcePool` | resource | The content/layout/surface pool, set as a world resource by `Text` |

There is also a `Font.byId(id)` lookup on the [Font facade](font.md) that `TextSystem` uses to resolve a stored `fontHandle` back to a font — you don't normally need it, but it is there for custom systems that read text entities directly.
