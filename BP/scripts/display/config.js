import { world } from "@minecraft/server";

const WORLD_MODE_DYNAMIC_PROPERTY = "insight:mode";
const WORLD_ENABLED_DYNAMIC_PROPERTY = "insight:enabled";
const WORLD_ADMIN_ONLY_DYNAMIC_PROPERTY = "insight:admin_only";
const WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY = "insight:admin_source_id";
const WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY = "insight:admin_source_name";
const PLAYER_SETTINGS_DYNAMIC_PROPERTY = "insight:player_settings";

const memoryFallback = {
    mode: "essential",
    enabled: true,
    adminOnly: false,
    adminSourceId: "",
    adminSourceName: "",
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
    SneakingAndCreative: "sneak_creative",
    Hide: "hide"
});

export const VisibilityPolicyLabels = Object.freeze([
    Object.freeze({ key: VisibilityPolicies.Show, label: "Show / Mostrar" }),
    Object.freeze({ key: VisibilityPolicies.ShowWhenSneaking, label: "Show When Sneaking / Mostrar Agachado" }),
    Object.freeze({ key: VisibilityPolicies.CreativeOnly, label: "Creative Only / Apenas Criativo" }),
    Object.freeze({ key: VisibilityPolicies.SneakingAndCreative, label: "Sneaking + Creative / Agachado + Criativo" }),
    Object.freeze({ key: VisibilityPolicies.Hide, label: "Hide / Ocultar" })
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
    IconValue: "icon_value",
    Text: "text", // Legacy alias, normalized to text_full.
    TextFull: "text_full",
    TextPercent: "text_percent",
    HybridFull: "hybrid_full",
    HybridPercent: "hybrid_percent"
});

export const DisplayStyleLabels = Object.freeze([
    Object.freeze({ key: DisplayStyles.Icon, label: "Icon" }),
    Object.freeze({ key: DisplayStyles.IconValue, label: "Icon + Value (❤️ x/y)" }),
    Object.freeze({ key: DisplayStyles.TextFull, label: "Text Type 1 (Health: x/y)" }),
    Object.freeze({ key: DisplayStyles.TextPercent, label: "Text Type 2 (Health: x%)" }),
    Object.freeze({ key: DisplayStyles.HybridFull, label: "Hybrid Type 1 (❤️ x/y)" }),
    Object.freeze({ key: DisplayStyles.HybridPercent, label: "Hybrid Type 2 (❤️ x%)" })
]);

export const HudDisplayModes = Object.freeze({
    ShowInsight: "show_insight",
    Both: "both",
    ShowVanilla: "show_vanilla",
    None: "none"
});

export const HudDisplayModeLabels = Object.freeze([
    Object.freeze({ key: HudDisplayModes.ShowInsight, label: "Show Insight" }),
    Object.freeze({ key: HudDisplayModes.Both, label: "Both" }),
    Object.freeze({ key: HudDisplayModes.ShowVanilla, label: "Show Vanilla" }),
    Object.freeze({ key: HudDisplayModes.None, label: "None" })
]);

export const HudIndicatorModes = Object.freeze({
    Hidden: "hidden",
    IconAndIndicator: "icon_and_indicator"
});

export const HudIndicatorModeLabels = Object.freeze([
    Object.freeze({ key: HudIndicatorModes.Hidden, label: "Hidden" }),
    Object.freeze({ key: HudIndicatorModes.IconAndIndicator, label: "Icon + Indicator" })
]);

export const ModePresetSummaryModes = Object.freeze({
    Hidden: "hidden",
    Summary: "summary",
    SummaryAndChanged: "summary_and_changed",
    ChangedOnly: "changed_only"
});

export const ModePresetSummaryModeLabels = Object.freeze([
    Object.freeze({ key: ModePresetSummaryModes.Hidden, label: "Hidden" }),
    Object.freeze({ key: ModePresetSummaryModes.Summary, label: "Show Enabled Summary" }),
    Object.freeze({ key: ModePresetSummaryModes.SummaryAndChanged, label: "Show Summary + Changed" }),
    Object.freeze({ key: ModePresetSummaryModes.ChangedOnly, label: "Show Changed Only" })
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
    TextIndicator: "text_indicator",
    IconAndIndicator: "icon_and_indicator"
});

