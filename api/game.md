# Game

The `Game` class is the main entry point for any Jygame project. It manages the game loop, canvas setup, scene management, and viewport scaling.

## Constructor

```js
const game = new Game(options)
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | `800` | Canvas width |
| `height` | `number` | `600` | Canvas height |
| `scene` | `Scene` | `null` | Initial scene |
| `parent` | `string\|HTMLElement` | `document.body` | Parent element for the canvas |

## Methods

### `game.start()`
Starts the game loop.

### `game.stop()`
Stops the game loop.

### `game.switchScene(scene)`
Switches to a new scene, calling `exit()` on the current and `enter()` on the new.
