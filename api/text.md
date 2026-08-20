---
title: Text
---

# Text

`Text` is the retained, world-space text object. Where [`Font.render(ctx, ...)`](font.md#drawing-with-a-bitmap-font) draws immediately into a 2D context — screen-space, behind or above the world, with no z-order — a `Text` behaves like any other object in the scene: it follows the camera, sorts by `layer` and `depth` alongside sprites, interpolates, and re-renders itself automatically when you change it. It is the engine's answer to "text that behaves like every other renderable."

```js
import { Text, Font } from "jygame";

const font = await Font.load("spr", {
  image: "grid.png",
  characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.?!,[]:",
  gridX: 10,
  gridY: 11,
});

const label = new Text(350, 100, font, "SCORE 0");
label.color = "#ffe600";
label.align = "center";
```

Once created, the text exists in the scene until you `destroy()` it. You mutate it through `.value`, `.color`, `.align`, and the engine redraws it — there is no draw call to issue in `render()` or `renderUI()`.

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

A `Text` is not a canvas draw — it's a scene object. Changing it is cheap: the rendered text is cached, and only rebuilt when something actually changed.

## `new Text(x, y, font, content, options)`

Creates the text in the scene's world. `font` is required and can be a **registered font name** or a `Font` instance; `content` defaults to `""`. The position is the text's **anchor** — the exact meaning depends on `align` (see [Alignment](#align)).

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
| `scale` | `number` \| `{ x, y }` | `1` | Uniform or per-axis scale of the text |
| `fontSize` | `number` | `16` | Logical pixel size for **native** retained text — the size the text is drawn at before `scale`. Ignored by bitmap fonts (their glyphs are a fixed pixel size) |
| `visible` | `boolean` | `true` | Start hidden or shown |
| `renderMode` | `"glyph"` \| `"raster"` \| `TextRenderMode` | auto | The rendering representation — chosen automatically from the font (`glyph` for bitmap, `raster` for native) unless given explicitly — see [Rendering representations](#rendering-representations) |

```js
const title = new Text(400, 50, font, "LEVEL 1", {
  align: "center",
  color: "#ffe600",
  depth: 10,
});
```

## Fonts — bitmap and native

`Text` draws with **bitmap fonts** in glyph mode and with **either** a bitmap or a **native** font in raster mode. Which combinations are valid is declared by the font's capabilities, and `Text` enforces them — an unsupported combination throws instead of silently falling back:

| Font | `TextRenderMode.GLYPH` | `TextRenderMode.RASTERIZED` |
|------|:---:|:---:|
| `BitmapFont` | ✓ | ✓ |
| `NativeFont` | ✗ | ✓ |

```js
const ink = await Font.load("Ink", { image: "ink.png", characters: "…", gridX: 16, gridY: 4 });
new Text(0, 0, ink, "Score: 0");                                     // ok — auto: bitmap → glyph
new Text(0, 0, ink, "Score: 0", { renderMode: "raster" });            // ok — explicit raster

const native = await Font.load("System", "Inter.ttf");
new Text(0, 0, native, "Score: 0");                                   // ok — auto: native → raster
new Text(0, 0, native, "Score: 0", { renderMode: "raster" });         // ok — explicit raster
new Text(0, 0, native, "Score: 0", { renderMode: "glyph" });
// Error: Text: font "System" does not support render mode "glyph".
```

Without a `renderMode` option the mode is chosen **automatically** from the font: a bitmap font defaults to `GLYPH`, a native font (which cannot render per-glyph) to `RASTERIZED`. An explicit `renderMode` is a deliberate override — such as a bitmap font in raster mode — and is validated like any other; an unsupported combination throws. A font that was never loaded throws too: `Text: font "nope" not found. Load it with Font.load() before creating Text.`

Native fonts still work through the immediate `Font.render(ctx, text, x, y, options)` inside `renderUI(ctx)` / `render(ctx)` for pure UI text that doesn't need an entity.

## Rendering representations

`Text` renders in one of two representations, selected with `text.renderMode`. Without an explicit `renderMode`, the mode is chosen automatically from the font — `"glyph"` for a bitmap font, `"raster"` for a native font. The value accepts a string name or its `TextRenderMode` constant — the string resolves to the constant automatically:

| Value | Constant | Meaning |
|-------|----------|---------|
| `"glyph"` | `TextRenderMode.GLYPH` | Each character stays an individually drawable unit. Best for text that will animate per character. |
| `"raster"` / `"rasterized"` | `TextRenderMode.RASTERIZED` | The whole string is composed into a single image before drawing. Best for static or infrequently changing text; least render work — one drawable. |

```js
import { Text, TextRenderMode } from "jygame";

const dynamic = new Text(100, 150, font, "Level 1");            // bitmap font → glyph (auto)
const nativeLabel = new Text(100, 120, "Pixel", "Score: 0");    // native font → raster (auto)
const staticLabel = new Text(100, 100, font, "Score: 0", {
  renderMode: "raster",                                          // explicit — or TextRenderMode.RASTERIZED
});

dynamic.renderMode = "glyph";      // same as TextRenderMode.GLYPH
staticLabel.renderMode = "raster"; // same as TextRenderMode.RASTERIZED
```

Both modes share the same font and the same geometry — they differ only in how the string is drawn. Switching `renderMode` is cheap: it only selects the representation, never rebuilds the text, and switching back to `"raster"` reuses the previously cached image. Changing the string, font, alignment, or letter spacing invalidates both representations together; a `color` change re-renders the image only.

Glyph mode is the foundation for future **per-glyph animation** (typewriter effects, per-character reveal, wave or bounce, per-glyph color/rotation/scale). Rasterized text minimizes render work; glyph text keeps every character individually addressable.

```text
NativeFont + RASTERIZED          BitmapFont + GLYPH
  browser font rasterization       pre-baked glyph regions
  cached as an image               per-glyph representation
  one drawable                     batched rendering
  re-renders on change             foundation for per-character animation
```

A native font in raster mode costs more to rebuild than a bitmap font: the browser rasterizes the string, so the image is re-measured and re-drawn whenever the text or style changes. It is ideal for labels that change rarely (`"SCORE 0"`); for per-frame text prefer a bitmap font in glyph mode.

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

Setting the value marks the text as changed, and the engine redraws it the next time the world updates. Rebuilding only happens on an actual change — if nothing touched the text, the cached result is reused.

## Styling

### `color`

The text color, as a hex string or number. It is an **explicit override**: the moment you set it, the glyphs are recolored to that color using the same tinting as `Font.render(ctx, { color })` — which means the font's `colors` option still applies: if the font defines which pixels are the glyph body, only those get recolored and shading is preserved.

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

Unset (default) and explicitly-`null` are the same state: the font's own pixels, no tint. Every other value — including `"#ffffff"` — is a real override, so you *can* force pure-white text from a colored font.

For a **native** font the color is applied directly while drawing — there are no glyph pixels to tint, so `"#ffffff"` genuinely produces white, and `color = null` falls back to the default white text. A color change re-renders the text without re-measuring it.

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

For bitmap fonts it widens every glyph advance. Native fonts are measured as a single string, so `letterSpacing` only widens the advance used for centering/right-aligning — per-letter spacing is not applied to native text.

## Position & transform

A `Text` moves, rotates, and scales like any scene object. The transform's `(x, y)` is the **anchor** point the text aligns around — unlike a sprite, it is not the top-left corner and not the center by default; `align` decides.

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

Scale and rotation apply to the whole text as a unit at draw time — they never re-render it, so a large `scale` scales the entire string (spacing included) without glyph overlap.

## Layering

A `Text` sorts with the same `(layer, depth)` keys as sprites, so it can sit behind, between, or in front of them, and its `layer` picks the band: `Layer.WORLD` by default, `Layer.UI` for overlay text that should sit above gameplay. There is no "text is always on top" rule.

```js
label.depth = 5;          // draw above sprites at depth < 5 on this layer
label.layer = Layer.UI;   // or move it to the UI band entirely
```

## Measuring — `width`, `height`

The drawn text size. `width` spans the whole string regardless of `align`; `height` is the tallest glyph in the string. For a native font both come from the measured Canvas2D text metrics, scaled by `fontSize`.

```js
label.width;    // e.g. 96 for "SCORE 0" at this font/scale
label.height;   // e.g. 12
```

Both are `0` while the text is empty. Note the size is the glyph extent, not the font's line height.

## Visibility

| Member | Type | Meaning |
|--------|------|---------|
| `visible` | `boolean` | Whether the text is drawn (get/set) |

```js
label.visible = false;   // hide, keep state
```

Invisible text is skipped entirely — nothing is drawn.

## Caching & re-rendering

A `Text` caches what it draws. Nothing re-renders until something actually changes:

| You change | What happens |
|------------|--------------|
| `value`, `font`, `align`, `letterSpacing`, `fontSize` | The text is re-measured and re-rendered |
| `color` | Re-rendered with the new color — the measured size is unchanged |
| `x`, `y`, `angle`, `scale`, `layer`, `depth`, `visible` | Nothing re-renders — applied at draw time |

Unchanged text is therefore zero work: the cached result is drawn as-is. Because a `Text` lives in the same scene as sprites, it gets everything sprites get — `(layer, depth)` sorting, culling, interpolation between ticks, and pixel-perfect rounding.

## `world` & `entity`

Every `Text` is backed by an ECS entity. `text.world` is the world it lives in and `text.entity` its entity id. You rarely need them; they exist for advanced cases like attaching extra components to the same entity or reading the text from your own systems.

## `destroy()`

Removes the text and frees its resources. After `destroy()`, any access to the text throws.

```js
label.destroy();
```

A `Text` created inside a scene is cleaned up when the scene exits; `destroy()` is for removing an individual label early.