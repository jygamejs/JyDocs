---
title: Font
---

# Font

`Font` is the facade for text. It is a global singleton like `Input` — no instances, no wiring — and it loads two very different kinds of font:

- **Native** fonts — `.ttf`/`.otf`/`.woff` files registered with the browser via the `FontFace` API, drawn with the standard canvas text methods.
- **Bitmap** fonts — an image sliced into glyphs, drawn by the engine (`render()`) with scaling, tinting, and alignment built in.

```js
import { Font } from "jygame";

// Native — use it with the canvas API:
const pixel = await Font.load("Pixel", "assets/fonts/pixel.ttf");
ctx.font = "24px Pixel";
ctx.fillText("Score", 10, 30);

// Bitmap — the engine draws it for you:
const ink = await Font.load("Ink", {
  image: "assets/fonts/ink.png",
  characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!? ",
  gridX: 16,
  gridY: 4,
});
ink.render(ctx, "Score: 100", 10, 60, { color: "#ffcc00", scale: 2 });
```

Everything is cached by name — loading the same font twice returns the same object, no second fetch. Which kind a name refers to is fixed once loaded; the returned object exposes `kind` (`"native"` or `"bitmap"`).

## `Font.load(...)`

The same call handles both kinds. Give a name + a path for a native font, or a name + a config for a bitmap font. All forms return the cached font on repeat calls.

### Native — `load(name, path)`

```js
const font = await Font.load("Pixel", "assets/fonts/pixel.ttf");
```

Loading registers the family with the browser (awaiting its `FontFace` load). The returned **`NativeFont`** is a thin descriptor — draw with the canvas API directly:

| Member | Type | Meaning |
|--------|------|---------|
| `name` | `string` | The registry key you loaded it under |
| `kind` | `string` | `"native"` |
| `family` | `string` | The font family name (= `name`) for `ctx.font` |

```js
const pixel = await Font.load("Pixel", "assets/fonts/pixel.ttf");
ctx.font = `24px ${pixel.family}`;
ctx.fillText("Hello", 10, 40);
```

### Bitmap — `load(name, config)`

Loads an image and slices it into glyphs. The config names the image, the character set (in glyph order), and **one** slicing strategy:

```js
const ink = await Font.load("Ink", {
  image: "assets/fonts/ink.png",
  characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!? ",
  gridX: 16,          // 16 columns…
  gridY: 4,           // …and 4 rows of glyphs
});
```

| Option | Type | Default | Meaning |
|--------|------|---------|---------|
| `image` | `string` | — | Path to the glyph image (**required**) |
| `characters` | `string` | — | Every glyph, in the order they appear in the image (**required**) |
| `gridX` / `gridY` | `number` | — | Slice the image into a uniform `gridX` × `gridY` grid; cell size = image ÷ grid |
| `separator` | `string` | — | A color (`#RGB`, `#RRGGBB`, `rgb()`/`rgba()`) marking vertical glyph dividers |
| `spacing` | `number` | `0` | Extra horizontal advance after every glyph |
| `spaceWidth` | `number` | widest glyph | Advance for the space character |
| `background` | `string` | — | A color (`#RGB`, `#RRGGBB`, `rgb()`/`rgba()`) treated as transparent — a chroma key for fonts with an opaque background |
| `colors` | `string` \| `string[]` | — | The glyph body color(s) that `render()`'s `color` tint replaces; every other pixel (shadows, outlines, bevels) is left untouched |
| `caseInsensitive` | `boolean` | `false` | When rendering, fall back to the other case if a character has no glyph |

`background` lets you use older font images that have an opaque background instead of transparency. Its color is ignored during slicing (so it doesn't inflate glyph boxes) and cleared from each sliced glyph — so nothing draws as a black block, and `render()`'s `color` tinting hits only the actual glyph shape. `caseInsensitive` is for fonts that contain a single case: with it on, `"Hello world"` renders correctly from a `characters` set that only has `"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.?!,[]:"`.

`colors` is for fonts whose glyphs carry shading (a drop shadow, an outline, a bevel). By default tinting recolors every opaque pixel, which would flatten the shading into a solid shape — listing the glyph body's colors instead tells the engine exactly which pixels to touch, so the shading survives tinting no matter how many colors it uses. A single color can be given as a bare string (`colors: "#FF0000"`) instead of an array.

Exactly one slicing strategy is required — `gridX`/`gridY` **or** `separator`. Both, neither, or a single grid axis throw a descriptive error.

#### Grid slicing

The image is a uniform grid. `characters` are assigned left → right, top → bottom, and must fit within `gridX × gridY` cells:

```js
// 2 columns × 1 row → "A B"
const font = await Font.load("Grid", {
  image: "grid.png",
  characters: "AB",
  gridX: 2,
  gridY: 1,
});
```

Here's a real grid font — `spr_font.png`, a `10 × 11` grid of `12 × 12` cells covering the full 110-character set:

<img src="/spr_font.png" alt="spr_font.png — a 10 × 11 grid of glyphs" width="480" class="pixel-art" />

```js
const font = await Font.load("spr", {
  image: "assets/spr_font.png",
  characters: " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$￠€£¥¤+-*/÷=%‰\"'#@&_(),.;:¿?¡!\\|{}<>[]§¶µ`^~©®™",
  gridX: 10,
  gridY: 11,
  colors: "#FFFFFF"
});

