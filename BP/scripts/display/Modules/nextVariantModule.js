const VARIANT_SOURCE_GLOBAL_KEY = "InsightAtelierVariants";

function stripNamespace(id) {
    const rawId = String(id || "");
    const parts = rawId.split(":");
    return parts.length > 1 ? parts.slice(1).join(":") : parts[0];
}

function resolveAlias(blockId, aliasMap) {
    let current = blockId;
    const visited = new Set();

    while (aliasMap instanceof Map && aliasMap.has(current) && !visited.has(current)) {
        visited.add(current);
        current = aliasMap.get(current);
    }

    return current;
}

function blockIdToDisplayName(blockId) {
    return stripNamespace(blockId)
        .split("_")
        .filter((token) => token.length)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function getVariantSource() {
    const source = globalThis?.[VARIANT_SOURCE_GLOBAL_KEY];
    if (!source || !Array.isArray(source.MATERIAL_CYCLES)) {
        return undefined;
    }

    return {
        cycles: source.MATERIAL_CYCLES,
        aliasMap: source.BLOCK_ALIAS instanceof Map
            ? source.BLOCK_ALIAS
            : new Map(Array.isArray(source.BLOCK_ALIAS) ? source.BLOCK_ALIAS : [])
    };
}

let cachedCyclesReference;
let cachedAliasReference;
let cachedLookup = new Map();

function ensureLookup(cycles, aliasMap) {
    if (cachedCyclesReference === cycles && cachedAliasReference === aliasMap) {
        return;
    }

    const lookup = new Map();

    for (let cycleIndex = 0; cycleIndex < cycles.length; cycleIndex++) {
        const cycle = cycles[cycleIndex];
        if (!Array.isArray(cycle)) {
            continue;
        }

        for (let stateIndex = 0; stateIndex < cycle.length; stateIndex++) {
            const blockId = cycle[stateIndex];
            if (typeof blockId !== "string" || !blockId.length) {
                continue;
            }

            lookup.set(blockId, { cycleIndex, stateIndex });
        }
    }

    cachedCyclesReference = cycles;
    cachedAliasReference = aliasMap;
    cachedLookup = lookup;
}

function findEntryForBlockId(blockId, cycles, aliasMap) {
    ensureLookup(cycles, aliasMap);

    if (cachedLookup.has(blockId)) {
        return cachedLookup.get(blockId);
    }

    const aliased = resolveAlias(blockId, aliasMap);
    if (cachedLookup.has(aliased)) {
        return cachedLookup.get(aliased);
    }

    const stripped = stripNamespace(blockId);
    for (const [candidateId, entry] of cachedLookup.entries()) {
        if (stripNamespace(candidateId) === stripped) {
            return entry;
        }
    }

    return undefined;
}

export function collectAtelierNextVariantBlockFields(context) {
    if (!context?.playerSettings?.showCustomFields || !context?.playerSettings?.showCustomVariantPreview) {
        return undefined;
    }

    const blockId = String(context?.block?.typeId || "");
    if (!blockId.length) {
        return undefined;
    }

    const source = getVariantSource();
    if (!source) {
        return undefined;
    }

    const entry = findEntryForBlockId(blockId, source.cycles, source.aliasMap);
    if (!entry) {
        return undefined;
    }

    const cycle = source.cycles[entry.cycleIndex];
    if (!Array.isArray(cycle) || cycle.length <= 1) {
        return undefined;
    }

    const nextIndex = (entry.stateIndex + 1) % cycle.length;
    const nextBlockId = cycle[nextIndex];
    if (typeof nextBlockId !== "string" || !nextBlockId.length) {
        return undefined;
    }

    return `Next Variant: ${blockIdToDisplayName(nextBlockId)}`;
}
