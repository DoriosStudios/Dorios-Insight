# Dorios' Insight v1.2.0

Dorios' Insight has been completely reworked with a faster, more customizable
WAILA system.

## Changes

- Rebuilt the addon with a lightweight and modular core.
- Added separate information panels for blocks and entities.
- Added optional block and entity renders beside the WAILA panel.
- Added UtilityCraft energy, liquid, gas, and overclock information.
- Added configurable block details, entity health, identifiers, tags, states,
  and properties.
- Added emoji-glyph entity stats for health, absorption, hunger with saturation,
  armor, air, mapped effects, and API-backed combat/movement attributes.
- Added configurable heart-bar capping; large health pools use a compact heart
  plus current/max values.
- Limited stat bars to 10 emoji glyphs per line and hid movement-speed details
  by default.
- Restricted tamed-heart glyphs to tamed entities and supported horse, mule, and
  donkey mount exceptions.
- Resolved dropped-item targets to their ItemStack data, including stack count,
  durability, identifier, and tags.
- Added an option to hide information-section separators.
- Added durability HUDs for held items, offhand items, and armor.
- Revamped the settings menu with independent per-player options.
- Added seven panel styles, five font sizes, and desktop/mobile layouts.
- Improved target detection and prioritization between blocks and entities.
- Reduced script and HUD usage through caching, configurable intervals, and
  skipped duplicate updates.
- Fixed missing renders, panel spacing, targeting, and durability display
  issues.

## Compatibility

- Compatible with UtilityCraft and addons using Dorios resource tags.
- Also works as a standalone block and entity inspection addon.
- Updated to Minecraft Bedrock 1.21.120 and `@minecraft/server` 2.6.0.
