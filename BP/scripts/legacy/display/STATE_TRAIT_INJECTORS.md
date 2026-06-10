# Insight State/Trait Injectors

Insight now exposes a global API to let **other addons** customize how block states/traits are shown.

Global object:
- `globalThis.InsightStateTraits`

## What it can do

- Rename state labels (`minecraft:facing_direction` -> `Facing`)
- Hide raw states
- Replace raw values with custom formatted values
- Merge multiple states into one synthetic line
- Inject extra synthetic state rows

## Public API

- `registerBlockStateTransformer(transformer, options?)`
- `unregisterBlockStateTransformer(transformer)`
- `clearBlockStateTransformers()`
- `registerStateAlias(stateKey, label)`
- `registerStateAliases(aliasMap)`
- `clearStateAliases()`
- `registerStateMerge(definition)`
- `getRegisteredCounts()`
- `preview(context)`

## Transformer context

Each transformer receives:
- `block`
- `typeId`
- `namespace`
- `blockTags`
- `blockTagSet`
- `namespaceInfo`
- `stateMap` (normalized object: key -> raw value)
- `entries` (current rendered entries snapshot)
- `formatStateName`
- `toMessageText`

## Transformer return format

Transformers can return an object with any of:
- `hide: string[]` (state keys to remove)
- `rename: Record<string, string>`
- `replace: Record<string, any>`
- `prepend: Array<{ key?: string, label?: string, value: any }>`
- `append: Array<{ key?: string, label?: string, value: any }>`

## Example: rename + hide one state

```js
globalThis.InsightStateTraits?.registerBlockStateTransformer((ctx) => {
  if (!ctx.typeId.startsWith("myaddon:")) return;

  return {
    rename: {
      "myaddon:machine_status": "Status",
      "myaddon:workload": "Load"
    },
    hide: ["myaddon:debug_internal"]
  };
});
```

## Example: merge multiple states

```js
globalThis.InsightStateTraits?.registerStateMerge({
  key: "myaddon:energy_summary",
  label: "Energy",
  stateKeys: ["myaddon:energy", "myaddon:energy_max"],
  formatter(values) {
    const current = Number(values[0]);
    const max = Number(values[1]);
    if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) {
      return "N/A";
    }

    return `${Math.floor(current)}/${Math.floor(max)} (${Math.floor((current / max) * 100)}%)`;
  },
  options: {
    namespaces: ["myaddon"]
  }
});
```

## Example: replace raw value format

```js
globalThis.InsightStateTraits?.registerBlockStateTransformer((ctx) => {
  const progress = Number(ctx.stateMap["myaddon:progress"]);
  if (!Number.isFinite(progress)) return;

  return {
    replace: {
      "myaddon:progress": `${Math.floor(progress)}%`
    }
  };
}, {
  typeIdPrefixes: ["myaddon:"]
});
```

## Filtering options

Second argument of `registerBlockStateTransformer(transformer, options)`:
- `priority` (lower runs first)
- `namespaces: string[]`
- `typeIdPrefixes: string[]`
- `requiredTags: string[]`
