import { system, world } from "@minecraft/server";
import { InsightConfig, getPlayerDisplaySettings } from "./config.js";
import { collectAndSendHudData, cleanupPlayer as cleanupHudPlayer } from "./hudDataCollector.js";
import { collectAndSendTargetData, cleanupPlayer as cleanupTargetPlayer } from "./targetDataCollector.js";
import { CHANNEL_TARGET } from "./uiChannels.js";
import * as biomeDataCollector from "./biomeDataCollector.js";
import * as uiQueue from "./uiQueue.js";

const playerUpdateSchedule = new Map();
const suppressedPlayers = new Set();
let globalTickCounter = 0;
let initialized = false;

const EMPTY_TARGET_RAW = Object.freeze({
    rawtext: [{ text: "" }]
});

function getPlayerCacheKey(player) {
    return player.id || player.name;
}

function canRunUpdateNow(player, settings) {
    const cacheKey = getPlayerCacheKey(player);
    const nextTick = playerUpdateSchedule.get(cacheKey) ?? 0;
    if (globalTickCounter < nextTick) {
        return false;
    }

    playerUpdateSchedule.set(cacheKey, globalTickCounter + Math.max(1, settings.updateIntervalTicks));
    return true;
}

function isSuppressed(settings) {
    if (settings.disabled) {
        return true;
    }

    if (settings.requireSneak && !settings.isSneaking) {
        return true;
    }

    return false;
}

function clearPlayerUiState(player) {
    uiQueue.clearPlayer(player);
    uiQueue.setSubtitle(player, null);
    uiQueue.sendRaw(player, CHANNEL_TARGET, EMPTY_TARGET_RAW);
    cleanupTargetPlayer(player.id);
    cleanupHudPlayer(player.id);
}

function processPlayer(player, settings) {
    const playerKey = player.id;

    if (isSuppressed(settings)) {
        if (suppressedPlayers.has(playerKey)) {
            return;
        }

        clearPlayerUiState(player);
        suppressedPlayers.add(playerKey);
        return;
    }

    suppressedPlayers.delete(playerKey);
    collectAndSendHudData(player, settings);
    collectAndSendTargetData(player, settings);
}

function processEntityHit(data) {
    if (!InsightConfig.compatibility.useEntityHitFallback) {
        return;
    }

    if (data.damagingEntity?.typeId !== "minecraft:player") {
        return;
    }

    const player = data.damagingEntity;
    const settings = getPlayerDisplaySettings(player);
    if (isSuppressed(settings)) {
        return;
    }

    collectAndSendTargetData(player, settings);
}

function cleanupPlayerState(playerId) {
    playerUpdateSchedule.delete(playerId);
    suppressedPlayers.delete(playerId);
    cleanupTargetPlayer(playerId);
    cleanupHudPlayer(playerId);
    biomeDataCollector.cleanupPlayer(playerId);
}

export function initializeDisplayController() {
    if (initialized) {
        return;
    }

    initialized = true;

    uiQueue.initializeUIQueue();
    biomeDataCollector.initialize();

    system.runInterval(() => {
        globalTickCounter += 1;

        for (const player of world.getAllPlayers()) {
            try {
                const settings = getPlayerDisplaySettings(player);
                if (!canRunUpdateNow(player, settings)) {
                    continue;
                }

                processPlayer(player, settings);
            } catch {
                // Silently skip edge cases from invalid targets/entities.
            }
        }
    }, 1);

    world.afterEvents.entityHitEntity.subscribe((data) => {
        try {
            processEntityHit(data);
        } catch {
            // Silently skip edge cases from invalid hit events.
        }
    });

    world.afterEvents.playerLeave.subscribe((event) => {
        cleanupPlayerState(event.playerId);
    });
}
