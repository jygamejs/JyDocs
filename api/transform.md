# Transform

The `Transform` component holds spatial state for an entity — position, rotation, and scale. Used internally by `Sprite` but can be used standalone in custom entities.

## Constructor

```js
new Transform(x, y)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | `number` | `0` | X position (center-based) |
| `y` | `number` | `0` | Y position (center-based) |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x` | `number` | `0` | Center X position |
| `y` | `number` | `0` | Center Y position |
| `rotation` | `number` | `0` | Rotation in radians |
| `scale` | `Vec2` | `Vec2(1, 1)` | Scale factor |

## Usage

```js
import { Transform, Sprite } from 'jygame'

const sprite = new Sprite(100, 100, 32, 32)
sprite.transform.x = 200
sprite.transform.rotation = Math.PI / 4
sprite.transform.scale.set(2, 2)
```
