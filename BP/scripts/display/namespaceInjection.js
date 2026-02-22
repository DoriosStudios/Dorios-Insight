import { system, world } from "@minecraft/server";
import { splitTypeId, toTitleWords } from "./formatters.js";
import { WorkspaceAddonContentRegistry } from "./workspaceRegistry.js";

const REGISTRY_DYNAMIC_PROPERTY = "insight:namespace_registry";

const DEFAULT_ADDON_LIBRARY = Object.freeze(
    WorkspaceAddonContentRegistry
        .map((entry) => normalizeAddonDefinition(entry))
        .filter(Boolean)
);

const DEFAULT_NAMESPACE_LABELS = Object.freeze({
    minecraft: "Minecraft",
    dorios: "Dorios",
    utilitycraft: "UtilityCraft"
});

const TAG_PREFIXES = Object.freeze({
    addonKey: "insight:addon.",
    namespaceOverride: "insight:namespace.",
    aliasOverride: "insight:alias."
});

const PRIORITIZED_TAG_PREFIXES = Object.freeze([
    "insight:",
    "dorios:",
    "utilitycraft:",
    "minecraft:"
]);

const RegistryState = {
    initialized: false,
    mergedByKey: new Map(),
    dynamicByKey: new Map(),
    contentToAddonKey: new Map(),
    namespaceToAddonKey: new Map()
};

function normalizeAddonKey(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_.-]/g, "");
}

function normalizeNamespaceInput(value) {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }

    const namespaceCandidate = trimmed.includes(":")
        ? trimmed.split(":")[0]
        : trimmed;

    const normalized = namespaceCandidate.trim().toLowerCase();
    if (!normalized) {
        return undefined;
    }

    if (!/^[a-z0-9_.-]+$/.test(normalized)) {
        return undefined;
    }

    return normalized;
}

function decodeTagPayload(value) {
    return value
        .trim()
        .replace(/__/g, ":")
        .replace(/_/g, " ");
}

function decodeNamespacePayload(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/__/g, ":")
        .replace(/\./g, ":")
        .replace(/\s+/g, "");
}

function normalizeContentList(content) {
    if (!Array.isArray(content)) {
        return [];
    }

    const normalized = [];
    for (const value of content) {
        if (typeof value !== "string") {
            continue;
        }

        const trimmed = value.trim().toLowerCase();
        if (!trimmed || !trimmed.includes(":")) {
            continue;
        }

        normalized.push(trimmed);
    }

    return [...new Set(normalized)];
}

function normalizeAddonDefinition(addonContent) {
    if (!addonContent || typeof addonContent !== "object") {
        return undefined;
    }

    const keySource = addonContent.key || addonContent.name;
    if (typeof keySource !== "string" || !keySource.trim()) {
        return undefined;
    }

    const key = normalizeAddonKey(keySource);
    const name = typeof addonContent.name === "string" && addonContent.name.trim()
        ? addonContent.name.trim()
        : toTitleWords(key.split("_"));

    const type = typeof addonContent.type === "string" && addonContent.type.trim()
        ? addonContent.type.trim().toLowerCase()
        : "addon";

    const namespace = typeof addonContent.namespace === "string" && addonContent.namespace.trim()
        ? addonContent.namespace.trim().toLowerCase()
        : undefined;

    const content = normalizeContentList(addonContent.content);

    return {
        key,
        name,
        type,
        namespace,
        content
    };
}

function mergeAddonDefinitions(baseAddon, overrideAddon) {
    if (!baseAddon) {
        return overrideAddon;
    }

    return {
        key: baseAddon.key,
        name: overrideAddon.name || baseAddon.name,
        type: overrideAddon.type || baseAddon.type,
        namespace: overrideAddon.namespace || baseAddon.namespace,
        content: [...new Set([...(baseAddon.content || []), ...(overrideAddon.content || [])])]
    };
}

function rebuildMergedRegistry() {
    RegistryState.mergedByKey = new Map();
    RegistryState.contentToAddonKey = new Map();
    RegistryState.namespaceToAddonKey = new Map();

    for (const addon of DEFAULT_ADDON_LIBRARY) {
        RegistryState.mergedByKey.set(addon.key, {
            key: addon.key,
            name: addon.name,
            type: addon.type,
            namespace: addon.namespace,
            content: [...addon.content]
        });
    }

    for (const addon of RegistryState.dynamicByKey.values()) {
        const existing = RegistryState.mergedByKey.get(addon.key);
        RegistryState.mergedByKey.set(addon.key, mergeAddonDefinitions(existing, addon));
    }

    for (const addon of RegistryState.mergedByKey.values()) {
        const namespaceKey = normalizeNamespaceInput(addon.namespace);
        if (namespaceKey) {
            RegistryState.namespaceToAddonKey.set(namespaceKey, addon.key);
        }

        for (const typeId of addon.content) {
            RegistryState.contentToAddonKey.set(typeId, addon.key);
        }
    }
}

