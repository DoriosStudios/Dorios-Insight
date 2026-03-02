import { splitTypeId, toTitleWords } from "./formatters.js";

const blockStateTransformers = [];
const stateLabelAliases = new Map();

const defaultStateLabelAliases = Object.freeze({
    "minecraft:cardinal_direction": "Facing",
    "minecraft:facing_direction": "Facing",
    "minecraft:block_face": "Face",
    "minecraft:vertical_half": "Half",
    "minecraft:upside_down_bit": "Upside Down",
    "minecraft:open_bit": "Open",
    "minecraft:in_wall_bit": "In Wall",
    "minecraft:door_hinge_bit": "Hinge Side",
    "minecraft:upper_block_bit": "Upper Half",
    "minecraft:persistent_bit": "Persistent",
    "minecraft:powered_bit": "Powered",
    "minecraft:attached_bit": "Attached",
    "minecraft:triggered_bit": "Triggered",
    "minecraft:liquid_depth": "Liquid Level",
    "minecraft:liquid_type": "Liquid Type",
    "minecraft:stone_type": "Stone Type",
    "minecraft:wood_type": "Wood Type"
});

for (const [stateKey, label] of Object.entries(defaultStateLabelAliases)) {
    stateLabelAliases.set(stateKey, label);
}

function normalizeStateKey(stateKey) {
    return String(stateKey || "").trim().toLowerCase();
}

function normalizeOptionalString(value) {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
}

function normalizeArrayOfStrings(values, normalizer = normalizeOptionalString) {
    if (!Array.isArray(values)) {
        return [];
    }

    const normalized = [];
    for (const value of values) {
        const next = normalizer(value);
        if (!next) {
            continue;
        }

        normalized.push(next);
    }

    return [...new Set(normalized)];
}

function normalizeEntryLabel(entry, fallbackLabel) {
    const preferredLabel = normalizeOptionalString(entry?.label);
    if (preferredLabel) {
        return preferredLabel;
    }

    const keyLabel = normalizeOptionalString(entry?.key);
    if (keyLabel) {
        return keyLabel;
    }

    return fallbackLabel;
}

function normalizeTransformerOptions(options) {
    const priority = Number(options?.priority);

    return {
        priority: Number.isFinite(priority) ? priority : 0,
        namespaces: normalizeArrayOfStrings(options?.namespaces, (value) => {
            const normalized = normalizeOptionalString(value);
            return normalized ? normalized.toLowerCase() : undefined;
        }),
        typeIdPrefixes: normalizeArrayOfStrings(options?.typeIdPrefixes, (value) => {
            const normalized = normalizeOptionalString(value);
            return normalized ? normalized.toLowerCase() : undefined;
        }),
        requiredTags: normalizeArrayOfStrings(options?.requiredTags, (value) => {
            const normalized = normalizeOptionalString(value);
            return normalized ? normalized.toLowerCase() : undefined;
        })
    };
}

function sortTransformersByPriority() {
    blockStateTransformers.sort((left, right) => left.options.priority - right.options.priority);
}

function registerBlockStateTransformer(transformer, options = {}) {
    if (typeof transformer !== "function") {
        return false;
    }

    if (blockStateTransformers.some((entry) => entry.transformer === transformer)) {
        return true;
    }

    blockStateTransformers.push({
        transformer,
        options: normalizeTransformerOptions(options)
    });

    sortTransformersByPriority();
    return true;
}

function unregisterBlockStateTransformer(transformer) {
    const index = blockStateTransformers.findIndex((entry) => entry.transformer === transformer);
    if (index === -1) {
        return false;
    }

    blockStateTransformers.splice(index, 1);
    return true;
}

function shouldRunTransformer(entry, context) {
    const options = entry.options;

    if (options.namespaces.length) {
        if (!options.namespaces.includes(context.namespace)) {
            return false;
        }
    }

    if (options.typeIdPrefixes.length) {
        const hasPrefix = options.typeIdPrefixes.some((prefix) => context.typeId.startsWith(prefix));
        if (!hasPrefix) {
            return false;
        }
    }

    if (options.requiredTags.length) {
        const missingTag = options.requiredTags.some((tag) => !context.blockTagSet.has(tag));
        if (missingTag) {
            return false;
        }
    }

    return true;
}

