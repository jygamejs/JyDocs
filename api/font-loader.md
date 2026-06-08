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
const task = FontLoader.loadAll(map)
await task
```

Loads multiple fonts in parallel. Returns a **`LoadingTask`** (thenable with progress tracking).

```js
const task = FontLoader.loadAll({
  PixelFont: '/fonts/pixel.woff2',
  'MonoFont': '/fonts/mono.woff2',
})

task.onProgress((loaded, total) => {
  console.log(`${loaded}/${total} fonts loaded`)
})

await task
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

### `unload(family)`

```js
FontLoader.unload(family)  // boolean
```

Removes a font family from the loaded set. Returns `true` if the family was loaded.

### `clear()`

```js
FontLoader.clear()
```

Empties the entire set of loaded fonts.

## Usage

```js
// Preload in boot scene
async function boot() {
  const task = FontLoader.loadAll({
    Pixel: '/fonts/pixel.woff2',
    Retro: '/fonts/retro.ttf',
  })

  task.onProgress((loaded, total) => {
    console.log(`Fonts: ${loaded}/${total}`)
  })

  await task
}

// Use in render
scene.render = function (ctx) {
  ctx.font = '32px Pixel'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Hello!', 100, 100)
}
```