function extractTagPayload(tags, prefix) {
    for (const tag of tags) {
        if (typeof tag !== "string") {
            continue;
        }

        if (tag.startsWith(prefix) && tag.length > prefix.length) {
            return tag.slice(prefix.length);
        }
    }

    return undefined;
}

function getTagPriority(tag) {
    for (let index = 0; index < PRIORITIZED_TAG_PREFIXES.length; index++) {
        const prefix = PRIORITIZED_TAG_PREFIXES[index];
        if (tag.startsWith(prefix)) {
            return index;
        }
    }

    return PRIORITIZED_TAG_PREFIXES.length;
}

function loadDynamicRegistryFromWorld() {
    RegistryState.dynamicByKey = new Map();

    let rawData;
    try {
        rawData = world.getDynamicProperty(REGISTRY_DYNAMIC_PROPERTY);
    } catch {
        rawData = undefined;
    }

    if (typeof rawData !== "string" || !rawData.trim()) {
        return;
    }

    let parsed;
    try {
        parsed = JSON.parse(rawData);
    } catch {
        return;
    }

    if (!Array.isArray(parsed)) {
        return;
    }

    for (const addon of parsed) {
        const normalized = normalizeAddonDefinition(addon);
        if (!normalized) {
            continue;
        }

        const current = RegistryState.dynamicByKey.get(normalized.key);
        RegistryState.dynamicByKey.set(normalized.key, mergeAddonDefinitions(current, normalized));
    }
}

function persistDynamicRegistryToWorld() {
    const dynamicAddons = [...RegistryState.dynamicByKey.values()].map((addon) => ({
        key: addon.key,
        name: addon.name,
        type: addon.type,
        namespace: addon.namespace,
        content: addon.content
    }));

    const serialized = JSON.stringify(dynamicAddons);
    system.run(() => {
        try {
            world.setDynamicProperty(REGISTRY_DYNAMIC_PROPERTY, serialized);
        } catch {
            // Dynamic properties may be unavailable if they were not registered.
        }
    });
}

function ensureRegistryInitialized() {
    if (RegistryState.initialized) {
        return;
    }

    loadDynamicRegistryFromWorld();
    rebuildMergedRegistry();
    exposeNamespaceRegistryApi();

    RegistryState.initialized = true;
}

function getAddonByKey(addonKey) {
    ensureRegistryInitialized();
    return RegistryState.mergedByKey.get(addonKey);
}

function getAddonByTypeId(typeId) {
    ensureRegistryInitialized();

    const normalizedTypeId = String(typeId || "").trim().toLowerCase();
    if (!normalizedTypeId) {
        return undefined;
    }

    const addonKey = RegistryState.contentToAddonKey.get(normalizedTypeId);
    if (!addonKey) {
        return undefined;
    }

    return RegistryState.mergedByKey.get(addonKey);
}

function getAddonByNamespace(namespace) {
    ensureRegistryInitialized();

    const normalizedNamespace = normalizeNamespaceInput(namespace);
    if (!normalizedNamespace) {
        return undefined;
    }

    const addonKey = RegistryState.namespaceToAddonKey.get(normalizedNamespace);
    if (!addonKey) {
        return undefined;
    }

    return RegistryState.mergedByKey.get(addonKey);
}

function registerAddonContentInternal(addonContent, persist = true) {
    ensureRegistryInitialized();

    const normalized = normalizeAddonDefinition(addonContent);
    if (!normalized) {
        return false;
    }

    const existingDynamic = RegistryState.dynamicByKey.get(normalized.key);
    RegistryState.dynamicByKey.set(normalized.key, mergeAddonDefinitions(existingDynamic, normalized));

    rebuildMergedRegistry();

    if (persist) {
        persistDynamicRegistryToWorld();
    }

    return true;
}

function registerNamespaceAliasInternal(namespaceInput, displayName, persist = true) {
    const namespace = normalizeNamespaceInput(namespaceInput);
    const name = typeof displayName === "string" ? displayName.trim() : "";

    if (!namespace || !name) {
        return {
            ok: false,
            reason: "invalid_input"
        };
    }

    const key = normalizeAddonKey(`namespace_${namespace}`);
    const didRegister = registerAddonContentInternal({
        key,
        name,
        type: "namespace",
        namespace,
        content: []
    }, persist);

    return {
        ok: didRegister,
        key,
        namespace,
        name
    };
}

