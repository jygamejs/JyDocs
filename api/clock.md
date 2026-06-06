# Clock

Fixed-timestep accumulator used internally by `Game` for deterministic updates. Can also be used standalone.

## Constructor

```js
const clock = new Clock(fps)
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `fps` | `number` | `60` | Target frames per second |

## Properties

| Property | Type | Description |
|---|---|---|
| `fps` | `number` | Get/set target FPS (updates `fixedDt`) |
| `fixedDt` | `number` (read-only) | `1 / fps` — the fixed timestep duration |

## Methods

### `tick(realDt)`

Feeds real elapsed time (in seconds) into the accumulator. Returns the number of fixed steps to simulate this frame.

```js
const steps = clock.tick(realDt)
for (let i = 0; i < steps; i++) {
  update(clock.fixedDt)
}
```

The real delta is clamped to `0.2` seconds maximum to prevent the spiral of death (catastrophic catch-up after a long pause).

### `reset()`

Resets the accumulator to `0`.

## Standalone Usage

```js
const clock = new Clock(60)
let lastTime = performance.now()

function loop(time) {
  const realDt = (time - lastTime) / 1000
  lastTime = time

  const steps = clock.tick(realDt)
  for (let i = 0; i < steps; i++) {
    update(clock.fixedDt)
  }
  render()

  requestAnimationFrame(loop)
}

requestAnimationFrame(loop)
```

## How It Works

```
realDt → [clamp to 0.2] → [accumulator] → while accumulator >= fixedDt:
                                              subtract fixedDt
                                              count += 1
                                           return count
```

This decouples update rate from render rate, giving consistent physics and simulation regardless of display refresh rate or frame drops.
