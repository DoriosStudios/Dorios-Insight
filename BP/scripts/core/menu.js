import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { ItemStack, system, world } from "@minecraft/server";
import * as DoriosLib from "../DoriosLib/index.js";
import {
  PANEL_STYLES,
  STAT_DISPLAY_STYLES,
  WAILA_FONT_SCALE_OPTIONS,
} from "./const.js";
import { getCoreSettings, setCoreSettings } from "./globalPlayerInterval.js";
import {
  getStatsCoreInsightBridgeEnabled,
  setStatsCoreInsightBridgeEnabled,
} from "./hud/statsCoreActivity.js";

let initialized = false;
const INSIGHT_SETTINGS_ITEM = "dorios:insight_settings";
const INSIGHT_SETTINGS_COMPONENT = "dorios:insight_settings";
const INSIGHT_SETTINGS_GRANTED_TAG = "dorios:insight_settings_granted";

const UI = {
  info: "§8",
  warn: "§e",
  muted: "§7",
  reset: "§r",
};

function infoLabel(text) {
  return `${UI.info}${text}${UI.reset}`;
}

function mutedText(text) {
  return `${UI.muted}${text}${UI.reset}`;
}

function sendMessage(player, message) {
  try {
    player.sendMessage(message);
  } catch {
    // Ignore.
  }
}

function getPlayerFromOrigin(origin) {
  const player = origin?.sourceEntity;
  return player?.typeId === "minecraft:player" ? player : undefined;
}

function getPanelStyleIndex(styleId) {
  const index = PANEL_STYLES.findIndex((style) => style.id === Number(styleId));
  return index >= 0 ? index : 0;
}

function getFontScaleIndex(fontScale) {
  const scale = Number(fontScale);
  if (!Number.isFinite(scale)) {
    return WAILA_FONT_SCALE_OPTIONS.findIndex((option) => option.scale === 1);
  }

  let nearestIndex = 0;
  let nearestDistance = Infinity;
  for (let i = 0; i < WAILA_FONT_SCALE_OPTIONS.length; i += 1) {
    const distance = Math.abs(WAILA_FONT_SCALE_OPTIONS[i].scale - scale);
    if (distance < nearestDistance) {
      nearestIndex = i;
      nearestDistance = distance;
    }
  }

  return nearestIndex;
}

function getDisplayStyleIndex(styleId) {
  const index = STAT_DISPLAY_STYLES.findIndex(
    (style) => style.id === styleId,
  );
  return index >= 0 ? index : 0;
}

/** @typedef {import("./const.js").CoreSettings} CoreSettings */

function getPanelStyleLabel(styleId) {
  return PANEL_STYLES[getPanelStyleIndex(styleId)]?.label ??
    PANEL_STYLES[0].label;
}

async function openMainSettingsMenu(player) {
  const settings = getCoreSettings(player);
  const mainSettings = settings.main;
  const form = new ModalFormData()
    .title(`${UI.info}Main Settings${UI.reset}`)
    .toggle(mutedText("Enabled"), {
      defaultValue: mainSettings.enabled,
      tooltip: "Turns Dorios Insight target labels on or off for you.",
    })
    .slider(mutedText("Update Interval"), 1, 40, {
      defaultValue: mainSettings.updateIntervalTicks,
      tooltip: "How often Insight refreshes labels, measured in ticks.",
    })
    .slider(mutedText("Max Distance"), 1, 32, {
      defaultValue: mainSettings.maxDistance,
      tooltip:
        "Maximum block distance used to find what the player is looking at.",
    })
    .toggle(mutedText("Mainhand Durability"), {
      defaultValue: mainSettings.mainhandDurability,
      tooltip: "Shows the selected main hand item durability HUD.",
    })
    .toggle(mutedText("Offhand Durability"), {
      defaultValue: mainSettings.offhandDurability,
      tooltip: "Shows the offhand item durability HUD.",
    })
    .toggle(mutedText("Armor Durability"), {
      defaultValue: mainSettings.armorDurability,
      tooltip: "Shows helmet, chestplate, leggings, and boots durability HUD.",
    })
    .toggle(mutedText("WAILA Mobile Layout"), {
      defaultValue: mainSettings.wailaMobileLayout,
      tooltip:
        "Uses the phone layout for the WAILA panel. New players default to this automatically on Mobile platform.",
    })
    .toggle(mutedText("Durability Mobile Layout"), {
      defaultValue: mainSettings.durabilityMobileLayout,
      tooltip:
        "Uses the phone layout for the durability HUD. New players default to this automatically on Mobile platform.",
    });

  const result = await form.show(player);
  if (result.canceled) {
    return;
  }

  const [
    enabled,
    updateIntervalTicks,
    maxDistance,
    mainhandDurability,
    offhandDurability,
    armorDurability,
    wailaMobileLayout,
    durabilityMobileLayout,
  ] = result.formValues;
  const next = setCoreSettings(player, {
    main: {
      enabled: Boolean(enabled),
      updateIntervalTicks: Number(updateIntervalTicks),
      maxDistance: Number(maxDistance),
      mainhandDurability: Boolean(mainhandDurability),
      offhandDurability: Boolean(offhandDurability),
      armorDurability: Boolean(armorDurability),
      wailaMobileLayout: Boolean(wailaMobileLayout),
      durabilityMobileLayout: Boolean(durabilityMobileLayout),
    },
  });

  sendMessage(
    player,
    `§aMain settings updated: ${
      next.main.enabled ? "enabled" : "disabled"
    }, ${next.main.updateIntervalTicks} ticks, ${next.main.maxDistance} blocks.`,
  );
}