export const ToolTierIndicatorModeLabels = Object.freeze([
    Object.freeze({ key: ToolTierIndicatorModes.Hidden, label: "Hidden" }),
    Object.freeze({ key: ToolTierIndicatorModes.BooleanIndicator, label: "Boolean Indicator (Yes/No)" }),
    Object.freeze({ key: ToolTierIndicatorModes.TierIndicatorColor, label: "Tier Indicator (Color)" }),
    Object.freeze({ key: ToolTierIndicatorModes.TierIndicatorOre, label: "Tier Indicator (Ore)" }),
    Object.freeze({ key: ToolTierIndicatorModes.TextIndicator, label: "Text Indicator (Diamond)" }),
    Object.freeze({ key: ToolTierIndicatorModes.IconAndIndicator, label: "Tool + Indicator" })
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
    Object.freeze({ key: "customFluidInfo", label: "Custom: Fluid Info" }),
    Object.freeze({ key: "customGasInfo", label: "Custom: Gas Info" }),
    Object.freeze({ key: "customRotationInfo", label: "UtilityCraft: Rotation Info" }),
    Object.freeze({ key: "customMachineProgress", label: "UtilityCraft: Machine Progress" }),
    Object.freeze({ key: "customCobblestoneCount", label: "UtilityCraft: Cobblestone Count" }),
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
            maxVisibleStates: 3,
            maxVisibleBlockTags: 3,
            maxVisibleEntityTags: 0,
            maxVisibleEntityFamilies: 0,
            maxVisibleEffects: 3,
            maxHeartDisplayHealth: 100,
            effectDisplayMode: EffectDisplayModes.Emoji,
            displayStyle: DisplayStyles.Icon,
            healthDisplayStyle: DisplayStyles.Icon,
            hungerDisplayStyle: DisplayStyles.Icon,
            armorDisplayStyle: DisplayStyles.Icon,
            absorptionDisplayStyle: DisplayStyles.Icon,
            airDisplayStyle: DisplayStyles.Icon,
            nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
            nameResolveMode: EntityNameResolveModes.TranslationKeys,
            villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
            toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
            toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
            toolIndicatorColor: "§7",
            modePresetSummaryMode: ModePresetSummaryModes.SummaryAndChanged,
            hudHealthVisibilityMode: HudDisplayModes.ShowVanilla,
            hudHungerVisibilityMode: HudDisplayModes.ShowVanilla,
            hudSaturationVisibilityMode: HudDisplayModes.ShowVanilla,
            hudToughnessVisibilityMode: HudDisplayModes.ShowVanilla,
            hudHealthIndicatorMode: HudIndicatorModes.IconAndIndicator,
            hudHungerIndicatorMode: HudIndicatorModes.IconAndIndicator,
            stateColumns: 1,
            tagColumns: 1,
            familyColumns: 1
        }),
        components: Object.freeze({
            namespace: VisibilityPolicies.Show,
            customFields: VisibilityPolicies.Show,
            customEnergyInfo: VisibilityPolicies.Show,
            customFluidInfo: VisibilityPolicies.Show,
            customGasInfo: VisibilityPolicies.Show,
            customRotationInfo: VisibilityPolicies.ShowWhenSneaking,
            customMachineProgress: VisibilityPolicies.ShowWhenSneaking,
            customCobblestoneCount: VisibilityPolicies.Show,
            customVariantPreview: VisibilityPolicies.ShowWhenSneaking,
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
            healthDisplayStyle: DisplayStyles.Icon,
            hungerDisplayStyle: DisplayStyles.Icon,
            armorDisplayStyle: DisplayStyles.Icon,
            absorptionDisplayStyle: DisplayStyles.Icon,
            airDisplayStyle: DisplayStyles.Icon,
            nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
            nameResolveMode: EntityNameResolveModes.TranslationKeys,
            villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
            toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
            toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
            toolIndicatorColor: "§7",
            modePresetSummaryMode: ModePresetSummaryModes.SummaryAndChanged,
            hudHealthVisibilityMode: HudDisplayModes.ShowVanilla,
            hudHungerVisibilityMode: HudDisplayModes.ShowVanilla,
            hudSaturationVisibilityMode: HudDisplayModes.Both,
            hudToughnessVisibilityMode: HudDisplayModes.Both,
            hudHealthIndicatorMode: HudIndicatorModes.IconAndIndicator,
            hudHungerIndicatorMode: HudIndicatorModes.IconAndIndicator,
            stateColumns: 1,
            tagColumns: 1,
            familyColumns: 1
        }),
        components: Object.freeze({
            namespace: VisibilityPolicies.Show,
            customFields: VisibilityPolicies.Show,
            customEnergyInfo: VisibilityPolicies.Show,
            customFluidInfo: VisibilityPolicies.Show,
            customGasInfo: VisibilityPolicies.Show,
            customRotationInfo: VisibilityPolicies.Show,
            customMachineProgress: VisibilityPolicies.Show,
            customCobblestoneCount: VisibilityPolicies.Show,
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
            healthDisplayStyle: DisplayStyles.Icon,
            hungerDisplayStyle: DisplayStyles.Icon,
            armorDisplayStyle: DisplayStyles.Icon,
            absorptionDisplayStyle: DisplayStyles.Icon,
            airDisplayStyle: DisplayStyles.Icon,
            nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
            nameResolveMode: EntityNameResolveModes.TranslationKeys,
            villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
            toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
            toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
            toolIndicatorColor: "§7",
            modePresetSummaryMode: ModePresetSummaryModes.SummaryAndChanged,
            hudHealthVisibilityMode: HudDisplayModes.Both,
            hudHungerVisibilityMode: HudDisplayModes.Both,
            hudSaturationVisibilityMode: HudDisplayModes.Both,
            hudToughnessVisibilityMode: HudDisplayModes.Both,
            hudHealthIndicatorMode: HudIndicatorModes.IconAndIndicator,
            hudHungerIndicatorMode: HudIndicatorModes.IconAndIndicator,
            stateColumns: 2,
            tagColumns: 2,
            familyColumns: 2
        }),
        components: Object.freeze({
            namespace: VisibilityPolicies.Show,
            customFields: VisibilityPolicies.Show,
            customEnergyInfo: VisibilityPolicies.Show,
            customFluidInfo: VisibilityPolicies.Show,
            customGasInfo: VisibilityPolicies.Show,
            customRotationInfo: VisibilityPolicies.Show,
            customMachineProgress: VisibilityPolicies.Show,
            customCobblestoneCount: VisibilityPolicies.Show,
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

export function normalizeHudDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of HudDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return HudDisplayModes.Both;
}

export function getHudDisplayModeIndex(mode) {
    const normalized = normalizeHudDisplayMode(mode);
    const index = HudDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeHudIndicatorMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of HudIndicatorModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return HudIndicatorModes.IconAndIndicator;
}

export function getHudIndicatorModeIndex(mode) {
    const normalized = normalizeHudIndicatorMode(mode);
    const index = HudIndicatorModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeModePresetSummaryMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of ModePresetSummaryModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return ModePresetSummaryModes.SummaryAndChanged;
}

export function getModePresetSummaryModeIndex(mode) {
    const normalized = normalizeModePresetSummaryMode(mode);
    const index = ModePresetSummaryModeLabels.findIndex((option) => option.key === normalized);
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

    if (
        normalized === "sneaking_creative"
        || normalized === "creative_sneak"
        || normalized === "creative_sneaking"
        || normalized === "sneak+creative"
    ) {
        return VisibilityPolicies.SneakingAndCreative;
    }

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
        healthDisplayStyle: normalizeDisplayStyle(runtime.healthDisplayStyle ?? presetRuntime.healthDisplayStyle),
        hungerDisplayStyle: normalizeDisplayStyle(runtime.hungerDisplayStyle ?? presetRuntime.hungerDisplayStyle),
        armorDisplayStyle: normalizeDisplayStyle(runtime.armorDisplayStyle ?? presetRuntime.armorDisplayStyle),
        absorptionDisplayStyle: normalizeDisplayStyle(runtime.absorptionDisplayStyle ?? presetRuntime.absorptionDisplayStyle),
        airDisplayStyle: normalizeDisplayStyle(runtime.airDisplayStyle ?? presetRuntime.airDisplayStyle),
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
        modePresetSummaryMode: normalizeModePresetSummaryMode(
            runtime.modePresetSummaryMode ?? presetRuntime.modePresetSummaryMode
        ),
        hudHealthVisibilityMode: normalizeHudDisplayMode(
            runtime.hudHealthVisibilityMode ?? presetRuntime.hudHealthVisibilityMode
        ),
        hudHungerVisibilityMode: normalizeHudDisplayMode(
            runtime.hudHungerVisibilityMode ?? presetRuntime.hudHungerVisibilityMode
        ),
        hudSaturationVisibilityMode: normalizeHudDisplayMode(
            runtime.hudSaturationVisibilityMode ?? presetRuntime.hudSaturationVisibilityMode
        ),
        hudToughnessVisibilityMode: normalizeHudDisplayMode(
            runtime.hudToughnessVisibilityMode ?? presetRuntime.hudToughnessVisibilityMode
        ),
        hudHealthIndicatorMode: normalizeHudIndicatorMode(
            runtime.hudHealthIndicatorMode ?? presetRuntime.hudHealthIndicatorMode
        ),
        hudHungerIndicatorMode: normalizeHudIndicatorMode(
            runtime.hudHungerIndicatorMode ?? presetRuntime.hudHungerIndicatorMode
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

export function isAdminPlayer(player) {
    if (!player) {
        return false;
    }

    try {
        if (typeof player.isOp === "function") {
            return Boolean(player.isOp());
        }
    } catch {
        // Ignore extension errors.
    }

    try {
        if (typeof player.isOp === "boolean") {
            return player.isOp;
        }
    } catch {
        // Ignore extension errors.
    }

    try {
        if (typeof player.hasTag === "function" && player.hasTag("insight:admin")) {
            return true;
        }
    } catch {
        // Ignore tag read errors.
    }

    return false;
}

export function isAdminOnlyGlobalProfileEnabled() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_ADMIN_ONLY_DYNAMIC_PROPERTY);
    if (typeof storedValue === "boolean") {
        memoryFallback.adminOnly = storedValue;
        return storedValue;
    }

    return memoryFallback.adminOnly;
}

export function getAdminGlobalProfileSourceId() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY);
    if (typeof storedValue === "string") {
        memoryFallback.adminSourceId = storedValue;
        return storedValue;
    }

    return memoryFallback.adminSourceId;
}

