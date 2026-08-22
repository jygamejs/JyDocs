---
title: Particle
---

# Particle

`Particle` is the entry point for particle effects. It creates **effects** — self-contained emitters with their own simulation, lifetime, and rendering — from a single options object. Every effect updates and draws itself automatically as part of the game loop.

```js
import { Particle, ConeShape, ScaleModifier, FadeModifier } from "jygame";

const fire = Particle.create({
  rate: 40,
  lifetime: [0.6, 1.2],
  shape: new ConeShape({ radius: 8, angle: Math.PI / 3, direction: -Math.PI / 2, speed: [60, 120] }),
  modifiers: [new ScaleModifier({ from: 1, to: 0 }), new FadeModifier({ mode: "out" })],
  position: { x: 400, y: 300 },
});

fire.play();
```

Once created, an effect is **retained**: it joins the active scene and keeps emitting, updating, and rendering every frame until you stop or destroy it. You drive it through its own methods — `play`, `stop`, `emit` — not through a global tick.

## The essentials

| Call | What it does |
|------|--------------|
| `Particle.create(options)` | Create an effect — not yet emitting |
| `effect.play()` | Start continuous emission |
| `effect.emit(count)` / `effect.burst(count)` | Spawn `count` particles immediately |
| `effect.stop()` | Stop future emission; alive particles keep living |
| `effect.clear()` | Kill all alive particles right now |
| `effect.destroy()` | Remove the effect from the world and free everything |

```js
const puff = Particle.create({ rate: 60, lifetime: 0.8 });
puff.play();          // continuous
// or one-shot:
puff.burst(20);       // 20 particles now, no need to play
```

## Creating an effect — `Particle.create(options)`

`Particle.create()` takes one options object. Every field is optional — the defaults give you an idle effect at `(0, 0)` you can configure later.

```js
const effect = Particle.create({
  rate: 30,
  lifetime: [0.5, 1.0],
  shape: new ConeShape({ radius: 12, angle: Math.PI / 4, speed: 80 }),
  modifiers: [new FadeModifier()],
  position: [200, 150],
  capacity: 256,
});
effect.play();
```

### Options