async function openStyleSettingsMenu(player) {
  const settings = getCoreSettings(player);
  const form = new ModalFormData()
    .title(`${UI.info}Style Settings${UI.reset}`)
    .dropdown(
      mutedText("Panel Style"),
      PANEL_STYLES.map((style) => style.label),
      {
        defaultValueIndex: getPanelStyleIndex(settings.main.panelStyleId),
        tooltip: "Visual style used by the WAILA panel.",
      },
    )
    .dropdown(
      mutedText("Font Size"),
      WAILA_FONT_SCALE_OPTIONS.map((option) => option.label),
      {
        defaultValueIndex: getFontScaleIndex(settings.main.fontScale),
        tooltip: "Text scale used by block and entity WAILA labels.",
      },
    )
    .dropdown(
      mutedText("Health and Absorption"),
      STAT_DISPLAY_STYLES.map((style) => style.label),
      {
        defaultValueIndex: getDisplayStyleIndex(settings.entity.healthDisplayStyle),
        tooltip: "Choose emoji glyphs, text, or both for health and absorption.",
      },
    )
    .dropdown(
      mutedText("Hunger and Saturation"),
      STAT_DISPLAY_STYLES.map((style) => style.label),
      {
        defaultValueIndex: getDisplayStyleIndex(settings.entity.hungerDisplayStyle),
        tooltip: "Choose emoji glyphs, text, or both for hunger and saturation.",
      },
    )
    .dropdown(
      mutedText("Armor and Air"),
      STAT_DISPLAY_STYLES.map((style) => style.label),
      {
        defaultValueIndex: getDisplayStyleIndex(settings.entity.armorAirDisplayStyle),
        tooltip: "Choose emoji glyphs, text, or both for armor and air supply.",
      },
    )
    .dropdown(
      mutedText("Effects"),
      STAT_DISPLAY_STYLES.map((style) => style.label),
      {
        defaultValueIndex: getDisplayStyleIndex(settings.entity.effectsDisplayStyle),
        tooltip: "Choose emoji glyphs, effect names, or both for mapped effects.",
      },
    )
    .dropdown(
      mutedText("Attributes and Speed"),
      STAT_DISPLAY_STYLES.map((style) => style.label),
      {
        defaultValueIndex: getDisplayStyleIndex(settings.entity.attributesDisplayStyle),
        tooltip: "Choose emoji glyphs, values in text, or both for damage and speed.",
      },
    );

  const result = await form.show(player);
  if (result.canceled) {
    return;
  }

  const [
    panelStyleIndex,
    fontScaleIndex,
    healthDisplayStyleIndex,
    hungerDisplayStyleIndex,
    armorAirDisplayStyleIndex,
    effectsDisplayStyleIndex,
    attributesDisplayStyleIndex,
  ] = result.formValues;
  const panelStyle = PANEL_STYLES[Number(panelStyleIndex)] ?? PANEL_STYLES[0];
  const fontScale = WAILA_FONT_SCALE_OPTIONS[Number(fontScaleIndex)]?.scale ?? 1;
  const styleAt = (index) => STAT_DISPLAY_STYLES[Number(index)]?.id ?? "glyphs";

  setCoreSettings(player, {
    main: {
      panelStyleId: panelStyle.id,
      fontScale,
    },
    entity: {
      healthDisplayStyle: styleAt(healthDisplayStyleIndex),
      hungerDisplayStyle: styleAt(hungerDisplayStyleIndex),
      armorAirDisplayStyle: styleAt(armorAirDisplayStyleIndex),
      effectsDisplayStyle: styleAt(effectsDisplayStyleIndex),
      attributesDisplayStyle: styleAt(attributesDisplayStyleIndex),
    },
  });

  sendMessage(player, `§aStyle settings updated: ${getPanelStyleLabel(panelStyle.id)}.`);
}

