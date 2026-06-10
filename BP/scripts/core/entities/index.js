import { collectEntityGeneral, renderEntityGeneral } from "./general.js";

export function composeEntityTarget(entity) {
    const general = collectEntityGeneral(entity);

    return {
        headerText: general.headerText,
        lines: renderEntityGeneral(general),
        currentHealth: general.health?.current ?? 0,
        maxHealth: general.health?.max ?? 0
    };
}
