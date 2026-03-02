import { collectAtelierNextVariantBlockFields } from "./nextVariantModule.js";

export const moduleBlockFieldInjectors = Object.freeze([
    Object.freeze({
        injector: collectAtelierNextVariantBlockFields,
        metadata: Object.freeze({
            provider: "Insight Modules - Dorios' Atelier",
            components: Object.freeze(["customVariantPreview"])
        })
    })
]);

export const moduleEntityFieldInjectors = Object.freeze([]);
