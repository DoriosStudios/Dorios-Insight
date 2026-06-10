import { collectBlockGeneral, renderBlockGeneral } from "./general.js";

export function composeBlockTarget(block) {
    const general = collectBlockGeneral(block);

    return {
        headerText: general.headerText,
        rawtext: renderBlockGeneral(general)
    };
}
