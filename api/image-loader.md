# ImageLoader

Image preloading utility with in-memory caching. Works with `HTMLImageElement` and returns Promises.

## Methods

### `load(path, options?)`

```js
await ImageLoader.load(path)                // Promise<HTMLImageElement>
await ImageLoader.load(path, { decode: false })
```

Loads a single image from the given path. Caches on success. Rejects on load error.

The `decode` option (default `true`) controls whether `img.decode()` is awaited before resolving. Disabling it speeds up loading but may cause a brief rendering delay on first paint.

```js
const playerImg = await ImageLoader.load('/assets/player.png')
```

### `loadAll(map, options?)`

```js
const task = ImageLoader.loadAll(map)
const assets = await task                    // { [key]: HTMLImageElement }
```

Loads multiple images in parallel. Returns a **`LoadingTask`** (thenable with progress tracking). Each entry is cached under its **key** (not the file path).

```js
const task = ImageLoader.loadAll({
  player: '/assets/player.png',
  enemy: '/assets/enemy.png',
  bullet: '/assets/bullet.png',
})

task.onProgress((loaded, total) => {
  console.log(`${loaded}/${total} images loaded`)
})

const assets = await task
// Use cached images
sprite.image = assets.player
sprite.image = ImageLoader.get('player')  // same result
```

### `get(key)`

```js
ImageLoader.get(key)  // HTMLImageElement | null
```

Retrieves a cached image by its key.

### `has(key)`

```js
ImageLoader.has(key)  // boolean
```

Checks whether a key is in the cache.

### `unload(key)`

```js
ImageLoader.unload(key)  // boolean
```

Removes a single image from the cache. Returns `true` if the key existed.

### `clear()`

```js
ImageLoader.clear()
```

Empties the entire image cache.

## Usage with Sprites

```js
const img = await ImageLoader.load('/assets/player.png')
const player = new Sprite(100, 100, 32, 48)
player.image = img
```

## Batch Loading Pattern

```js
async function preload() {
  const assets = await ImageLoader.loadAll({
    bg: '/assets/bg.png',
    player: '/assets/player.png',
    enemy: '/assets/enemy.png',
    bullet: '/assets/bullet.png',
  })
  return assets
}

// In scene
const assets = await preload()
// Assets are cached — use ImageLoader.get('key') anywhere
```