export function getAdminGlobalProfileSourceName() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY);
    if (typeof storedValue === "string") {
        memoryFallback.adminSourceName = storedValue;
        return storedValue;
    }

    return memoryFallback.adminSourceName;
}

function findPlayerByIdOrName(playerId, playerName) {
    const expectedId = String(playerId || "").trim();
    const expectedName = String(playerName || "").trim().toLowerCase();

    for (const onlinePlayer of world.getAllPlayers()) {
        if (expectedId.length && onlinePlayer.id === expectedId) {
            return onlinePlayer;
        }

        if (expectedName.length && String(onlinePlayer.name || "").toLowerCase() === expectedName) {
            return onlinePlayer;
        }
    }

    return undefined;
}

function findFirstOnlineAdmin() {
    for (const onlinePlayer of world.getAllPlayers()) {
        if (isAdminPlayer(onlinePlayer)) {
            return onlinePlayer;
        }
    }

    return undefined;
}

export function resolveAdminGlobalProfileSourcePlayer() {
    const sourceId = getAdminGlobalProfileSourceId();
    const sourceName = getAdminGlobalProfileSourceName();
    const explicitSource = findPlayerByIdOrName(sourceId, sourceName);
    if (explicitSource) {
        return explicitSource;
    }

    return findFirstOnlineAdmin();
}

