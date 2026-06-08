# Clock

Fixed-timestep accumulator used internally by `Game` for deterministic updates. Can also be used standalone.

## Constructor

```js
const clock = new Clock(fps, maxTicks)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `fps` | `number` | `60` | Target frames per second |
| `maxTicks` | `number` | `5` | Maximum fixed ticks per frame (spiral-of-death protection) |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `fps` | `number` | Get/set target FPS (updates `fixedDt`) |
| `fixedDt` | `number` (read-only) | `1 / fps` — the fixed timestep duration |
| `alpha` | `number` (read-only) | `accumulator / fixedDt` — fraction of a step remaining, for interpolation |
| `maxTicks` | `number` | Get/set max ticks per frame |

## Methods

### `tick(realDt)`

Feeds real elapsed time (in seconds) into the accumulator. Returns the number of fixed steps to simulate this frame.

```js
const steps = clock.tick(realDt)
for (let i = 0; i < steps; i++) {
  update(clock.fixedDt)
}
```

The real delta is clamped to `0.2` seconds maximum. If the number of accumulated steps exceeds `maxTicks`, the accumulator resets to `0` to prevent the **spiral of death** (catastrophic catch-up after a long pause).

### `reset()`

Resets the accumulator to `0`.

## Standalone Usage

```js
const clock = new Clock(60, 5)
let lastTime = performance.now()

function loop(time) {
  const realDt = (time - lastTime) / 1000
  lastTime = time

  const steps = clock.tick(realDt)
  for (let i = 0; i < steps; i++) {
    update(clock.fixedDt)
  }

  // Interpolate remaining time for smooth rendering
  const alpha = clock.alpha
  render(alpha)

  requestAnimationFrame(loop)
}

requestAnimationFrame(loop)
```

## How It Works

```
realDt → [clamp to 0.2] → [accumulator] → while accumulator >= fixedDt
                                             and count < maxTicks:
                                               subtract fixedDt
                                               count += 1
                                           if count >= maxTicks:
                                             reset accumulator to 0
                                           return count
```

This decouples update rate from render rate, giving consistent physics and simulation regardless of display refresh rate or frame drops.
