# Serialization

The `Serializer` provides world-level serialization and deserialization of all entities and their components.

## Serializing

```js
const json = world.serialize()
```

Returns a JSON string containing all alive entities, their component data, and tags.

### Output Format

```json
{
  "version": 1,
  "entities": [
    {
      "id": 16777217,
      "components": [
        { "name": "Transform", "data": { "x": 100, "y": 200, "rotation": 0, "scaleX": 1, "scaleY": 1 } },
        { "name": "Renderable", "data": { "image": 0, "fillColor": 4278190335, "shape": 1, "layer": 0 } }
      ],
      "tags": ["EnemyTag"]
    }
  ]
}
```

Components with data are listed under `components`. Empty-schema components (tags) are listed under `tags`. The `Parent` component's `entity` field is serialized as the original entity ID and remapped during deserialization.

## Deserializing

```js
const idMap = world.deserialize(json)
```

Returns a `Map<oldId, newId>` mapping original entity IDs to newly created entity IDs.

During deserialization:
- All component classes referenced must be registered
- `Parent` entity references are remapped to the new IDs
- Entities are created in the same order as serialized

## Requirements

- The world must have all component types registered before deserialization
- Tag components must be registered (they are referenced by name)
- The serialization format is versioned (current: `version: 1`)