function exposeNamespaceRegistryApi() {
    if (globalThis.InsightNamespaceRegistry) {
        return;
    }

    globalThis.InsightNamespaceRegistry = {
        registerAddonContent(addonContent, persist = true) {
            return registerAddonContentInternal(addonContent, persist);
        },
        registerNamespaceAlias(namespaceInput, displayName, persist = true) {
            return registerNamespaceAliasInternal(namespaceInput, displayName, persist);
        },
        registerAddonContents(addons, persist = true) {
            if (!Array.isArray(addons)) {
                return false;
            }

            let changed = false;
            for (const addon of addons) {
                const didRegister = registerAddonContentInternal(addon, false);
                changed = changed || didRegister;
            }

            if (changed && persist) {
                persistDynamicRegistryToWorld();
            }

            return changed;
        },
        getRegistrySnapshot() {
            ensureRegistryInitialized();
            return [...RegistryState.mergedByKey.values()].map((addon) => ({
                key: addon.key,
                name: addon.name,
                type: addon.type,
                namespace: addon.namespace,
                content: [...addon.content]
            }));
        },
        getNamespaceAliases() {
            ensureRegistryInitialized();
            return [...RegistryState.namespaceToAddonKey.entries()].map(([namespace, addonKey]) => {
                const addon = RegistryState.mergedByKey.get(addonKey);
                return {
                    namespace,
                    name: addon?.name ?? toTitleWords(namespace.split("_")),
                    key: addonKey
                };
            });
        },
        refreshFromDynamicProperties() {
            RegistryState.initialized = false;
            ensureRegistryInitialized();
        }
    };
}

export function getBlockTagsSafe(block) {
    try {
        if (typeof block.getTags === "function") {
            return block.getTags() ?? [];
        }
    } catch {
        // Continue to fallback.
    }

    try {
        if (block.permutation && typeof block.permutation.getTags === "function") {
            return block.permutation.getTags() ?? [];
        }
    } catch {
        // No tags available.
    }

    return [];
}

export function sortBlockTagsForDisplay(tags) {
    const deduplicated = [...new Set(tags.filter((tag) => typeof tag === "string" && tag.length > 0))];

    deduplicated.sort((left, right) => {
        const leftPriority = getTagPriority(left);
        const rightPriority = getTagPriority(right);

        if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
        }

        return left.localeCompare(right);
    });

    return deduplicated;
}

export function resolveInjectedNamespace(typeId, blockTags = []) {
    const { namespace } = splitTypeId(typeId);

    const addonTagPayload = extractTagPayload(blockTags, TAG_PREFIXES.addonKey);
    const namespaceTagPayload = extractTagPayload(blockTags, TAG_PREFIXES.namespaceOverride);
    const aliasTagPayload = extractTagPayload(blockTags, TAG_PREFIXES.aliasOverride);

    const addonKeyFromTag = addonTagPayload ? normalizeAddonKey(addonTagPayload) : undefined;
    const namespaceOverride = namespaceTagPayload ? decodeNamespacePayload(namespaceTagPayload) : undefined;
    const aliasOverride = aliasTagPayload ? decodeTagPayload(aliasTagPayload) : undefined;

    const addonFromTag = addonKeyFromTag ? getAddonByKey(addonKeyFromTag) : undefined;
    const addonFromTypeId = getAddonByTypeId(typeId);
    const addonFromNamespace = getAddonByNamespace(namespaceOverride || namespace);
    const mappedAddon = addonFromTag || addonFromTypeId || addonFromNamespace;

    let source = "default";
    let resolvedNamespace = namespace;
    let displayNamespace = DEFAULT_NAMESPACE_LABELS[namespace] ?? toTitleWords(namespace.split("_"));
    let addonKey;
    let addonName;
    let addonType;

    if (namespaceOverride) {
        resolvedNamespace = namespaceOverride;
        displayNamespace = toTitleWords(namespaceOverride.replace(/[:.]/g, "_").split("_"));
        source = "tag:namespace";
    }

    if (mappedAddon) {
        addonKey = mappedAddon.key;
        addonName = mappedAddon.name;
        addonType = mappedAddon.type;
        resolvedNamespace = mappedAddon.namespace || resolvedNamespace;
        displayNamespace = mappedAddon.name;
        source = addonFromTag
            ? "tag:addon"
            : addonFromTypeId
                ? "registry:content"
                : "registry:namespace";
    }

    if (aliasOverride) {
        displayNamespace = aliasOverride;
        source = "tag:alias";
    }

    return {
        addonKey,
        addonName,
        addonType,
        source,
        injected: source !== "default",
        originalNamespace: namespace,
        resolvedNamespace,
        displayNamespace
    };
}

export function registerNamespaceAlias(namespaceInput, displayName, persist = true) {
    ensureRegistryInitialized();
    return registerNamespaceAliasInternal(namespaceInput, displayName, persist);
}