# v1.1 (Plan)

Dorios’ Insight 1.1 foca em deixar a leitura de informações mais clara e configurável, com melhorias no actionbar, personalização por campo, mais idiomas e novos assets visuais. Também inclui ajustes técnicos para extensibilidade e estabilidade.

## DISPLAY (BLOCKS & ENTITIES)
- Expanded actionbar inspection with richer context for blocks and entities.
  - Added nearby item cluster readout for stacked item entities.
  - Added block-specific lines for common interactables (e.g., cauldrons, bells, bookshelves, containers).
- Added new condition-driven heart states.
  - Hearts can now switch to an on-fire style when the inspected entity is burning.
- Added hunger saturation viewer improvements.
  - Hunger now supports saturation-aware icon composition.
  - Saturation overlay display order was adjusted to the latest visual rule.
- Improved entity condition detection reliability.
  - Baby and on-fire checks now use safer component/property fallback paths.

## MENU & PERSONALIZATION
- Added deeper runtime style controls in the in-game menu.
  - Per-field style override for health, hunger, armor, absorption, and air.
- Expanded system controls.
  - Added block name resolve mode selection.
- Improved custom field controls.
  - Added visibility support for custom fluid, gas, and cobblestone fields.

## LOCALIZATION
- Expanded language coverage to additional locales.
  - Added `de_DE`, `fr_FR`, `ja_JP`, `ru_RU`, and `zh_CN`.
- Updated existing locale files (`en_US`, `pt_BR`, `pt_PT`, `es_ES`, `es_MX`) with new menu/display keys.
- Refined runtime/menu wording for better readability and less technical phrasing.

## UI/UX
- Updated glyph assets used by display conditions and status indicators.
- Improved display readability with clearer section separation between configurable and computed fields.

## BUG FIXES
### Fixed
- Fixed localization key concatenation issues in ES/PT locale files.
- Fixed inconsistencies in saturation glyph mapping keys.
- Improved resilience for custom injectors and state transformers when third-party handlers throw runtime errors.
### Known
- Most of the custom fields doesn't work properly.
- Name of entities doesn't get translated using localization keys.

## TECHNICAL CHANGES
- Added module-aware custom field injector architecture.
  - New display modules entrypoint under `BP/scripts/display/Modules/`.
- Extended state/trait transform integration and diagnostics.
- Kept release manifests aligned with the 1.1.x line.

---

## Commit mapping used for this plan (from `v1.0.0`)
Player-facing and technical commits considered:
- `60aef70` feat(display): expand actionbar rendering, localization, and entity scoreboard fields
- `54de0a9` feat(integration): add state/trait injection module and split insight command aliases
- `f7cac95` chore(release): bump manifests to 1.1.0 and update RP glyph assets
- `32b7b9f` docs(release): update roadmap, changelog, and v1.1.0 release notes
- `cfa6f18` Enhance workspace registry generation script
- `a1dc0e6` Added Localization for Multiple Fields
- `a0c62b1` Added richer display conditions
- `1a80a80` Added runtime style controls
- `f146dd3` Added language support and assets
- `c23b6d1` Added inventory title migration plan

Non-release noise intentionally excluded from the narrative:
- README-only update sequence (`1d08f12` .. `8e9db3b`).