export function setAdminOnlyGlobalProfileEnabled(isEnabled, sourcePlayer) {
    const normalized = Boolean(isEnabled);
    memoryFallback.adminOnly = normalized;
    safeWriteWorldDynamicProperty(WORLD_ADMIN_ONLY_DYNAMIC_PROPERTY, normalized);

    if (!normalized) {
        memoryFallback.adminSourceId = "";
        memoryFallback.adminSourceName = "";
        safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY, "");
        safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY, "");
        return normalized;
    }

    const source = sourcePlayer || resolveAdminGlobalProfileSourcePlayer();
    const sourceId = String(source?.id || "").trim();
    const sourceName = String(source?.name || "").trim();

    memoryFallback.adminSourceId = sourceId;
    memoryFallback.adminSourceName = sourceName;
    safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY, sourceId);
    safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY, sourceName);

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
        case VisibilityPolicies.SneakingAndCreative:
            return context.isSneaking && context.isCreative;
        case VisibilityPolicies.Hide:
        default:
            return false;
    }
}

function isHudInsightVisible(mode) {
    const normalized = normalizeHudDisplayMode(mode);
    return normalized === HudDisplayModes.ShowInsight || normalized === HudDisplayModes.Both;
}

function isHudVanillaVisible(mode) {
    const normalized = normalizeHudDisplayMode(mode);
    return normalized === HudDisplayModes.ShowVanilla || normalized === HudDisplayModes.Both;
}

