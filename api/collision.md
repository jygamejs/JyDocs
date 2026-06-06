# Collision

Static utility object with pure collision detection functions. Works with plain objects — no need for sprites or rect instances for basic shapes.

## Methods

### `rectRect(a, b)`

```js
Collision.rectRect(rectA, rectB)  // boolean
```

AABB overlap test. Delegates to `a.collides(b)` if available, otherwise performs edge comparison.

### `circleCircle(a, b)`

```js
Collision.circleCircle(a, b)  // boolean
```

Circle vs circle using squared distance. Each argument expects `{ x, y, radius }`.

```js
const a = { x: 0, y: 0, radius: 30 }
const b = { x: 40, y: 0, radius: 20 }
Collision.circleCircle(a, b)  // true (centers 40px apart, radii sum = 50)
```

### `pointInRect(point, rect)`

```js
Collision.pointInRect({ x, y }, rect)  // boolean
```

Delegates to `rect.contains(point)`.

### `rectCircle(rect, circle)`

```js
Collision.rectCircle(rect, { x, y, radius })  // boolean
```

Finds the nearest point on the rect boundary to the circle center, then checks if the distance is within the circle's radius.

### `groupRect(group, rect)`

```js
Collision.groupRect(group, rect)  // Sprite[]
```

Returns an array of visible sprites in the group whose rects collide with the given rect.

### `groupGroup(a, b)`

```js
Collision.groupGroup(groupA, groupB)  // [spriteA, spriteB][]
```

Returns an array of all visible colliding sprite pairs between two groups. Each pair is `[spriteFromA, spriteFromB]`.

```js
const pairs = Collision.groupGroup(bullets, enemies)
pairs.forEach(([bullet, enemy]) => {
  bullet.kill()
  enemy.health--
})
```

## Notes

- All functions expect rect-like objects with `x`, `y`, `w`, `h` properties (or compatible classes like `Rect` and `Sprite`).
- Group functions (`groupRect`, `groupGroup`) automatically skip invisible sprites.
