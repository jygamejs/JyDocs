# ImageLoader

Image preloading utility with in-memory caching. Works with `HTMLImageElement` and returns Promises.

## Methods

### `load(path)`

```js
await ImageLoader.load(path)  // Promise<HTMLImageElement>
```

Loads a single image from the given path. Caches on success. Rejects on load error.

```js
const playerImg = await ImageLoader.load('/assets/player.png')
```

### `loadAll(map)`

```js
await ImageLoader.loadAll(map)  // Promise<{ [key]: HTMLImageElement }>
```

Loads multiple images in parallel. Each entry is cached under its **key** (not the file path).

```js
const assets = await ImageLoader.loadAll({
  player: '/assets/player.png',
  enemy: '/assets/enemy.png',
  bullet: '/assets/bullet.png',
})

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
