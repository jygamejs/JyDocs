# Pool

A generic object pool for reusing frequently created and destroyed objects (bullets, particles, enemies). Reduces garbage collection pressure by avoiding allocations in hot paths.

## Constructor

```js
const pool = new Pool(options)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `create` | `function` | *(required)* | Factory function that returns a new object |
| `reset` | `function` | `() => {}` | Called on each object when released back to the pool |
| `initialSize` | `number` | `0` | Number of objects to pre-allocate |
| `maxSize` | `number` | `Infinity` | Maximum number of released objects to keep |

```js
const bulletPool = new Pool({
  create: () => new Sprite(0, 0, 4, 4),
  reset: (b) => { b.visible = false; b.velocity.set(0, 0) },
  initialSize: 50,
  maxSize: 200,
})
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `size` | `number` | Number of objects currently available in the pool |

## Methods

### `acquire(...args)`

```js
pool.acquire()           // returns pooled or newly created object
pool.acquire(x, y)       // args are forwarded to create() if no pooled object available
```

Returns a recycled object if one is available, otherwise calls `create(...args)` to produce a new one.

### `release(obj)`

```js
pool.release(obj)
```

Resets the object via the `reset` function and returns it to the pool. Objects beyond `maxSize` are discarded. Calling `release` on the same object twice is a no-op.

### `grow(n)`

```js
pool.grow(20)
```

Pre-allocates `n` additional objects and adds them to the pool. Each is created and reset immediately.

### `drain()`

```js
pool.drain()
```

Empties the pool entirely. All references to pooled objects are released for garbage collection.

## Usage

```js
import { Pool, Sprite } from 'jygame'

const bulletPool = new Pool({
  create: () => {
    const b = new Sprite(0, 0, 8, 8)
    b.style.fill = '#ff0'
    return b
  },
  reset: (b) => {
    b.visible = false
    b.velocity.set(0, 0)
    b.transform.x = 0
    b.transform.y = 0
  },
  initialSize: 30,
})

function fire(x, y, vx, vy) {
  const bullet = bulletPool.acquire()
  bullet.transform.x = x
  bullet.transform.y = y
  bullet.velocity.set(vx, vy)
  bullet.visible = true
  return bullet
}

function update(dt) {
  for (const b of activeBullets) {
    if (outOfBounds(b)) {
      bulletPool.release(b)
    }
  }
}
```
