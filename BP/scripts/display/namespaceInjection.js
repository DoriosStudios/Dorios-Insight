import { system, world } from "@minecraft/server";
import { splitTypeId, toTitleWords } from "./formatters.js";
import { WorkspaceAddonContentRegistry } from "./workspaceRegistry.js";

const REGISTRY_DYNAMIC_PROPERTY = "insight:namespace_registry";
export const NamespaceRegistrationSources = Object.freeze({
    Workspace: "workspace",
    Script: "script",
    Command: "command"
});

const RegistrationSources = NamespaceRegistrationSources;

const DEFAULT_ADDON_LIBRARY = Object.freeze(
    WorkspaceAddonContentRegistry
        .map((entry) => normalizeAddonDefinition(entry, RegistrationSources.Workspace))
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
    contentToAddonKeys: new Map(),
    namespaceToAddonKeys: new Map()
};

const AddonTypePriority = Object.freeze({
    identifier: -1,
    namespace: 0,
    expansion: 1,
    addon: 2,
    core: 3
});

function normalizeAddonKey(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_.-]/g, "");
}

function normalizeRegistrationSource(value, fallback = RegistrationSources.Workspace) {
    const normalized = typeof value === "string"
        ? value.trim().toLowerCase()
        : "";

    switch (normalized) {
        case RegistrationSources.Workspace:
        case RegistrationSources.Script:
        case RegistrationSources.Command:
            return normalized;
        default:
            return fallback;
    }
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

function normalizeTypeIdInput(value) {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim().toLowerCase();
    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) {
        return undefined;
    }

    const namespace = normalizeNamespaceInput(trimmed.slice(0, separatorIndex));
    const identifierPath = trimmed.slice(separatorIndex + 1).trim();
    if (!namespace || !identifierPath || !/^[a-z0-9_.\/-]+$/.test(identifierPath)) {
        return undefined;
    }

    return `${namespace}:${identifierPath}`;
}

