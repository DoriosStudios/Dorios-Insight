import { world } from "@minecraft/server";

const WORLD_MODE_DYNAMIC_PROPERTY = "insight:mode";
const WORLD_ENABLED_DYNAMIC_PROPERTY = "insight:enabled";
const PLAYER_SETTINGS_DYNAMIC_PROPERTY = "insight:player_settings";

const memoryFallback = {
    mode: "essential",
    enabled: true,
    playerSettings: new Map()
};

export const InsightModes = Object.freeze({
    Essential: "essential",
    Detailed: "detailed",
    Debug: "debug"
});

export const VisibilityPolicies = Object.freeze({
    Show: "show",
    ShowWhenSneaking: "sneak",
    CreativeOnly: "creative",
    Hide: "hide"
});

export const VisibilityPolicyLabels = Object.freeze([
    Object.freeze({ key: VisibilityPolicies.Show, label: "Show" }),
    Object.freeze({ key: VisibilityPolicies.ShowWhenSneaking, label: "Show When Sneaking" }),
    Object.freeze({ key: VisibilityPolicies.CreativeOnly, label: "Creative Only" }),
    Object.freeze({ key: VisibilityPolicies.Hide, label: "Hide" })
]);

export const EffectDisplayModes = Object.freeze({
    Emoji: "emoji",
    Text: "text"
});

export const EffectDisplayModeLabels = Object.freeze([
    Object.freeze({ key: EffectDisplayModes.Emoji, label: "Emoji" }),
    Object.freeze({ key: EffectDisplayModes.Text, label: "Text" })
]);

export const DisplayStyles = Object.freeze({
    Icon: "icon",
    Text: "text", // Legacy alias, normalized to text_full.
    TextFull: "text_full",
    TextPercent: "text_percent",
    HybridFull: "hybrid_full",
    HybridPercent: "hybrid_percent"
});

export const DisplayStyleLabels = Object.freeze([
    Object.freeze({ key: DisplayStyles.Icon, label: "Icon" }),
    Object.freeze({ key: DisplayStyles.TextFull, label: "Text Type 1 (Health: x/y)" }),
    Object.freeze({ key: DisplayStyles.TextPercent, label: "Text Type 2 (Health: x%)" }),
    Object.freeze({ key: DisplayStyles.HybridFull, label: "Hybrid Type 1 (❤️ x/y)" }),
    Object.freeze({ key: DisplayStyles.HybridPercent, label: "Hybrid Type 2 (❤️ x%)" })
]);

export const EntityNameDisplayModes = Object.freeze({
    NicknameFirst: "nickname_first",
    MobNameFirst: "mob_name_first",
    NicknameAfterMobName: "nickname_after_mob_name",
    MobNameAfterNickname: "mob_name_after_nickname",
    NicknameOnly: "nickname_only",
    MobNameOnly: "mob_name_only"
});

export const EntityNameDisplayModeLabels = Object.freeze([
    Object.freeze({ key: EntityNameDisplayModes.NicknameFirst, label: "Nickname First" }),
    Object.freeze({ key: EntityNameDisplayModes.MobNameFirst, label: "Mob Name First" }),
    Object.freeze({ key: EntityNameDisplayModes.NicknameAfterMobName, label: "Nickname After Mob Name" }),
    Object.freeze({ key: EntityNameDisplayModes.MobNameAfterNickname, label: "Mob Name After Nickname" }),
    Object.freeze({ key: EntityNameDisplayModes.NicknameOnly, label: "Nickname Only" }),
    Object.freeze({ key: EntityNameDisplayModes.MobNameOnly, label: "Mob Name Only" })
]);

export const EntityNameResolveModes = Object.freeze({
    TranslationKeys: "translation_keys",
    TypeIdToText: "typeid_text"
});

export const EntityNameResolveModeLabels = Object.freeze([
    Object.freeze({ key: EntityNameResolveModes.TranslationKeys, label: "Translation Keys" }),
    Object.freeze({ key: EntityNameResolveModes.TypeIdToText, label: "Translate Id to Text" })
]);

export const VillagerProfessionDisplayModes = Object.freeze({
    AfterName: "after_name",
    BelowName: "below_name",
    Hidden: "hidden"
});

export const VillagerProfessionDisplayModeLabels = Object.freeze([
    Object.freeze({ key: VillagerProfessionDisplayModes.AfterName, label: "After Name" }),
    Object.freeze({ key: VillagerProfessionDisplayModes.BelowName, label: "Below Name" }),
    Object.freeze({ key: VillagerProfessionDisplayModes.Hidden, label: "Hidden" })
]);

export const ToolTierIndicatorModes = Object.freeze({
    Hidden: "hidden",
    BooleanIndicator: "boolean_indicator",
    TierIndicatorColor: "tier_indicator_color",
    TierIndicatorOre: "tier_indicator_ore",
    TextIndicator: "text_indicator"
});