async function openBlockSettingsMenu(player) {
  const settings = getCoreSettings(player);
  const form = new ModalFormData()
    .title(`${UI.info}Block Settings${UI.reset}`)
    .toggle(mutedText("Energy Containers"), {
      defaultValue: settings.block.energyContainers,
      tooltip: "Shows stored energy for blocks tagged dorios:energy.",
    })
    .toggle(mutedText("Fluid Containers"), {
      defaultValue: settings.block.fluidContainers,
      tooltip: "Shows stored fluids for blocks tagged dorios:fluid.",
    })
    .toggle(mutedText("Gas Containers"), {
      defaultValue: settings.block.gasContainers,
      tooltip: "Shows stored gases for blocks tagged dorios:gas.",
    })
    .toggle(mutedText("Overclock Level"), {
      defaultValue: settings.block.overclockLevel,
      tooltip: "Shows the UtilityCraft machine overclock level.",
    })
    .toggle(mutedText("Block Render"), {
      defaultValue: settings.block.blockRender,
      tooltip:
        "Shows the targeted block item render next to the WAILA text when Insight can resolve its aux id.",
    })
    .toggle(mutedText("Preferred Tool"), {
      defaultValue: settings.block.preferredTool,
      tooltip:
        "Shows the tool type associated with block destructible tags, such as Pickaxe or Shovel.",
    })
    .toggle(mutedText("Tool Tier"), {
      defaultValue: settings.block.toolTier,
      tooltip:
        "Shows the destructible tier tag. Blocks without a tier show Hand.",
    })
    .toggle(mutedText("Location"), {
      defaultValue: settings.block.location,
      tooltip: "Shows the targeted block coordinates as X Y Z.",
    })
    .toggle(mutedText("Identifier"), {
      defaultValue: settings.block.identifier,
      tooltip: "Shows the full block type identifier.",
    })
    .toggle(mutedText("Block Tags"), {
      defaultValue: settings.block.blockTags,
      tooltip: "Shows all tags found on the targeted block.",
    })
    .toggle(mutedText("States"), {
      defaultValue: settings.block.states,
      tooltip: "Shows every state on the targeted block, one per line.",
    })
    .toggle(mutedText("Separators"), {
      defaultValue: settings.block.separators,
      tooltip: "Shows divider lines between WAILA information sections.",
    });

  const result = await form.show(player);
  if (result.canceled) {
    return;
  }

  const [
    energyContainers,
    fluidContainers,
    gasContainers,
    overclockLevel,
    blockRender,
    preferredTool,
    toolTier,
    location,
    identifier,
    blockTags,
    states,
    separators,
  ] = result.formValues;
  setCoreSettings(player, {
    block: {
      energyContainers: Boolean(energyContainers),
      fluidContainers: Boolean(fluidContainers),
      gasContainers: Boolean(gasContainers),
      overclockLevel: Boolean(overclockLevel),
      blockRender: Boolean(blockRender),
      preferredTool: Boolean(preferredTool),
      toolTier: Boolean(toolTier),
      location: Boolean(location),
      identifier: Boolean(identifier),
      blockTags: Boolean(blockTags),
      states: Boolean(states),
      separators: Boolean(separators),
    },
  });

  sendMessage(player, "§aBlock settings updated.");
}

