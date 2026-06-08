# Snake Game

A fully playable Snake game built with Jygame. Features classic and stage modes, multiple difficulties, and persistent high scores.

> **Note:** This example was built with Jygame v0.2.0. The code snippets use the older `sprite.rect` API (`sprite.rect.x`, `sprite.rect.y`) which has been replaced by component properties (`sprite.transform.x`, `sprite.transform.y`, `sprite.collider.width`) in v0.4.0. The architectural patterns (scene flow, game loop, input handling, persistence) remain valid.

<div class="snake-embed">

<iframe src="https://jygame-snake.vercel.app/" title="Jygame Snake" allow="fullscreen" loading="lazy"></iframe>

</div>

**Play the game above** — or [open it in a new tab](https://jygame-snake.vercel.app/).

[View source on GitHub](https://github.com/Bouzidi-Youssef/jygame-snake)

## Scene Flow

- **Menu** — PLAY goes to difficulty selection, STAGE jumps directly into the game (resumes saved progress)
- **Difficulty** — pick Slug / Worm / Python, then enter CLASSIC mode
- **Game** — handles all gameplay, pause, game over, and stage complete internally as DOM overlays
- **Game → Game** — retry or advance to next stage via self-transition (constructs a fresh GameScene)
- **Game → Menu** — exit to title screen

Button clicks use `this.on()` which wraps `addEventListener` with automatic cleanup — when the scene exits, all registered listeners are removed.

```js
// MenuScene — PLAY vs STAGE buttons
this.on(this.root.querySelector(".btn-play"), "click", () => {
  this.transitionTo(new DifficultyScene());
});

this.on(this.root.querySelector(".btn-stage"), "click", () => {
  let idx = getStageProgress();
  if (idx >= stages.length) idx = 0;
  this.transitionTo(new GameScene({
    mode: MODES.STAGE,
    stageIndex: idx,
    stageConfig: stages[idx],
    backScene: MenuScene,
  }));
});
```

```js
// DifficultyScene — three difficulty buttons
this.root.querySelectorAll(".btn-level").forEach((btn) => {
  this.on(btn, "click", () => {
    this.transitionTo(new GameScene({
      mode: "classic",
      difficulty: btn.dataset.difficulty,
      backScene: DifficultyScene,
    }));
  });
});
```

## Game Loop

The game loop is driven by Jygame's built-in `Clock` instead of a manual accumulator. Each frame calls `clock.tick(dt)` which returns the number of fixed-step ticks to run (using the classic "fixed timestep with accumulator" pattern internally).

```js
update(dt) {
  if (this.status === GAME_STATUS.RUNNING) {
    const ticks = this.clock.tick(dt);
    for (let i = 0; i < ticks; i++) {
      this._tick();
    }
  }
  if (this.food) this.food.updateAnimations();

  if (this.status === GAME_STATUS.RUNNING) {
    const dirs = ["UP", "DOWN", "LEFT", "RIGHT"];
    for (const dir of dirs) {
      if (Input.justPressed(dir)) {
        this.snake.queueDirection(dir);
      }
    }
  }

  if (Input.justPressed("SPACE")) {
    if (this.status === GAME_STATUS.RUNNING) this.status = GAME_STATUS.PAUSED;
    else if (this.status === GAME_STATUS.PAUSED) this.status = GAME_STATUS.RUNNING;
    else if (this.status === GAME_STATUS.STAGE_COMPLETE) this._advanceStage();
    else if (this.status === GAME_STATUS.GAMEOVER) this._retry();
  }

  if (Input.justPressed("ESCAPE")) {
    this.transitionTo(new this.backScene());
  }

  this._updateHUD();
}
```

The tick rate varies by mode:
- **CLASSIC**: Slug (150ms), Worm (110ms), Python (80ms)
- **STAGE**: per-stage config (150ms / 110ms / 80ms)

Unlike a raw `keydown` listener, `Input.justPressed()` is polled inside `update()` each frame — it returns `true` only on the first frame the key is held, preventing repeated triggers.

## Snake Entity

The snake is an array of `{x, y}` segments with a **direction queue** that buffers up to 4 inputs, rejecting opposite-of-last to prevent instant 180-degree reversals.

```js
export class Snake {
  constructor(startSegments) {
    this.segments = startSegments.map(s => ({ x: s.x, y: s.y }));
    this.direction = "RIGHT";
    this.nextQueue = ["RIGHT"];
    this.grow = 0;
  }

  queueDirection(dir) {
    const lastDir = this.nextQueue.length > 0
      ? this.nextQueue[this.nextQueue.length - 1]
      : this.direction;
    if (dir === OPPOSITE_DIRECTIONS[lastDir]) return;
    this.nextQueue = [...this.nextQueue, dir].slice(-4);
  }

  peekNextHead(cols, rows, wrapEdges) {
    let direction = this.direction;
    for (let i = 0; i < this.nextQueue.length; i++) {
      if (this.nextQueue[i] !== OPPOSITE_DIRECTIONS[direction]) {
        direction = this.nextQueue[i];
        break;
      }
    }

    const head = this.segments[0];
    let nx = head.x, ny = head.y;

    switch (direction) {
      case "UP":    ny -= 1; break;
      case "DOWN":  ny += 1; break;
      case "LEFT":  nx -= 1; break;
      case "RIGHT": nx += 1; break;
    }

    if (wrapEdges) {
      nx = ((nx % cols) + cols) % cols;
      ny = ((ny % rows) + rows) % rows;
    }

    return { x: nx, y: ny };
  }

  move(cols, rows, wrapEdges) {
    let direction = this.direction;
    const queue = [...this.nextQueue];

    while (queue.length > 0) {
      const nextDir = queue.shift();
      if (nextDir !== OPPOSITE_DIRECTIONS[direction]) {
        direction = nextDir;
        break;
      }
    }

    const head = this.segments[0];
    let nx = head.x, ny = head.y;

    switch (direction) {
      case "UP":    ny -= 1; break;
      case "DOWN":  ny += 1; break;
      case "LEFT":  nx -= 1; break;
      case "RIGHT": nx += 1; break;
    }

    if (wrapEdges) {
      nx = ((nx % cols) + cols) % cols;
      ny = ((ny % rows) + rows) % rows;
    }

    const newSnake = [{ x: nx, y: ny }, ...this.segments];
    if (this.grow > 0) { this.grow -= 1; }
    else { newSnake.pop(); }

    this.segments = newSnake;
    this.direction = direction;
    this.nextQueue = queue;
  }

  checkSelfCollision(head) {
    return this.segments.some((seg, i) => i > 0 && seg.x === head.x && seg.y === head.y);
  }
}
```

## Collision Detection

Collision uses a **peek-ahead** pattern — check where the head will be before actually moving. Wall collision uses `wallGroup.collidePoint()` instead of manually iterating the walls array.

```js
_tick() {
  const head = this.snake.peekNextHead(this.cols, this.rows, this.wrapEdges);

  if (this._wouldCollide(head)) {
    this._gameOver();
    return;
  }

  this.snake.move(this.cols, this.rows, this.wrapEdges);

  const hp = this.snake.getHead();
  if (hp.x === this.food.position.x && hp.y === this.food.position.y) {
    this._eatFood();
  }

  if (this.mode === MODES.STAGE && this.score >= this.foodTarget) {
    this._stageComplete();
  }
}

_wouldCollide(head) {
  if (this.snake.checkSelfCollision(head)) return true;
  if (!this.wrapEdges) {
    if (head.x < 0 || head.y < 0 || head.x >= this.cols || head.y >= this.rows) return true;
  }
  const px = head.x * CELL + CELL / 2;
  const py = head.y * CELL + CELL / 2;
  if (this.wallGroup.collidePoint({ x: px, y: py }).length > 0) return true;
  return false;
}
```

Walls are built into a `Group` of Sprites at scene start:

```js
this.wallGroup = new Group();
for (const w of this.walls) {
  const s = new Sprite(w.x * CELL, w.y * CELL, CELL, CELL);
  this.wallGroup.add(s);
}
```

## Food & Animations

Food spawns at a random unoccupied cell. Visual feedback uses timing-based canvas animations — an `easeOutBack` bounce on spawn, then a cubic-bezier spin over 3.5 seconds.

```js
export class Food {
  constructor(image) {
    this.position = { x: 0, y: 0 };
    this.sprite = new Sprite(0, 0, CELL, CELL);
    this.sprite.image = image;
    this.spawnTime = 0;
  }

  generate(snake, walls, cols, rows) {
    while (true) {
      const candidate = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };

      if (
        !snake.segments.some(s => s.x === candidate.x && s.y === candidate.y) &&
        !walls.some(w => w.x === candidate.x && w.y === candidate.y)
      ) {
        this.position = candidate;
        this.sprite.rect.x = candidate.x * CELL;
        this.sprite.rect.y = candidate.y * CELL;
        this.spawnTime = performance.now();
        return;
      }
    }
  }
}
```

## Stages & Walls

Stage mode uses ASCII-art maps parsed into wall coordinates. All three stages have outer border walls with different internal layouts.

```js
// stage-1 — Tutorial Meadow (wrapEdges: true, foodTarget: 3)
walls: [
  '#####################',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#####################',
],

// stage-2 — The Corridor (wrapEdges: false, foodTarget: 5)
walls: [
  '#####################',
  '#...................#',
  '#...................#',
  '#....####....####...#',
  '#....####....####...#',
  '#...................#',
  '#...................#',
  '.....................',
  '#...................#',
  '#...................#',
  '#....####....####...#',
  '#....####....####...#',
  '#...................#',
  '#...................#',
  '#####################',
],

// stage-3 — Snake Pit (wrapEdges: false, foodTarget: 4)
walls: [
  '#####################',
  '#...................#',
  '#..####.......####..#',
  '#..####.......####..#',
  '#...................#',
  '#....############...#',
  '#....############...#',
  '#...................#',
  '#....############...#',
  '#....############...#',
  '#...................#',
  '#..####.......####..#',
  '#..####.......####..#',
  '#...................#',
  '#####################',
],
```

Walls are parsed by scanning for `#` characters:

```js
export function parseWallMap(rows) {
  const walls = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '#') walls.push({ x, y });
    }
  });
  return walls;
}
```

## Rendering

All drawing uses raw Canvas 2D calls. Snake segments and walls are drawn as rounded rectangles using `ctx.roundRect()`.

```js
render(ctx) {
  this._drawWalls(ctx);
  this._drawSnake(ctx);
  this._drawFood(ctx);
}

_drawWalls(ctx) {
  ctx.fillStyle = COLOR_GREEN_DARK;
  ctx.globalAlpha = 0.5;
  for (const wall of this.walls) {
    ctx.beginPath();
    ctx.roundRect(wall.x * CELL, wall.y * CELL, CELL, CELL, 4);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

_drawSnake(ctx) {
  ctx.fillStyle = COLOR_GREEN_DARK;
  for (const seg of this.snake.segments) {
    ctx.beginPath();
    ctx.roundRect(seg.x * CELL, seg.y * CELL, CELL, CELL, 8);
    ctx.fill();
  }
}
```

## Overlays & HUD

DOM overlays render inside the game container via the scene's `renderUI()` method (called automatically by `Game`). The HUD strip sits below the game container using absolute positioning so the game area never shifts.

```js
renderUI() {
  let html = "";

  if (this.status === GAME_STATUS.PAUSED) {
    html = `
      <div class="pause-overlay">
        <div class="pause-text">PAUSED</div>
        <div class="pause-hint">Press SPACE to Resume</div>
      </div>`;
  }

  if (this.status === GAME_STATUS.GAMEOVER) { /* ... */ }
  if (this.status === GAME_STATUS.STAGE_COMPLETE) { /* ... */ }

  return html;
}
```

The HUD strip is hidden during Menu and Difficulty scenes and shown only when the GameScene is active:

```js
// In GameScene.enter():
const strip = document.getElementById("hud-strip");
if (strip) strip.style.display = "";

// In MenuScene.enter() / DifficultyScene.enter():
const strip = document.getElementById("hud-strip");
if (strip) strip.style.display = "none";
```

## Scene Methods & Cleanup

All event listeners registered via `this.on()`, `this.onSwipe()`, and `this.onTap()` are automatically removed when the scene exits — no manual teardown needed.

```js
// Auto-cleaned event listeners
this.on(document, "keydown", handler);
this.on(button, "click", handler);
this.onSwipe((dir) => this.snake.queueDirection(dir));
this.onTap(() => this.game.refreshUI());

// Custom cleanup (runs on exit alongside auto-cleanup)
this.cleanup(() => { /* custom teardown */ });
```

Button clicks in overlays use event delegation on `this.root`:

```js
this.on(this.root, "click", (e) => {
  const replay = e.target.closest(".btn-replay");
  if (replay) { this._retry(); return; }
  const menu = e.target.closest(".btn-menu");
  if (menu) { this.transitionTo(new MenuScene()); return; }
});
```

## Persistence

High scores are stored per-difficulty (or per "stage") using Jygame's `Storage`. Stage progress uses a separate key.

```js
const STORAGE_HIGHSCORES = "snake_highscores";

_gameOver() {
  this.status = GAME_STATUS.GAMEOVER;
  const key = this.difficulty || "stage";
  if (this.score > (this.highScore[key] || 0)) {
    this.highScore[key] = this.score;
    Storage.set(STORAGE_HIGHSCORES, this.highScore);
  }
  this.game.refreshUI();
}
```

```js
export function getStageProgress() {
  const val = Storage.get('snake_stage_progress');
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function saveStageProgress(index) {
  Storage.set('snake_stage_progress', String(index));
}
```

## Input

Direction and action input are polled via `Input.justPressed()` inside `update()` each frame. Navigation (Escape) uses a document-level keydown listener registered through `this.on()`. Swipe and tap are handled via `this.onSwipe()` and `this.onTap()`.

```js
// In GameScene.enter():

// Prevent arrows/space from scrolling the page
this.on(document, "keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar", "Escape"].includes(e.key)) {
    e.preventDefault();
  }
});

// Swipe for direction (touch)
this.onSwipe((dir) => {
  if (this.status === GAME_STATUS.RUNNING) {
    this.snake.queueDirection(dir);
  }
});

// Tap to toggle pause
this.onTap(() => {
  if (this.status === GAME_STATUS.RUNNING) {
    this.status = GAME_STATUS.PAUSED;
    this.game.refreshUI();
  } else if (this.status === GAME_STATUS.PAUSED) {
    this.status = GAME_STATUS.RUNNING;
    this.game.refreshUI();
  }
});
```

Keyboard direction input (`UP`/`DOWN`/`LEFT`/`RIGHT`) is handled in `update()` via `Input.justPressed()`, which supports arrow keys and WASD by default:

```js
update(dt) {
  if (this.status === GAME_STATUS.RUNNING) {
    const dirs = ["UP", "DOWN", "LEFT", "RIGHT"];
    for (const dir of dirs) {
      if (Input.justPressed(dir)) {
        this.snake.queueDirection(dir);
      }
    }
  }
}
```

## HUD Layout

The HUD strip is positioned below the game container using `position: absolute` inside a fixed-height wrapper so the game area position remains identical across all scenes.

```css
.game-screen {
  position: relative;
  height: 484px;                   /* container + gap + HUD */
}

.game-hud-strip {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 36px;
  display: flex;
  justify-content: space-between;
}
```

## Scaling

Scaling is handled via CSS custom properties. An inline script in `index.html` calculates the scale factor on load.

```js
const NATIVE_W = 596;
const NATIVE_TOTAL_H = 484;
const VIEWPORT_PAD = 12;

function applyScale() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const availW = vw - VIEWPORT_PAD * 2;
  const availH = vh - VIEWPORT_PAD * 2;
  const scale = Math.min(1, availW / NATIVE_W, availH / NATIVE_TOTAL_H);
  const visualH = NATIVE_TOTAL_H * scale;
  const marginV = ((NATIVE_TOTAL_H - visualH) / 2) * -1;
  document.documentElement.style.setProperty('--scale', scale);
  document.documentElement.style.setProperty('--scale-margin-v', marginV + 'px');
}
```

## Run Locally

```bash
git clone https://github.com/Bouzidi-Youssef/jygame-snake.git
cd jygame-snake
npm install
npm run dev
```

<style>
.snake-embed {
  max-width: 600px;
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
}

.snake-embed iframe {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border: none;
}
</style>
