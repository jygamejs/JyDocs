# Input

Static class for keyboard and touch input. `Input.init()` is called automatically when you create a `Game`.

## Key State Queries

| Method | Signature | Description |
|---|---|---|
| `isDown(key)` | `isDown('UP')` | Is the key currently held? |
| `justPressed(key)` | `justPressed('SPACE')` | Was the key pressed this frame? Cleared mid-loop. |
| `justReleased(key)` | `justReleased('ENTER')` | Was the key released this frame? Cleared each frame. |

```js
if (Input.isDown('RIGHT')) player.x += 200 * dt
if (Input.justPressed('SPACE')) player.jump()
if (Input.justReleased('ENTER')) confirm()
```

## Default Key Mappings

| Raw Key | Alias |
|---|---|
| `ArrowUp`, `w`, `W` | `UP` |
| `ArrowDown`, `s`, `S` | `DOWN` |
| `ArrowLeft`, `a`, `A` | `LEFT` |
| `ArrowRight`, `d`, `D` | `RIGHT` |
| ` ` (Space) | `SPACE` |
| `Escape` | `ESCAPE` |
| `Enter` | `ENTER` |

## Custom Key Mapping

| Method | Signature | Description |
|---|---|---|
| `mapKey(rawKey, alias)` | `mapKey('z', 'JUMP')` | Maps a raw key to a logical alias |
| `unmapKey(rawKey)` | `unmapKey('z')` | Removes a mapping |
| `setKeyMap(map)` | `setKeyMap({ z: 'JUMP' })` | Replaces the entire key map |
| `resetKeyMap()` | `resetKeyMap()` | Restores the default map |
| `getKeyMap()` | `getKeyMap()` | Returns a copy of the current map |

```js
Input.mapKey('z', 'FIRE')
Input.mapKey('x', 'JUMP')
if (Input.justPressed('FIRE')) shoot()
```

## Touch Input

| Method | Signature | Description |
|---|---|---|
| `onSwipe(callback)` | `onSwipe(dir => ...)` | Register swipe listener, returns unsubscribe |
| `removeSwipe(callback)` | `removeSwipe(fn)` | Remove a specific swipe listener |
| `onTap(callback)` | `onTap(({x, y}) => ...)` | Register tap listener, returns unsubscribe |
| `removeTap(callback)` | `removeTap(fn)` | Remove a specific tap listener |

Swipe minimum distance: 30px. Tap max time: 300ms, max movement: 30px.

```js
Input.onSwipe(dir => {
  // dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
})

Input.onTap(({ x, y }) => {
  // use client coordinates
})
```

## Key Buffer

| Method | Description |
|---|---|
| `consumeBuffer()` | Shifts and returns the first buffered key, or `null` |
| `peekBuffer()` | Returns the first buffered key without removing, or `null` |

```js
Input.consumeBuffer()  // 'UP' | null
```

## Lifecycle

| Method | Description |
|---|---|
| `init(target?)` | Binds listeners (called by `Game` constructor) |
| `destroy(target?)` | Removes all listeners, clears state |
| `updateFrame()` | Clears `justReleased` (called at end of each loop) |
| `clearJustPressed()` | Clears `justPressed` (called mid-loop after first tick) |

`Input` state is automatically reset when calling `game.switchScene()`.
