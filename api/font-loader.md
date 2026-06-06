# FontLoader

Web font loader using the `FontFace` API. Supports `woff2`, `woff`, `ttf`, and other formats.

## Methods

### `load(family, path)`

```js
await FontLoader.load(family, path)
```

Creates a `FontFace`, loads it, and adds it to `document.fonts`. No-op if the font is already loaded.

```js
await FontLoader.load('PixelFont', '/fonts/pixel.woff2')
```

### `loadAll(map)`

```js
await FontLoader.loadAll(map)
```

Loads multiple fonts in parallel.

```js
await FontLoader.loadAll({
  PixelFont: '/fonts/pixel.woff2',
  'MonoFont': '/fonts/mono.woff2',
})
```

### `isLoaded(family)`

```js
FontLoader.isLoaded(family)  // boolean
```

Checks whether a font family has been loaded.

```js
if (FontLoader.isLoaded('PixelFont')) {
  ctx.font = '24px PixelFont'
}
```

## Usage

```js
// Preload in boot scene
async function boot() {
  await FontLoader.loadAll({
    Pixel: '/fonts/pixel.woff2',
    Retro: '/fonts/retro.ttf',
  })
}

// Use in render
scene.render = function (ctx) {
  ctx.font = '32px Pixel'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Hello!', 100, 100)
}
```
