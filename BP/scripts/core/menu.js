import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { system } from "@minecraft/server";
import { CORE_LIMITS, PANEL_STYLES } from "./const.js";
import { getCoreSettings, setCoreSettings } from "./globalPlayerInterval.js";

let initialized = false;

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
        .title("Main Settings")
        .toggle("Enabled", {
            defaultValue: mainSettings.enabled
        })
        .slider("Update interval (ticks)", CORE_LIMITS.minUpdateIntervalTicks, CORE_LIMITS.maxUpdateIntervalTicks, {
            defaultValue: mainSettings.updateIntervalTicks
        })
        .slider("Max distance", CORE_LIMITS.minMaxDistance, CORE_LIMITS.maxMaxDistance, {
            defaultValue: mainSettings.maxDistance
        })
        .dropdown("Panel style", PANEL_STYLES.map((style) => style.label), {
            defaultValueIndex: getPanelStyleIndex(mainSettings.panelStyleId)
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
        .title("Block Settings")
        .toggle("Preferred Tool", {
            defaultValue: settings.block.preferredTool
        })
        .toggle("Tool Tier", {
            defaultValue: settings.block.toolTier
        })
        .toggle("Block Tags", {
            defaultValue: settings.block.blockTags
        });

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    const [preferredTool, toolTier, blockTags] = result.formValues;
    setCoreSettings({
        block: {
            preferredTool: Boolean(preferredTool),
            toolTier: Boolean(toolTier),
            blockTags: Boolean(blockTags)
        }
    });

    sendMessage(player, "§aBlock settings updated.");
}

async function openEntitySettingsMenu(player) {
    const form = new ActionFormData()
        .title("Entity Settings")
        .body("Entity settings are not used yet.")
        .button("Back");

    const result = await form.show(player);
    if (!result.canceled && result.selection === 0) {
        await openCoreMenu(player);
    }
}

export async function openCoreMenu(player) {
    if (!isAdminPlayer(player)) {
        sendMessage(player, "§cOnly Insight admins can edit Core settings.");
        return;
    }

    const form = new ActionFormData()
        .title("Dorios Insight Core")
        .button("Main Settings")
        .button("Block Settings")
        .button("Entity Settings");

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
