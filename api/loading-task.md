# LoadingTask

An async progress tracker returned by `ImageLoader.loadAll()` and `FontLoader.loadAll()`. Provides progress callbacks and acts as a thenable (compatible with `await`).

::: info Source moved (v0.8.2)
`LoadingTask` moved from `core/LoadingTask.js` to `loaders/LoadingTask.js`. The import path `import { LoadingTask } from "jygame"` continues to work via the barrel export.
:::

## Constructor

```js
new LoadingTask(resultFn)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `resultFn` | `function \| null` | `null` | Optional function called on completion to produce the resolved value |

## Properties (getters)

| Getter | Type | Description |
|--------|------|-------------|
| `progress` | `number` | `0` to `1` — ratio of loaded to total |
| `loaded` | `number` | Number of completed items |
| `total` | `number` | Total number of expected items |
| `promise` | `Promise` | The underlying promise — resolves when all items complete |

## Methods

### `expect(n)`

```js
task.expect(n)
```

Increases the expected total count by `n`. Must be called before items are marked as done.

### `done()`

```js
task.done()
```

Marks one item as loaded and notifies progress listeners. If all items are loaded, resolves the promise.

### `fail(err)`

```js
task.fail(err)
```

Rejects the promise with the given error. Subsequent calls to `done()` are ignored.

### `onProgress(cb)`

```js
const unsub = task.onProgress((loaded, total) => {
  console.log(`${loaded} / ${total}`)
})
```

Registers a progress callback. Returns an unsubscribe function.

### `then(onfulfilled, onrejected)`

The `LoadingTask` is thenable, so it can be used directly with `await`:

```js
const assets = await ImageLoader.loadAll({ ... })
console.log(assets)  // resolved value from resultFn
```

## Usage

```js
import { ImageLoader } from 'jygame'

const task = ImageLoader.loadAll({
  player: '/assets/player.png',
  enemy: '/assets/enemy.png',
  bg: '/assets/bg.png',
})

task.onProgress((loaded, total) => {
  console.log(`Loading: ${Math.round((loaded / total) * 100)}%`)
})

const assets = await task
// assets.player, assets.enemy, assets.bg
```
