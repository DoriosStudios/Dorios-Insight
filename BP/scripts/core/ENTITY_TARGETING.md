# Entity Targeting

Dorios Insight ignores entities that include the `inanimate` type family.

Use this family for technical entities that represent blocks or systems instead of living targets, such as machines, tanks, pipes, outlines, storage terminals, thrown helper entities, and similar block-backed entities.

Example:

```json
"minecraft:type_family": {
  "family": [
    "inanimate",
    "dorios:energy_container",
    "dorios:fluid_container"
  ]
}
```

When the player looks at an `inanimate` entity, Insight skips that entity target and continues to the block raycast. This lets WAILA show the block label and block-backed data like energy, fluids, tags, states, and identifiers.

Do not add `inanimate` to real living entities or `minecraft:player`, unless they should never be treated as entity targets by Insight.
