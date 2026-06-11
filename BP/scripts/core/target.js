export const TargetKinds = {
    None: "none",
    Block: "block",
    Entity: "entity"
};

/** @typedef {import("./const.js").MainSettings} MainSettings */

/**
 * @param {import("@minecraft/server").Player} player
 * @param {MainSettings} settings
 */
export function resolvePlayerTarget(player, settings) {
    const maxDistance = Math.max(1, Number(settings?.maxDistance) || 8);

    try {
        const entityHits = player.getEntitiesFromViewDirection({
            maxDistance,
            includeLiquidBlocks: false,
            includePassableBlocks: true
        });

        if (Array.isArray(entityHits) && entityHits.length > 0) {
            const hit = entityHits.find((candidate) => candidate?.entity);
            if (hit?.entity) {
                return {
                    kind: TargetKinds.Entity,
                    entity: hit.entity
                };
            }
        }
    } catch {
        // Entity raycast is optional; fall back to block raycast.
    }

    try {
        const blockHit = player.getBlockFromViewDirection({
            maxDistance,
            includeLiquidBlocks: false,
            includePassableBlocks: true
        });

        if (blockHit?.block) {
            return {
                kind: TargetKinds.Block,
                block: blockHit.block
            };
        }
    } catch {
        // No target.
    }

    return {
        kind: TargetKinds.None
    };
}
