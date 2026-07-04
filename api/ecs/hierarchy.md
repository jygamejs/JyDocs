# Hierarchy

The hierarchy system enables **parent-child relationships** between entities. Child entities inherit a transformed version of their parent's position, rotation, and scale.

## Initialization

Hierarchy must be explicitly initialized on a World:

```js
world.initHierarchy()
```

This:
1. Creates a `HierarchyGraph` instance
2. Registers it as a resource (`world.getResource(HierarchyGraph)`)
3. Sets up automatic dirty tracking on `Transform` changes

## Components

### Parent

Stores a reference to the parent entity:

```js
class Parent {
  static schema = { entity: "u32" }
}
```

### Children

Marker component — no data. Presence indicates an entity has children.

```js
class Children {}
```

### WorldTransform

Auto-computed world-space transform. Has the same schema as `Transform`:

```js
class WorldTransform {
  static schema = { x: "f32", y: "f32", rotation: "f32", scaleX: "f32", scaleY: "f32" }
}
```

## Attaching Entities

```js
world.attach(child, parent)
```

This:
1. Adds a `Parent` component to the child (with `{ entity: parentId }`)
2. Adds a `Children` component to the parent
3. Adds a `WorldTransform` component to the child
4. Marks the child and its descendants as dirty

## Detaching

```js
world.detach(child)
```

Removes the parent-child link. The child retains its local `Transform`.

## Querying Hierarchy

```js
world.parentOf(entity)   // parent entity ID or null
world.childrenOf(entity) // array of child entity IDs or null
```

## Traversal

```js
world.isDescendant(descendant, ancestor) // boolean
world.rootOf(entity)                     // top-most ancestor
```

## World Transform Computation

The `HierarchySystem` (priority `-10`) computes `WorldTransform` from local `Transform`:

- **Root entities**: `WorldTransform` = `Transform`
- **Child entities**: `WorldTransform` = parent's `WorldTransform` × child's local `Transform`

The computation follows the formula:

```
child.wx = parent.wx + child.x * parent.wsx * cos(parent.wrot) - child.y * parent.wsy * sin(parent.wrot)
child.wy = parent.wy + child.x * parent.wsx * sin(parent.wrot) + child.y * parent.wsy * cos(parent.wrot)
child.wrotation = parent.wrotation + child.rotation
child.wscaleX = parent.wscaleX * child.scaleX
child.wscaleY = parent.wscaleY * child.scaleY
```

## Dirty Tracking

The `HierarchyGraph` maintains a dirty set. When a `Transform` field is written, the entity and all its descendants are marked dirty. The `HierarchySystem` processes the dirty set each frame, starting from roots and propagating downward.

```js
graph.markDirty(entity)
graph.markDirtyRecursive(entity)
graph.markClean(entity)
graph.isDirty(entity)
graph.clearDirty()
```

## Lifecycle

When an entity with children is destroyed, all children are automatically detached (they keep their `Transform` but lose the `Parent` component).
