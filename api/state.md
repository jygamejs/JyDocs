# State

Observable state container for managing game data (score, health, level, settings).

## Constructor

```js
const state = new State(initial)
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `initial` | `object` | `{}` | Initial state (shallow-copied) |

```js
const state = new State({ score: 0, lives: 3, level: 1 })
```

## Methods

### `get()`

```js
state.get()  // { score: 0, lives: 3, level: 1 }
```

Returns the current state object (reference, not a copy).

### `set(partial)`

```js
state.set({ score: 10 })
```

Merges `partial` into the state using spread (`{ ...state, ...partial }`), then notifies all subscribers.

### `replace(next)`

```js
state.replace({ score: 0 })
```

Completely replaces the state object and notifies subscribers.

### `reset(initial)`

```js
state.reset({ score: 0, lives: 3, level: 1 })
```

Replaces state with a copy of `initial` and notifies subscribers.

### `subscribe(fn)`

```js
const unsub = state.subscribe(s => {
  console.log('Score:', s.score)
})
```

Adds a listener that receives the full state on every change. Returns an unsubscribe function.

### `unsubscribe(fn)`

```js
state.unsubscribe(listenerFn)
```

Removes a specific listener.

## Usage

```js
const gameState = new State({ score: 0, lives: 3 })

const unsub = gameState.subscribe(s => {
  game.patchUI({ score: `Score: ${s.score}` })
})

gameState.set({ score: 100 })  // auto-updates UI via subscription
gameState.set({ lives: 2 })    // score stays 100, lives becomes 2

unsub()  // stop listening
```