async function openEntitySettingsMenu(player) {
  const settings = getCoreSettings(player);
  const form = new ModalFormData()
    .title(`${UI.info}Entity Settings${UI.reset}`)
    .toggle(infoLabel("Entity Render"), {
      defaultValue: settings.entity.entityRender,
      tooltip: "Shows the targeted entity render next to the WAILA text.",
    })
    .toggle(mutedText("Health"), {
      defaultValue: settings.entity.health,
      tooltip:
        "Shows health with full, half, empty, and condition-aware heart glyphs.",
    })
    .slider(mutedText("Heart Bar Limit"), 20, 200, {
      defaultValue: settings.entity.maxHeartDisplayHealth,
      valueStep: 2,
      tooltip:
        "Maximum health points rendered as a full heart bar. Above it, Insight uses one heart plus current/max values.",
    })
    .toggle(mutedText("Effect Hearts"), {
      defaultValue: settings.entity.effectHearts,
      tooltip:
        "Changes hearts for fire, poison, wither, and freezing when the matching state is available.",
    })
    .toggle(mutedText("Tamed Hearts"), {
      defaultValue: settings.entity.tamedHearts,
      tooltip:
        "Uses tamed hearts only after taming is detected. Horses, mules, and donkeys are supported as explicit mount exceptions.",
    })
    .toggle(mutedText("Absorption"), {
      defaultValue: settings.entity.absorption,
      tooltip:
        "Shows absorption hearts when the target exposes a positive absorption value.",
    })
    .toggle(mutedText("Hunger"), {
      defaultValue: settings.entity.hunger,
      tooltip: "Shows the hunger bar for targeted players.",
    })
    .toggle(mutedText("Saturation Overlay"), {
      defaultValue: settings.entity.saturation,
      tooltip:
        "Composes available saturation into the targeted player's hunger glyphs.",
    })
    .toggle(mutedText("Armor"), {
      defaultValue: settings.entity.armor,
      tooltip:
        "Shows armor glyphs when the target exposes armor through its equippable or armor component.",
    })
    .toggle(mutedText("Air Supply"), {
      defaultValue: settings.entity.air,
      tooltip:
        "Shows bubble glyphs while a breathable target has less than its maximum air supply.",
    })
    .toggle(mutedText("Attack Damage"), {
      defaultValue: settings.entity.attackDamage,
      tooltip:
        "Shows attack damage when the matching API component and glyph exist.",
    })
    .toggle(mutedText("Movement Speed"), {
      defaultValue: settings.entity.movementSpeed,
      tooltip: "Shows walking and swimming speed. Hidden by default.",
    })
    .toggle(mutedText("Glyph Effects"), {
      defaultValue: settings.entity.effects,
      tooltip:
        "Shows active effects only when emojis.txt defines a matching glyph.",
    })
    .slider(mutedText("Visible Effects"), 1, 10, {
      defaultValue: settings.entity.maxVisibleEffects,
      valueStep: 1,
      tooltip: "Maximum number of mapped effect glyphs shown at once.",
    })
    .toggle(mutedText("Hostile"), {
      defaultValue: settings.entity.hostile,
      tooltip:
        "Shows whether Insight detects the entity as hostile from type families or attack components.",
    })
    .toggle(mutedText("Special Info"), {
      defaultValue: settings.entity.specialInfo,
      tooltip:
        "Shows extra data for supported entity types, such as villager jobs.",
    })
    .toggle(mutedText("Identifier"), {
      defaultValue: settings.entity.identifier,
      tooltip: "Shows the full entity type identifier.",
    })
    .toggle(mutedText("Type Families"), {
      defaultValue: settings.entity.typeFamilies,
      tooltip: "Shows all type families found on the targeted entity.",
    })
    .toggle(mutedText("Tags"), {
      defaultValue: settings.entity.tags,
      tooltip: "Shows all runtime tags found on the targeted entity.",
    })
    .toggle(mutedText("Properties"), {
      defaultValue: settings.entity.properties,
      tooltip: "Shows normal entity properties, not dynamic properties.",
    })
    .toggle(mutedText("Separators"), {
      defaultValue: settings.entity.separators,
      tooltip: "Shows divider lines between WAILA information sections.",
    });

  const result = await form.show(player);
  if (result.canceled) {
    return;
  }

  const [
    entityRender,
    health,
    maxHeartDisplayHealth,
    effectHearts,
    tamedHearts,
    absorption,
    hunger,
    saturation,
    armor,
    air,
    attackDamage,
    movementSpeed,
    effects,
    maxVisibleEffects,
    hostile,
    specialInfo,
    identifier,
    typeFamilies,
    tags,
    properties,
    separators,
  ] = result.formValues;
  setCoreSettings(player, {
    entity: {
      entityRender: Boolean(entityRender),
      health: Boolean(health),
      maxHeartDisplayHealth: Number(maxHeartDisplayHealth),
      effectHearts: Boolean(effectHearts),
      tamedHearts: Boolean(tamedHearts),
      absorption: Boolean(absorption),
      hunger: Boolean(hunger),
      saturation: Boolean(saturation),
      armor: Boolean(armor),
      air: Boolean(air),
      attackDamage: Boolean(attackDamage),
      movementSpeed: Boolean(movementSpeed),
      effects: Boolean(effects),
      maxVisibleEffects: Number(maxVisibleEffects),
      hostile: Boolean(hostile),
      specialInfo: Boolean(specialInfo),
      identifier: Boolean(identifier),
      typeFamilies: Boolean(typeFamilies),
      tags: Boolean(tags),
      properties: Boolean(properties),
      separators: Boolean(separators),
    },
  });

  sendMessage(player, "§aEntity settings updated.");
}

