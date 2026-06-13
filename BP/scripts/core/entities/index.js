import { collectEntityGeneral, renderEntityGeneral } from "./general.js";

export function composeEntityTarget(entity, settings) {
    const general = collectEntityGeneral(entity);

    return {
        entityId: String(entity?.id || ""),
        headerText: general.headerText,
        rawtext: renderEntityGeneral(general, settings),
        currentHealth: general.health?.current ?? 0,
        maxHealth: general.health?.max ?? 0
    };
}
