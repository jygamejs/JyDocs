# Events

The events system provides **typed event channels** with pooled, reusable event objects. Events are cleared automatically after each `world.update()`.

## Defining an Event Class

Events must have a static `fields` array listing their data fields:

```js
class CollisionEvent {
  static fields = ['entityA', 'entityB', 'contactPoint']
}

class ScoreEvent {
  static fields = ['points', 'entity']
}

class DamageEvent {
  static fields = ['target', 'source', 'amount']
}
```

## Registration

Events must be registered before use:

```js
world.registerEvent(CollisionEvent)
world.registerEvent(ScoreEvent, { capacity: 512 }) // optional capacity
```

## Emitting

```js
world.events.emit(CollisionEvent, {
  entityA: ship,
  entityB: asteroid,
  contactPoint: { x: 100, y: 200 },
})
```

Event objects are pre-allocated in a ring buffer. Fields are copied into the next available slot — no garbage is produced.

## Reading Events

`world.events.read()` returns the event channel, which is iterable:

```js
for (const evt of world.events.read(CollisionEvent)) {
  console.log(evt.entityA, evt.entityB)
}
```

## Reading in Systems

```js
class CollisionResponseSystem extends System {
  static query = { all: [Transform, Collider] }

  update(ctx, dt) {
    for (const evt of ctx.events.read(CollisionEvent)) {
      if (ctx.has(evt.entityA, Health)) {
        const health = ctx.get(evt.entityA, Health)
        health.current -= 10
      }
    }
  }
}
```

## Clearing

Events are cleared automatically at the end of `world.update()`. You can also clear manually:

```js
world.events.clear()
```

## EventChannel

Each event type has an `EventChannel` with:

| Property | Description |
|----------|-------------|
| `channel.count` | Number of events in the current frame's buffer |
| `channel.capacity` | Current capacity (auto-grows) |

```js
const channel = world.events.read(CollisionEvent)
console.log(channel.count) // events this frame
```
