# InputContext

Instance-based input handler that the `Game` class creates automatically. Uses the **Pointer Events API** (unified mouse, touch, and pen) and `Map`-based key state tracking with multi-touch support.

You normally interact through the global `Input` facade, which delegates to the game's default `InputContext`.

## Constructor

```js
const ctx = new InputContext(options)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `swipeThreshold` | `number` | `30` | Minimum distance (px) to trigger a swipe |
| `tapTimeout` | `number` | `300` | Max ms for a pointer down-up sequence to count as a tap |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | Latest pointer X coordinate (read-only) |
| `y` | `number` | Latest pointer Y coordinate (read-only) |
| `isPointerDown` | `boolean` | Whether any pointer is currently down (read-only) |
| `pointerCount` | `number` | Number of active pointers (read-only) |
| `buffer` | `string[]` | Key buffer for queued input events |

## Methods

### Lifecycle

| Method | Description |
|--------|-------------|
| `init(target)` | Binds keyboard and pointer listeners to the target element |
| `destroy()` | Removes all listeners and clears all state |

### Key State Queries

| Method | Signature | Description |
|--------|-----------|-------------|
| `isDown(key)` | `isDown('UP')` | Is the key currently held? |
| `justPressed(key)` | `justPressed('SPACE')` | Was the key pressed this frame? Cleared mid-loop. |
| `justReleased(key)` | `justReleased('ENTER')` | Was the key released this frame? Cleared each frame. |

### Key Mapping

| Method | Signature | Description |
|--------|-----------|-------------|
| `mapKey(rawKey, alias)` | `mapKey('z', 'JUMP')` | Maps a raw key to a logical alias |
| `unmapKey(rawKey)` | `unmapKey('z')` | Removes a mapping |
| `setKeyMap(map)` | `setKeyMap({ z: 'JUMP' })` | Replaces the entire key map |
| `resetKeyMap()` | `resetKeyMap()` | Restores the default map |
| `getKeyMap()` | `getKeyMap()` | Returns a copy of the current map |

### Pointer API

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPointer(id)` | `getPointer(0)` | Returns pointer data `{ id, x, y, startX, startY, startTime, pointerType }` or `null` |
| `getPointers()` | `getPointers()` | Returns all active pointers as an array |
| `forEachPointer(fn)` | `forEachPointer(p => ...)` | Iterates over all active pointers |

### Gesture Listeners

| Method | Signature | Description |
|--------|-----------|-------------|
| `onSwipe(callback)` | `onSwipe(dir => ...)` | Register swipe listener, returns unsubscribe |
| `removeSwipe(callback)` | `removeSwipe(fn)` | Remove a specific swipe listener |
| `onTap(callback)` | `onTap(({x, y}) => ...)` | Register tap listener, returns unsubscribe |
| `removeTap(callback)` | `removeTap(fn)` | Remove a specific tap listener |

### Key Buffer

| Method | Description |
|--------|-------------|
| `consumeBuffer()` | Shifts and returns the first buffered key, or `null` |
| `peekBuffer()` | Returns the first buffered key without removing, or `null` |

### Frame State

| Method | Description |
|--------|-------------|
| `updateFrame()` | Clears `justPressed` and `justReleased` (called at end of each game loop) |
| `clearJustPressed()` | Clears `justPressed` (called mid-loop between multiple fixed ticks) |

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

## Standalone Usage

```js
import { InputContext } from 'jygame'

const input = new InputContext({ swipeThreshold: 20 })
input.init(document.getElementById('game'))

if (input.isDown('UP')) { /* ... */ }
input.onSwipe(dir => console.log('Swiped:', dir))
input.onTap(({ x, y }) => console.log('Tapped:', x, y))
```
