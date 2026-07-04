# Component Schemas

Components are **plain classes with a static `schema` property** defining typed fields. The schema tells the `ComponentRegistry` which typed arrays to create for each field.

## Defining a Component

```js
export class Transform {
  static schema = { x: "f32", y: "f32", rotation: "f32", scaleX: "f32", scaleY: "f32" }
}
```

Components without fields (tag components) omit the schema:

```js
export class EnemyTag {}
```

## Supported Field Types

| Type | Aliases | C Type | Range |
|------|---------|--------|-------|
| `f32` | `float` | `Float32Array` | ~±3.4e38 |
| `f64` | `double` | `Float64Array` | ~±1.8e308 |
| `u8` | `bool` | `Uint8Array` | 0–255 |
| `u16` | | `Uint16Array` | 0–65535 |
| `u32` | `uint` | `Uint32Array` | 0–4.3e9 |
| `i8` | | `Int8Array` | -128–127 |
| `i16` | | `Int16Array` | -32768–32767 |
| `i32` | `int` | `Int32Array` | ~±2.1e9 |

## Registration

Components must be registered with a `World` before entities are created:

```js
world.register(Transform)
world.register(Velocity)
world.register(EnemyTag)
```

You may assign a reserved ID (1–63) for internal components:

```js
world.register(Transform, { reservedId: 1 })
```

Registration locks automatically after `world.createEntity()` is called.

## Built-in Components

### Transform
```js
class Transform {
  static schema = { x: "f32", y: "f32", rotation: "f32", scaleX: "f32", scaleY: "f32" }
}
```

### WorldTransform
```js
class WorldTransform {
  static schema = { x: "f32", y: "f32", rotation: "f32", scaleX: "f32", scaleY: "f32" }
}
```

### Velocity
```js
class Velocity {
  static schema = { x: "f32", y: "f32" }
}
```

### Collider
```js
class Collider {
  static schema = { width: "f32", height: "f32" }
}
```

### Renderable
```js
class Renderable {
  static schema = { image: "u16", fillColor: "u32", shape: "u8", layer: "i16" }
}
```

### RenderBounds
```js
class RenderBounds {
  static schema = { width: "f32", height: "f32" }
}
```

### Visible
```js
class Visible {
  static schema = { value: "u8" }
}
```

### Animation
```js
class Animation {
  static schema = { clipId: "u16", frameIndex: "u32", elapsed: "f32", isPlaying: "u8", speed: "f32" }
}
```

### Trail
```js
class Trail {
  static schema = {
    enabled: "u8",
    maxPoints: "u16",
    spacing: "f32",
    width: "f32",
    color: "u32",
    mode: "u8",
  }
}
```

### Parent
```js
class Parent {
  static schema = { entity: "u32" }
}
```

### Children
```js
class Children {}
```

## Custom Components

Define your own components for game-specific data:

```js
class Health {
  static schema = { current: "f32", max: "f32" }
}

class Mana {
  static schema = { current: "f32", max: "f32", regenRate: "f32" }
}
```
