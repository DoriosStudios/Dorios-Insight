export const TargetKinds = {
    None: "none",
    Block: "block",
    Entity: "entity"
};

/** @typedef {import("./const.js").MainSettings} MainSettings */

const IGNORED_ENTITY_TARGET_FAMILIES = ["inanimate"];
const TARGET_DISTANCE_EPSILON = 0.1;

function getDistanceBetween(left, right) {
    if (!left || !right) {
        return Number.POSITIVE_INFINITY;
    }

    const dx = Number(left.x) - Number(right.x);
    const dy = Number(left.y) - Number(right.y);
    const dz = Number(left.z) - Number(right.z);

    if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(dz)) {
        return Number.POSITIVE_INFINITY;
    }

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function getBlockHitDistance(player, blockHit) {
    if (!blockHit?.block) {
        return Number.POSITIVE_INFINITY;
    }

    const origin = player.getHeadLocation?.() ?? player.location;
    const blockLocation = blockHit.block.location;
    return getDistanceBetween(origin, {
        x: blockLocation.x + 0.5,
        y: blockLocation.y + 0.5,
        z: blockLocation.z + 0.5
    });
}

function getEntityHitDistance(player, entityHit) {
    if (typeof entityHit?.distance === "number" && Number.isFinite(entityHit.distance)) {
        return entityHit.distance;
    }

    return getDistanceBetween(player.getHeadLocation?.() ?? player.location, entityHit?.entity?.location);
}

function hasTypeFamily(entity, family) {
    try {
        return entity
            ?.getComponent("minecraft:type_family")
            ?.hasTypeFamily(family) === true;
    } catch {
        return false;
    }
}

function shouldIgnoreEntityTarget(entity) {
    return IGNORED_ENTITY_TARGET_FAMILIES.some((family) => hasTypeFamily(entity, family));
}

/**
 * @param {import("@minecraft/server").Player} player
 * @param {MainSettings} settings
 */
export function resolvePlayerTarget(player, settings) {
    const maxDistance = Math.max(1, Number(settings?.maxDistance) || 8);
    let entityHit;
    let blockHit;

    try {
        const entityHits = player.getEntitiesFromViewDirection({
            maxDistance,
            includeLiquidBlocks: true,
            includePassableBlocks: true
        });

        if (Array.isArray(entityHits) && entityHits.length > 0) {
            entityHit = entityHits.find((candidate) => (
                candidate?.entity && !shouldIgnoreEntityTarget(candidate.entity)
            ));
        }
    } catch {
        // Entity raycast is optional; fall back to block raycast.
    }

    try {
        blockHit = player.getBlockFromViewDirection({
            maxDistance,
            includeLiquidBlocks: true,
            includePassableBlocks: true
        });
    } catch {
        // No target.
    }

    if (entityHit?.entity && blockHit?.block) {
        const entityDistance = getEntityHitDistance(player, entityHit);
        const blockDistance = getBlockHitDistance(player, blockHit);

        if (blockDistance <= entityDistance + TARGET_DISTANCE_EPSILON) {
            return {
                kind: TargetKinds.Block,
                block: blockHit.block
            };
        }

        return {
            kind: TargetKinds.Entity,
            entity: entityHit.entity
        };
    }

    if (entityHit?.entity) {
        return {
            kind: TargetKinds.Entity,
            entity: entityHit.entity
        };
    }

    if (blockHit?.block) {
        return {
            kind: TargetKinds.Block,
            block: blockHit.block
        };
    }

    return {
        kind: TargetKinds.None
    };
}
