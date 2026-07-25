// -----------------------------------------------------------------------------
// Insight custom field injectors
// -----------------------------------------------------------------------------
// Purpose:
// - Allow external addons to inject custom lines into Insight actionbar output.
// - Keep Insight core generic while enabling project-specific metadata.
//
// Public global API exposed as:
// globalThis.InsightCustomFields
//
// Methods:
// - registerBlockFieldInjector(injector, options?)
// - registerEntityFieldInjector(injector, options?)
// - unregisterBlockFieldInjector(injector)
// - unregisterEntityFieldInjector(injector)
// - clearBlockFieldInjectors()
// - clearEntityFieldInjectors()
// - getRegisteredCounts()
// - getProvidersByComponent(componentKey)
// - getSupportedComponentKeys()
//
// Injector contract:
// - Input: context object (block/entity and useful metadata)
// - Output: string | string[] | undefined
// - Throwing is tolerated (Insight catches and ignores injector failures)

import {
    moduleBlockFieldInjectors,
    moduleEntityFieldInjectors
} from "./Modules/index.js";
import { InsightComponentDefinitions } from "./config.js";
import { system } from "@minecraft/server";

const blockFieldInjectors = [];
const entityFieldInjectors = [];
const supportedComponentKeys = Object.freeze(
    InsightComponentDefinitions
        .map((definition) => typeof definition?.key === "string" ? definition.key.trim() : "")
        .filter((componentKey) => componentKey.length > 0)
);
const supportedComponentKeySet = new Set(supportedComponentKeys);
const DEFAULT_LINKED_ENTITY_SCAN_INTERVAL_TICKS = 20;
const DEFAULT_LINKED_ENTITY_SCAN_MAX_DISTANCE = 1.35;
const MIN_LINKED_ENTITY_SCAN_INTERVAL_TICKS = 1;
const MAX_LINKED_ENTITY_SCAN_INTERVAL_TICKS = 200;
const MIN_LINKED_ENTITY_SCAN_MAX_DISTANCE = 0.5;
const MAX_LINKED_ENTITY_SCAN_MAX_DISTANCE = 4;
const DEFAULT_LINKED_ENTITY_CANDIDATE_NAMES = Object.freeze([
    "utilitycraft:machine_entity",
    "entity.utilitycraft:machine_entity",
    "entity.utilitycraft:machine_entity.name"
]);
const linkedEntityCache = new Map();

function normalizeProviderName(provider) {
    if (typeof provider !== "string") {
        return undefined;
    }

    const trimmed = provider.trim();
    return trimmed.length ? trimmed : undefined;
}

function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getCurrentTick() {
    try {
        const tick = Number(system?.currentTick ?? 0);
        return Number.isFinite(tick) && tick >= 0 ? tick : 0;
    } catch {
        return 0;
    }
}

function normalizeLinkedEntityScanIntervalTicks(playerSettings) {
    const rawValue = Number(playerSettings?.linkedEntityScanIntervalTicks);
    if (!Number.isFinite(rawValue)) {
        return DEFAULT_LINKED_ENTITY_SCAN_INTERVAL_TICKS;
    }

    return Math.floor(clampNumber(rawValue, MIN_LINKED_ENTITY_SCAN_INTERVAL_TICKS, MAX_LINKED_ENTITY_SCAN_INTERVAL_TICKS));
}

function normalizeLinkedEntityScanMaxDistance(playerSettings) {
    const rawValue = Number(playerSettings?.linkedEntityScanMaxDistance);
    if (!Number.isFinite(rawValue)) {
        return DEFAULT_LINKED_ENTITY_SCAN_MAX_DISTANCE;
    }

    return clampNumber(rawValue, MIN_LINKED_ENTITY_SCAN_MAX_DISTANCE, MAX_LINKED_ENTITY_SCAN_MAX_DISTANCE);
}

function normalizeLinkedEntityCandidateNames(playerSettings) {
    const source = Array.isArray(playerSettings?.linkedEntityCandidateNames)
        ? playerSettings.linkedEntityCandidateNames
        : DEFAULT_LINKED_ENTITY_CANDIDATE_NAMES;

    const normalized = source
        .filter((value) => typeof value === "string")
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0);

    if (!normalized.length) {
        return [...DEFAULT_LINKED_ENTITY_CANDIDATE_NAMES];
    }

    return [...new Set(normalized)];
}

