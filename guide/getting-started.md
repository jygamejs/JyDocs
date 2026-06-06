# Getting Started

## Installation

```bash
npm install jygame
```

Or import directly from a CDN:

```js
import { Game } from 'https://unpkg.com/jygame@latest/jygame.js'
```

## Your First Game

```js
import { Game, Scene, Sprite, Input } from 'jygame'

const scene = new Scene()

scene.create = function () {
  this.player = new Sprite(100, 100, 32, 32)
  this.player.color = 'tomato'
}

scene.update = function (dt) {
  if (Input.keys('RIGHT')) this.player.x += 200 * dt
  if (Input.keys('LEFT')) this.player.x -= 200 * dt
  if (Input.keys('UP')) this.player.y -= 200 * dt
  if (Input.keys('DOWN')) this.player.y += 200 * dt
}

scene.render = function (ctx) {
  this.player.render(ctx)
}

const game = new Game({
  width: 800,
  height: 600,
  scene: scene,
})

game.start()
```

## Project Structure

```
my-game/
├── index.html
├── package.json
└── src/
    ├── main.js         # Entry point
    ├── scenes/         # Scene files
    ├── entities/       # Game entities
    └── assets/         # Images, fonts
```
