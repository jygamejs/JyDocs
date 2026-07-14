# Input (Legacy)

<Badge type="warning">Legacy — superseded by InputSystem in v0.8.1</Badge>

The `Input` object is a **global facade** that delegates to the game's default `InputContext` instance. It mirrors every method of `InputContext` for convenience.

The `Game` constructor automatically creates its own `InputContext`, binds it to the game container, and sets it as the default.

::: tip Use the new InputSystem
The legacy `Input` facade still works for quick prototyping, but new projects should use the [InputSystem](/api/input/input-system) with its device registry, action maps, context stack, gesture recognition, and coordinate transforms.
:::

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
| `isDown(key)` | `isDown('UP')` | Is the key or action currently held? |
| `justPressed(key)` | `justPressed('SPACE')` | Was the key or action pressed this frame? |
| `justReleased(key)` | `justReleased('ENTER')` | Was the key or action released this frame? |

```js
if (Input.isDown('RIGHT')) player.velocity.x = 200
if (Input.justPressed('SPACE')) player.jump()
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

## Action Bindings

Bind multiple keys to a single logical action. `isDown`/`justPressed`/`justReleased` check both the key name directly and all keys bound to the action.

| Method | Signature | Description |
|--------|-----------|-------------|
| `bind(action, input)` | `bind('JUMP', 'SPACE')` | Binds a key to an action |
| `unbind(action, input)` | `unbind('JUMP', 'SPACE')` | Removes a key from an action |
| `getBindings(action)` | `getBindings('JUMP')` | Returns all keys bound to an action |
| `clearBindings(action)` | `clearBindings('JUMP')` | Removes all bindings for an action |

```js
Input.bind('JUMP', 'SPACE')
Input.bind('JUMP', 'W')
Input.justPressed('JUMP')  // true if SPACE or W was just pressed

const bindings = Input.getBindings('JUMP')  // ['SPACE', 'W']
```

## Pointer API

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPointer(id)` | `getPointer(0)` | Returns pointer data or `null` |
| `getPointers()` | `getPointers()` | Returns iterator over active pointers (zero-alloc) |
| `forEachPointer(fn)` | `forEachPointer(p => ...)` | Iterates over all active pointers |

## Gesture Listeners

| Method | Signature | Description |
|--------|-----------|-------------|
| `onSwipe(callback)` | `onSwipe(dir => ...)` | Register swipe listener, returns unsubscribe |
| `removeSwipe(callback)` | `removeSwipe(fn)` | Remove a specific swipe listener |
| `onTap(callback)` | `onTap(({x, y}) => ...)` | Register tap listener, returns unsubscribe |
| `removeTap(callback)` | `removeTap(fn)` | Remove a specific tap listener |

## Key Buffer

| Method | Description |
|--------|-------------|
| `consumeBuffer()` | Shifts and returns the first buffered key, or `null` |
| `peekBuffer()` | Returns the first buffered key without removing, or `null` |

## Default Context

| Method | Description |
|--------|-------------|
| `setDefault(ctx)` | Replaces the default `InputContext` instance |
| `getDefault()` | Returns the current default `InputContext` |
