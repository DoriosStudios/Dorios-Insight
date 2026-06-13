import { collectEntityGeneral, renderEntityGeneral } from "./general.js";

function getEntityRenderId(entity) {
    const numericId = Number(entity?.id);
    if (!Number.isFinite(numericId)) {
        return String(entity?.id || "");
    }

    const sign = numericId > 0;
    return `${sign ? "" : "-"}${Math.abs(numericId).toString().padStart(12, "0")}`;
}

export function composeEntityTarget(entity, settings) {
    const general = collectEntityGeneral(entity);

    return {
        entityId: getEntityRenderId(entity),
        headerText: general.headerText,
        rawtext: renderEntityGeneral(general, settings),
        currentHealth: general.health?.current ?? 0,
        maxHealth: general.health?.max ?? 0
    };
}