function normalizeRenameMap(renameMap) {
    if (!renameMap || typeof renameMap !== "object") {
        return {};
    }

    const normalized = {};
    for (const [stateKey, label] of Object.entries(renameMap)) {
        const normalizedKey = normalizeStateKey(stateKey);
        const normalizedLabel = normalizeOptionalString(label);
        if (!normalizedKey || !normalizedLabel) {
            continue;
        }

        normalized[normalizedKey] = normalizedLabel;
    }

    return normalized;
}

function normalizeReplaceMap(replaceMap) {
    if (!replaceMap || typeof replaceMap !== "object") {
        return {};
    }

    const normalized = {};
    for (const [stateKey, value] of Object.entries(replaceMap)) {
        const normalizedKey = normalizeStateKey(stateKey);
        if (!normalizedKey) {
            continue;
        }

        normalized[normalizedKey] = value;
    }

    return normalized;
}

function normalizeTransformerEntries(entries, context) {
    if (!Array.isArray(entries)) {
        return [];
    }

    const normalized = [];

    for (const entry of entries) {
        if (!entry || typeof entry !== "object") {
            continue;
        }

        const stateKey = normalizeStateKey(entry.key);
        const labelFallback = stateKey
            ? toTitleWords(stateKey.includes(":") ? stateKey.split(":")[1].split("_") : stateKey.split("_"))
            : "State";

        const label = normalizeEntryLabel(entry, labelFallback);

        normalized.push({
            stateKey,
            label,
            rawValue: entry.value,
            valueText: context.toMessageText(entry.value),
            injected: true
        });
    }

    return normalized;
}

function normalizeTransformerResult(result, context) {
    if (!result || typeof result !== "object") {
        return {
            hide: new Set(),
            rename: {},
            replace: {},
            prepend: [],
            append: []
        };
    }

    return {
        hide: new Set(normalizeArrayOfStrings(result.hide, normalizeStateKey)),
        rename: normalizeRenameMap(result.rename),
        replace: normalizeReplaceMap(result.replace),
        prepend: normalizeTransformerEntries(result.prepend, context),
        append: normalizeTransformerEntries(result.append, context)
    };
}

function applyAliasLabels(entries) {
    for (const entry of entries) {
        if (!entry.stateKey) {
            continue;
        }

        const aliasLabel = stateLabelAliases.get(entry.stateKey);
        if (aliasLabel) {
            entry.label = aliasLabel;
        }
    }
}

function toStateEntries(rawStates, context) {
    const entries = [];
    for (const [stateKey, rawValue] of Object.entries(rawStates || {})) {
        entries.push({
            stateKey: normalizeStateKey(stateKey),
            label: context.formatStateName(stateKey),
            rawValue,
            valueText: context.toMessageText(rawValue),
            injected: false
        });
    }

    applyAliasLabels(entries);
    return entries;
}

function toStateMap(entries) {
    const map = Object.create(null);

    for (const entry of entries) {
        if (!entry.stateKey) {
            continue;
        }

        map[entry.stateKey] = entry.rawValue;
    }

    return map;
}

function applyTransformerResult(entries, normalizedResult, context) {
    const filteredEntries = [];

    for (const entry of entries) {
        if (entry.stateKey && normalizedResult.hide.has(entry.stateKey)) {
            continue;
        }

        const nextEntry = {
            ...entry
        };

        if (entry.stateKey && normalizedResult.rename[entry.stateKey]) {
            nextEntry.label = normalizedResult.rename[entry.stateKey];
        }

        if (entry.stateKey && Object.prototype.hasOwnProperty.call(normalizedResult.replace, entry.stateKey)) {
            const nextRawValue = normalizedResult.replace[entry.stateKey];
            nextEntry.rawValue = nextRawValue;
            nextEntry.valueText = context.toMessageText(nextRawValue);
        }

        filteredEntries.push(nextEntry);
    }

    const merged = [
        ...normalizedResult.prepend,
        ...filteredEntries,
        ...normalizedResult.append
    ];

    applyAliasLabels(merged);
    return merged;
}

function registerStateAlias(stateKey, label) {
    const normalizedStateKey = normalizeStateKey(stateKey);
    const normalizedLabel = normalizeOptionalString(label);

    if (!normalizedStateKey || !normalizedLabel) {
        return false;
    }

    stateLabelAliases.set(normalizedStateKey, normalizedLabel);
    return true;
}