function createCandidateSignature(candidateNames) {
    return [...candidateNames].sort((left, right) => left.localeCompare(right)).join("|");
}

function getBlockCacheKey(block) {
    if (!block?.location || !block?.dimension) {
        return undefined;
    }

    const x = Math.floor(Number(block.location.x));
    const y = Math.floor(Number(block.location.y));
    const z = Math.floor(Number(block.location.z));

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        return undefined;
    }

    const dimensionId = String(block.dimension.id || "unknown").toLowerCase();
    return `${dimensionId}:${x},${y},${z}`;
}

function getBlockCenter(block) {
    const location = block?.location;
    if (!location) {
        return undefined;
    }

    const x = Number(location.x);
    const y = Number(location.y);
    const z = Number(location.z);

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        return undefined;
    }

    return {
        x: x + 0.5,
        y: y + 0.5,
        z: z + 0.5
    };
}

function getDistanceSquared(locationA, locationB) {
    if (!locationA || !locationB) {
        return Number.POSITIVE_INFINITY;
    }

    const deltaX = Number(locationA.x) - Number(locationB.x);
    const deltaY = Number(locationA.y) - Number(locationB.y);
    const deltaZ = Number(locationA.z) - Number(locationB.z);

    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY) || !Number.isFinite(deltaZ)) {
        return Number.POSITIVE_INFINITY;
    }

    return (deltaX * deltaX) + (deltaY * deltaY) + (deltaZ * deltaZ);
}

function isEntityUsable(entity) {
    if (!entity) {
        return false;
    }

    try {
        if (typeof entity.isValid === "function") {
            return Boolean(entity.isValid());
        }

        if (typeof entity.isValid === "boolean") {
            return entity.isValid;
        }
    } catch {
        return false;
    }

    return true;
}

function normalizeEntityIdentity(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().toLowerCase();
}

function isMatchingLinkedEntityCandidate(entity, candidateSet) {
    if (!entity || !(candidateSet instanceof Set) || !candidateSet.size) {
        return false;
    }

    const typeId = normalizeEntityIdentity(entity.typeId);
    const localizationKey = normalizeEntityIdentity(entity.localizationKey);
    const nameTag = normalizeEntityIdentity(entity.nameTag);
    const name = normalizeEntityIdentity(entity.name);

    if (typeId && candidateSet.has(typeId)) {
        return true;
    }

    if (localizationKey && candidateSet.has(localizationKey)) {
        return true;
    }

    if (nameTag && candidateSet.has(nameTag)) {
        return true;
    }

    if (name && candidateSet.has(name)) {
        return true;
    }

    return false;
}

function findNearestLinkedEntity(block, scanDistance, candidateNames) {
    const dimension = block?.dimension;
    const center = getBlockCenter(block);
    if (!dimension || !center) {
        return undefined;
    }

    let nearbyEntities;
    try {
        nearbyEntities = dimension.getEntities({
            location: center,
            maxDistance: scanDistance
        });
    } catch {
        return undefined;
    }

    if (!Array.isArray(nearbyEntities) || !nearbyEntities.length) {
        return undefined;
    }

    const candidateSet = new Set(candidateNames);
    let nearestEntity;
    let nearestDistanceSquared = Number.POSITIVE_INFINITY;

    for (const entity of nearbyEntities) {
        if (!isEntityUsable(entity)) {
            continue;
        }

        if (!isMatchingLinkedEntityCandidate(entity, candidateSet)) {
            continue;
        }

        const distanceSquared = getDistanceSquared(entity.location, center);
        if (distanceSquared < nearestDistanceSquared) {
            nearestDistanceSquared = distanceSquared;
            nearestEntity = entity;
        }
    }

    return nearestEntity;
}