export const ToolTierIndicatorModeLabels = Object.freeze([
    Object.freeze({ key: ToolTierIndicatorModes.Hidden, label: "Hidden" }),
    Object.freeze({ key: ToolTierIndicatorModes.BooleanIndicator, label: "Boolean Indicator (Yes/No)" }),
    Object.freeze({ key: ToolTierIndicatorModes.TierIndicatorColor, label: "Tier Indicator (Color)" }),
    Object.freeze({ key: ToolTierIndicatorModes.TierIndicatorOre, label: "Tier Indicator (Ore)" }),
    Object.freeze({ key: ToolTierIndicatorModes.TextIndicator, label: "Text Indicator (Diamond)" })
]);

export const ToolIndicatorPlacementModes = Object.freeze({
    BeforeName: "before_name",
    AfterName: "after_name",
    BelowName: "below_name"
});

export const ToolIndicatorPlacementModeLabels = Object.freeze([
    Object.freeze({ key: ToolIndicatorPlacementModes.BeforeName, label: "Before Name" }),
    Object.freeze({ key: ToolIndicatorPlacementModes.AfterName, label: "After Name" }),
    Object.freeze({ key: ToolIndicatorPlacementModes.BelowName, label: "Below Name" })
]);

export const ToolIndicatorColorOptions = Object.freeze([
    Object.freeze({ key: "§7", label: "Gray (Default)" }),
    Object.freeze({ key: "§f", label: "White" }),
    Object.freeze({ key: "§e", label: "Yellow" }),
    Object.freeze({ key: "§a", label: "Green" }),
    Object.freeze({ key: "§b", label: "Aqua" }),
    Object.freeze({ key: "§9", label: "Blue" }),
    Object.freeze({ key: "§d", label: "Light Purple" }),
    Object.freeze({ key: "§c", label: "Red" })
]);

export const InsightComponentDefinitions = Object.freeze([
    // All of these will eventually use localization keys, but for now the labels are hardcoded in English.
    Object.freeze({ key: "namespace", label: "Namespace Label" }),
    Object.freeze({ key: "customFields", label: "Custom Fields" }),
    Object.freeze({ key: "customEnergyInfo", label: "UtilityCraft: Energy Info" }),
    Object.freeze({ key: "customRotationInfo", label: "UtilityCraft: Rotation Info" }),
    Object.freeze({ key: "customMachineProgress", label: "UtilityCraft: Machine Progress" }),
    Object.freeze({ key: "customVariantPreview", label: "Dorios' Atelier: Variant Preview" }),
    Object.freeze({ key: "blockStates", label: "Block States" }),
    Object.freeze({ key: "blockTags", label: "Block Tags" }),
    Object.freeze({ key: "health", label: "Entity Health" }),
    Object.freeze({ key: "absorption", label: "Absorption Hearts" }),
    Object.freeze({ key: "armor", label: "Player Armor" }),
    Object.freeze({ key: "hunger", label: "Player Hunger" }),
    Object.freeze({ key: "hungerEffect", label: "Hunger Effect Icons" }),
    Object.freeze({ key: "airBubbles", label: "Air Bubbles" }),
    Object.freeze({ key: "effects", label: "Status Effects" }),
    Object.freeze({ key: "effectHearts", label: "Status Heart Effects" }),
    Object.freeze({ key: "frozenHearts", label: "Frozen Hearts (Deprecated / Non-functional)" }),
    Object.freeze({ key: "animalHearts", label: "Rideable Hearts" }),
    Object.freeze({ key: "entityScoreboards", label: "Entity Scoreboards" }),
    Object.freeze({ key: "tameable", label: "Tameable Status" }),
    Object.freeze({ key: "tameFoods", label: "Tame Foods" }),
    Object.freeze({ key: "technical", label: "Technical Summary" }),
    Object.freeze({ key: "coordinates", label: "Coordinates" }),
    Object.freeze({ key: "typeId", label: "Type Identifier" }),
    Object.freeze({ key: "entityTags", label: "Entity Tags" }),
    Object.freeze({ key: "entityFamilies", label: "Entity Families" }),
    Object.freeze({ key: "velocity", label: "Entity Velocity" }),
    Object.freeze({ key: "namespaceResolution", label: "Namespace Resolution Debug" })
]);

const DeprecatedInsightComponents = Object.freeze(new Set([
    "frozenHearts"
]));

export function isInsightComponentDeprecated(componentKey) {
    return DeprecatedInsightComponents.has(String(componentKey || "").trim());
}

