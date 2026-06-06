# Timer

Countdown timer with optional looping. Useful for timed events, cooldowns, spawning intervals, and countdowns.

## Constructor

```js
const timer = new Timer(duration, options)
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `duration` | `number` | — | Duration in seconds |
| `options.loop` | `boolean` | `false` | Automatically restart on completion |
| `options.autoStart` | `boolean` | `true` | Start running immediately |

```js
const timer = new Timer(3)             // 3-second timer
const loopTimer = new Timer(1, { loop: true })        // loops every 1 second
const manual = new Timer(5, { autoStart: false })     // needs manual start
```

## Properties (getters)

| Getter | Description |
|---|---|
| `done` | `true` when elapsed >= duration (and timer is running) |
| `progress` | `0` to `1` (clamped) |
| `remaining` | `duration - elapsed` (clamped to `0`) |
| `running` | Whether the timer is currently active |

```js
console.log(timer.progress)    // 0.0 to 1.0
console.log(timer.remaining)   // seconds left
```

## Methods

| Method | Description |
|---|---|
| `tick(dt)` | Advances by `dt` seconds. Returns `true` if the timer just completed or looped. |
| `start()` | Sets `running = true` |
| `stop()` | Sets `running = false` |
| `reset()` | Sets elapsed to `0` and starts running |

## Usage

```js
const spawnTimer = new Timer(2, { loop: true })
const powerUpTimer = new Timer(10)

function update(dt) {
  if (spawnTimer.tick(dt)) {
    spawnEnemy()
  }

  if (powerUpTimer.tick(dt)) {
    // power-up expired
    player.deactivatePowerUp()
  }
}
```

## Looping Timers

For looping timers, `tick()` returns `true` each time the timer wraps around. The elapsed time is wrapped (not reset), so precision is maintained.

```js
const blink = new Timer(0.5, { loop: true })

function update(dt) {
  if (blink.tick(dt)) {
    sprite.visible = !sprite.visible
  }
}
```
