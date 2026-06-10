import { ModalFormData } from "@minecraft/server-ui";
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

function getPanelStyleLabel(styleId) {
    return PANEL_STYLES[getPanelStyleIndex(styleId)]?.label ?? PANEL_STYLES[0].label;
}

export async function openCoreMenu(player) {
    if (!isAdminPlayer(player)) {
        sendMessage(player, "§cOnly Insight admins can edit Core settings.");
        return;
    }

    const settings = getCoreSettings();
    const form = new ModalFormData()
        .title("Dorios Insight Core")
        .toggle("Enabled", {
            defaultValue: settings.enabled
        })
        .slider("Update interval (ticks)", CORE_LIMITS.minUpdateIntervalTicks, CORE_LIMITS.maxUpdateIntervalTicks, {
            defaultValue: settings.updateIntervalTicks
        })
        .slider("Max distance", CORE_LIMITS.minMaxDistance, CORE_LIMITS.maxMaxDistance, {
            defaultValue: settings.maxDistance
        })
        .dropdown("Panel style", PANEL_STYLES.map((style) => style.label), {
            defaultValueIndex: getPanelStyleIndex(settings.panelStyleId)
        });

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    const [enabled, updateIntervalTicks, maxDistance, panelStyleIndex] = result.formValues;
    const panelStyle = PANEL_STYLES[Number(panelStyleIndex)] ?? PANEL_STYLES[0];
    const next = setCoreSettings({
        enabled: Boolean(enabled),
        updateIntervalTicks: Number(updateIntervalTicks),
        maxDistance: Number(maxDistance),
        panelStyleId: panelStyle.id
    });

    sendMessage(player, `§aInsight Core updated: ${next.enabled ? "enabled" : "disabled"}, ${next.updateIntervalTicks} ticks, ${next.maxDistance} blocks, ${getPanelStyleLabel(next.panelStyleId)} style.`);
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