export const InsightConfig = Object.freeze({
    system: {
        showLoadMessage: true,
        loadMessage: "§a[Dorios' Insight]§r loaded",
        showInitializationModeMessage: true,
        defaultMode: InsightModes.Essential,
        minMaxDistance: 3,
        maxMaxDistance: 24,
        minUpdateIntervalTicks: 1,
        maxUpdateIntervalTicks: 20,
        minUnchangedTargetRefreshTicks: 1,
        maxUnchangedTargetRefreshTicks: 40,
        minClearAfterNoTargetTicks: 0,
        maxClearAfterNoTargetTicks: 200,
        maxVisibleStatesCap: 20,
        maxVisibleTagsCap: 20,
        maxVisibleFamiliesCap: 20,
        maxVisibleEffectsCap: 20,
        maxLayoutColumns: 6,
        maxHeartsPerLine: 10,
        maxHeartDisplayHealth: 100,
        minMaxHeartDisplayHealth: 20,
        maxMaxHeartDisplayHealth: 500
    },
    display: {
        namespaceColor: "§9",
        technicalColor: "§7",
        tagsColor: "§8",
        separator: "\n----------",
        moreRowsLabel: "more rows...",
        moreTagsLabel: "more tags...",
        moreFamiliesLabel: "more families...",
        initializedPrefix: "§aDorios' Insight Initialized on "
    },
    compatibility: {
        deduplicateActionbar: true,
        unchangedTargetRefreshTicks: 8,
        useEntityHitFallback: true
    },
    commands: {
        prefix: "!insight"
    },
    playerTags: {
        disabled: "insight:disable",
        sneakOnly: "insight:sneak_only",
        hideNamespace: "insight:hide_namespace",
        hideHealth: "insight:hide_health",
        technicalView: "insight:technical",
        blockTags: "insight:block_tags",
        hideBlockTags: "insight:hide_block_tags",
        namespaceDebug: "insight:namespace_debug"
    }
});

export const InsightModePresets = Object.freeze({
    [InsightModes.Essential]: Object.freeze({
        label: "Essential",
        runtime: Object.freeze({
            maxDistance: 7,
            updateIntervalTicks: 3,
            unchangedTargetRefreshTicks: 8,
            includeLiquidBlocks: false,
            includeInvisibleEntities: true,
            clearAfterNoTargetTicks: 20,
            maxVisibleStates: 2,
            maxVisibleBlockTags: 2,
            maxVisibleEntityTags: 0,
            maxVisibleEntityFamilies: 0,
            maxVisibleEffects: 3,
            maxHeartDisplayHealth: 100,
            effectDisplayMode: EffectDisplayModes.Emoji,
            displayStyle: DisplayStyles.Icon,
            nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
            nameResolveMode: EntityNameResolveModes.TranslationKeys,
            villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
            toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
            toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
            toolIndicatorColor: "§7",
            stateColumns: 1,
            tagColumns: 1,
            familyColumns: 1
        }),
        components: Object.freeze({
            namespace: VisibilityPolicies.Show,
            customFields: VisibilityPolicies.Show,
            customEnergyInfo: VisibilityPolicies.Show,
            customRotationInfo: VisibilityPolicies.ShowWhenSneaking,
            customMachineProgress: VisibilityPolicies.ShowWhenSneaking,
            customVariantPreview: VisibilityPolicies.ShowWhenSneaking,
            blockStates: VisibilityPolicies.Show,
            blockTags: VisibilityPolicies.Hide,
            health: VisibilityPolicies.Show,
            absorption: VisibilityPolicies.Show,
            armor: VisibilityPolicies.Show,
            hunger: VisibilityPolicies.Show,
            hungerEffect: VisibilityPolicies.Show,
            airBubbles: VisibilityPolicies.Show,
            effects: VisibilityPolicies.Show,
            effectHearts: VisibilityPolicies.Show,
            frozenHearts: VisibilityPolicies.Show,
            animalHearts: VisibilityPolicies.Show,
            entityScoreboards: VisibilityPolicies.ShowWhenSneaking,
            tameable: VisibilityPolicies.Show,
            tameFoods: VisibilityPolicies.ShowWhenSneaking,
            technical: VisibilityPolicies.Hide,
            coordinates: VisibilityPolicies.Hide,
            typeId: VisibilityPolicies.Hide,
            entityTags: VisibilityPolicies.Hide,
            entityFamilies: VisibilityPolicies.Hide,
            velocity: VisibilityPolicies.Hide,
            namespaceResolution: VisibilityPolicies.Hide
        })
    }),
    [InsightModes.Detailed]: Object.freeze({
        label: "Detailed",
        runtime: Object.freeze({
            maxDistance: 9,
            updateIntervalTicks: 2,
            unchangedTargetRefreshTicks: 8,
            includeLiquidBlocks: false,
            includeInvisibleEntities: true,
            clearAfterNoTargetTicks: 30,
            maxVisibleStates: 6,
            maxVisibleBlockTags: 6,
            maxVisibleEntityTags: 4,
            maxVisibleEntityFamilies: 4,
            maxVisibleEffects: 5,
            maxHeartDisplayHealth: 100,
            effectDisplayMode: EffectDisplayModes.Emoji,
            displayStyle: DisplayStyles.Icon,
            nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
            nameResolveMode: EntityNameResolveModes.TranslationKeys,
            villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
            toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
            toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
            toolIndicatorColor: "§7",
            stateColumns: 1,
            tagColumns: 1,
            familyColumns: 1
        }),
        components: Object.freeze({
            namespace: VisibilityPolicies.Show,
            customFields: VisibilityPolicies.Show,
            customEnergyInfo: VisibilityPolicies.Show,
            customRotationInfo: VisibilityPolicies.Show,
            customMachineProgress: VisibilityPolicies.Show,
            customVariantPreview: VisibilityPolicies.Show,
            blockStates: VisibilityPolicies.Show,
            blockTags: VisibilityPolicies.ShowWhenSneaking,
            health: VisibilityPolicies.Show,
            absorption: VisibilityPolicies.Show,
            armor: VisibilityPolicies.Show,
            hunger: VisibilityPolicies.Show,
            hungerEffect: VisibilityPolicies.Show,
            airBubbles: VisibilityPolicies.Show,
            effects: VisibilityPolicies.Show,
            effectHearts: VisibilityPolicies.Show,
            frozenHearts: VisibilityPolicies.Show,
            animalHearts: VisibilityPolicies.Show,
            entityScoreboards: VisibilityPolicies.Show,
            tameable: VisibilityPolicies.Show,
            tameFoods: VisibilityPolicies.Show,
            technical: VisibilityPolicies.ShowWhenSneaking,
            coordinates: VisibilityPolicies.ShowWhenSneaking,
            typeId: VisibilityPolicies.ShowWhenSneaking,
            entityTags: VisibilityPolicies.ShowWhenSneaking,
            entityFamilies: VisibilityPolicies.ShowWhenSneaking,
            velocity: VisibilityPolicies.ShowWhenSneaking,
            namespaceResolution: VisibilityPolicies.Hide
        })
    }),
    [InsightModes.Debug]: Object.freeze({
        label: "Debug",
        runtime: Object.freeze({
            maxDistance: 12,
            updateIntervalTicks: 1,
            unchangedTargetRefreshTicks: 6,
            includeLiquidBlocks: true,
            includeInvisibleEntities: true,
            clearAfterNoTargetTicks: 40,
            maxVisibleStates: 12,
            maxVisibleBlockTags: 12,
            maxVisibleEntityTags: 12,
            maxVisibleEntityFamilies: 12,
            maxVisibleEffects: 8,
            maxHeartDisplayHealth: 100,
            effectDisplayMode: EffectDisplayModes.Emoji,
            displayStyle: DisplayStyles.Icon,
            nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
            nameResolveMode: EntityNameResolveModes.TranslationKeys,
            villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
            toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
            toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
            toolIndicatorColor: "§7",
            stateColumns: 2,
            tagColumns: 2,
            familyColumns: 2
        }),
        components: Object.freeze({
            namespace: VisibilityPolicies.Show,
            customFields: VisibilityPolicies.Show,
            customEnergyInfo: VisibilityPolicies.Show,
            customRotationInfo: VisibilityPolicies.Show,
            customMachineProgress: VisibilityPolicies.Show,
            customVariantPreview: VisibilityPolicies.Show,
            blockStates: VisibilityPolicies.Show,
            blockTags: VisibilityPolicies.Show,
            health: VisibilityPolicies.Show,
            absorption: VisibilityPolicies.Show,
            armor: VisibilityPolicies.Show,
            hunger: VisibilityPolicies.Show,
            hungerEffect: VisibilityPolicies.Show,
            airBubbles: VisibilityPolicies.Show,
            effects: VisibilityPolicies.Show,
            effectHearts: VisibilityPolicies.Show,
            frozenHearts: VisibilityPolicies.Show,
            animalHearts: VisibilityPolicies.Show,
            entityScoreboards: VisibilityPolicies.Show,
            tameable: VisibilityPolicies.Show,
            tameFoods: VisibilityPolicies.Show,
            technical: VisibilityPolicies.Show,
            coordinates: VisibilityPolicies.Show,
            typeId: VisibilityPolicies.Show,
            entityTags: VisibilityPolicies.Show,
            entityFamilies: VisibilityPolicies.Show,
            velocity: VisibilityPolicies.Show,
            namespaceResolution: VisibilityPolicies.Show
        })
    })
});

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    return InsightModePresets[normalized] ? normalized : InsightConfig.system.defaultMode;
}

