# Storage

Static `localStorage` wrapper with JSON serialization. All methods are wrapped in `try/catch` for safety.

## Methods

### `get(key, defaultValue)`

```js
Storage.get(key, defaultValue)  // any
```

Reads and JSON-parses a value from `localStorage`. Returns `defaultValue` if the key doesn't exist or on parse error.

```js
const highscore = Storage.get('highscore', 0)
const settings = Storage.get('settings', { volume: 1 })
```

### `set(key, value)`

```js
Storage.set(key, value)
```

JSON-stringifies and writes the value to `localStorage`.

```js
Storage.set('highscore', 1000)
Storage.set('settings', { volume: 0.5, muted: false })
```

### `remove(key)`

```js
Storage.remove(key)
```

Removes a key from `localStorage`.

### `clear()`

```js
Storage.clear()
```

Clears all `localStorage` data.

## Usage

```js
// Save progress
function saveGame(state) {
  Storage.set('save', {
    level: state.level,
    score: state.score,
    hp: state.hp,
  })
}

// Load progress
function loadGame() {
  return Storage.get('save', null)
}

// Reset
function deleteSave() {
  Storage.remove('save')
}
```
