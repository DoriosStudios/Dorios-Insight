import { system, world } from "@minecraft/server";
import { InsightConfig, getPlayerDisplaySettings } from "./config.js";
import { createBlockActionbar, createEntityActionbar } from "./messages.js";

const playerActionbarCache = new Map();
const playerActionbarLastSentTick = new Map();
const playerUpdateSchedule = new Map();
const playerNoTargetTicks = new Map();
let globalTickCounter = 0;

function getPlayerCacheKey(player) {
    return player.id || player.name;
}

function getPlayerMainhandItem(player) {
    try {
        const equippable = player.getComponent?.("minecraft:equippable");
        if (equippable && typeof equippable.getEquipment === "function") {
            return equippable.getEquipment("Mainhand")
                ?? equippable.getEquipment("mainhand")
                ?? equippable.getEquipment("slot.weapon.mainhand");
        }
    } catch {
        // Fallback below.
    }

    try {
        const inventory = player.getComponent?.("minecraft:inventory")?.container;
        const selectedSlot = Number(player.selectedSlotIndex ?? player.selectedSlot ?? 0);
        if (inventory && Number.isFinite(selectedSlot)) {
            return inventory.getItem(Math.max(0, selectedSlot));
        }
    } catch {
        // Ignore inventory fallback failures.
    }

    return undefined;
}

function setActionbarIfChanged(player, rawMessage, settings) {
    const cacheKey = getPlayerCacheKey(player);
    const serialized = JSON.stringify(rawMessage);
    playerNoTargetTicks.set(cacheKey, 0);

    const lastSerialized = playerActionbarCache.get(cacheKey);
    const shouldDeduplicate = InsightConfig.compatibility.deduplicateActionbar;
    const runtimeRefresh = Number(settings?.unchangedTargetRefreshTicks);
    const fallbackRefresh = Number(InsightConfig.compatibility.unchangedTargetRefreshTicks) || 8;
    const refreshInterval = Math.max(1, Number.isFinite(runtimeRefresh) ? runtimeRefresh : fallbackRefresh);
    const lastSentTick = playerActionbarLastSentTick.get(cacheKey) ?? -refreshInterval;

    if (shouldDeduplicate && lastSerialized === serialized && (globalTickCounter - lastSentTick) < refreshInterval) {
        return;
    }

    player.onScreenDisplay.setActionBar(rawMessage);
    playerActionbarCache.set(cacheKey, serialized);
    playerActionbarLastSentTick.set(cacheKey, globalTickCounter);
}

function clearActionbar(player) {
    const cacheKey = getPlayerCacheKey(player);
    playerActionbarCache.delete(cacheKey);
    playerActionbarLastSentTick.delete(cacheKey);
    playerNoTargetTicks.delete(cacheKey);
    player.onScreenDisplay.setActionBar("");
}

function getNoTargetTicks(player) {
    return playerNoTargetTicks.get(getPlayerCacheKey(player)) ?? 0;
}

function setNoTargetTicks(player, ticks) {
    playerNoTargetTicks.set(getPlayerCacheKey(player), ticks);
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

function shouldSkipPlayer(player, settings) {
    if (settings.disabled) {
        return true;
    }

    if (!settings.requireSneak) {
        return false;
    }

    return !settings.isSneaking;
}

function isEntityInvisible(entity) {
    if (!entity) {
        return false;
    }

    try {
        if (typeof entity.isInvisible === "boolean") {
            return entity.isInvisible;
        }
    } catch {
        // Ignore direct property access failures.
    }

    try {
        if (typeof entity.getComponent === "function" && entity.getComponent("minecraft:is_invisible")) {
            return true;
        }
    } catch {
        // Ignore component lookup failures.
    }

    try {
        if (typeof entity.getEffects !== "function") {
            return false;
        }

        const effects = entity.getEffects();
        if (!Array.isArray(effects)) {
            return false;
        }

        for (const effect of effects) {
            const rawTypeId = effect?.typeId
                ?? effect?.type?.id
                ?? effect?.effectType?.id
                ?? effect?.effectType;

            if (typeof rawTypeId !== "string" || !rawTypeId.length) {
                continue;
            }

            const normalizedTypeId = rawTypeId.includes(":")
                ? rawTypeId.split(":").pop()?.toLowerCase()
                : rawTypeId.toLowerCase();

            if (normalizedTypeId === "invisibility") {
                return true;
            }
        }
    } catch {
        // Ignore effect read failures.
    }

    return false;
}

function selectEntityFromRaycast(entityRaycastHits, includeInvisibleEntities) {
    if (!Array.isArray(entityRaycastHits) || !entityRaycastHits.length) {
        return undefined;
    }

    if (includeInvisibleEntities) {
        return entityRaycastHits[0]?.entity;
    }

    for (const hit of entityRaycastHits) {
        const entity = hit?.entity;
        if (!entity || isEntityInvisible(entity)) {
            continue;
        }

        return entity;
    }

    return undefined;
}

function processPlayerRaycast(player, settings) {
    if (shouldSkipPlayer(player, settings)) {
        clearActionbar(player);
        return;
    }

    const entityRaycast = player.getEntitiesFromViewDirection({
        maxDistance: settings.maxDistance
    });

    const targetEntity = selectEntityFromRaycast(entityRaycast, settings.includeInvisibleEntities);

    if (targetEntity) {
        const rawMessage = createEntityActionbar(targetEntity, settings, {
            heldItemStack: getPlayerMainhandItem(player)
        });
        setActionbarIfChanged(player, rawMessage, settings);
        return;
    }

    const blockRaycast = player.getBlockFromViewDirection({
        maxDistance: settings.maxDistance,
        includeLiquidBlocks: settings.includeLiquidBlocks
    });

    if (blockRaycast) {
        const rawMessage = createBlockActionbar(blockRaycast.block, settings, {
            heldItemStack: getPlayerMainhandItem(player)
        });
        setActionbarIfChanged(player, rawMessage, settings);
        return;
    }

    if (settings.clearAfterNoTargetTicks <= 0) {
        return;
    }

    const nextNoTargetTicks = getNoTargetTicks(player) + Math.max(1, settings.updateIntervalTicks);
    if (nextNoTargetTicks >= settings.clearAfterNoTargetTicks) {
        clearActionbar(player);
    } else {
        setNoTargetTicks(player, nextNoTargetTicks);
    }
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

    if (shouldSkipPlayer(player, settings)) {
        return;
    }

    if (!settings.includeInvisibleEntities && isEntityInvisible(data.hitEntity)) {
        return;
    }

    const rawMessage = createEntityActionbar(data.hitEntity, settings, {
        heldItemStack: getPlayerMainhandItem(player)
    });
    setActionbarIfChanged(player, rawMessage, settings);
}

export function initializeDisplayController() {
    system.runInterval(() => {
        globalTickCounter += 1;

        for (const player of world.getAllPlayers()) {
            try {
                const settings = getPlayerDisplaySettings(player);
                if (!canRunUpdateNow(player, settings)) {
                    continue;
                }

                processPlayerRaycast(player, settings);
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
}
