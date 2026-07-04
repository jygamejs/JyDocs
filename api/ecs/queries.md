# Queries

Queries match entities by their component composition (archetype). They are the primary way to iterate over groups of entities.

## Query Definition

A query is an object with three optional filters:

```js
const queryDef = {
  all:  [Transform, Velocity], // entity must have ALL of these
  any:  [EnemyTag, PlayerTag], // entity must have AT LEAST ONE
  none: [StaticTag],           // entity must have NONE of these
}
```

## Creating Queries

Queries are created and cached by the `World`:

```js
const view = world.query({ all: [Transform, Renderable] })
```

`world.query()` returns a `QueryView` that is cached by query definition — repeated calls with the same definition return the same view.

## QueryView Iteration

### Entities

```js
for (const entity of view.entities()) {
  const t = world.get(entity, Transform)
}
```

### Tables (for bulk access)

```js
for (const table of view.tables()) {
  const x = table.getColumn(Transform, 'x')
  const y = table.getColumn(Transform, 'y')
  for (let r = 0; r < table.count; r++) {
    // x[r], y[r]
  }
}
```

### Rows

```js
for (const { table, row } of view.rows()) {
  // table, row
}
```

### forEach

```js
view.forEach((table, row) => {
  const x = table.getColumn(Transform, 'x')[row]
})
```

### Direct Column (single archetype)

If the query matches exactly one archetype:

```js
const x = view.column(Transform, 'x')
```

Returns `null` if no entities match. Throws if multiple archetypes match.

## QueryEngine (low-level)

The `QueryEngine` is accessible via `world.queryEngine`. It manages query creation, archetype scanning, and version-based cache invalidation.

```js
const query = world.queryEngine.createQuery({
  all: [transformId, velocityId],
  none: [staticTagId],
})

const tables = world.queryEngine.getTables(query)
const archetypes = world.queryEngine.getArchetypes(query)
const matches = world.queryEngine.matches(signature, query)
```

## Archetype Matching

Entities are grouped into **archetypes** — unique sets of component IDs. A query matches an archetype when:

- All components in `all` are present
- At least one component in `any` is present (if specified)
- No components in `none` are present

Archetype membership determines which entities a query returns. When you add or remove a component, the entity moves to a different archetype.
