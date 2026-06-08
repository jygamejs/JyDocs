# Collider

The `Collider` component defines an AABB (axis-aligned bounding box) collision volume for an entity. Includes static helper methods for common collision checks.

## Constructor

```js
new Collider(width, height)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | `number` | `0` | Collider width |
| `height` | `number` | `0` | Collider height |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number` | `0` | Collider width |
| `height` | `number` | `0` | Collider height |

## Static Methods

### `checkAABB(aTransform, aCollider, bTransform, bCollider)`

```js
Collider.checkAABB(transformA, colliderA, transformB, colliderB)  // boolean
```

AABB overlap test between two entities. Uses their `Transform` and `Collider` components.

### `checkRect(transform, collider, rect)`

```js
Collider.checkRect(transform, collider, rect)  // boolean
```

Tests whether the entity's AABB overlaps a given `Rect`.

### `containsPoint(transform, collider, point)`

```js
Collider.containsPoint(transform, collider, { x, y })  // boolean
```

Tests whether a point lies inside the entity's AABB (inclusive bounds).

### `getAABB(transform, collider, out)`

```js
Collider.getAABB(transform, collider, out)
```

Writes the entity's axis-aligned bounding box into the `out` object (`out.left`, `out.right`, `out.top`, `out.bottom`). Useful for pool-friendly code paths.

## Usage

```js
import { Sprite, Collider } from 'jygame'

const a = new Sprite(0, 0, 50, 50)
const b = new Sprite(30, 30, 50, 50)

Collider.checkAABB(a.transform, a.collider, b.transform, b.collider)  // true
```