export function normalizeEffectDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of EffectDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return EffectDisplayModes.Emoji;
}

export function getEffectDisplayModeIndex(mode) {
    const normalized = normalizeEffectDisplayMode(mode);
    const index = EffectDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeDisplayStyle(style) {
    const normalized = String(style || "").trim().toLowerCase();

    if (normalized === DisplayStyles.Text) {
        return DisplayStyles.TextFull;
    }

    for (const option of DisplayStyleLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return DisplayStyles.Icon;
}

export function getDisplayStyleIndex(style) {
    const normalized = normalizeDisplayStyle(style);
    const index = DisplayStyleLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeEntityNameDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of EntityNameDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return EntityNameDisplayModes.NicknameFirst;
}

export function getEntityNameDisplayModeIndex(mode) {
    const normalized = normalizeEntityNameDisplayMode(mode);
    const index = EntityNameDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeEntityNameResolveMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of EntityNameResolveModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return EntityNameResolveModes.TranslationKeys;
}

export function getEntityNameResolveModeIndex(mode) {
    const normalized = normalizeEntityNameResolveMode(mode);
    const index = EntityNameResolveModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeVillagerProfessionDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of VillagerProfessionDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return VillagerProfessionDisplayModes.BelowName;
}

export function getVillagerProfessionDisplayModeIndex(mode) {
    const normalized = normalizeVillagerProfessionDisplayMode(mode);
    const index = VillagerProfessionDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeToolTierIndicatorMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of ToolTierIndicatorModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return ToolTierIndicatorModes.BooleanIndicator;
}

export function getToolTierIndicatorModeIndex(mode) {
    const normalized = normalizeToolTierIndicatorMode(mode);
    const index = ToolTierIndicatorModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeToolIndicatorPlacementMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of ToolIndicatorPlacementModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return ToolIndicatorPlacementModes.BeforeName;
}

export function getToolIndicatorPlacementModeIndex(mode) {
    const normalized = normalizeToolIndicatorPlacementMode(mode);
    const index = ToolIndicatorPlacementModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeToolIndicatorColor(colorCode) {
    const normalized = String(colorCode || "").trim().toLowerCase();
    for (const option of ToolIndicatorColorOptions) {
        if (option.key.toLowerCase() === normalized) {
            return option.key;
        }
    }

    return "§7";
}

export function getToolIndicatorColorIndex(colorCode) {
    const normalized = normalizeToolIndicatorColor(colorCode);
    const index = ToolIndicatorColorOptions.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeVisibilityPolicy(policy) {
    const normalized = String(policy || "").trim().toLowerCase();
    for (const option of VisibilityPolicyLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return VisibilityPolicies.Show;
}

export function getVisibilityPolicyIndex(policy) {
    const normalized = normalizeVisibilityPolicy(policy);
    const index = VisibilityPolicyLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

function safeReadWorldDynamicProperty(key) {
    try {
        return world.getDynamicProperty(key);
    } catch {
        return undefined;
    }
}

function safeWriteWorldDynamicProperty(key, value) {
    try {
        world.setDynamicProperty(key, value);
        return true;
    } catch {
        return false;
    }
}

function safeReadPlayerDynamicProperty(player, key) {
    try {
        return player.getDynamicProperty(key);
    } catch {
        return undefined;
    }
}

function safeWritePlayerDynamicProperty(player, key, value) {
    try {
        player.setDynamicProperty(key, value);
        return true;
    } catch {
        return false;
    }
}

function normalizeRuntime(runtimeCandidate, presetRuntime) {
    const runtime = runtimeCandidate && typeof runtimeCandidate === "object" ? runtimeCandidate : {};

    return {
        maxDistance: clamp(
            Number.isFinite(runtime.maxDistance) ? runtime.maxDistance : presetRuntime.maxDistance,
            InsightConfig.system.minMaxDistance,
            InsightConfig.system.maxMaxDistance
        ),
        updateIntervalTicks: clamp(
            Number.isFinite(runtime.updateIntervalTicks) ? runtime.updateIntervalTicks : presetRuntime.updateIntervalTicks,
            InsightConfig.system.minUpdateIntervalTicks,
            InsightConfig.system.maxUpdateIntervalTicks
        ),
        unchangedTargetRefreshTicks: clamp(
            Number.isFinite(runtime.unchangedTargetRefreshTicks)
                ? runtime.unchangedTargetRefreshTicks
                : presetRuntime.unchangedTargetRefreshTicks,
            InsightConfig.system.minUnchangedTargetRefreshTicks,
            InsightConfig.system.maxUnchangedTargetRefreshTicks
        ),
        includeLiquidBlocks: typeof runtime.includeLiquidBlocks === "boolean"
            ? runtime.includeLiquidBlocks
            : presetRuntime.includeLiquidBlocks,
        includeInvisibleEntities: typeof runtime.includeInvisibleEntities === "boolean"
            ? runtime.includeInvisibleEntities
            : presetRuntime.includeInvisibleEntities,
        clearAfterNoTargetTicks: clamp(
            Number.isFinite(runtime.clearAfterNoTargetTicks) ? runtime.clearAfterNoTargetTicks : presetRuntime.clearAfterNoTargetTicks,
            InsightConfig.system.minClearAfterNoTargetTicks,
            InsightConfig.system.maxClearAfterNoTargetTicks
        ),
        maxVisibleStates: clamp(
            Number.isFinite(runtime.maxVisibleStates) ? runtime.maxVisibleStates : presetRuntime.maxVisibleStates,
            0,
            InsightConfig.system.maxVisibleStatesCap
        ),
        maxVisibleBlockTags: clamp(
            Number.isFinite(runtime.maxVisibleBlockTags) ? runtime.maxVisibleBlockTags : presetRuntime.maxVisibleBlockTags,
            0,
            InsightConfig.system.maxVisibleTagsCap
        ),
        maxVisibleEntityTags: clamp(
            Number.isFinite(runtime.maxVisibleEntityTags) ? runtime.maxVisibleEntityTags : presetRuntime.maxVisibleEntityTags,
            0,
            InsightConfig.system.maxVisibleTagsCap
        ),
        maxVisibleEntityFamilies: clamp(
            Number.isFinite(runtime.maxVisibleEntityFamilies) ? runtime.maxVisibleEntityFamilies : presetRuntime.maxVisibleEntityFamilies,
            0,
            InsightConfig.system.maxVisibleFamiliesCap
        ),
        maxVisibleEffects: clamp(
            Number.isFinite(runtime.maxVisibleEffects) ? runtime.maxVisibleEffects : presetRuntime.maxVisibleEffects,
            0,
            InsightConfig.system.maxVisibleEffectsCap
        ),
        maxHeartDisplayHealth: clamp(
            Number.isFinite(runtime.maxHeartDisplayHealth) ? runtime.maxHeartDisplayHealth : presetRuntime.maxHeartDisplayHealth,
            InsightConfig.system.minMaxHeartDisplayHealth,
            InsightConfig.system.maxMaxHeartDisplayHealth
        ),
        effectDisplayMode: normalizeEffectDisplayMode(runtime.effectDisplayMode ?? presetRuntime.effectDisplayMode),
        displayStyle: normalizeDisplayStyle(runtime.displayStyle ?? presetRuntime.displayStyle),
        nameDisplayMode: normalizeEntityNameDisplayMode(runtime.nameDisplayMode ?? presetRuntime.nameDisplayMode),
        nameResolveMode: normalizeEntityNameResolveMode(runtime.nameResolveMode ?? presetRuntime.nameResolveMode),
        villagerProfessionDisplay: normalizeVillagerProfessionDisplayMode(
            runtime.villagerProfessionDisplay ?? presetRuntime.villagerProfessionDisplay
        ),
        toolTierIndicatorMode: normalizeToolTierIndicatorMode(runtime.toolTierIndicatorMode ?? presetRuntime.toolTierIndicatorMode),
        toolIndicatorPlacement: normalizeToolIndicatorPlacementMode(
            runtime.toolIndicatorPlacement ?? presetRuntime.toolIndicatorPlacement
        ),
        toolIndicatorColor: normalizeToolIndicatorColor(
            runtime.toolIndicatorColor ?? presetRuntime.toolIndicatorColor
        ),
        stateColumns: clamp(
            Number.isFinite(runtime.stateColumns) ? runtime.stateColumns : presetRuntime.stateColumns,
            1,
            InsightConfig.system.maxLayoutColumns
        ),
        tagColumns: clamp(
            Number.isFinite(runtime.tagColumns) ? runtime.tagColumns : presetRuntime.tagColumns,
            1,
            InsightConfig.system.maxLayoutColumns
        ),
        familyColumns: clamp(
            Number.isFinite(runtime.familyColumns) ? runtime.familyColumns : presetRuntime.familyColumns,
            1,
            InsightConfig.system.maxLayoutColumns
        )
    };
}

function normalizeComponents(componentCandidate, presetComponents) {
    const components = componentCandidate && typeof componentCandidate === "object" ? componentCandidate : {};
    const normalized = {};

    for (const definition of InsightComponentDefinitions) {
        const rawValue = components[definition.key];
        const resolvedPolicy = rawValue ? normalizeVisibilityPolicy(rawValue) : presetComponents[definition.key];
        normalized[definition.key] = isInsightComponentDeprecated(definition.key)
            ? VisibilityPolicies.Hide
            : resolvedPolicy;
    }

    return normalized;
}

function normalizePlayerOverrides(rawCandidate, preset) {
    const raw = rawCandidate && typeof rawCandidate === "object" ? rawCandidate : {};
    const modeOverride = raw.modeOverride ? normalizeMode(raw.modeOverride) : undefined;
    const disabled = typeof raw.disabled === "boolean" ? raw.disabled : false;

    return {
        modeOverride,
        disabled,
        runtime: normalizeRuntime(raw.runtime, preset.runtime),
        components: normalizeComponents(raw.components, preset.components)
    };
}

function getMemoryPlayerOverrides(player) {
    const key = player.id || player.name;
    if (!memoryFallback.playerSettings.has(key)) {
        memoryFallback.playerSettings.set(key, undefined);
    }
    return memoryFallback.playerSettings.get(key);
}

function setMemoryPlayerOverrides(player, overrides) {
    const key = player.id || player.name;
    memoryFallback.playerSettings.set(key, overrides);
}

export function getCurrentMode() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_MODE_DYNAMIC_PROPERTY);
    if (typeof storedValue === "string") {
        const normalized = normalizeMode(storedValue);
        memoryFallback.mode = normalized;
        return normalized;
    }

    return memoryFallback.mode;
}

export function setCurrentMode(mode) {
    const normalized = normalizeMode(mode);
    memoryFallback.mode = normalized;
    safeWriteWorldDynamicProperty(WORLD_MODE_DYNAMIC_PROPERTY, normalized);
    return normalized;
}

export function isInsightGloballyEnabled() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_ENABLED_DYNAMIC_PROPERTY);
    if (typeof storedValue === "boolean") {
        memoryFallback.enabled = storedValue;
        return storedValue;
    }

    return memoryFallback.enabled;
}

export function setInsightGlobalEnabled(isEnabled) {
    const normalized = Boolean(isEnabled);
    memoryFallback.enabled = normalized;
    safeWriteWorldDynamicProperty(WORLD_ENABLED_DYNAMIC_PROPERTY, normalized);
    return normalized;
}

export function getModePreset(mode) {
    const normalized = normalizeMode(mode);
    return InsightModePresets[normalized];
}

export function getCurrentModeLabel() {
    const mode = getCurrentMode();
    return getModePreset(mode).label;
}

export function getPlayerOverrides(player, mode) {
    const activeMode = normalizeMode(mode || getCurrentMode());
    const preset = getModePreset(activeMode);
    const memoryValue = getMemoryPlayerOverrides(player);

    const stored = safeReadPlayerDynamicProperty(player, PLAYER_SETTINGS_DYNAMIC_PROPERTY);
    if (typeof stored === "string") {
        try {
            const parsed = JSON.parse(stored);
            const normalized = normalizePlayerOverrides(parsed, preset);
            setMemoryPlayerOverrides(player, normalized);
            return normalized;
        } catch {
            // Fallback to memory/default values.
        }
    }

    if (memoryValue) {
        return normalizePlayerOverrides(memoryValue, preset);
    }

    const defaults = normalizePlayerOverrides({}, preset);
    setMemoryPlayerOverrides(player, defaults);
    return defaults;
}

function persistPlayerOverrides(player, overrides) {
    setMemoryPlayerOverrides(player, overrides);
    const serialized = JSON.stringify(overrides);
    safeWritePlayerDynamicProperty(player, PLAYER_SETTINGS_DYNAMIC_PROPERTY, serialized);
}

export function updatePlayerOverrides(player, patch) {
    const mode = getCurrentMode();
    const preset = getModePreset(mode);
    const current = getPlayerOverrides(player, mode);

    const merged = {
        modeOverride: patch?.modeOverride !== undefined
            ? (patch.modeOverride ? normalizeMode(patch.modeOverride) : undefined)
            : current.modeOverride,
        disabled: patch?.disabled !== undefined ? Boolean(patch.disabled) : current.disabled,
        runtime: {
            ...current.runtime,
            ...(patch?.runtime || {})
        },
        components: {
            ...current.components,
            ...(patch?.components || {})
        }
    };

    const normalized = normalizePlayerOverrides(merged, preset);
    persistPlayerOverrides(player, normalized);
    return normalized;
}

export function resetPlayerOverrides(player) {
    const mode = getCurrentMode();
    const preset = getModePreset(mode);
    const defaults = normalizePlayerOverrides({}, preset);
    persistPlayerOverrides(player, defaults);
    return defaults;
}

export function setPlayerActivation(player, isActive) {
    return updatePlayerOverrides(player, { disabled: !isActive });
}

function isCreativePlayer(player) {
    try {
        if (typeof player.isInCreative === "function") {
            return Boolean(player.isInCreative());
        }

        if (typeof player.isInCreative === "boolean") {
            return player.isInCreative;
        }
    } catch {
        // Ignore extension errors.
    }

    try {
        if (typeof player.getGameMode === "function") {
            const rawMode = player.getGameMode();
            if (typeof rawMode === "string") {
                return rawMode.toLowerCase() === "creative";
            }

            if (rawMode && typeof rawMode === "object") {
                const modeId = rawMode.id ?? rawMode.value;
                if (typeof modeId === "string") {
                    return modeId.toLowerCase() === "creative";
                }
            }

            return String(rawMode).toLowerCase() === "creative";
        }
    } catch {
        // Fallback below.
    }

    return false;
}

function isPlayerSneaking(player) {
    try {
        if (typeof player.isSneaking === "function") {
            return Boolean(player.isSneaking());
        }

        if (typeof player.isSneaking === "boolean") {
            return player.isSneaking;
        }
    } catch {
        // Ignore extension errors.
    }

    return false;
}

function evaluateVisibilityPolicy(policy, context) {
    const normalized = normalizeVisibilityPolicy(policy);

    switch (normalized) {
        case VisibilityPolicies.Show:
            return true;
        case VisibilityPolicies.ShowWhenSneaking:
            return context.isSneaking;
        case VisibilityPolicies.CreativeOnly:
            return context.isCreative;
        case VisibilityPolicies.Hide:
        default:
            return false;
    }
}

export function getPlayerDisplaySettings(player) {
    const tags = new Set(player.getTags ? player.getTags() : []);
    const isSneaking = isPlayerSneaking(player);
    const isCreative = isCreativePlayer(player);
    const globalEnabled = isInsightGloballyEnabled();

    const globalMode = getCurrentMode();
    const overrides = getPlayerOverrides(player, globalMode);
    const activeMode = normalizeMode(overrides.modeOverride || globalMode);
    const preset = getModePreset(activeMode);

    const runtime = normalizeRuntime(overrides.runtime, preset.runtime);
    const components = normalizeComponents(overrides.components, preset.components);

    // Legacy compatibility via tags.
    if (tags.has(InsightConfig.playerTags.hideNamespace)) {
        components.namespace = VisibilityPolicies.Hide;
    }
    if (tags.has(InsightConfig.playerTags.hideHealth)) {
        components.health = VisibilityPolicies.Hide;
    }
    if (tags.has(InsightConfig.playerTags.technicalView)) {
        components.technical = VisibilityPolicies.Show;
    }
    if (tags.has(InsightConfig.playerTags.blockTags)) {
        components.blockTags = VisibilityPolicies.Show;
    }
    if (tags.has(InsightConfig.playerTags.hideBlockTags)) {
        components.blockTags = VisibilityPolicies.Hide;
    }
    if (tags.has(InsightConfig.playerTags.namespaceDebug)) {
        components.namespaceResolution = VisibilityPolicies.Show;
    }

    const visibilityContext = { isSneaking, isCreative };

    return {
        mode: activeMode,
        modeLabel: preset.label,
        globalEnabled,
        disabled: !globalEnabled || overrides.disabled || tags.has(InsightConfig.playerTags.disabled),
        requireSneak: tags.has(InsightConfig.playerTags.sneakOnly),
        isSneaking,
        isCreative,
        runtime,
        components,
        maxDistance: runtime.maxDistance,
        updateIntervalTicks: runtime.updateIntervalTicks,
        unchangedTargetRefreshTicks: runtime.unchangedTargetRefreshTicks,
        includeLiquidBlocks: runtime.includeLiquidBlocks,
        includeInvisibleEntities: runtime.includeInvisibleEntities,
        clearAfterNoTargetTicks: runtime.clearAfterNoTargetTicks,
        maxVisibleStates: runtime.maxVisibleStates,
        maxVisibleBlockTags: runtime.maxVisibleBlockTags,
        maxVisibleEntityTags: runtime.maxVisibleEntityTags,
        maxVisibleEntityFamilies: runtime.maxVisibleEntityFamilies,
        maxVisibleEffects: runtime.maxVisibleEffects,
        maxHeartDisplayHealth: runtime.maxHeartDisplayHealth,
        effectDisplayMode: runtime.effectDisplayMode,
        displayStyle: runtime.displayStyle,
        nameDisplayMode: runtime.nameDisplayMode,
        nameResolveMode: runtime.nameResolveMode,
        villagerProfessionDisplay: runtime.villagerProfessionDisplay,
        toolTierIndicatorMode: runtime.toolTierIndicatorMode,
        toolIndicatorPlacement: runtime.toolIndicatorPlacement,
        toolIndicatorColor: runtime.toolIndicatorColor,
        stateColumns: runtime.stateColumns,
        tagColumns: runtime.tagColumns,
        familyColumns: runtime.familyColumns,
        showNamespace: evaluateVisibilityPolicy(components.namespace, visibilityContext),
        showCustomFields: evaluateVisibilityPolicy(components.customFields, visibilityContext),
        showCustomEnergyInfo: evaluateVisibilityPolicy(components.customEnergyInfo, visibilityContext),
        showCustomRotationInfo: evaluateVisibilityPolicy(components.customRotationInfo, visibilityContext),
        showCustomMachineProgress: evaluateVisibilityPolicy(components.customMachineProgress, visibilityContext),
        showCustomVariantPreview: evaluateVisibilityPolicy(components.customVariantPreview, visibilityContext),
        showBlockStates: evaluateVisibilityPolicy(components.blockStates, visibilityContext),
        showBlockTags: evaluateVisibilityPolicy(components.blockTags, visibilityContext),
        showHealth: evaluateVisibilityPolicy(components.health, visibilityContext),
        showAbsorption: evaluateVisibilityPolicy(components.absorption, visibilityContext),
        showArmor: evaluateVisibilityPolicy(components.armor, visibilityContext),
        showHunger: evaluateVisibilityPolicy(components.hunger, visibilityContext),
        showHungerEffect: evaluateVisibilityPolicy(components.hungerEffect, visibilityContext),
        showAirBubbles: evaluateVisibilityPolicy(components.airBubbles, visibilityContext),
        showEffects: evaluateVisibilityPolicy(components.effects, visibilityContext),
        showEffectHearts: evaluateVisibilityPolicy(components.effectHearts, visibilityContext),
        showFrozenHearts: false,
        showAnimalHearts: evaluateVisibilityPolicy(components.animalHearts, visibilityContext),
        showEntityScoreboards: evaluateVisibilityPolicy(components.entityScoreboards, visibilityContext),
        showTameable: evaluateVisibilityPolicy(components.tameable, visibilityContext),
        showTameFoods: evaluateVisibilityPolicy(components.tameFoods, visibilityContext),
        showTechnicalData: evaluateVisibilityPolicy(components.technical, visibilityContext),
        showCoordinates: evaluateVisibilityPolicy(components.coordinates, visibilityContext),
        showTypeId: evaluateVisibilityPolicy(components.typeId, visibilityContext),
        showEntityTags: evaluateVisibilityPolicy(components.entityTags, visibilityContext),
        showEntityFamilies: evaluateVisibilityPolicy(components.entityFamilies, visibilityContext),
        showVelocity: evaluateVisibilityPolicy(components.velocity, visibilityContext),
        showNamespaceResolutionDebug: evaluateVisibilityPolicy(components.namespaceResolution, visibilityContext)
    };
}
