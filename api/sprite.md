---
title: Sprite
---

# Sprite

`Sprite` is the retained, world-space image object. Where `Image` loads and slices assets, a `Sprite` is a live object in the scene: it follows the camera, sorts by `layer` and `depth` alongside text and everything else, interpolates between ticks, and animates itself through the clips you loaded with [`Image.animate`](image.md#animating-images-—-image-animate-config). Every sprite is a thin wrapper over an ECS entity, so it behaves like any other renderable in the world.

```js
import { Sprite, Image, Input } from "jygame";

// load an animation set, then build a sprite from its registered name:
await Image.animate({ name: "king", path: "assets/king", idle: 4, run: 6 });

const player = new Sprite(400, 300, "king");
player.animation.play("idle");
player.scale = 2;
player.velocity.x = 120;
```

A sprite is whatever you point it at — a single image, a frame of an animation, a rectangle cut out of an atlas — or a solid shape with no image at all. Its `x`/`y` is the **top-left corner**, and it stays the top-left corner through every size change: image resolution, `scale`, and explicit `width`/`height` all grow the sprite from that corner. Rotation pivots around the center.

## The essentials

| Call | What it does |
|------|--------------|
| `new Sprite(x, y, image)` | Create a sprite at `(x, y)` showing `image` |
| `sprite.animation.play("run")` | Play a clip — see [Animation](#animation) |
| `sprite.collides(other)` | Test overlap with another sprite or a rectangle |
| `sprite.bounds` / `sprite.hitbox` | The rendered box / the collider box |
| `sprite.destroy()` | Remove the sprite from the world |

## Construction

`new Sprite(...)` adapts to what you pass it:

| Form | Meaning |
|------|---------|
| `new Sprite()` | Empty sprite at `(0, 0)`, size `0` |
| `new Sprite(x, y)` | Position only — size resolves when an image is set |
| `new Sprite(x, y, image)` | Position + image |
| `new Sprite(x, y, w, h)` | Position + **explicit size** (also fixes the collider) |
| `new Sprite(x, y, w, h, image)` | Position + size + image |
| `new Sprite(x, y, w, h, world)` | Into a specific world |
| `new Sprite(image)` | Image only, at `(0, 0)` |

```js
const hero = new Sprite(100, 100, "hero.png");          // URL
const tile = new Sprite(0, 0, 32, 32, img);             // image + fixed size
const card = new Sprite(400, 300, cards[0]);            // atlas region
const box  = new Sprite(200, 200, 50, 60);              // solid shape, no image
```

`image` can be a URL string, an `HTMLImageElement`, a canvas, an atlas region from [`Image.atlas`](image.md#building-atlases-—-image-atlas-config), or a **name** — if the name matches a registered animation set, the sprite adopts every clip automatically (see [Named sets & sprites](image.md#named-sets-sprites)). Passing `w`/`h` fixes the collider to that size; later scaling will not resize it.

`x`/`y` are the sprite's **top-left corner**. Internally the entity transform tracks the center (`x + width/2`); rotation pivots around that center, while size changes keep the top-left fixed.

## Image

| Member | Type | Meaning |
|--------|------|---------|
| `image` | `string` \| `HTMLImageElement` \| `canvas` \| `region` \| `number` | The asset this sprite draws (get/set) |
| `nativeWidth` / `nativeHeight` | `number` | The asset's size in pixels, resolved once |
| `width` / `height` | `number` | The drawn size — `native` × `scale` |

```js
sprite.image = "enemy.png";      // swap the picture
sprite.image = ui.health;        // or a named atlas region
```

The sprite's size is resolved from the image the first time one is set — from the image's own dimensions, or from the first frame of a clip when `animation.play()` runs. That resolution happens **once**: an explicit size from the constructor (or from `width`/`height`) wins, and a later image swap never shrinks the sprite back down. A sprite with no image and no size draws nothing until it has one or the other.

## Solid shapes

Without an image, a sprite draws as a **filled shape** — useful for physics probes, debug boxes, collision visualization, and quick prototyping. Set its size (constructor or `width`/`height`) and style it:

```js
const circle = new Sprite(400, 300, 60, 60);
circle.style.fill = "#ff0000";
circle.style.shape = "circle";   // "rect" (default) | "circle"

const box = new Sprite(100, 100, 40, 40);
box.style.fill = "rgba(0, 200, 255, 0.5)";
```

| Member | Type | Meaning |
|--------|------|---------|
| `style.fill` | `string` | Hex color (or any CSS color) for solid shapes — default `"#ffffff"` |
| `style.shape` | `"rect"` \| `"circle"` | The primitive to draw — default `"rect"` |

A circle is inscribed in the sprite's box: its radius is half the smaller dimension. Shapes are drawn with the sprite's scale, rotation, layer, and depth like anything else.

## Transform

| Member | Type | Meaning |
|--------|------|---------|
| `x`, `y` | `number` | Top-left position (get/set) |
| `angle` | `number` | Rotation in radians around the center |
| `scale` | `number` \| `{ x, y }` | Uniform or per-axis scale — grows from the top-left |
| `transform` | `object` | The raw `{ x, y, rotation, scaleX, scaleY }` view (get/set) |

```js
player.x = 100;
player.y += 10;
player.angle += 0.05;               // spin in place
player.scale = 2;                   // uniform
player.scale = { x: -1, y: 1 };     // flip horizontally
```

`transform` exposes the underlying fields directly — `sprite.transform.x` is the **center**, not the top-left corner. Set it with a partial object to update only the fields you name; setting `scaleX`/`scaleY` via `transform` syncs the collider (unless the collider is fixed). The geometry accessors below are the comfortable layer on top of it.

## Geometry

The position helpers treat the sprite as an axis-aligned box from `left`/`top` to `right`/`bottom`:

| Member | Meaning |
|--------|---------|
| `left` / `right` | `x` / `x + width` |
| `top` / `bottom` | `y` / `y + height` |
| `centerx` / `centery` | The box center |
| `center` | `{ x: centerx, y: centery }` |
| `midtop` / `midbottom` | `{ centerx, y }` / `{ centerx, bottom }` |
| `midleft` / `midright` | `{ x, centery }` / `{ right, centery }` |

Every one is readable and writable, so you can anchor the sprite by any edge or point:

```js
player.bottom = 300;              // stand on a platform at y = 300
label.centerx = 400;              // center horizontally
sprite.right = this.exit.left;    // push against a wall
```

`scaledWidth` / `scaledHeight` are aliases of `width` / `height` (which already include scale).

## Bounds

`bounds` is a live read-only view of the sprite's **rendered box** — the visible footprint after scale. It tracks the sprite, so you can query it once and keep using it:

```js
const b = sprite.bounds;
b.collides(other);                // overlap test vs sprite or any rect
b.overlap(other);                 // { x, y, width, height } of the overlap, or null
b.contains({ x, y });             // point inside (inclusive)
```

`bounds` exposes `x`, `y`, `width`, `height`, `left`, `right`, `top`, `bottom`, `centerx`, `centery`, and `center` — all reflecting the sprite's current transform. `collides` and `overlap` accept another `bounds`, a `Sprite`, or any plain rectangle (`{ x, y, width, height }` or `{ x, y, w, h }`).

## Hitbox & collider

A sprite carries a **collider** — the rectangle used for collision tests. By default it is **auto**: it tracks the rendered size, following the image and scale. Set it explicitly and it becomes fixed — scaling no longer moves it.

| Member | Type | Meaning |
|--------|------|---------|
| `collider` | `object` | `{ width, height, offsetX, offsetY }` (get/set) |
| `hitbox` | `object` | Live view of the collider's box, like `bounds` |
| `resetCollider()` | | Drop the explicit collider and re-sync to the rendered size |

```js
sprite.collider = { width: 20, height: 40, offsetX: 0, offsetY: 10 };
// a tighter, lower hitbox than the full sprite

sprite.hitbox.collides(wall);       // test against the collider box
sprite.resetCollider();             // back to auto — follows the image again
```

`offsetX`/`offsetY` shift the collider from the sprite center without moving the sprite. `hitbox` is the live box of that collider — same helpers as `bounds` (`collides`, `overlap`, `contains`, edges, centers) — and is what every collision query below actually tests. `new Sprite(x, y, w, h)` starts with an explicit collider; setting `collider` marks it explicit too.

## Collision

Sprites can be tested against each other, against rectangles, against groups, and against the world's spatial hash:

```js
if (player.collides(exit)) { this.levelComplete(); }       // sprite vs sprite
if (player.collides({ x: 0, y: 500, width: 800, height: 20 })) { /* floor */ }

const hit = player.collidesAny(enemies);   // first colliding sprite in a Group or array
const d   = player.distanceTo(exit);       // center-to-center distance

const near = player.queryNearby(120);      // sprites within 120px (spatial hash)
```

| Call | Returns | Notes |
|------|---------|-------|
| `collides(other)` | `boolean` | AABB vs sprite, or any rect (`{ x, y, width, height }` / `{ x, y, w, h }` / `{ left, top, right, bottom }`) |
| `collidesAny(group)` | `Sprite \| null` | First overlap in a `Group` or array; skips self and invisible sprites |
| `distanceTo(other)` | `number` | Center-to-center to a sprite or point; `Infinity` for `null`/`undefined` |
| `queryNearby(radius?)` | `Sprite[]` | Neighbors within `radius` (circle) or touching the collider (omitted); needs the world's `SpatialHash` resource, else `[]` |

`collides` and `collidesAny` use the **collider** (with its offset), never the drawn box — that's what `hitbox` represents. Invisible sprites never collide. Edge-touching counts as no collision (strict AABB).

For collision *between whole sets* — every sprite in one group against every sprite in another — use [`Group` collision queries](#groups).

## Velocity

`velocity` is the movement vector in pixels per second. It is added lazily — nothing is created until you first touch it. The engine's movement system integrates it every tick:

```js
player.velocity.x = 120;         // move right at 120 px/s
player.velocity.y = -300;        // jump

player.velocity = { x: 0, y: 0 };  // or set both at once
```

```js
update(dt) {
  player.velocity.x = Input.axis("move").x * this.speed;
}
```

## Visibility

| Member | Type | Meaning |
|--------|------|---------|
| `visible` | `boolean` | Whether the sprite is drawn (get/set) — default `true` |

```js
sprite.visible = false;   // hide, keep state
```

Invisible sprites are skipped entirely — nothing is drawn, and they do not participate in collision.

## Layering

A sprite sorts with the same `(layer, depth)` keys as `Text` and every other renderable, so it can sit behind, between, or in front of them. `layer` picks the band (`Layer.WORLD` by default, `Layer.UI` for overlay), `depth` sorts within it:

```js
sprite.depth = 5;          // draw above things at depth < 5 on this layer
sprite.layer = Layer.UI;   // or move it to the UI band
```

There is no "sprites are always below text" rule — ordering comes entirely from these two values.

## `imageSmoothing`

| Member | Type | Meaning |
|--------|------|---------|
| `imageSmoothing` | `boolean` | Smooth edges when scaling — inherits the game's global `imageSmoothing` setting |

```js
pixelArt.imageSmoothing = false;   // keep crisp pixels when scaled up
```

Each sprite starts from the global `Game({ imageSmoothing })` choice; this flag overrides it for just this sprite.

## Animation

Animated sprites are driven through `sprite.animation`. Clips come from [`Image.animate`](image.md#animating-images--imageanimateconfig) — either adopted automatically when you build the sprite from a registered name, or attached by hand:

```js
await Image.animate({ name: "hero", path: "assets/hero", idle: 4, run: 6 });

const player = new Sprite(400, 300, "hero");   // name string → adopts the clips
player.animation.play("idle");

// or attach clips manually:
player.animation.add("blink", { frames: [1, 2], fps: 4, loop: true });
```

The first frame of the first clip is shown immediately on `add`/`addAll`, and its size resolves the sprite (unless a size is already fixed).

The controller distinguishes **what should normally be playing** from **temporary actions that take control**. It owns playback, completion, and resumption — gameplay code just states intent:

| Operation | Meaning |
|-----------|---------|
| `play(name)` | Persistent request: "this is the normal animation". Safe to call every frame; calling it with the active name does not restart. |
| `playOnce(name)` | Temporary one-shot that plays to completion and then resumes the latest persistent request. Never loops, even if the clip is configured to loop. |
| `playUntil(name, marker)` | Plays the named clip and pauses exactly at the marker — see [Marker-driven playback](#marker-driven-playback). |
| `playAfter(name, marker)` | Plays the named clip starting at the position right **after** the marker. |
| `pauseAt(name, marker)` | Arms the named (currently playing) clip to pause automatically when it reaches the marker. |
| `resumeAt(name, marker)` | Positions the cursor at the marker and resumes playback from there. |
| `play(name, { force: true })` | Higher-priority animation (death, stun, hit) that cannot be interrupted by ordinary `play()`. Resumes the persistent request on completion unless `{ resume: false }` holds the last frame. |
| `queue(name)` | Plays after the current one-shot/queued animation. With nothing temporary active it starts immediately. |
| `clearQueue()` | Drops pending queued clips; the currently playing one finishes, then normal playback resumes. |
| `pause()` / `resume()` | Stop at the current playback position / continue exactly where playback stopped. `resume()` also clears any armed marker stop. |
| `stop()` | Reset playback state (stops, rewinds to the first frame). |
| `isAt(name, marker)` | Is the playback cursor exactly at the marker? |
| `hasReached(name, marker)` | Has the cursor reached or passed the marker? |
| `onComplete(cb)` | Fires once each time a finite playback reaches its end, with the completed clip name. |

Playback state is queryable through the facade — no ECS internals needed:

| Getter | Meaning |
|--------|---------|
| `current` | Name of the clip owning playback |
| `frame` / `position` | Current playback position on the normalized timeline |
| `progress` | Normalized progress through the clip (timing-aware; `1` when a finite clip completes) |
| `isPlaying` | Playback is actively advancing |
| `isPaused` | Intentionally stopped with a resumable cursor |
| `isComplete` | A finite playback genuinely completed — a marker stop is never complete |
| `marker` | Marker name at the current position, or `null` |

### `play()` vs `playOnce()`

```js
update(dt) {
  // Persistent: keep issuing it every frame.
  player.animation.play(Input.down("move") ? "run" : "idle");

  // Temporary: trigger on the one-frame input edge; the controller
  // plays jump to completion, then resumes run/idle.
  if (Input.pressed("jump")) {
    player.animation.playOnce("jump");
  }
}
```

While the jump is playing, the `play("run")` / `play("idle")` requests keep updating in the background. When the jump finishes, the latest request takes over automatically.

Do **not** try to express a one-shot with `play()` on a single-frame input edge:

```js
// Broken: pressed() is a one-frame event, so the animation reverts to
// run/idle on the very next frame. play() is persistent intent, not an action.
player.animation.play(Input.pressed("jump") ? "jump" : "walk");
```

`Input.pressed()` is a one-frame event, while `play()` means "this is the persistent animation". Use `playOnce()` for temporary actions.

### Forced animations

```js
if (enemyHit) {
  player.animation.play("hit", { force: true });   // resumes normal on completion
}
player.animation.play("death", { force: true, resume: false }); // terminal: holds last frame
```

### Queues

```js
if (Input.pressed("attack")) {
  player.animation.playOnce("attack1");
  player.animation.queue("attack2");
  player.animation.queue("attack3");
}
// attack1 → attack2 → attack3 → normal animation
```

### Completion events

```js
player.animation.playOnce("jump");
player.animation.onComplete((name) => {
  if (name === "jump") Audio.play("land");
});
```

The callback fires once per finite clip that ends — including each queued clip, in order. It fires after the controller has advanced, so calling `play()` / `playOnce()` from inside the callback cannot corrupt playback state.

### Marker-driven playback

`playUntil` and `pauseAt` split an animation into semantic phases. The
motivating example is a jump: play the anticipation and takeoff, pause at
`"airborne"`, and only continue when gameplay says so.

```js
const anims = await Image.animate({
  image: "jump.png",
  sliceX: 5,
  sliceY: 1,
  jump: {
    frames: 5,
    timing: [0.08, 0.08, 0.20, 0.40, 0.08],
    markers: { airborne: 2, landing: 4 },
  },
});

// later, in gameplay:
update(dt) {
  if (Input.pressed("jump")) {
    if (player.animation.isAt("jump", "airborne")) {
      player.animation.resume();          // already airborne — finish the jump
    } else {
      player.animation.playUntil("jump", "airborne"); // 0 → 1 → 2, then PAUSED
    }
  }
  if (player.isFalling) {
    player.animation.resume();            // 2 → 3 → 4 → complete
  }
}
```

Markers are addressed **explicitly** by animation + marker — there is no global
marker namespace, so the same name can exist in several clips without colliding
and gameplay code stays self-documenting. `playUntil` plays the named clip and
pauses exactly at the marker. The pause is detected even when a single `dt`
would have jumped past it, and it is **not** completion:

- `onComplete` does **not** fire,
- queued animations do **not** advance,
- the persistent request is preserved,

so `resume()` continues from the exact paused position and only a genuine end
of playback triggers normal completion/queue behavior.

`pauseAt` does not start a new animation — it arms the named clip that is
**currently playing**:

```js
player.animation.play("jump");
player.animation.pauseAt("jump", "airborne");  // keeps playing until the marker, then pauses
```

`playAfter` and `resumeAt` reposition the cursor directly on the timeline:

```js
player.animation.playAfter("jump", "airborne"); // starts at the position after the marker
player.animation.resumeAt("jump", "landing");   // positions at the marker and resumes
```

`playAfter("jump", "landing")` when `landing` is the final position ends the
animation without wrapping to frame 0. Positioning never fires `onComplete`.

`isAt` and `hasReached` let gameplay query where the cursor is: `isAt` is true
only at the exact marker position (repeated source frames stay distinct), while
`hasReached` stays true once playback has passed the marker, including after
completion.

## Groups

A **`Group`** collects sprites and answers collision queries over the whole set at once. It is iterable, so it drops into `for...of`, `forEach`, `map`, `filter`, `find`, `some`, and `every` naturally.

```js
const enemies = new Group();
enemies.add(new Sprite(100, 100, 32, 32));
enemies.add(new Sprite(200, 200, 32, 32));

for (const e of enemies) { e.update = ...; }
enemies.forEach((e) => e.velocity.x = -50);
```

| Member | Behavior |
|--------|----------|
| `add(sprite)` / `remove(sprite)` / `has(sprite)` | Membership (a sprite knows its groups, so `destroy()` cleans them up) |
| `clear()` | Remove every sprite |
| `size` / `length` / `children` | Count / snapshot array |
| `first` / `last` | The first / last sprite |

### Group collision queries

```js
const hits = enemies.collideSprite(player);          // sprites overlapping the player
const onFloor = platforms.collideRect({ left: 0, top: 480, right: 800, bottom: 500 });
const under = enemies.collidePoint({ x: 100, y: 300 });
const inRadius = enemies.collideCircle(400, 300, 150);
```

| Call | Returns |
|------|---------|
| `collideSprite(sprite, out?)` | `Sprite[]` — members overlapping the sprite's collider |
| `collideRect(rect, out?)` | `Sprite[]` — members overlapping the rect |
| `collidePoint(point, out?)` | `Sprite[]` — members containing the point |
| `collideCircle(cx, cy, radius, out?)` | `Sprite[]` — members within the circle |
| `collideGroup(other, cbOrOut?)` | Pairwise overlaps with another group — callback or `[[a, b], ...]` array |
| `raycast(ox, oy, dx, dy, maxDist, out?)` | Hits along a ray (needs a spatial hash) |

All queries skip invisible members and reuse the optional `out` array you pass (zero-allocation). Without an acceleration structure each query scans the group; for big sets, turn one on:

```js
enemies.useSpatialHash(64);   // optional broad phase — queries only touch nearby cells
```

`raycast` returns nothing without a spatial hash; with one it returns the hits along the ray up to `maxDist`.

### Query-backed groups

`Group.query(world, { all, any, none })` builds a live, read-only group from an ECS query — it always reflects the world's current entities and never needs `add`/`remove`. The object uses component classes; specify which a sprite must have (`all`), may have (`any`), or must not have (`none`):

```js
const enemies = Group.query(this.world, { all: [EnemyTag, Sprite] });
```

Query groups are iterable and support the same iteration helpers, but adding, removing, or clearing throws.

## `world` & `entity`

Every `Sprite` is backed by an ECS entity. `sprite.world` is the world it lives in and `sprite.entity` its entity id. You rarely need them; they exist for advanced cases like attaching extra components to the same entity or addressing the sprite from your own systems.

## `destroy()` & `kill()`

```js
sprite.destroy();   // remove the entity and leave its groups
```

| Call | Effect |
|------|--------|
| `destroy()` | Removes the sprite's entity from the world and every group. Idempotent. After it, any access throws |
| `kill()` | Leaves the entity alive but removes the sprite from its groups only |

Sprites created inside a scene are cleaned up when the scene exits; `destroy()` is for removing an individual sprite early.