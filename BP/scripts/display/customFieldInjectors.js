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
//
// Injector contract:
// - Input: context object (block/entity and useful metadata)
// - Output: string | string[] | undefined
// - Throwing is tolerated (Insight catches and ignores injector failures)

const blockFieldInjectors = [];
const entityFieldInjectors = [];

function normalizeProviderName(provider) {
    if (typeof provider !== "string") {
        return undefined;
    }

    const trimmed = provider.trim();
    return trimmed.length ? trimmed : undefined;
}

function normalizeComponentKeys(components) {
    if (!Array.isArray(components)) {
        return [];
    }

    const deduplicated = new Set();

    for (const componentKey of components) {
        if (typeof componentKey !== "string") {
            continue;
        }

        const normalizedKey = componentKey.trim();
        if (!normalizedKey.length) {
            continue;
        }

        deduplicated.add(normalizedKey);
    }

    return [...deduplicated];
}

function createInjectorEntry(injector, options) {
    const metadata = {
        provider: normalizeProviderName(options?.provider),
        components: normalizeComponentKeys(options?.components)
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
        } catch {
            // Keep Insight resilient when an external injector fails.
        }
    }

    return lines;
}

export function collectCustomBlockFieldLines(context) {
    return runInjectors(blockFieldInjectors, context);
}

export function collectCustomEntityFieldLines(context) {
    return runInjectors(entityFieldInjectors, context);
}

function getProvidersByComponent(componentKey) {
    const normalizedComponentKey = typeof componentKey === "string"
        ? componentKey.trim()
        : "";

    if (!normalizedComponentKey.length) {
        return [];
    }

    const providerNames = new Set();
    const lists = [blockFieldInjectors, entityFieldInjectors];

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
                block: blockFieldInjectors.length,
                entity: entityFieldInjectors.length
            };
        },
        getProvidersByComponent(componentKey) {
            return getProvidersByComponent(componentKey);
        }
    };
}

exposeCustomFieldApi();
