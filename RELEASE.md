# Dorios’ Insight — Release Notes (v1.1.0)

**Dorios’ Insight** is a Minecraft Bedrock add-on that shows information about the **block** or **entity** you are looking at in the **action bar**, and lets you configure what is shown using an in-game menu.

- Pack version (manifest): **1.1.0**
- Minimum game version (manifest): **1.21.120+**

For a full, technical changelog (including file-level audit details), see `changelog.md`.

## What it does (quick overview)
- Shows a configurable info overlay for the target you are looking at (block/entity) in the action bar.
- Provides an in-game configuration menu with per-player settings.
- Includes three presets:
  - **Essential** (lighter output)
  - **Detailed** (more information)
  - **Debug** (maximum detail)
- Supports both **global** (world) and **local** (per-player) enable/disable.
- Lets you tune visibility per “component” (example: only show tags while sneaking).
- Includes style options (icon/text) and effect display modes (emoji/text).
- Adds **namespace aliases** so unknown content can still show a friendly “addon name”.

## Quick start
1. Enable **both** the Behavior Pack and Resource Pack in your world.
2. Join the world and look at a block or entity.
3. Open the configuration menu:
   - `/utilitycraft:insight menu`

If the command does not work, the most common causes are world permissions/settings.
Depending on your platform/version, you may need Cheats enabled and the relevant script-related toggles enabled for the world.

## Main menu (what each option is)
- **Mode**: switch between Essential / Detailed / Debug.
- **Local toggle**: enable/disable Insight for **you**.
- **Global toggle**: enable/disable Insight for the **world**.
- **Components (General/Custom)**: pick what to show and under what conditions.
- **Namespaces**: register a namespace (example: `cc`) with a display name (example: `Cube Craft`).
- **Style**: visual style (icon vs text) and how effects are shown.
- **Runtime**: performance + limits (distance, update interval, max rows/tags/etc).
- **Reset**: restore your settings back to the current preset defaults.

## Components (visibility rules)
Each component can be set to one of these policies:
- **Show**: always show
- **Show When Sneaking**: only show while sneaking
- **Creative Only**: only show in Creative mode
- **Hide**: never show

Practical examples:
- keep block tags on “Show When Sneaking” to reduce clutter;
- hide technical data for normal gameplay;
- keep Debug mode for troubleshooting.

## Namespace aliases (when the addon cannot be identified)
Sometimes the targeted block/entity is from another add-on, and Insight cannot identify its origin via the existing content registry.
In those cases you can map a **namespace** to a friendly name.

### Using the command
- `/utilitycraft:insight namespace add <namespace> <displayName>`
- Example:
  - `/utilitycraft:insight namespace add cc "Cube Craft"`

### Using the menu
- Menu → **Namespaces** → fill in:
  - Namespace: `cc`
  - Display name: `Cube Craft`

Notes:
- Namespace aliases are a **fallback**. If a more specific match exists (tags or detailed registry), that takes priority.
- The alias is stored **per-world** (not per-player).

## Available commands
If you type `/utilitycraft:insight` with an invalid action, the add-on prints a usage/help message.

Common commands:
- `/utilitycraft:insight menu` — open the menu
- `/utilitycraft:insight mode <essential|detailed|debug>` — set the global mode
- `/utilitycraft:insight activate <on|off|toggle>` — enable/disable for your player
- `/utilitycraft:insight activate <component> <show|sneak|creative|hide>` — set a component policy
- `/utilitycraft:insight global <on|off|toggle|status>` — enable/disable globally
- `/utilitycraft:insight namespace add <namespace> <displayName>` — namespace alias

## Resource Pack styles (subpacks)
The Resource Pack includes these subpacks:
- **Dark**
- **Copper**
- **Default**

You can switch subpacks in the world’s Resource Pack settings.

## Performance tips
If the overlay feels too “busy” or you want to reduce update cost:
- Use **Essential** mode.
- In **Runtime**, lower:
  - max distance
  - maximum visible states/tags/families/effects
  - update frequency
- Keep heavier components (like tags) on “Show When Sneaking”.

## Known limitations
- Insight writes to the **action bar**. If another add-on also uses the action bar, they can visually compete.
- Some components may be marked as deprecated/non-functional and will be ignored.
- The command is registered via DoriosAPI with a fixed namespace: **`utilitycraft:`**.

## Technical notes (persistence)
Settings and aliases are stored using **dynamic properties**.
Main identifiers used by Insight include:
- World:
  - `insight:mode`
  - `insight:enabled`
  - `insight:namespace_registry`
- Player:
  - `insight:player_settings`

## Credits
- Dorios Studios
- DoriosAPI (command + utility foundation)

---

For the full technical changelog: `changelog.md`.