function getLinkedEntityFromCache(cacheKey, tick, interval, scanDistance, candidateSignature) {
    const cachedEntry = linkedEntityCache.get(cacheKey);
    if (!cachedEntry) {
        return undefined;
    }

    if (cachedEntry.interval !== interval) {
        return undefined;
    }

    if (cachedEntry.scanDistance !== scanDistance) {
        return undefined;
    }

    if (cachedEntry.candidateSignature !== candidateSignature) {
        return undefined;
    }

    if (tick >= cachedEntry.nextScanTick) {
        return undefined;
    }

    if (cachedEntry.entity && !isEntityUsable(cachedEntry.entity)) {
        return undefined;
    }

    return cachedEntry.entity;
}

function resolveLinkedEntityForBlock(context) {
    const block = context?.block;
    const cacheKey = getBlockCacheKey(block);
    if (!cacheKey || !block) {
        return {
            linkedEntity: undefined,
            linkedEntityLastScanTick: undefined,
            linkedEntityIntervalTicks: DEFAULT_LINKED_ENTITY_SCAN_INTERVAL_TICKS,
            linkedEntityScanMaxDistance: DEFAULT_LINKED_ENTITY_SCAN_MAX_DISTANCE
        };
    }

    const tick = getCurrentTick();
    const interval = normalizeLinkedEntityScanIntervalTicks(context?.playerSettings);
    const scanDistance = normalizeLinkedEntityScanMaxDistance(context?.playerSettings);
    const candidateNames = normalizeLinkedEntityCandidateNames(context?.playerSettings);
    const candidateSignature = createCandidateSignature(candidateNames);

    const cachedEntity = getLinkedEntityFromCache(cacheKey, tick, interval, scanDistance, candidateSignature);
    if (cachedEntity !== undefined) {
        const cachedEntry = linkedEntityCache.get(cacheKey);
        return {
            linkedEntity: cachedEntity,
            linkedEntityLastScanTick: cachedEntry?.lastScanTick,
            linkedEntityIntervalTicks: interval,
            linkedEntityScanMaxDistance: scanDistance
        };
    }

    const linkedEntity = findNearestLinkedEntity(block, scanDistance, candidateNames);
    linkedEntityCache.set(cacheKey, {
        entity: linkedEntity,
        nextScanTick: tick + interval,
        lastScanTick: tick,
        interval,
        scanDistance,
        candidateSignature
    });

    return {
        linkedEntity,
        linkedEntityLastScanTick: tick,
        linkedEntityIntervalTicks: interval,
        linkedEntityScanMaxDistance: scanDistance
    };
}

function createBlockInjectorContext(context) {
    const linkData = resolveLinkedEntityForBlock(context);

    return {
        ...context,
        linkedEntity: linkData.linkedEntity,
        machineEntity: linkData.linkedEntity,
        linkedEntityLastScanTick: linkData.linkedEntityLastScanTick,
        linkedEntityIntervalTicks: linkData.linkedEntityIntervalTicks,
        linkedEntityScanMaxDistance: linkData.linkedEntityScanMaxDistance
    };
}

function normalizeComponentKeys(components, provider) {
    if (!Array.isArray(components)) {
        return [];
    }

    const deduplicated = new Set();
    const invalidKeys = [];

    for (const componentKey of components) {
        if (typeof componentKey !== "string") {
            continue;
        }

        const normalizedKey = componentKey.trim();
        if (!normalizedKey.length) {
            continue;
        }

        if (!supportedComponentKeySet.has(normalizedKey)) {
            invalidKeys.push(normalizedKey);
            continue;
        }

        deduplicated.add(normalizedKey);
    }

    if (invalidKeys.length) {
        const providerName = provider || "unknown";
        console.warn(
            `[Insight] Ignored unsupported custom field component keys from "${providerName}": ${invalidKeys.join(", ")}`
        );
    }

    return [...deduplicated];
}

function createInjectorEntry(injector, options) {
    const provider = normalizeProviderName(options?.provider);
    const metadata = {
        provider,
        components: normalizeComponentKeys(options?.components, provider)
    };

    return {
        injector,
        metadata
    };
}

