/**
 * @module wailaComposer
 * @description UI Queue WAILA composer using the legacy actionbar builder as
 * the composition backend.
 *
 * This keeps the new subtitle/UI Queue flow while restoring the old system's
 * configurability (scoreboards, tameable fields, technical blocks, style
 * variants, custom injector compatibility, etc.).
 */

import {
    createBlockActionbar,
    createEntityActionbar
} from "../Deprecated/messages.js";

/** Distance used to group nearby dropped item entities for cluster info. */
const NearbyItemClusterDistance = 0.25;

/** @type {Map<string, { targetId: string|undefined, tick: number, clearAt: number }>} */
const playerTargetState = new Map();

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

function getItemEntityAmount(entity) {
    if (!entity || entity.typeId !== "minecraft:item") {
        return 0;
    }

    try {
        const itemComponent = entity.getComponent?.("minecraft:item");
        const amount = Number(itemComponent?.itemStack?.amount);
        return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 1;
    } catch {
        return 1;
    }
}

function getDistanceBetweenEntities(source, target) {
    const sourceLocation = source?.location;
    const targetLocation = target?.location;

    if (!sourceLocation || !targetLocation) {
        return Number.POSITIVE_INFINITY;
    }

    const deltaX = Number(targetLocation.x) - Number(sourceLocation.x);
    const deltaY = Number(targetLocation.y) - Number(sourceLocation.y);
    const deltaZ = Number(targetLocation.z) - Number(sourceLocation.z);
    return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY) + (deltaZ * deltaZ));
}

function getNearbyItemClusterContext(targetEntity) {
    if (!targetEntity || targetEntity.typeId !== "minecraft:item") {
        return undefined;
    }

    const dimension = targetEntity.dimension;
    const location = targetEntity.location;
    if (!dimension || !location) {
        return undefined;
    }

    let nearbyItems;
    try {
        nearbyItems = dimension.getEntities({
            type: "minecraft:item",
            location,
            maxDistance: NearbyItemClusterDistance
        });
    } catch {
        return undefined;
    }

    if (!Array.isArray(nearbyItems) || nearbyItems.length < 2) {
        return undefined;
    }

    let entityCount = 0;
    let totalAmount = 0;

    for (const nearbyItem of nearbyItems) {
        const distance = getDistanceBetweenEntities(targetEntity, nearbyItem);
        if (!Number.isFinite(distance) || distance > NearbyItemClusterDistance) {
            continue;
        }

        entityCount += 1;
        totalAmount += getItemEntityAmount(nearbyItem);
    }

    if (entityCount < 2) {
        return undefined;
    }

    return {
        entityCount,
        totalAmount,
        maxDistance: NearbyItemClusterDistance
    };
}

function resolveEntityScoreboardFallback(settings) {
    if (typeof settings?.showEntityScoreboards === "boolean") {
        return settings.showEntityScoreboards;
    }

    const mode = String(settings?.mode || "").trim().toLowerCase();
    if (mode === "detailed" || mode === "debug") {
        return true;
    }

    if (mode === "essential") {
        return Boolean(settings?.isSneaking);
    }

    return Boolean(settings?.showTechnicalData || settings?.isSneaking);
}

function normalizeLegacySettings(settings) {
    const displayStyle = settings?.displayStyle;

    return {
        ...settings,
        blockNameResolveMode: settings?.blockNameResolveMode ?? settings?.nameResolveMode,
        healthDisplayStyle: settings?.healthDisplayStyle ?? displayStyle,
        hungerDisplayStyle: settings?.hungerDisplayStyle ?? displayStyle,
        armorDisplayStyle: settings?.armorDisplayStyle ?? displayStyle,
        absorptionDisplayStyle: settings?.absorptionDisplayStyle ?? displayStyle,
        airDisplayStyle: settings?.airDisplayStyle ?? displayStyle,
        showEntityScoreboards: resolveEntityScoreboardFallback(settings),
        showCustomFluidInfo: typeof settings?.showCustomFluidInfo === "boolean"
            ? settings.showCustomFluidInfo
            : Boolean(settings?.showCustomFields),
        showCustomGasInfo: typeof settings?.showCustomGasInfo === "boolean"
            ? settings.showCustomGasInfo
            : Boolean(settings?.showCustomFields),
        showCustomCobblestoneCount: typeof settings?.showCustomCobblestoneCount === "boolean"
            ? settings.showCustomCobblestoneCount
            : Boolean(settings?.showCustomFields)
    };
}

