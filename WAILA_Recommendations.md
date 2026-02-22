# Dorios' Insight — Improvement Recommendations (WAILA-Inspired)

This document summarizes practical recommendations for `Dorios' Insight` based on patterns seen in the WAILA codebase architecture.

## 1) Build a Dedicated Localization Layer

### Why
WAILA maintains explicit translation mappings and special-case aliases. This avoids inconsistent names and improves multi-language fidelity.

### Recommendations
- Create a dedicated `localizationResolver` module with:
  - ID normalization (`minecraft:foo_bar` -> canonical key candidates)
  - category-aware key generation (`item.*`, `tile.*`, `entity.*`)
  - override tables for known exceptions
- Add key resolution strategy with deterministic order:
  1. hardcoded override map
  2. vanilla convention key
  3. addon convention key
  4. human-readable fallback
- Add `cache` for resolved keys (`Map<string, TranslationKeyResult>`) to avoid repeated formatting work per tick.

## 2) Separate Data Collection from Rendering

### Why
WAILA appears strongly modular. Insight already has a good split, but collector/render boundaries can be made stricter.

### Recommendations
- Keep rendering completely stateless:
  - input: normalized `ViewSnapshot`
  - output: `RawMessage`
- Move all expensive lookups to collectors:
  - type families
  - tags
  - item component extraction
  - namespace resolution source
- Introduce a stable DTO schema:
  - `BlockSnapshot`, `EntitySnapshot`, `ItemSnapshot`

## 3) Add a Pulse Scheduler (Per-Player Budget)

### Why
WAILA includes pulse scheduling concepts. Insight can gain smoothness with controlled per-player update cadence.

### Recommendations
- Replace global tick scanning with a rotating pulse queue:
  - process subset of players each tick
  - guarantee max latency bound (e.g., each player updated every N ticks)
- Add dynamic budget:
  - fewer updates in crowded servers
  - preserve responsiveness for nearby targets
- Track soft metrics:
  - average collector time
  - skipped frames
  - actionbar write count

## 4) Event Lifecycle Orchestration

### Why
WAILA has explicit startup/world-load event orchestration and deferred init patterns.

### Recommendations
- Create one `lifecycle` module for:
  - startup registration
  - world-load-safe initialization
  - safe retries for optional systems
- Add explicit `isInitialized` gate to avoid duplicate registration in hot-reload/dev contexts.

## 5) Stronger Item Entity Handling

### Why
WAILA-like viewers often treat `minecraft:item` as a first-class target with item-level metadata.

### Recommendations
- Extend item snapshot support:
  - item translation name
  - stack amount
  - optional durability and custom name
- Add optional display fields:
  - enchantment count
  - custom lore flag (boolean)
  - lock mode (if present)

## 6) Translation Diagnostics Mode

### Why
Localization regressions are hard to detect without explicit diagnostics.

### Recommendations
- Add `debug` option to show:
  - resolved translation key
  - key source (`override`, `default`, `fallback`)
  - fallback reason when not localized
- Optional command:
  - `/utilitycraft:insight global localization_debug on|off`

## 7) Compatibility Catalog for Addon Content

### Why
WAILA benefits from curated content metadata and exceptions. Insight already has workspace registry mapping and can evolve this further.

### Recommendations
- Keep generated registry, but add metadata columns:
  - display category
  - preferred translation family (`item`/`tile`/`entity`)
  - known aliases
- Add a small validator script to detect orphaned IDs.

## 8) Better Failure Isolation

### Why
WAILA-style systems should fail gracefully per-target.

### Recommendations
- Wrap each stage independently:
  - target acquire
  - snapshot collect
  - message build
  - actionbar send
- Attach lightweight reason codes (`NO_TARGET`, `MISSING_COMPONENT`, `TRANSLATION_FALLBACK`) for debug mode.

## 9) UX: Profiles and Quick Presets

### Why
WAILA users expect fast profile switching.

### Recommendations
- Add profile slots:
  - `Builder`, `Combat`, `Debug`, `Minimal`
- Keep runtime + component policies in each profile.
- Add commands:
  - `/utilitycraft:insight mode_profile <name>`

## 10) Priority Roadmap

### High Priority
1. Localization resolver module + cache
2. Translation diagnostics in debug mode
3. Pulse scheduler for large multiplayer worlds

### Medium Priority
4. Profile system with command shortcuts
5. Registry metadata enrichment and validation

### Low Priority
6. Extended item diagnostics (durability, enchant summary)
7. Optional telemetry counters for tuning

---

## Notes
- Insight already has excellent foundations: dynamic settings, policy-driven components, global/local toggles, and command-driven control.
- The biggest next leap is a dedicated localization pipeline with caching and diagnostics, which aligns strongly with the WAILA philosophy.