function normalizeInjectorResult(result) {
    if (typeof result === "string") {
        const line = result.trim();
        return line ? [line] : [];
    }

    if (!Array.isArray(result)) {
        return [];
    }

    const normalized = [];
    for (const value of result) {
        if (typeof value !== "string") {
            continue;
        }

        const line = value.trim();
        if (!line) {
            continue;
        }

        normalized.push(line);
    }

    return normalized;
}

function registerInjector(list, injector, options) {
    if (typeof injector !== "function") {
        return false;
    }

    if (list.some((entry) => entry.injector === injector)) {
        return true;
    }

    list.push(createInjectorEntry(injector, options));
    return true;
}

function unregisterInjector(list, injector) {
    const index = list.findIndex((entry) => entry.injector === injector);
    if (index === -1) {
        return false;
    }

    list.splice(index, 1);
    return true;
}

function runInjectors(list, context) {
    const lines = [];

    for (const entry of list) {
        try {
            const result = entry.injector(context);
            lines.push(...normalizeInjectorResult(result));
        } catch (error) {
            // Keep Insight resilient when an external injector fails.
            const provider = entry?.metadata?.provider || "unknown";
            console.warn(`[Insight] Custom field injector from "${provider}" threw: ${error?.message || error}`);
        }
    }

    return lines;
}

export function collectCustomBlockFieldLines(context) {
    const runtimeContext = createBlockInjectorContext(context);
    const moduleLines = runInjectors(moduleBlockFieldInjectors, runtimeContext);
    const externalLines = runInjectors(blockFieldInjectors, runtimeContext);
    return [...moduleLines, ...externalLines];
}

export function collectCustomEntityFieldLines(context) {
    const moduleLines = runInjectors(moduleEntityFieldInjectors, context);
    const externalLines = runInjectors(entityFieldInjectors, context);
    return [...moduleLines, ...externalLines];
}

function getProvidersByComponent(componentKey) {
    const normalizedComponentKey = typeof componentKey === "string"
        ? componentKey.trim()
        : "";

    if (!normalizedComponentKey.length) {
        return [];
    }

    const providerNames = new Set();
    const lists = [
        moduleBlockFieldInjectors,
        blockFieldInjectors,
        moduleEntityFieldInjectors,
        entityFieldInjectors
    ];

    for (const list of lists) {
        for (const entry of list) {
            const provider = entry?.metadata?.provider;
            const components = entry?.metadata?.components;

            if (!provider || !Array.isArray(components) || !components.includes(normalizedComponentKey)) {
                continue;
            }

            providerNames.add(provider);
        }
    }

    return [...providerNames].sort((a, b) => a.localeCompare(b));
}

function getSupportedComponentKeys() {
    return [...supportedComponentKeys];
}

function exposeCustomFieldApi() {
    const existingApi = globalThis.InsightCustomFields && typeof globalThis.InsightCustomFields === "object"
        ? globalThis.InsightCustomFields
        : {};

    globalThis.InsightCustomFields = {
        ...existingApi,
        registerBlockFieldInjector(injector, options) {
            return registerInjector(blockFieldInjectors, injector, options);
        },
        registerEntityFieldInjector(injector, options) {
            return registerInjector(entityFieldInjectors, injector, options);
        },
        unregisterBlockFieldInjector(injector) {
            return unregisterInjector(blockFieldInjectors, injector);
        },
        unregisterEntityFieldInjector(injector) {
            return unregisterInjector(entityFieldInjectors, injector);
        },
        clearBlockFieldInjectors() {
            blockFieldInjectors.length = 0;
        },
        clearEntityFieldInjectors() {
            entityFieldInjectors.length = 0;
        },
        getRegisteredCounts() {
            return {
                block: moduleBlockFieldInjectors.length + blockFieldInjectors.length,
                entity: moduleEntityFieldInjectors.length + entityFieldInjectors.length
            };
        },
        getProvidersByComponent(componentKey) {
            return getProvidersByComponent(componentKey);
        },
        getSupportedComponentKeys() {
            return getSupportedComponentKeys();
        },
        clearLinkedEntityCache() {
            linkedEntityCache.clear();
        },
        getLinkedEntityCacheSize() {
            return linkedEntityCache.size;
        }
    };
}

exposeCustomFieldApi();