function toRawMessage(payload) {
    if (payload && typeof payload === "object" && Array.isArray(payload.rawtext)) {
        return payload;
    }

    return null;
}

function composeBlockDisplay(block, player, settings) {
    try {
        return toRawMessage(createBlockActionbar(
            block,
            normalizeLegacySettings(settings),
            {
                heldItemStack: getPlayerMainhandItem(player)
            }
        ));
    } catch {
        return null;
    }
}

function composeEntityDisplay(entity, player, settings) {
    try {
        return toRawMessage(createEntityActionbar(
            entity,
            normalizeLegacySettings(settings),
            {
                heldItemStack: getPlayerMainhandItem(player),
                nearbyItemCluster: getNearbyItemClusterContext(entity)
            }
        ));
    } catch {
        return null;
    }
}

/**
 * Compose a block display payload when the target is already known.
 * This bypasses raycast logic and reuses the legacy-compatible formatter.
 *
 * @param {import("@minecraft/server").Block} block
 * @param {import("@minecraft/server").Player} player
 * @param {Object} settings
 * @returns {{ rawtext: Array }|null}
 */
export function composeBlockDisplayForTarget(block, player, settings) {
    return composeBlockDisplay(block, player, settings);
}

/**
 * Compose an entity display payload when the target is already known.
 * This bypasses raycast logic and reuses the legacy-compatible formatter.
 *
 * @param {import("@minecraft/server").Entity} entity
 * @param {import("@minecraft/server").Player} player
 * @param {Object} settings
 * @returns {{ rawtext: Array }|null}
 */
export function composeEntityDisplayForTarget(entity, player, settings) {
    return composeEntityDisplay(entity, player, settings);
}

function isEntityInvisible(entity) {
    try {
        if (typeof entity?.isInvisible === "boolean") {
            return entity.isInvisible;
        }
    } catch {
        // Ignore direct property access failures.
    }

    try {
        if (entity?.getComponent?.("minecraft:is_invisible")) {
            return true;
        }
    } catch {
        // Ignore component lookup failures.
    }

    try {
        const effects = entity?.getEffects?.();
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

/**
 * Compose the WAILA display rawtext for a player.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {Object} settings - From getPlayerDisplaySettings().
 * @returns {{ rawtext: Array }|null|undefined}
 *   - RawMessage: update subtitle
 *   - null: clear subtitle
 *   - undefined: keep previous subtitle (clear delay)
 */
export function composeWailaDisplay(player, settings) {
    if (settings.disabled) {
        return null;
    }

    if (settings.requireSneak && !settings.isSneaking) {
        return null;
    }

    try {
        const playerId = player.id;
        const state = playerTargetState.get(playerId) || {
            targetId: undefined,
            tick: 0,
            clearAt: 0
        };

        const entityHits = player.getEntitiesFromViewDirection({
            maxDistance: settings.maxDistance
        });

        let targetEntity;
        if (Array.isArray(entityHits) && entityHits.length > 0) {
            if (settings.includeInvisibleEntities) {
                targetEntity = entityHits[0]?.entity;
            } else {
                for (const hit of entityHits) {
                    if (hit?.entity && !isEntityInvisible(hit.entity)) {
                        targetEntity = hit.entity;
                        break;
                    }
                }
            }
        }

        if (targetEntity) {
            state.targetId = targetEntity.id || targetEntity.typeId;
            state.tick = 0;
            state.clearAt = 0;
            playerTargetState.set(playerId, state);

            return composeEntityDisplay(targetEntity, player, settings);
        }

        const blockHit = player.getBlockFromViewDirection({
            maxDistance: settings.maxDistance,
            includeLiquidBlocks: settings.includeLiquidBlocks
        });

        if (blockHit?.block) {
            const block = blockHit.block;
            state.targetId = `block:${block.typeId}:${block.x}:${block.y}:${block.z}`;
            state.tick = 0;
            state.clearAt = 0;
            playerTargetState.set(playerId, state);

            return composeBlockDisplay(block, player, settings);
        }

        if (state.targetId) {
            state.tick += 1;

            if (state.clearAt === 0) {
                state.clearAt = state.tick + settings.clearAfterNoTargetTicks;
            }

            if (state.tick < state.clearAt) {
                playerTargetState.set(playerId, state);
                return undefined;
            }

            state.targetId = undefined;
            state.tick = 0;
            state.clearAt = 0;
            playerTargetState.set(playerId, state);
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Cleanup cached state for a player.
 * @param {string} playerId
 */
export function cleanupPlayer(playerId) {
    playerTargetState.delete(playerId);
}