function normalizeAddonIdentifier(value) {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value
        .trim()
        .replace(/[\r\n\t]+/g, " ")
        .replace(/\s+/g, " ");

    return normalized.length ? normalized : undefined;
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

function normalizeAddonDefinition(addonContent, fallbackRegistrationSource = RegistrationSources.Workspace) {
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
    const identifier = normalizeAddonIdentifier(addonContent.identifier);
    const registrationSource = normalizeRegistrationSource(
        addonContent.registrationSource ?? addonContent.source,
        fallbackRegistrationSource
    );

    return {
        key,
        name,
        identifier,
        registrationSource,
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
        identifier: overrideAddon.identifier || baseAddon.identifier,
        registrationSource: normalizeRegistrationSource(
            overrideAddon.registrationSource,
            baseAddon.registrationSource
        ),
        type: overrideAddon.type || baseAddon.type,
        namespace: overrideAddon.namespace || baseAddon.namespace,
        content: [...new Set([...(baseAddon.content || []), ...(overrideAddon.content || [])])]
    };
}

function rebuildMergedRegistry() {
    RegistryState.mergedByKey = new Map();
    RegistryState.contentToAddonKeys = new Map();
    RegistryState.namespaceToAddonKeys = new Map();

    for (const addon of DEFAULT_ADDON_LIBRARY) {
        RegistryState.mergedByKey.set(addon.key, {
            key: addon.key,
            name: addon.name,
            identifier: addon.identifier,
            registrationSource: addon.registrationSource,
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
        const namespaceKey = addon.type === "identifier"
            ? undefined
            : normalizeNamespaceInput(addon.namespace);
        if (namespaceKey) {
            if (!RegistryState.namespaceToAddonKeys.has(namespaceKey)) {
                RegistryState.namespaceToAddonKeys.set(namespaceKey, []);
            }

            const namespaceOwners = RegistryState.namespaceToAddonKeys.get(namespaceKey);
            if (!namespaceOwners.includes(addon.key)) {
                namespaceOwners.push(addon.key);
            }
        }

        for (const typeId of addon.content) {
            if (!RegistryState.contentToAddonKeys.has(typeId)) {
                RegistryState.contentToAddonKeys.set(typeId, []);
            }

            const contentOwners = RegistryState.contentToAddonKeys.get(typeId);
            if (!contentOwners.includes(addon.key)) {
                contentOwners.push(addon.key);
            }
        }
    }
}

function getAddonTypeRank(addonType) {
    if (typeof addonType !== "string") {
        return Number.MAX_SAFE_INTEGER;
    }

    return AddonTypePriority[addonType] ?? Number.MAX_SAFE_INTEGER;
}

function selectBestAddonForTypeId(addonCandidates) {
    if (!Array.isArray(addonCandidates) || !addonCandidates.length) {
        return undefined;
    }

    const sortedCandidates = [...addonCandidates].sort((left, right) => {
        const leftRank = getAddonTypeRank(left.type);
        const rightRank = getAddonTypeRank(right.type);

        if (leftRank !== rightRank) {
            return leftRank - rightRank;
        }

        return String(left.key || "").localeCompare(String(right.key || ""));
    });

    return sortedCandidates[0];
}

function selectBestAddonForNamespace(addonCandidates) {
    if (!Array.isArray(addonCandidates) || !addonCandidates.length) {
        return undefined;
    }

    // Explicit namespace aliases should always override shared namespace ambiguity.
    const explicitAlias = addonCandidates.find((addon) => addon.type === "namespace");
    if (explicitAlias) {
        return explicitAlias;
    }

    // If multiple addons share the same namespace, do not guess the owner.
    if (addonCandidates.length > 1) {
        return undefined;
    }

    return addonCandidates[0];
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
        const normalized = normalizeAddonDefinition(addon, RegistrationSources.Command);
        if (!normalized) {
            continue;
        }

        const current = RegistryState.dynamicByKey.get(normalized.key);
        RegistryState.dynamicByKey.set(normalized.key, mergeAddonDefinitions(current, normalized));
    }
}

function persistDynamicRegistryToWorld() {
    const dynamicAddons = [...RegistryState.dynamicByKey.values()]
        .filter((addon) => addon.registrationSource === RegistrationSources.Command)
        .map((addon) => ({
            key: addon.key,
            name: addon.name,
            identifier: addon.identifier,
            registrationSource: addon.registrationSource,
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

    const addonKeys = RegistryState.contentToAddonKeys.get(normalizedTypeId);
    if (!Array.isArray(addonKeys) || !addonKeys.length) {
        return undefined;
    }

    const addonCandidates = addonKeys
        .map((addonKey) => RegistryState.mergedByKey.get(addonKey))
        .filter(Boolean);

    return selectBestAddonForTypeId(addonCandidates);
}

function getAddonByNamespace(namespace) {
    ensureRegistryInitialized();

    const normalizedNamespace = normalizeNamespaceInput(namespace);
    if (!normalizedNamespace) {
        return undefined;
    }

    const addonKeys = RegistryState.namespaceToAddonKeys.get(normalizedNamespace);
    if (!Array.isArray(addonKeys) || !addonKeys.length) {
        return undefined;
    }

    const addonCandidates = addonKeys
        .map((addonKey) => RegistryState.mergedByKey.get(addonKey))
        .filter(Boolean);

    return selectBestAddonForNamespace(addonCandidates);
}

function registerAddonContentInternal(addonContent, persist = true) {
    ensureRegistryInitialized();

    const normalized = normalizeAddonDefinition(
        addonContent,
        persist ? RegistrationSources.Command : RegistrationSources.Script
    );
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

function resolveNamespaceAliasRegistrationArgs(identifierOrPersist, persistMaybe) {
    if (typeof identifierOrPersist === "boolean") {
        return {
            identifier: undefined,
            persist: identifierOrPersist
        };
    }

    return {
        identifier: normalizeAddonIdentifier(identifierOrPersist),
        persist: typeof persistMaybe === "boolean" ? persistMaybe : true
    };
}

function registerNamespaceAliasInternal(namespaceInput, displayName, identifierOrPersist = true, persistMaybe = true) {
    const typeId = normalizeTypeIdInput(namespaceInput);
    const namespace = normalizeNamespaceInput(typeId ? typeId.split(":")[0] : namespaceInput);
    const name = typeof displayName === "string" ? displayName.trim() : "";
    const registrationArgs = resolveNamespaceAliasRegistrationArgs(identifierOrPersist, persistMaybe);

    if (!namespace || !name) {
        return {
            ok: false,
            reason: "invalid_input"
        };
    }

    const key = typeId
        ? normalizeAddonKey(`identifier_${typeId.replace(/[:./-]+/g, "_")}`)
        : normalizeAddonKey(`namespace_${namespace}`);
    const didRegister = registerAddonContentInternal({
        key,
        name,
        identifier: registrationArgs.identifier,
        registrationSource: RegistrationSources.Command,
        type: typeId ? "identifier" : "namespace",
        namespace,
        content: typeId ? [typeId] : []
    }, registrationArgs.persist);

    return {
        ok: didRegister,
        key,
        namespace,
        typeId,
        target: typeId || namespace,
        identifier: registrationArgs.identifier,
        name
    };
}

function getDynamicRegistrationSortWeight(source) {
    switch (source) {
        case RegistrationSources.Script:
            return 0;
        case RegistrationSources.Command:
            return 1;
        default:
            return 2;
    }
}

function describeDynamicRegistration(addon) {
    const registrationSource = normalizeRegistrationSource(
        addon?.registrationSource,
        RegistrationSources.Command
    );
    const content = Array.isArray(addon?.content) ? addon.content : [];
    const typeId = addon?.type === "identifier"
        ? normalizeTypeIdInput(content[0])
        : undefined;

    return {
        key: addon?.key,
        name: addon?.name,
        identifier: addon?.identifier,
        registrationSource,
        type: addon?.type,
        namespace: addon?.namespace,
        typeId,
        target: typeId || addon?.namespace || addon?.key,
        contentCount: content.length,
        content: [...content],
        resettable: registrationSource === RegistrationSources.Script || registrationSource === RegistrationSources.Command
    };
}

function getRegisteredNamespaceEntriesInternal(source) {
    ensureRegistryInitialized();

    const normalizedSource = normalizeRegistrationSource(source, undefined);
    const entries = [...RegistryState.dynamicByKey.values()]
        .map((addon) => describeDynamicRegistration(addon))
        .filter((entry) => !normalizedSource || entry.registrationSource === normalizedSource);

    entries.sort((left, right) => {
        const leftWeight = getDynamicRegistrationSortWeight(left.registrationSource);
        const rightWeight = getDynamicRegistrationSortWeight(right.registrationSource);

        if (leftWeight !== rightWeight) {
            return leftWeight - rightWeight;
        }

        const namespaceCompare = String(left.namespace || "").localeCompare(String(right.namespace || ""));
        if (namespaceCompare !== 0) {
            return namespaceCompare;
        }

        const nameCompare = String(left.name || "").localeCompare(String(right.name || ""));
        if (nameCompare !== 0) {
            return nameCompare;
        }

        return String(left.key || "").localeCompare(String(right.key || ""));
    });

    return entries;
}

function normalizeNamespaceResetFilter(filter) {
    if (typeof filter === "string") {
        return {
            source: normalizeRegistrationSource(filter, undefined)
        };
    }

    if (!filter || typeof filter !== "object") {
        return {};
    }

    return {
        source: normalizeRegistrationSource(filter.source, undefined),
        key: typeof filter.key === "string" && filter.key.trim()
            ? normalizeAddonKey(filter.key)
            : undefined
    };
}

function matchesNamespaceResetFilter(addonKey, addon, filter) {
    if (filter.source && addon.registrationSource !== filter.source) {
        return false;
    }

    if (filter.key && addonKey !== filter.key) {
        return false;
    }

    return true;
}

function resetRegisteredNamespaceEntriesInternal(filter = {}) {
    ensureRegistryInitialized();

    const normalizedFilter = normalizeNamespaceResetFilter(filter);
    const removed = [];

    for (const [addonKey, addon] of [...RegistryState.dynamicByKey.entries()]) {
        if (!matchesNamespaceResetFilter(addonKey, addon, normalizedFilter)) {
            continue;
        }

        RegistryState.dynamicByKey.delete(addonKey);
        removed.push(describeDynamicRegistration(addon));
    }

    if (!removed.length) {
        return {
            ok: false,
            count: 0,
            removed: []
        };
    }

    rebuildMergedRegistry();
    persistDynamicRegistryToWorld();

    return {
        ok: true,
        count: removed.length,
        removed
    };
}

function exposeNamespaceRegistryApi() {
    const existingApi = globalThis.InsightNamespaceRegistry && typeof globalThis.InsightNamespaceRegistry === "object"
        ? globalThis.InsightNamespaceRegistry
        : {};

    globalThis.InsightNamespaceRegistry = {
        ...existingApi,
        registerAddonContent(addonContent, persist = true) {
            return registerAddonContentInternal(addonContent, persist);
        },
        registerNamespaceAlias(namespaceInput, displayName, identifierOrPersist = true, persistMaybe = true) {
            return registerNamespaceAliasInternal(namespaceInput, displayName, identifierOrPersist, persistMaybe);
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
                identifier: addon.identifier,
                type: addon.type,
                namespace: addon.namespace,
                content: [...addon.content]
            }));
        },
        getNamespaceAliases() {
            ensureRegistryInitialized();
            const aliases = [];

            for (const [namespace, addonKeys] of RegistryState.namespaceToAddonKeys.entries()) {
                const addonCandidates = (addonKeys || [])
                    .map((addonKey) => RegistryState.mergedByKey.get(addonKey))
                    .filter(Boolean);

                const resolved = selectBestAddonForNamespace(addonCandidates);
                if (!resolved) {
                    continue;
                }

                aliases.push({
                    namespace,
                    name: resolved.name ?? toTitleWords(namespace.split("_")),
                    identifier: resolved.identifier,
                    key: resolved.key
                });
            }

            return aliases;
        },
        getRegisteredNamespaceEntries(source) {
            return getRegisteredNamespaceEntriesInternal(source);
        },
        getDynamicRegistrySnapshot(source) {
            return getRegisteredNamespaceEntriesInternal(source);
        },
        resetNamespaceRegistrations(filter = {}) {
            return resetRegisteredNamespaceEntriesInternal(filter);
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
    let displayIdentifier;
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
        displayIdentifier = mappedAddon.identifier;
        resolvedNamespace = mappedAddon.namespace || resolvedNamespace;
        displayNamespace = mappedAddon.name;
        source = addonFromTag
            ? "tag:addon"
            : addonFromTypeId
                ? (mappedAddon.type === "identifier" ? "registry:identifier" : "registry:content")
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
        displayIdentifier,
        source,
        injected: source !== "default",
        originalNamespace: namespace,
        resolvedNamespace,
        displayNamespace
    };
}

export function registerNamespaceAlias(namespaceInput, displayName, identifierOrPersist = true, persistMaybe = true) {
    ensureRegistryInitialized();
    return registerNamespaceAliasInternal(namespaceInput, displayName, identifierOrPersist, persistMaybe);
}

export function getRegisteredNamespaceEntries(source) {
    ensureRegistryInitialized();
    return getRegisteredNamespaceEntriesInternal(source);
}

export function resetRegisteredNamespaceEntries(filter = {}) {
    ensureRegistryInitialized();
    return resetRegisteredNamespaceEntriesInternal(filter);
}