export async function openCoreMenu(player) {
  const form = new ActionFormData()
    .title(`${UI.info}Dorios Insight Core${UI.reset}`)
    .body(mutedText("Choose the personal settings group to edit."))
    .button(
      `Main Settings\n${infoLabel("Core behavior and HUD toggles")}`,
      "textures/ui/icon_setting",
    )
    .button(
      `Block Settings\n${infoLabel("Tools, tiers, and tags")}`,
      "textures/ui/category_icon_blocks",
    )
    .button(
      `Entity Settings\n${infoLabel("Health, families, and tags")}`,
      "textures/ui/icon_staffpicks",
    )
    .button(
      `Style Settings\n${infoLabel("Panel, glyph, and text formats")}`,
      "textures/ui/color_picker",
    );

  const result = await form.show(player);
  if (result.canceled) {
    return;
  }

  if (result.selection === 0) {
    await openMainSettingsMenu(player);
    return;
  }

  if (result.selection === 1) {
    await openBlockSettingsMenu(player);
    return;
  }

  if (result.selection === 2) {
    await openEntitySettingsMenu(player);
    return;
  }

  if (result.selection === 3) {
    await openStyleSettingsMenu(player);
  }
}

function registerCommand(definition) {
  try {
    DoriosLib.registry.customCommand(definition);
  } catch (error) {
    console.warn(
      `[Dorios Insight Core] Failed to register command ${definition?.name}: ${error}`,
    );
  }
}

export function initializeCoreMenu() {
  if (initialized) {
    return;
  }

  initialized = true;

  system.beforeEvents.startup.subscribe((event) => {
    event.itemComponentRegistry.registerCustomComponent(
      INSIGHT_SETTINGS_COMPONENT,
      {
        onUse(useEvent) {
          const player = useEvent.source;
          if (player?.typeId !== "minecraft:player") {
            return;
          }

          system.run(async () => {
            await openCoreMenu(player);
          });
        },
      },
    );
  });

  world.afterEvents.playerSpawn.subscribe((event) => {
    if (!event.initialSpawn || event.player.hasTag(INSIGHT_SETTINGS_GRANTED_TAG)) {
      return;
    }

    event.player.addTag(INSIGHT_SETTINGS_GRANTED_TAG);
    try {
      event.player.getComponent("minecraft:inventory")?.container?.addItem(
        new ItemStack(INSIGHT_SETTINGS_ITEM),
      );
    } catch {
      // The player can still obtain the menu item through /give.
    }
  });

  registerCommand({
    name: "utilitycraft:insightmenu",
    description: "Open Dorios Insight Core settings",
    permissionLevel: "any",
    parameters: [],
    callback(origin) {
      const player = getPlayerFromOrigin(origin);
      if (!player) {
        return;
      }

      system.run(async () => {
        await openCoreMenu(player);
      });
    },
  });

  registerCommand({
    name: "utilitycraft:insightcore",
    description: "Open Dorios Insight Core settings",
    permissionLevel: "any",
    parameters: [],
    callback(origin) {
      const player = getPlayerFromOrigin(origin);
      if (!player) {
        return;
      }

      system.run(async () => {
        await openCoreMenu(player);
      });
    },
  });

  registerCommand({
    name: "utilitycraft:insightbridge",
    description: "Enables or disables the StatsCore Insight bridge",
    permissionLevel: "any",
    parameters: [
      { name: "mode", type: "enum", values: ["on", "off"], optional: true },
    ],
    callback(origin, mode) {
      const player = getPlayerFromOrigin(origin);
      if (!player) {
        return;
      }

      if (mode === undefined) {
        sendMessage(
          player,
          `§7StatsCore Insight bridge: §f${getStatsCoreInsightBridgeEnabled(player) ? "on" : "off"}`,
        );
        return;
      }

      const normalized = String(mode).trim().toLowerCase();
      if (normalized !== "on" && normalized !== "off") {
        sendMessage(player, "§cUse on or off.");
        return;
      }

      const enabled = normalized === "on";
      if (!setStatsCoreInsightBridgeEnabled(player, enabled)) {
        sendMessage(player, "§cCould not save the StatsCore Insight bridge setting.");
        return;
      }

      sendMessage(player, `§aStatsCore Insight bridge ${enabled ? "enabled" : "disabled"}.`);
    },
  });
}
