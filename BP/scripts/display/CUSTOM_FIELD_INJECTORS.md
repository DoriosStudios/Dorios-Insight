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

Both register methods accept an optional second argument:
- `{ provider?: string, components?: string[] }`

When `components` is provided, Insight automatically skips that injector when any mapped `show...` setting for those component keys is disabled (for example, `customVariantPreview` → `showCustomVariantPreview`).

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
- `linkedEntity` (nearest matched helper entity near the block, cache-based)
- `machineEntity` (alias of `linkedEntity` for compatibility)
- `linkedEntityLastScanTick`
- `linkedEntityIntervalTicks`
- `linkedEntityScanMaxDistance`

Linked entity lookup behavior:
- Default scan interval: `20` ticks.
- Default max distance: `1.35` blocks.
- Both are configurable through Insight runtime settings (`linkedEntityScanIntervalTicks`, `linkedEntityScanMaxDistance`).
- Candidate names can be overridden with `playerSettings.linkedEntityCandidateNames`.

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
> - If values are stored in entities, scoreboards, or dynamic properties, read from `linkedEntity` inside the block injector when available.

## Related

For state/trait transformations (rename/hide/merge/replace display values), see:
- `STATE_TRAIT_INJECTORS.md`