| Option | Type | Default | Meaning |
|--------|------|---------|---------|
| `rate` | `number` | `0` | Particles per second while playing. `0` means "only manual emission via `emit`/`burst`" |
| `shape` | shape instance | none | Where and how particles spawn — see [Shapes](#shapes) |
| `modifiers` | modifier instances | `[]` | Per-particle behaviour — see [Modifiers](#modifiers) |
| `lifetime` | `number` \| `[min, max]` | — | How long each particle lives, in seconds. A single value fixes it; a range randomizes per particle |
| `position` | `{ x, y }` \| `[x, y]` | `{ x: 0, y: 0 }` | Initial effect position in world coordinates |
| `follow` | `target` \| `{ target, getter }` | — | Attach the effect to an object — see [Following a target](#following-a-target) |
| `initializer` | `(particle, index) => void` | — | Per-particle hook called right after spawn, before modifiers |
| `capacity` | `number` | auto | Maximum alive particles. Auto-estimated as `ceil(rate × maxLife × 1.5)` with a floor of `256` when omitted |
| `backend` | `"cpu"` \| `"gpu"` | auto | Which simulation backend to use — see [Backend](#backend) |

#### `rate`

Continuous emission rate, in particles per second. Fractional rates work correctly across frames — nothing is lost between ticks. `0` disables continuous emission: the effect only produces particles when you call `emit`/`burst`.

#### `shape`

Decides where each particle appears and what initial velocity it gets:

```js
import { CircleShape, ConeShape, RectangleShape } from "jygame";

new CircleShape({ radius: 20, direction: "outward", speed: [40, 80] })
new ConeShape({ radius: 8, angle: Math.PI / 6, direction: 0, speed: 100, spread: 0.2 })
new RectangleShape({ width: 100, height: 10 })
```

Shapes share direction/speed/spread options where applicable. See the dedicated [Shapes](#shapes) reference for the full list and their parameters.

#### `modifiers`

Per-particle behaviours that run every frame — fading, scaling, forces, colour, and so on:

```js
import { ScaleModifier, FadeModifier, ForceModifier } from "jygame";

Particle.create({
  modifiers: [
    new ScaleModifier({ from: 1, to: 0 }),
    new FadeModifier({ mode: "out", easing: "quadOut" }),
    new ForceModifier({ y: 200 }), // gravity
  ],
});
```

Modifiers compose and are applied in `priority` order when set. See the dedicated [Modifiers](#modifiers) reference.

#### `lifetime`

Per-particle lifetime in seconds. A single number fixes every particle to the same life; a two-element range randomizes uniformly per spawn:

```js
Particle.create({ lifetime: 1.5 });          // every particle lives 1.5 s
Particle.create({ lifetime: [0.4, 1.2] });   // random in [0.4, 1.2]
```

The lifetime is set on the particle before `initializer` and modifiers run, so both can read or override it. If you omit `lifetime`, particles fall back to whatever the initializer sets — and capacity estimation falls back to the `256` default.

#### `position`

Where the effect starts. Accepted forms:

```js
Particle.create({ position: { x: 100, y: 200 } });
Particle.create({ position: [100, 200] });
Particle.create(); // → (0, 0)
```

After creation the same forms work through `effect.position` — see [Position](#position).

#### `follow`

Attach the effect to a moving object so it tracks automatically. Two forms:

```js
// track target.transform or target.x/y directly:
effect.follow(player);
Particle.create({ follow: player });

// custom extraction — follow whatever getter returns:
Particle.create({ follow: { target: player, getter: (p) => p.weapon } });
effect.follow(player, (p) => p.tip);
```

The default getter looks for `target.transform.{x,y}`, then `target.{x,y}`. While following, manual `position` writes are overwritten every frame until you call `effect.unfollow()`.

#### `initializer`

A per-particle callback called right after each particle spawns, before any modifiers touch it:

```js
Particle.create({
  lifetime: 1,
  initializer: (particle, index) => {
    particle.size = 4 + Math.random() * 4;
    particle.color = "#ffaa00";
    // particle.x / y / vx / vy / life / maxLife etc. are all writable
  },
});
```

`index` counts spawn order within the current emission batch — handy for staggering or varying particles without extra state.

When both `lifetime` and `initializer` are provided, the lifetime is applied first and then `initializer` runs — so the initializer can read `particle.life`/`maxLife` or overwrite them.

#### `capacity`

Maximum number of alive particles the effect can hold. When omitted it is estimated from your emission settings:

```
capacity = ceil(rate × maxLifetime × 1.5)   // floor 256
```

`maxLifetime` is the single value or the upper bound of the range. An explicit `capacity` overrides the estimate. Size it generously for bursts — a burst of 200 particles needs capacity ≥ 200 even if `rate` is 0.

#### `backend`

Which simulation backend drives the effect:

| Value | Meaning |
|-------|---------|
| `"cpu"` (default) | Particles simulate in JavaScript |
| `"gpu"` | Particles simulate on the GPU — requires WebGL2 or WebGPU |

The automatic choice picks GPU when the game's renderer supports it and CPU otherwise. Forcing `"gpu"` without a capable renderer throws; the automatic path falls back silently to CPU.

## Controlling an effect

### Lifecycle — `play` / `stop` / `pause` / `resume` / `restart`

```js
effect.play();    // start emitting at `rate` per second
effect.stop();    // stop future emission; alive particles keep simulating
effect.pause();   // freeze emission and simulation
effect.resume();  // continue after pause
effect.restart(); // stop + clear + play — a clean replay
```

`play()` is idempotent — calling it while already playing does nothing, and calling it after the effect has finished (see [Completion](#completion--onfinish)) clears the finished flag so emission can resume. `stop()` never kills alive particles; use `clear()` for that.

A freshly created effect does **not** autoplay — you must call `play()` or `emit()` explicitly.

### Manual emission — `emit` / `burst`

Spawn particles immediately, regardless of whether the effect is playing:

```js
effect.emit(12);   // 12 particles now
effect.burst(30);  // alias of emit — same behaviour, reads better for one-shots
```

Both work while stopped or paused. Combine a zero `rate` with bursts for explosion-style effects:

```js
const explosion = Particle.create({ lifetime: 0.8, modifiers: [new FadeModifier()] });
explosion.burst(80);
explosion.onFinish(() => explosion.destroy());
```

### Clearing and destroying — `clear` / `destroy`

```js
effect.clear();    // kill every alive particle, keep the effect alive
effect.destroy();  // clear, unregister from the world, free the backend — done
```

`clear()` resets the emitter as well. `destroy()` is terminal — after it, `play`/`emit`/`update`/`render` are no-ops and `active`/`finished` reflect the destroyed state. Effects are not auto-destroyed when a scene exits; call `destroy()` yourself or use `onFinish` to tie their lifetime to the particle simulation.

### Following a target

```js
effect.follow(target);
effect.follow(target, (t) => t.hand); // custom getter
effect.unfollow();
effect.following; // boolean — readonly
```

While following, the effect's position is overwritten every frame from the getter's return value. Call `unfollow()` to detach — the effect stays where it was last anchored.

## Properties

| Member | Type | Meaning |
|--------|------|---------|
| `position` | `{ x, y, set(x,y) }` | Emitter position — see below |
| `rotation` | `number` | Forwarded to the shape when applicable (e.g. `ConeShape` direction) |
| `depth` | `number` | Sort key for rendering order — lower draws first (default `0`) |
| `visible` | `boolean` | Whether the effect is rendered (default `true`) |
| `enabled` | `boolean` | Whether the effect is updated, emitted, and rendered (default `true`) |
| `following` | `boolean` | Whether a follow target is attached (readonly) |
| `active` | `boolean` | Not destroyed and not finished (readonly) |
| `finished` | `boolean` | Completion has fired (readonly) |

### `position`

A live view over the emitter. All of these mutate the same emitter position:

```js
effect.position.x = 120;
effect.position.y += 10;
effect.position.set(400, 300);
effect.position = { x: 10, y: 20 };
effect.position = [10, 20];
effect.move(5, -2); // relative offset — adds to the current position
```

`effect.position` itself is a view object with `x`, `y`, and `set(x, y)` (which also accepts `set({x, y})`). Assigning `effect.position = value` accepts `{x, y}` or `[x, y]`.

### `rotation`

For shapes with a direction (like `ConeShape`), setting `effect.rotation` rotates the shape accordingly. For other shapes the value is stored but has no effect.

### `depth`

Effects sort by `depth` before rendering — the `World` draws them low-to-high alongside other retained renderables. Use it to keep a ground dust effect behind a character and a spark effect in front.

### `visible` vs `enabled`

- `visible = false` — still simulated and still emitting, just not drawn.
- `enabled = false` — completely dormant: no emission, no simulation, no rendering. Alive particles freeze in place.

## Completion — `onFinish`

`onFinish` fires once when the effect was told to auto-destroy and the simulation naturally empties:

```js
const puff = Particle.create({ rate: 0, lifetime: 0.5 });
puff.onFinish(() => puff.destroy());
puff.burst(20);
// ~0.5 s later: last particle dies → callback fires → effect destroyed
```

```js
effect.onFinish((fx) => {
  console.log("done", fx.finished); // true
});
```

| Call | Effect |
|------|--------|
| `effect.onFinish(cb)` | Fires once when all particles have died and the effect is done — calls `cb(effect)` |
| `effect.destroyWhenFinished(cb)` | Alias of `onFinish` |

Details:

- `onFinish` only fires if you arm it. An idle effect with no particles never completes on its own.
- `stop()` + `onFinish` is the typical "play until drained" pattern for continuous emitters: stop new emission, let the tail drain, then clean up.

## World integration

Effects are managed by the scene — they update and render automatically every frame and are sorted by `depth`. In most games you never call `update` or `render` yourself.

## The particle object

`initializer` receives a mutable particle object. Its writable fields:

| Field | Meaning |
|-------|---------|
| `x`, `y` | Position |
| `vx`, `vy` | Velocity |
| `ax`, `ay` | Acceleration |
| `life` / `maxLife` | Remaining / initial lifetime |
| `size` | Rendered size |
| `rotation` / `rotationSpeed` | Orientation and spin |
| `alpha` | Opacity `0`–`1` |
| `r`, `g`, `b`, `color` | Colour |
| `texture` | Optional texture handle |
| `originX` / `originY` | Draw origin |
| `width` / `height` / `frameX` / `frameY` / `frameWidth` / `frameHeight` | Atlas frame |
| `depth` / `ageRatio` / `lifeRatio` | Derived values |
| `collides` / `radius` / `collisionResponse` / `restitution` / `collisionLayer` / `onCollision` | Collision (when a `CollisionModifier` is present) |
| `userData` | Free slot for game data |

`lifeRatio` is `life / maxLife` (read-only getter). Modifiers like `ScaleModifier` and `FadeModifier` read `ageRatio`/`lifeRatio` internally.

## Shapes

Shapes decide where a new particle appears and what initial velocity it gets:

| Shape | What it does |
|-------|--------------|
| `CircleShape` | Uniform inside a circle — `radius`, `direction`, `speed`, `spread` |
| `RingShape` | Between two radii — `innerRadius`, `outerRadius` |
| `RectangleShape` | Uniform inside a rectangle — `width`, `height` |
| `LineShape` | Along a segment — `new LineShape(x1, y1, x2, y2)` |
| `ConeShape` | Inside a cone — `radius`, `angle`, `direction`, `speed`, `spread` |
| `PolygonShape` | Uniform inside a polygon |
| `PathShape` | Along a polyline — `new PathShape([[x,y], ...])` |
| `SplineShape` | Along a smooth spline — `new SplineShape([[x,y], ...])` (≥ 4 points) |

Shapes that support `direction` accept values like `"outward"` / `"inward"` / `"clockwise"` (radial) or `"along"` / `"perpendicular"` (linear), plus `speed` (number or `[min, max]`) and `spread` (radians). Dedicated shape docs cover each constructor in detail.

## Modifiers

Modifiers run per particle each frame:

| Modifier | What it does |
|----------|--------------|
| `FadeModifier` | Fades `alpha` — `mode: "in"` / `"out"` / `"in-out"`, `easing` |
| `ScaleModifier` | Scales `size` — `from`/`to` or `min`/`max`, `easing` |
| `ColorModifier` | Interpolates `r/g/b` through colour stops |
| `RotationModifier` | Spins via `speed` or interpolates `from` → `to` |
| `VelocityModifier` | Drag / damping on `vx`/`vy` |
| `ForceModifier` / `AttractionModifier` / `OrbitModifier` / `WindModifier` / `TurbulenceModifier` | Forces and fields |
| `AnimationModifier` / `AnimatedSpriteModifier` | Frame animation |
| `SpawnModifier` / `TrailModifier` | Spawn new particles from alive ones |
| `CollisionModifier` | Particle-vs-world collision |

Modifiers expose `enabled` and `priority` (lower runs first; last write wins on conflicts). Dedicated modifier docs cover each option.

## Examples

A looping campfire with gravity and a flicker:

```js
import { Particle, ConeShape, ScaleModifier, FadeModifier, ForceModifier } from "jygame";

const campfire = Particle.create({
  rate: 25,
  lifetime: [0.8, 1.4],
  shape: new ConeShape({ radius: 6, angle: Math.PI / 5, direction: -Math.PI / 2, speed: [30, 70] }),
  modifiers: [
    new ScaleModifier({ from: 4, to: 0 }),
    new FadeModifier({ mode: "out" }),
    new ForceModifier({ y: -20 }),
  ],
  position: { x: 400, y: 300 },
});
campfire.play();
campfire.depth = 1;
```

A one-shot explosion that cleans itself up:

```js
const boom = Particle.create({
  rate: 0,
  lifetime: [0.3, 0.7],
  shape: new CircleShape({ radius: 4, direction: "outward", speed: [120, 260] }),
  modifiers: [new ScaleModifier({ from: 6, to: 0 }), new FadeModifier()],
  position: player.position,
  capacity: 200,
});
boom.burst(80);
boom.onFinish(() => boom.destroy());
```

Following a moving character:

```js
const trail = Particle.create({
  rate: 30,
  lifetime: 0.6,
  shape: new CircleShape({ radius: 2, speed: 10 }),
  modifiers: [new FadeModifier()],
  follow: player, // tracks player.transform or player.x/y
});
trail.play();
// later...
trail.unfollow();
trail.stop();
```

Custom initialization per particle:

```js
const confetti = Particle.create({
  rate: 0,
  lifetime: 1.2,
  initializer: (p, i) => {
    p.size = 3 + Math.random() * 5;
    p.rotationSpeed = (Math.random() - 0.5) * 8;
    p.color = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4"][i % 4];
  },
  modifiers: [new FadeModifier({ mode: "out" })],
});
confetti.burst(40);
```
