import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { system } from "@minecraft/server";
import { CORE_LIMITS, PANEL_STYLES } from "./const.js";
import { getCoreSettings, setCoreSettings } from "./globalPlayerInterval.js";

let initialized = false;

const UI = {
    info: "§b",
    warn: "§e",
    muted: "§7",
    reset: "§r"
};

function infoLabel(text) {
    return `${UI.info}${text}${UI.reset}`;
}

function mutedText(text) {
    return `${UI.muted}${text}${UI.reset}`;
}

function isAdminPlayer(player) {
    if (!player) {
        return false;
    }

    try {
        if (typeof player.isOp === "function" && player.isOp()) {
            return true;
        }
    } catch {
        // Try tag fallback.
    }

    try {
        return typeof player.hasTag === "function" && player.hasTag("insight:admin");
    } catch {
        return false;
    }
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

/** @typedef {import("./const.js").CoreSettings} CoreSettings */

function getPanelStyleLabel(styleId) {
    return PANEL_STYLES[getPanelStyleIndex(styleId)]?.label ?? PANEL_STYLES[0].label;
}

async function openMainSettingsMenu(player) {
    const settings = getCoreSettings();
    const mainSettings = settings.main;
    const form = new ModalFormData()
        .title(`${UI.info}Main Settings${UI.reset}`)
        .toggle(infoLabel("Enabled"), {
            defaultValue: mainSettings.enabled,
            tooltip: "Turns Dorios Insight target labels on or off globally."
        })
        .slider(infoLabel("Update Interval"), CORE_LIMITS.minUpdateIntervalTicks, CORE_LIMITS.maxUpdateIntervalTicks, {
            defaultValue: mainSettings.updateIntervalTicks,
            tooltip: "How often Insight refreshes labels, measured in ticks."
        })
        .slider(infoLabel("Max Distance"), CORE_LIMITS.minMaxDistance, CORE_LIMITS.maxMaxDistance, {
            defaultValue: mainSettings.maxDistance,
            tooltip: "Maximum block distance used to find what the player is looking at."
        })
        .dropdown(infoLabel("Panel Style"), PANEL_STYLES.map((style) => style.label), {
            defaultValueIndex: getPanelStyleIndex(mainSettings.panelStyleId),
            tooltip: "Visual style used by the WAILA panel."
        });

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    const [enabled, updateIntervalTicks, maxDistance, panelStyleIndex] = result.formValues;
    const panelStyle = PANEL_STYLES[Number(panelStyleIndex)] ?? PANEL_STYLES[0];
    const next = setCoreSettings({
        main: {
            enabled: Boolean(enabled),
            updateIntervalTicks: Number(updateIntervalTicks),
            maxDistance: Number(maxDistance),
            panelStyleId: panelStyle.id
        }
    });

    sendMessage(player, `§aMain settings updated: ${next.main.enabled ? "enabled" : "disabled"}, ${next.main.updateIntervalTicks} ticks, ${next.main.maxDistance} blocks, ${getPanelStyleLabel(next.main.panelStyleId)} style.`);
}

async function openBlockSettingsMenu(player) {
    const settings = getCoreSettings();
    const form = new ModalFormData()
        .title(`${UI.info}Block Settings${UI.reset}`)
        .toggle(infoLabel("Energy Containers"), {
            defaultValue: settings.block.energyContainers,
            tooltip: "Shows stored energy for blocks tagged dorios:energy."
        })
        .toggle(infoLabel("Fluid Containers"), {
            defaultValue: settings.block.fluidContainers,
            tooltip: "Shows stored fluids for blocks tagged dorios:fluid."
        })
        .toggle(infoLabel("Block Render"), {
            defaultValue: settings.block.blockRender,
            tooltip: "Shows the targeted block item render next to the WAILA text when Insight can resolve its aux id."
        })
        .toggle(infoLabel("Preferred Tool"), {
            defaultValue: settings.block.preferredTool,
            tooltip: "Shows the tool type associated with block destructible tags, such as Pickaxe or Shovel."
        })
        .toggle(infoLabel("Tool Tier"), {
            defaultValue: settings.block.toolTier,
            tooltip: "Shows the destructible tier tag. Blocks without a tier show Hand."
        })
        .toggle(infoLabel("Location"), {
            defaultValue: settings.block.location,
            tooltip: "Shows the targeted block coordinates as X Y Z."
        })
        .toggle(infoLabel("Identifier"), {
            defaultValue: settings.block.identifier,
            tooltip: "Shows the full block type identifier."
        })
        .toggle(infoLabel("Block Tags"), {
            defaultValue: settings.block.blockTags,
            tooltip: "Shows all tags found on the targeted block."
        })
        .toggle(infoLabel("States"), {
            defaultValue: settings.block.states,
            tooltip: "Shows every state on the targeted block, one per line."
        });

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    const [energyContainers, fluidContainers, blockRender, preferredTool, toolTier, location, identifier, blockTags, states] = result.formValues;
    setCoreSettings({
        block: {
            energyContainers: Boolean(energyContainers),
            fluidContainers: Boolean(fluidContainers),
            blockRender: Boolean(blockRender),
            preferredTool: Boolean(preferredTool),
            toolTier: Boolean(toolTier),
            location: Boolean(location),
            identifier: Boolean(identifier),
            blockTags: Boolean(blockTags),
            states: Boolean(states)
        }
    });

    sendMessage(player, "§aBlock settings updated.");
}

async function openEntitySettingsMenu(player) {
    const settings = getCoreSettings();
    const form = new ModalFormData()
        .title(`${UI.info}Entity Settings${UI.reset}`)
        .toggle(infoLabel("Health"), {
            defaultValue: settings.entity.health,
            tooltip: "Shows the entity current and max health when the entity has a health component."
        })
        .toggle(infoLabel("Hostile"), {
            defaultValue: settings.entity.hostile,
            tooltip: "Shows whether Insight detects the entity as hostile from type families or attack components."
        })
        .toggle(infoLabel("Identifier"), {
            defaultValue: settings.entity.identifier,
            tooltip: "Shows the full entity type identifier."
        })
        .toggle(infoLabel("Type Families"), {
            defaultValue: settings.entity.typeFamilies,
            tooltip: "Shows all type families found on the targeted entity."
        })
        .toggle(infoLabel("Tags"), {
            defaultValue: settings.entity.tags,
            tooltip: "Shows all runtime tags found on the targeted entity."
        })
        .toggle(infoLabel("Properties"), {
            defaultValue: settings.entity.properties,
            tooltip: "Shows normal entity properties, not dynamic properties."
        });

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    const [health, hostile, identifier, typeFamilies, tags, properties] = result.formValues;
    setCoreSettings({
        entity: {
            health: Boolean(health),
            hostile: Boolean(hostile),
            identifier: Boolean(identifier),
            typeFamilies: Boolean(typeFamilies),
            tags: Boolean(tags),
            properties: Boolean(properties)
        }
    });

    sendMessage(player, "§aEntity settings updated.");
}

export async function openCoreMenu(player) {
    if (!isAdminPlayer(player)) {
        sendMessage(player, "§cOnly Insight admins can edit Core settings.");
        return;
    }

    const form = new ActionFormData()
        .title(`${UI.info}Dorios Insight Core${UI.reset}`)
        .body(mutedText("Choose the settings group to edit."))
        .button(`Main Settings\n${mutedText("Core behavior and panel style")}`, "textures/ui/icon_setting")
        .button(`Block Settings\n${mutedText("Tools, tiers, and tags")}`, "textures/ui/Wrenches1")
        .button(`Entity Settings\n${mutedText("Health, families, and tags")}`, "textures/ui/gear");

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
    }
}

function registerCommand(definition) {
    try {
        globalThis.DoriosAPI?.register?.command?.(definition);
    } catch (error) {
        console.warn(`[Dorios Insight Core] Failed to register command ${definition?.name}: ${error}`);
    }
}

export function initializeCoreMenu() {
    if (initialized) {
        return;
    }

    initialized = true;

    registerCommand({
        name: "insightmenu",
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
        }
    });

    registerCommand({
        name: "insightcore",
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
        }
    });
}
