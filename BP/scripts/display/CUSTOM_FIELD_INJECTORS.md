# Insight Custom Field Injectors

Insight now exposes a global API to inject custom actionbar fields from other addons.

Global object:
- `globalThis.InsightCustomFields`

Methods:
- `registerBlockFieldInjector(injector)`
- `registerEntityFieldInjector(injector)`
- `unregisterBlockFieldInjector(injector)`
- `unregisterEntityFieldInjector(injector)`
- `clearBlockFieldInjectors()`
- `clearEntityFieldInjectors()`
- `getRegisteredCounts()`

## Block injector context

Block injectors receive an object with:
- `block`
- `playerSettings`
- `blockTags`
- `namespaceInfo`
- `formatStateName`
- `formatTypeIdToText`
- `splitTypeId`
- `toMessageText`

Return value can be:
- `string`
- `string[]`
- `undefined`

Each returned line is rendered by Insight as:
- `\n${technicalColor}${line}§r`

## Entity injector context

Entity injectors receive:
- `entity`
- `playerSettings`
- `typeIdForDisplay`
- `namespaceInfo`
- `formatTypeIdToText`
- `splitTypeId`
- `toMessageText`

## Example: Decorative block next variant

```js
globalThis.InsightCustomFields?.registerBlockFieldInjector((ctx) => {
  const stateMap = ctx.block?.permutation?.getAllStates?.();
  if (!stateMap) return;

  const variantIndex = Number(stateMap["atelier:variant_index"]);
  const variantCount = Number(stateMap["atelier:variant_count"]);

  if (!Number.isFinite(variantIndex) || !Number.isFinite(variantCount) || variantCount <= 0) {
    return;
  }

  const nextVariant = (variantIndex + 1) % variantCount;
  return `Next Variant: ${nextVariant + 1}/${variantCount}`;
});
```

## Example: UtilityCraft energy line

```js
globalThis.InsightCustomFields?.registerBlockFieldInjector((ctx) => {
  const stateMap = ctx.block?.permutation?.getAllStates?.();
  if (!stateMap) return;

  const current = Number(stateMap["utilitycraft:energy"]);
  const total = Number(stateMap["utilitycraft:energy_max"]);

  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return;
  }

  return `Energy: ${Math.floor(current)}/${Math.floor(total)}`;
});
```

> Notes:
> - Property/state names depend on how each addon stores its runtime values.
> - If values are stored in entities, scoreboards, or dynamic properties, read from those sources inside the injector.
