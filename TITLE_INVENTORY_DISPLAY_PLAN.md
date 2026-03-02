# Dorios' Insight — Inventory Display Migration Plan (Actionbar -> Title)

## Goal
Plan the migration required to display **container inventories** (blocks like chests/barrels) and **entity inventories** (when available) using `onScreenDisplay.setTitle`, because actionbar has limited vertical space for slot-by-slot output.

## Why migration is needed
- Actionbar is optimized for short, dense status text.
- Inventory output is multi-line and often exceeds readable actionbar length.
- Title/subtitle can provide larger, structured payloads with better readability.

## Scope
### In scope
- Read-only inventory preview for:
  - Block containers (`minecraft:inventory` block component)
  - Entity inventories (when entity exposes inventory-like container components)
- Optional pagination/windowing for large containers.
- Rendering strategy and scheduling in the display controller.

### Out of scope (this phase)
- Editing inventory slots.
- New gameplay mechanics.
- Persistent inventory UI widgets.

## Technical references (Microsoft Learn)
- `Block.getComponent(...)` and block API:
  - https://learn.microsoft.com/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-stable
- `BlockComponentTypes`:
  - https://learn.microsoft.com/minecraft/creator/scriptapi/minecraft/server/blockcomponenttypes?view=minecraft-bedrock-stable
- `BlockInventoryComponent` (`minecraft:inventory`):
  - https://learn.microsoft.com/minecraft/creator/scriptapi/minecraft/server/blockinventorycomponent?view=minecraft-bedrock-stable

## Proposed architecture
1. **Render mode switch**
   - Add runtime render mode: `compact_actionbar` (default) | `inventory_title`.
2. **Controller branching**
   - Keep current actionbar path for compact status.
   - When inventory mode is active and target is inventory-capable, route to title renderer.
3. **Inventory extraction layer**
   - `extractBlockInventorySnapshot(block)`
   - `extractEntityInventorySnapshot(entity)`
   - Both return normalized snapshot:
     - `title`, `sourceType`, `slotCount`, `usedSlots`, `totalItems`, `slots[]`.
4. **Title renderer**
   - `renderInventoryTitle(snapshot, page, pageSize)`
   - Suggest page size: 9 slots per page (stable readability).
5. **Update cadence and dedupe**
   - Reuse existing deduplication cache strategy with payload hashing.
   - Throttle title refresh to avoid flicker.

## UX behavior proposal
- If target is container/entity inventory-capable:
  - Title: object name + summary (`used/total slots`, total items)
  - Subtitle/body: paged slot list (`#slot: item x amount`)
- If not inventory-capable:
  - Fallback to normal actionbar status.

## Risk analysis
- Frequent title updates can be visually noisy.
- Not all entities expose a consistent inventory component.
- Distance/raycast target switching can cause quick context jumps.

## Mitigations
- Add minimum hold time before swapping title source.
- Only rerender title on payload change.
- Use strict null/try guards for component access.
- Keep fallback to actionbar when snapshot extraction fails.

## Rollout plan
### Phase 1
- Implement block container snapshots + title renderer.
- Add runtime toggle and fallback path.

### Phase 2
- Add entity inventory snapshots for stable component cases.
- Add paging controls (simple next/prev command).

### Phase 3
- Optional compact icons/glyphs and localization polish.

## Acceptance criteria
- Inventory-capable blocks render readable paged title output.
- Non-inventory targets continue using actionbar.
- No regressions in existing actionbar display pipeline.
- Dedupe/throttle prevents flicker spam.