function registerStateAliases(aliasMap) {
    if (!aliasMap || typeof aliasMap !== "object") {
        return false;
    }

    let changed = false;
    for (const [stateKey, label] of Object.entries(aliasMap)) {
        changed = registerStateAlias(stateKey, label) || changed;
    }

    return changed;
}

function registerStateMerge(definition = {}) {
    const mergedKey = normalizeStateKey(definition.key || definition.stateKey || "");
    const mergedLabel = normalizeOptionalString(definition.label) || "Merged";
    const sourceStateKeys = normalizeArrayOfStrings(definition.stateKeys, normalizeStateKey);

    if (!mergedKey || sourceStateKeys.length < 2) {
        return false;
    }

    const formatter = typeof definition.formatter === "function"
        ? definition.formatter
        : (values) => values.map((value) => String(value)).join(definition.separator || " / ");

    const hideOriginal = definition.hideOriginal !== false;

    const transformer = (context) => {
        const values = sourceStateKeys.map((stateKey) => context.stateMap[stateKey]);
        if (values.some((value) => value === undefined)) {
            return undefined;
        }

        const mergedValue = formatter(values, context);
        return {
            hide: hideOriginal ? sourceStateKeys : [],
            append: [
                {
                    key: mergedKey,
                    label: mergedLabel,
                    value: mergedValue
                }
            ]
        };
    };

    return registerBlockStateTransformer(transformer, definition.options || {});
}

export function transformBlockStateEntries(context) {
    const typeId = String(context?.typeId || context?.block?.typeId || "").trim().toLowerCase();
    const namespace = splitTypeId(typeId).namespace;
    const blockTags = Array.isArray(context?.blockTags)
        ? context.blockTags
        : [];

    const runtimeContext = {
        ...context,
        typeId,
        namespace,
        blockTagSet: new Set(blockTags.map((tag) => String(tag || "").toLowerCase())),
        toMessageText: typeof context?.toMessageText === "function"
            ? context.toMessageText
            : (value) => String(value),
        formatStateName: typeof context?.formatStateName === "function"
            ? context.formatStateName
            : (value) => String(value)
    };

    let entries = toStateEntries(context?.rawStates || {}, runtimeContext);

    for (const transformerEntry of blockStateTransformers) {
        if (!shouldRunTransformer(transformerEntry, runtimeContext)) {
            continue;
        }

        const stateMap = toStateMap(entries);
        let rawResult;

        try {
            rawResult = transformerEntry.transformer({
                ...runtimeContext,
                stateMap,
                entries: entries.map((entry) => ({ ...entry }))
            });
        } catch (error) {
            const provider = transformerEntry?.metadata?.provider || "unknown";
            console.warn(`[Insight] State transformer from "${provider}" threw: ${error?.message || error}`);
            continue;
        }

        const normalizedResult = normalizeTransformerResult(rawResult, runtimeContext);
        entries = applyTransformerResult(entries, normalizedResult, runtimeContext);
    }

    return entries;
}

function exposeStateTraitInjectionApi() {
    const existingApi = globalThis.InsightStateTraits && typeof globalThis.InsightStateTraits === "object"
        ? globalThis.InsightStateTraits
        : {};

    globalThis.InsightStateTraits = {
        ...existingApi,
        registerBlockStateTransformer(transformer, options) {
            return registerBlockStateTransformer(transformer, options);
        },
        unregisterBlockStateTransformer(transformer) {
            return unregisterBlockStateTransformer(transformer);
        },
        clearBlockStateTransformers() {
            blockStateTransformers.length = 0;
        },
        registerStateAlias(stateKey, label) {
            return registerStateAlias(stateKey, label);
        },
        registerStateAliases(aliasMap) {
            return registerStateAliases(aliasMap);
        },
        clearStateAliases() {
            stateLabelAliases.clear();
            for (const [stateKey, label] of Object.entries(defaultStateLabelAliases)) {
                stateLabelAliases.set(stateKey, label);
            }
        },
        registerStateMerge(definition) {
            return registerStateMerge(definition);
        },
        getRegisteredCounts() {
            return {
                transformers: blockStateTransformers.length,
                aliases: stateLabelAliases.size
            };
        },
        preview(context) {
            return transformBlockStateEntries(context);
        }
    };
}

exposeStateTraitInjectionApi();