# Input

The `Input` object is a **global facade** that delegates to the game's default `InputContext` instance. It mirrors every method of `InputContext` for convenience.

The `Game` constructor automatically creates its own `InputContext`, binds it to the game container, and sets it as the default — no manual setup required.

## Pointer Position

| Property | Type | Description |
|----------|------|-------------|
| `Input.x` | `number` | Latest pointer X coordinate (read-only) |
| `Input.y` | `number` | Latest pointer Y coordinate (read-only) |
| `Input.isPointerDown` | `boolean` | Whether any pointer is currently down (read-only) |
| `Input.pointerCount` | `number` | Number of active pointers (read-only) |

## Key State Queries

| Method | Signature | Description |
|--------|-----------|-------------|
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
|---------|-------|
| `ArrowUp`, `w`, `W` | `UP` |
| `ArrowDown`, `s`, `S` | `DOWN` |
| `ArrowLeft`, `a`, `A` | `LEFT` |
| `ArrowRight`, `d`, `D` | `RIGHT` |
| ` ` (Space) | `SPACE` |
| `Escape` | `ESCAPE` |
| `Enter` | `ENTER` |

## Custom Key Mapping

| Method | Signature | Description |
|--------|-----------|-------------|
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

## Pointer API

Unified mouse, touch, and pen input via the Pointer Events API with multi-touch support.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPointer(id)` | `getPointer(0)` | Returns pointer data `{ id, x, y, startX, startY, startTime, pointerType }` or `null` |
| `getPointers()` | `getPointers()` | Returns all active pointers as an array |
| `forEachPointer(fn)` | `forEachPointer(p => ...)` | Iterates over all active pointers |

```js
Input.forEachPointer(p => {
  console.log(`Pointer ${p.id}: (${p.x}, ${p.y})`)
})
```

## Gesture Listeners

| Method | Signature | Description |
|--------|-----------|-------------|
| `onSwipe(callback)` | `onSwipe(dir => ...)` | Register swipe listener, returns unsubscribe |
| `removeSwipe(callback)` | `removeSwipe(fn)` | Remove a specific swipe listener |
| `onTap(callback)` | `onTap(({x, y}) => ...)` | Register tap listener, returns unsubscribe |
| `removeTap(callback)` | `removeTap(fn)` | Remove a specific tap listener |

Swipe minimum distance: 30px. Tap max time: 300ms, max movement: 30px (configurable via `InputContext`).

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
|--------|-------------|
| `consumeBuffer()` | Shifts and returns the first buffered key, or `null` |
| `peekBuffer()` | Returns the first buffered key without removing, or `null` |

```js
Input.consumeBuffer()  // 'UP' | null
```

## Default Context

| Method | Description |
|--------|-------------|
| `setDefault(ctx)` | Replaces the default `InputContext` instance |
| `getDefault()` | Returns the current default `InputContext` |

The game's built-in `InputContext` is automatically set as default. You can access it via `game.input` to add per-instance listeners:

```js
const scene = new Scene()
scene.enter = function () {
  game.input.onSwipe(dir => this.move(dir))
}
```
