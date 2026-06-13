import { collectEntityGeneral, renderEntityGeneral } from "./general.js";

function getEntityRenderHeightClass(entity) {
    try {
        const aabb = entity?.getAABB?.();
        const height = Number(aabb?.extent?.y) * 2;

        if (!Number.isFinite(height) || height <= 0) {
            return "h2";
        }

        return `h${Math.min(5, Math.max(1, Math.ceil(height)))}`;
    } catch {
        return "h2";
    }
}

export function composeEntityTarget(entity, settings) {
    const general = collectEntityGeneral(entity);

    return {
        entityId: String(entity?.id || ""),
        renderHeightClass: getEntityRenderHeightClass(entity),
        headerText: general.headerText,
        rawtext: renderEntityGeneral(general, settings),
        currentHealth: general.health?.current ?? 0,
        maxHealth: general.health?.max ?? 0
    };
}