font.render(ctx, "Hello, World!", 350, 100, { scale: 3, color: "#ffe600" });
```

`spr_font.png`'s glyphs carry a light-gray drop shadow, so when tinting this font list the glyph body's colors in a `colors` option — the shadow is then left untouched (see the option table below).

#### Separator slicing

A vertical line of the `separator` color divides glyphs, like a sprite sheet separated by colored gutters. The engine finds the content bounds, splits at every separator column, and trims each glyph to its opaque pixels — so glyphs of different widths work naturally. The number of glyphs found must equal `characters.length`.

Here's a real font made this way — `font.png`, one row of 4-pixel-wide red glyphs separated by `rgb(127, 127, 127)` gutters:

<img src="/font.png" alt="font.png — red glyphs separated by rgb(127, 127, 127) divider columns" width="633" class="pixel-art" />

```js
const font = await Font.load("Sep", {
  image: "assets/font.png",
  characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.?!,[]:",
  separator: "#7F7F7F",   // the gray gutters between glyphs
  background: "#000000",  // the font's opaque background, treated as transparent
  caseInsensitive: true,  // "Hello, World!" renders from the uppercase-only set
  spacing: 2,             // extra pixels between glyphs
});

font.render(ctx, "Hello, World!", 350, 100, { scale: 3, color: "#ffe600" });
```

### Drawing with a bitmap font

A **`BitmapFont`** draws and measures itself:

| Member | Type | Meaning |
|--------|------|---------|
| `name` | `string` | The registry key |
| `kind` | `string` | `"bitmap"` |
| `render(ctx, text, x, y, opts?)` | | Draw `text` at `(x, y)` on a 2D context |
| `measure(text, opts?)` | | `{ width, height }` in pixels |

`render()` options:

| Option | Type | Default | Meaning |
|--------|------|---------|---------|
| `scale` | `number` | `1` | Multiply every glyph's size and advance |
| `color` | `string` | — | Tint the glyphs (any CSS color). Opaque source pixels become this color |
| `align` | `string` | `"left"` | `"left"`, `"center"`, or `"right"` |

```js
const ink = await Font.load("Ink", { /* … */ });

ink.measure("Score 100");              // { width: 72, height: 8 } at scale 1
ink.render(ctx, "Score 100", 10, 60, { scale: 2 });              // 2× size
ink.render(ctx, "GAME OVER", 160, 60, { align: "center", color: "#ff0000" });
```

`measure(text, { scale })` mirrors `render()`'s geometry, so centering and right-aligning are exact. Characters missing from the image are skipped (their advance still applies), and the space advance comes from `spaceWidth` or the widest glyph.

### Batch loading

All three batch forms resolve to an object of fonts keyed by name (via a **`LoadingTask`**, like `Image`/`Audio`):

```js
// Native batch — { name: path }:
const fonts = await Font.load({
  ui:   "assets/fonts/ui.ttf",
  big:  "assets/fonts/big.otf",
});

// Bitmap batch map — { name: config }:
const fonts = await Font.load({
  ui:    { image: "ui.png",    characters: "…", gridX: 16, gridY: 4 },
  title: { image: "title.png", characters: "…", separator: "#FF00FF" },
});

// Bitmap batch array — [config, …]:
const fonts = await Font.load([
  { name: "ui",    image: "ui.png",    characters: "…", gridX: 16, gridY: 4 },
  { name: "title", image: "title.png", characters: "…", separator: "#FF00FF" },
]);
```

A batch map must be all paths (native) or all configs (bitmap) — mixing them throws. A single bitmap config may also be passed directly with a `name` inside it:

```js
const ink = await Font.load({
  name: "Ink",
  image: "ink.png",
  characters: "…",
  gridX: 16,
  gridY: 4,
});
```

A `LoadingTask` exposes `promise`, `progress` (`0`–`1`), `loaded`, `total`, and `onProgress(cb)`.

## `Font.get` / `has` / `remove` / `clear`

| Member | Behavior |
|--------|----------|
| `Font.get(name)` | The loaded font, or `null` |
| `Font.has(name)` | `true` if a font is loaded under that name |
| `Font.remove(name)` | Removes the font (and unloads the native family); `true` if it existed |
| `Font.clear()` | Removes every loaded font |

```js
const ink = Font.get("Ink");   // null until loaded
if (Font.has("Ink")) { /* … */ }
```