export function getPlayerDisplaySettings(player) {
    const tags = new Set(player.getTags ? player.getTags() : []);
    const isSneaking = isPlayerSneaking(player);
    const isCreative = isCreativePlayer(player);
    const globalEnabled = isInsightGloballyEnabled();
    const adminOnlyGlobalProfile = isAdminOnlyGlobalProfileEnabled();
    const adminSourcePlayer = adminOnlyGlobalProfile ? resolveAdminGlobalProfileSourcePlayer() : undefined;
    const adminSourceName = adminSourcePlayer?.name || getAdminGlobalProfileSourceName();

    const globalMode = getCurrentMode();
    const localOverrides = getPlayerOverrides(player, globalMode);
    const activeOverrides = adminOnlyGlobalProfile && adminSourcePlayer
        ? getPlayerOverrides(adminSourcePlayer, globalMode)
        : localOverrides;
    const activeMode = normalizeMode(activeOverrides.modeOverride || globalMode);
    const preset = getModePreset(activeMode);

    const runtime = normalizeRuntime(activeOverrides.runtime, preset.runtime);
    const components = normalizeComponents(activeOverrides.components, preset.components);
    const showHudHealthInsight = isHudInsightVisible(runtime.hudHealthVisibilityMode);
    const showHudHungerInsight = isHudInsightVisible(runtime.hudHungerVisibilityMode);
    const showHudSaturationInsight = isHudInsightVisible(runtime.hudSaturationVisibilityMode);
    const showHudToughnessInsight = isHudInsightVisible(runtime.hudToughnessVisibilityMode);
    const showHudHealthVanilla = isHudVanillaVisible(runtime.hudHealthVisibilityMode);
    const showHudHungerVanilla = isHudVanillaVisible(runtime.hudHungerVisibilityMode)
        && isHudVanillaVisible(runtime.hudSaturationVisibilityMode);
    const showHudArmorVanilla = isHudVanillaVisible(runtime.hudToughnessVisibilityMode);
    const hudHealthIndicatorEnabled = showHudHealthInsight
        && runtime.hudHealthIndicatorMode === HudIndicatorModes.IconAndIndicator;
    const hudHungerIndicatorEnabled = showHudHungerInsight
        && runtime.hudHungerIndicatorMode === HudIndicatorModes.IconAndIndicator;

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
        adminOnlyGlobalProfile,
        adminGlobalProfileSourceName: adminSourceName,
        disabled: !globalEnabled
            || (adminOnlyGlobalProfile && adminSourcePlayer ? false : localOverrides.disabled)
            || tags.has(InsightConfig.playerTags.disabled),
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
        healthDisplayStyle: runtime.healthDisplayStyle,
        hungerDisplayStyle: runtime.hungerDisplayStyle,
        armorDisplayStyle: runtime.armorDisplayStyle,
        absorptionDisplayStyle: runtime.absorptionDisplayStyle,
        airDisplayStyle: runtime.airDisplayStyle,
        nameDisplayMode: runtime.nameDisplayMode,
        nameResolveMode: runtime.nameResolveMode,
        villagerProfessionDisplay: runtime.villagerProfessionDisplay,
        toolTierIndicatorMode: runtime.toolTierIndicatorMode,
        toolIndicatorPlacement: runtime.toolIndicatorPlacement,
        toolIndicatorColor: runtime.toolIndicatorColor,
        modePresetSummaryMode: runtime.modePresetSummaryMode,
        hudHealthVisibilityMode: runtime.hudHealthVisibilityMode,
        hudHungerVisibilityMode: runtime.hudHungerVisibilityMode,
        hudSaturationVisibilityMode: runtime.hudSaturationVisibilityMode,
        hudToughnessVisibilityMode: runtime.hudToughnessVisibilityMode,
        hudHealthIndicatorMode: runtime.hudHealthIndicatorMode,
        hudHungerIndicatorMode: runtime.hudHungerIndicatorMode,
        showHudHealthInsight,
        showHudHungerInsight,
        showHudSaturationInsight,
        showHudToughnessInsight,
        showHudHealthVanilla,
        showHudHungerVanilla,
        showHudArmorVanilla,
        hudHealthIndicatorEnabled,
        hudHungerIndicatorEnabled,
        showSaturation: showHudSaturationInsight,
        showExhaustion: showHudSaturationInsight,
        showToughness: showHudToughnessInsight,
        showExtraArmor: showHudToughnessInsight,
        stateColumns: runtime.stateColumns,
        tagColumns: runtime.tagColumns,
        familyColumns: runtime.familyColumns,
        showNamespace: evaluateVisibilityPolicy(components.namespace, visibilityContext),
        showCustomFields: evaluateVisibilityPolicy(components.customFields, visibilityContext),
        showCustomEnergyInfo: evaluateVisibilityPolicy(components.customEnergyInfo, visibilityContext),
        showCustomFluidInfo: evaluateVisibilityPolicy(components.customFluidInfo, visibilityContext),
        showCustomGasInfo: evaluateVisibilityPolicy(components.customGasInfo, visibilityContext),
        showCustomRotationInfo: evaluateVisibilityPolicy(components.customRotationInfo, visibilityContext),
        showCustomMachineProgress: evaluateVisibilityPolicy(components.customMachineProgress, visibilityContext),
        showCustomCobblestoneCount: evaluateVisibilityPolicy(components.customCobblestoneCount, visibilityContext),
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
