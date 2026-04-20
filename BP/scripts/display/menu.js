import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import {
    DisplayStyleLabels,
    EntityNameDisplayModeLabels,
    EntityNameResolveModeLabels,
    EffectDisplayModeLabels,
    HudDisplayModeLabels,
    HudDurabilityDisplayModeLabels,
    HudDurabilityPositionModeLabels,
    HudElementOrientationModeLabels,
    HudElementPositionModeLabels,
    HudInventoryDisplayModeLabels,
    HudIndicatorModeLabels,
    HudQuickCounterModeLabels,
    InsightComponentDefinitions,
    InsightConfig,
    InsightModes,
    NamespaceDisplayModeLabels,
    ModePresetSummaryModeLabels,
    ToolIndicatorColorOptions,
    ToolIndicatorPlacementModeLabels,
    ToolTierIndicatorModeLabels,
    VisibilityPolicyLabels,
    WailaAnchorModeLabels,
    WailaColorThemeLabels,
    WailaHorizontalOffsetModeLabels,
    WailaVerticalOffsetModeLabels,
    VillagerProfessionDisplayModeLabels,
    getCurrentMode,
    getDisplayStyleIndex,
    getEntityNameDisplayModeIndex,
    getEntityNameResolveModeIndex,
    getEffectDisplayModeIndex,
    getHudDisplayModeIndex,
    getHudDurabilityDisplayModeIndex,
    getHudDurabilityPositionModeIndex,
    getHudElementOrientationModeIndex,
    getHudElementPositionModeIndex,
    getHudInventoryDisplayModeIndex,
    getHudIndicatorModeIndex,
    getHudQuickCounterModeIndex,
    getModePreset,
    getModePresetSummaryModeIndex,
    getNamespaceDisplayModeIndex,
    getPlayerDisplaySettings,
    getWailaAnchorModeIndex,
    getWailaColorThemeIndex,
    getWailaOffsetModeIndex,
    isAdminPlayer,
    getToolIndicatorColorIndex,
    getToolIndicatorPlacementModeIndex,
    getToolTierIndicatorModeIndex,
    getVisibilityPolicyIndex,
    getVillagerProfessionDisplayModeIndex,
    isInsightComponentDeprecated,
    normalizeVisibilityPolicy,
    resetPlayerOverrides,
    setAdminOnlyGlobalProfileEnabled,
    setCurrentMode,
    setInsightGlobalEnabled,
    setPlayerActivation,
    updatePlayerOverrides
} from "./config.js";
import {
    NamespaceRegistrationSources,
    getRegisteredNamespaceEntries,
    registerNamespaceAlias,
    resetRegisteredNamespaceEntries
} from "./namespaceInjection.js";

const modeSequence = [InsightModes.Essential, InsightModes.Detailed, InsightModes.Debug];

const customComponentKeySet = new Set([
    "customFields",
    "customEnergyInfo",
    "customRotationInfo",
    "customMachineProgress",
    "customVariantPreview"
]);

const stateMessageFallbackLabels = Object.freeze({
    "ui.dorios.insight.value.active": "Active",
    "ui.dorios.insight.value.enabled": "Enabled",
    "ui.dorios.insight.value.disabled": "Disabled"
});

const namespaceRegistrationSourceFallbackLabels = Object.freeze({
    [NamespaceRegistrationSources.Script]: "Scripts",
    [NamespaceRegistrationSources.Command]: "Commands",
    all: "All"
});

const normalizeRawMessageArg = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    if (typeof value === "object") {
        return value;
    }

    return String(value);
};

const normalizeRawtextArray = (value) => {
    if (value === undefined || value === null) {
        return [];
    }

    if (typeof value === "object") {
        if (Array.isArray(value.rawtext)) {
            return value.rawtext;
        }

        return [value];
    }

    return [{ text: String(value) }];
};

const tr = (key, withArgs = []) => ({
    translate: key,
    with: withArgs.map(normalizeRawMessageArg)
});

function getLocalizedOption(option) {
    if (!option) {
        return "";
    }

    return option.labelKey ? tr(option.labelKey) : option.label || "";
}

function getLocalizedOptions(options) {
    return options.map((option) => getLocalizedOption(option));
}

function getLocalizedOptionByValue(options, value, fallbackIndex = 0) {
    const normalized = String(value || "").toLowerCase();
    const option = options.find((entry) => String(entry?.key || "").toLowerCase() === normalized) || options[fallbackIndex];
    return option?.label || "";
}

function getLocalizedToolIndicatorColor(colorCode) {
    const normalized = String(colorCode || "").toLowerCase();
    const option = ToolIndicatorColorOptions.find((entry) => entry.key.toLowerCase() === normalized) || ToolIndicatorColorOptions[0];
    return option?.label || ToolIndicatorColorOptions[0].label;
}

function getStateMessage(isEnabled, enabledKey = "ui.dorios.insight.value.enabled", disabledKey = "ui.dorios.insight.value.disabled") {
    const key = isEnabled ? enabledKey : disabledKey;
    return stateMessageFallbackLabels[key] || String(key || "");
}

function getModeMessage(mode) {
    return getModeLabel(mode);
}

function getModeLabel(mode) {
    return getModePreset(mode)?.label || String(mode || "");
}

function getPolicyLabel(policy) {
    const normalized = normalizeVisibilityPolicy(policy);
    const option = VisibilityPolicyLabels.find((entry) => entry.key === normalized);
    return option?.label || VisibilityPolicyLabels[0].label;
}

function getDisplayStyleLabel(style) {
    const normalized = String(style || "").toLowerCase();
    const option = DisplayStyleLabels.find((entry) => entry.key === normalized);
    return option?.label || DisplayStyleLabels[0].label;
}

function getEffectModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = EffectDisplayModeLabels.find((entry) => entry.key === normalized);
    return option?.label || EffectDisplayModeLabels[0].label;
}

function getEntityNameDisplayModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = EntityNameDisplayModeLabels.find((entry) => entry.key === normalized);
    return option?.label || EntityNameDisplayModeLabels[0].label;
}

function getEntityNameResolveModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = EntityNameResolveModeLabels.find((entry) => entry.key === normalized);
    return option?.label || EntityNameResolveModeLabels[0].label;
}

function getVillagerProfessionDisplayModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = VillagerProfessionDisplayModeLabels.find((entry) => entry.key === normalized);
    return option?.label || VillagerProfessionDisplayModeLabels[0].label;
}

function getToolTierIndicatorModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = ToolTierIndicatorModeLabels.find((entry) => entry.key === normalized);
    return option?.label || ToolTierIndicatorModeLabels[0].label;
}

function getToolIndicatorPlacementModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = ToolIndicatorPlacementModeLabels.find((entry) => entry.key === normalized);
    return option?.label || ToolIndicatorPlacementModeLabels[0].label;
}

function getToolIndicatorColorLabel(colorCode) {
    const normalized = String(colorCode || "").toLowerCase();
    const option = ToolIndicatorColorOptions.find((entry) => entry.key.toLowerCase() === normalized);
    return option?.label || ToolIndicatorColorOptions[0].label;
}

function getModePresetSummaryModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = ModePresetSummaryModeLabels.find((entry) => entry.key === normalized);
    return option?.label || ModePresetSummaryModeLabels[0].label;
}

function getHudDisplayModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = HudDisplayModeLabels.find((entry) => entry.key === normalized);
    return option?.label || HudDisplayModeLabels[0].label;
}

function getHudIndicatorModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = HudIndicatorModeLabels.find((entry) => entry.key === normalized);
    return option?.label || HudIndicatorModeLabels[0].label;
}

function getHudElementPositionModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = HudElementPositionModeLabels.find((entry) => entry.key === normalized);
    return option?.label || HudElementPositionModeLabels[0].label;
}

function getHudInventoryDisplayModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = HudInventoryDisplayModeLabels.find((entry) => entry.key === normalized);
    return option?.label || HudInventoryDisplayModeLabels[0].label;
}

function getHudElementOrientationModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = HudElementOrientationModeLabels.find((entry) => entry.key === normalized);
    return option?.label || HudElementOrientationModeLabels[0].label;
}

function getHudDurabilityDisplayModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = HudDurabilityDisplayModeLabels.find((entry) => entry.key === normalized);
    return option?.label || HudDurabilityDisplayModeLabels[0].label;
}

function getHudDurabilityPositionModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = HudDurabilityPositionModeLabels.find((entry) => entry.key === normalized);
    return option?.label || HudDurabilityPositionModeLabels[0].label;
}

function getHudQuickCounterModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = HudQuickCounterModeLabels.find((entry) => entry.key === normalized);
    return option?.label || HudQuickCounterModeLabels[0].label;
}

function getWailaColorThemeLabel(theme) {
    const normalized = String(theme || "").toLowerCase();
    const option = WailaColorThemeLabels.find((entry) => entry.key === normalized);
    return option?.label || WailaColorThemeLabels[0].label;
}

function getWailaAnchorModeLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = WailaAnchorModeLabels.find((entry) => entry.key === normalized);
    return option?.label || WailaAnchorModeLabels[0].label;
}

function getWailaHorizontalOffsetLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = WailaHorizontalOffsetModeLabels.find((entry) => entry.key === normalized);
    return option?.label || WailaHorizontalOffsetModeLabels[0].label;
}

function getWailaVerticalOffsetLabel(mode) {
    const normalized = String(mode || "").toLowerCase();
    const option = WailaVerticalOffsetModeLabels.find((entry) => entry.key === normalized);
    return option?.label || WailaVerticalOffsetModeLabels[0].label;
}

function getStateLabel(isEnabled, enabledLabel = "Enabled", disabledLabel = "Disabled") {
    return isEnabled ? enabledLabel : disabledLabel;
}

function buildSectionLabel(labelKey) {
    return tr(labelKey);
}

function resolveCustomNumberInput(rawValue, fallback, min, max) {
    const text = String(rawValue ?? "").trim();
    if (!text.length) {
        return fallback;
    }

    const numeric = Number(text);
    if (!Number.isFinite(numeric)) {
        return fallback;
    }

    return Math.max(min, Math.min(max, numeric));
}

function getProviderNamesForComponent(componentKey) {
    try {
        const api = globalThis.InsightCustomFields;
        if (!api || typeof api.getProvidersByComponent !== "function") {
            return [];
        }

        const providerNames = api.getProvidersByComponent(componentKey);
        if (!Array.isArray(providerNames)) {
            return [];
        }

        return providerNames
            .filter((name) => typeof name === "string")
            .map((name) => name.trim())
            .filter((name) => name.length > 0);
    } catch {
        return [];
    }
}

function toSnakeCase(value) {
    return String(value || "")
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .toLowerCase();
}

function getComponentLocalizationKey(componentKey, suffix) {
    const keySegment = toSnakeCase(componentKey);
    return `ui.dorios.insight.component.${keySegment}.${suffix}`;
}

function buildComponentLabelRawtext(component, providerNames, isDeprecated) {
    const baseLabel = {
        translate: getComponentLocalizationKey(component.key, "label")
    };

    const parts = [baseLabel];

    if (isDeprecated) {
        parts.push({
            translate: "ui.dorios.insight.component.deprecated_suffix"
        });
    }

    if (providerNames.length) {
        parts.push({
            text: ` (${providerNames.join(", ")})`
        });
    }

    return parts.length > 1 ? { rawtext: parts } : baseLabel;
}

function buildComponentDescriptionRawtext(component) {
    return {
        translate: getComponentLocalizationKey(component.key, "description")
    };
}

function buildComponentDropdownLabel(componentTitle, componentDescription, currentPolicyLabel) {
    const titleParts = normalizeRawtextArray(componentTitle);
    const descriptionParts = normalizeRawtextArray(componentDescription);

    return {
        rawtext: [
            ...titleParts,
            { text: "\n§j" },
            ...descriptionParts,
            { text: "\n" },
            {
                translate: "ui.dorios.insight.components.current",
                with: [currentPolicyLabel]
            }
        ]
    };
}

function getComponentOptionTitle(component) {
    const providerNames = getProviderNamesForComponent(component.key);
    const isDeprecated = isInsightComponentDeprecated(component.key);
    return buildComponentLabelRawtext(component, providerNames, isDeprecated);
}

function sendPlayerMessage(player, message) {
    try {
        player.sendMessage(message);
    } catch {
        // Ignore message delivery errors.
    }
}

function appendLimitedRows(target, rows, limit = 10) {
    const cappedRows = rows.slice(0, limit);
    target.push(...cappedRows);

    const remaining = rows.length - cappedRows.length;
    if (remaining > 0) {
        target.push(`- ... +${remaining} more`);
    }
}

function getModeRank(mode) {
    if (mode === InsightModes.Debug) {
        return 2;
    }

    if (mode === InsightModes.Detailed) {
        return 1;
    }

    return 0;
}

function countEnabledComponents(components) {
    let count = 0;

    for (const definition of InsightComponentDefinitions) {
        const policy = normalizeVisibilityPolicy(components?.[definition.key]);
        if (policy !== "hide") {
            count += 1;
        }
    }

    return count;
}

function buildModeSummaryMessage(previousMode, nextMode, modeSummarySetting) {
    const summaryMode = String(modeSummarySetting || "").toLowerCase();
    if (summaryMode === "hidden") {
        return "";
    }

    const previousPreset = getModePreset(previousMode);
    const nextPreset = getModePreset(nextMode);
    if (!previousPreset || !nextPreset) {
        return "";
    }

    const isDowngrade = getModeRank(nextMode) < getModeRank(previousMode);
    const enableRows = [];
    const changedRows = [];
    const removedRows = [];
    const runtimeFields = [
        { key: "maxDistance", label: "Range" },
        { key: "updateIntervalTicks", label: "Update Interval" },
        { key: "linkedEntityScanIntervalTicks", label: "Linked Entity Scan Interval" },
        { key: "linkedEntityScanMaxDistance", label: "Linked Entity Scan Distance" },
        { key: "maxVisibleStates", label: "Block States Limit" },
        { key: "maxVisibleBlockTags", label: "Block Tags Limit" },
        { key: "maxVisibleEntityTags", label: "Entity Tags Limit" },
        { key: "maxVisibleEntityFamilies", label: "Entity Families Limit" },
        { key: "maxVisibleEffects", label: "Effects Limit" },
        { key: "displayStyle", label: "Display Style" },
        { key: "toolTierIndicatorMode", label: "Tool Indicator" },
        { key: "includeLiquidBlocks", label: "Include Liquid Blocks" },
        { key: "includeInvisibleEntities", label: "Include Invisible Entities" },
        { key: "ignoreMachineHelperEntities", label: "Ignore Machine Helper Entities" }
    ];

    for (const definition of InsightComponentDefinitions) {
        const componentLabel = definition.label || definition.key;
        const previousPolicy = normalizeVisibilityPolicy(previousPreset.components?.[definition.key]);
        const nextPolicy = normalizeVisibilityPolicy(nextPreset.components?.[definition.key]);

        if (nextPolicy !== "hide") {
            enableRows.push(`- ${componentLabel}`);
        }

        if (previousPolicy === nextPolicy) {
            continue;
        }

        if (previousPolicy !== "hide" && nextPolicy === "hide") {
            removedRows.push(`- ${componentLabel}`);
            continue;
        }

        changedRows.push(`- ${componentLabel}: ${getPolicyLabel(previousPolicy)} > ${getPolicyLabel(nextPolicy)}`);
    }

    for (const runtimeField of runtimeFields) {
        const previousValue = previousPreset.runtime?.[runtimeField.key];
        const nextValue = nextPreset.runtime?.[runtimeField.key];
        if (previousValue === nextValue) {
            continue;
        }

        const formatValue = (value) => {
            if (runtimeField.key === "displayStyle") {
                return getDisplayStyleLabel(value);
            }

            if (runtimeField.key === "toolTierIndicatorMode") {
                return getToolTierIndicatorModeLabel(value);
            }

            if (typeof value === "boolean") {
                return value ? "Enabled" : "Disabled";
            }

            return String(value);
        };

        changedRows.push(`- ${runtimeField.label}: ${formatValue(previousValue)} > ${formatValue(nextValue)}`);
    }

    const lines = [`§a${getModeLabel(nextMode)} Mode Selected!`];

    const includeEnableSummary = !isDowngrade && (
        summaryMode === "summary"
        || summaryMode === "summary_and_changed"
    );
    const includeChanged = isDowngrade
        || summaryMode === "changed_only"
        || summaryMode === "summary_and_changed";

    if (includeEnableSummary) {
        lines.push("§7Enable:");
        if (enableRows.length) {
            appendLimitedRows(lines, enableRows);
        } else {
            lines.push("- None");
        }
    }

    if (includeChanged) {
        lines.push("§3Changed:");
        if (changedRows.length) {
            appendLimitedRows(lines, changedRows);
        } else {
            lines.push("- None");
        }

        if (removedRows.length) {
            lines.push("§cRemoved:");
            appendLimitedRows(lines, removedRows);
        }
    }

    return lines.join("\n");
}

async function showModeMenu(player) {
    const currentMode = getCurrentMode();

    const form = new ActionFormData()
        .title(tr("ui.dorios.insight.mode_menu.title"))
        .body(tr("ui.dorios.insight.mode_menu.body", [getModeMessage(currentMode)]));

    for (const mode of modeSequence) {
        const preset = getModePreset(mode);
        const runtime = preset.runtime;
        const enabledComponentCount = countEnabledComponents(preset.components);

        form.button(
            tr("ui.dorios.insight.mode_menu.option", [
                getModeMessage(mode),
                runtime.maxDistance,
                runtime.updateIntervalTicks,
                enabledComponentCount,
                runtime.maxVisibleStates,
                runtime.maxVisibleBlockTags
            ])
        );
    }

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    const selectedMode = modeSequence[result.selection ?? 0] || currentMode;
    const previousMode = currentMode;
    const appliedMode = setCurrentMode(selectedMode);

    sendPlayerMessage(
        player,
        tr("ui.dorios.insight.feedback.mode_set", [getModeMessage(appliedMode)])
    );

    const nextSettings = getPlayerDisplaySettings(player);
    const summaryMessage = buildModeSummaryMessage(
        previousMode,
        appliedMode,
        nextSettings.modePresetSummaryMode
    );

    if (summaryMessage.length) {
        sendPlayerMessage(player, summaryMessage);
    }
}

async function showComponentGroupMenu(player, componentGroup) {
    const settings = getPlayerDisplaySettings(player);
    const visibilityLabels = getLocalizedOptions(VisibilityPolicyLabels);

    const form = new ModalFormData()
        .title(tr(componentGroup.titleKey));

    for (const component of componentGroup.components) {
        const currentPolicy = settings.components[component.key];
        const componentTitle = getComponentOptionTitle(component);
        const componentDescription = buildComponentDescriptionRawtext(component);
        const currentPolicyLabel = getLocalizedOptionByValue(VisibilityPolicyLabels, currentPolicy);
        const dropdownLabel = buildComponentDropdownLabel(
            componentTitle,
            componentDescription,
            currentPolicyLabel
        );

        form.dropdown(
            dropdownLabel,
            visibilityLabels,
            {
                defaultValueIndex: getVisibilityPolicyIndex(currentPolicy)
            }
        );
    }

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    const nextPolicies = {};
    const ignoredDeprecated = [];

    for (let index = 0; index < componentGroup.components.length; index++) {
        const component = componentGroup.components[index];
        if (isInsightComponentDeprecated(component.key)) {
            ignoredDeprecated.push(component.label);
            continue;
        }

        const selectedIndex = Number(result.formValues[index] ?? 0);
        const selectedOption = VisibilityPolicyLabels[selectedIndex] || VisibilityPolicyLabels[0];
        nextPolicies[component.key] = normalizeVisibilityPolicy(selectedOption.key);
    }

    updatePlayerOverrides(player, {
        components: nextPolicies
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.components_updated"));

    if (ignoredDeprecated.length) {
        sendPlayerMessage(player, tr("ui.dorios.insight.feedback.deprecated_ignored", [ignoredDeprecated.join(", ")]));
    }
}

async function showComponentGroupWithRuntimeMenu(player, componentGroup) {
    const settings = getPlayerDisplaySettings(player);
    const visibilityLabels = getLocalizedOptions(VisibilityPolicyLabels);
    const runtimeFieldKeys = Array.isArray(componentGroup.runtimeFields) ? componentGroup.runtimeFields : [];

    const runtimeFieldMap = {
        maxVisibleStates: {
            min: 0,
            max: InsightConfig.system.maxVisibleStatesCap,
            labelKey: "ui.dorios.insight.runtime.visible_block_states"
        },
        maxVisibleBlockTags: {
            min: 0,
            max: InsightConfig.system.maxVisibleTagsCap,
            labelKey: "ui.dorios.insight.runtime.visible_block_tags"
        },
        maxVisibleEntityTags: {
            min: 0,
            max: InsightConfig.system.maxVisibleTagsCap,
            labelKey: "ui.dorios.insight.runtime.visible_entity_tags"
        },
        maxVisibleEntityFamilies: {
            min: 0,
            max: InsightConfig.system.maxVisibleFamiliesCap,
            labelKey: "ui.dorios.insight.runtime.visible_entity_families"
        },
        stateColumns: {
            min: 1,
            max: InsightConfig.system.maxLayoutColumns,
            labelKey: "ui.dorios.insight.system_menu.state_columns"
        },
        tagColumns: {
            min: 1,
            max: InsightConfig.system.maxLayoutColumns,
            labelKey: "ui.dorios.insight.system_menu.tag_columns"
        },
        familyColumns: {
            min: 1,
            max: InsightConfig.system.maxLayoutColumns,
            labelKey: "ui.dorios.insight.system_menu.family_columns"
        }
    };

    const runtimeFields = runtimeFieldKeys
        .map((key) => ({ key, ...(runtimeFieldMap[key] || {}) }))
        .filter((field) => field.labelKey);

    const form = new ModalFormData()
        .title(tr(componentGroup.titleKey));

    for (const component of componentGroup.components) {
        const currentPolicy = settings.components[component.key];
        const componentTitle = getComponentOptionTitle(component);
        const componentDescription = buildComponentDescriptionRawtext(component);
        const currentPolicyLabel = getLocalizedOptionByValue(VisibilityPolicyLabels, currentPolicy);
        const dropdownLabel = buildComponentDropdownLabel(
            componentTitle,
            componentDescription,
            currentPolicyLabel
        );

        form.dropdown(
            dropdownLabel,
            visibilityLabels,
            {
                defaultValueIndex: getVisibilityPolicyIndex(currentPolicy)
            }
        );
    }

    for (const field of runtimeFields) {
        const currentValue = Number(settings.runtime?.[field.key] ?? field.min);
        form.slider(
            tr(field.labelKey, [currentValue]),
            field.min,
            field.max,
            { defaultValue: currentValue }
        );
    }

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    const nextPolicies = {};
    const ignoredDeprecated = [];

    for (let index = 0; index < componentGroup.components.length; index++) {
        const component = componentGroup.components[index];
        if (isInsightComponentDeprecated(component.key)) {
            ignoredDeprecated.push(component.label);
            continue;
        }

        const selectedIndex = Number(result.formValues[index] ?? 0);
        const selectedOption = VisibilityPolicyLabels[selectedIndex] || VisibilityPolicyLabels[0];
        nextPolicies[component.key] = normalizeVisibilityPolicy(selectedOption.key);
    }

    const nextRuntime = {};
    for (let fieldIndex = 0; fieldIndex < runtimeFields.length; fieldIndex++) {
        const field = runtimeFields[fieldIndex];
        const formIndex = componentGroup.components.length + fieldIndex;
        nextRuntime[field.key] = resolveCustomNumberInput(
            result.formValues[formIndex],
            settings.runtime?.[field.key] ?? field.min,
            field.min,
            field.max
        );
    }

    updatePlayerOverrides(player, {
        components: nextPolicies,
        runtime: nextRuntime
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.components_updated"));

    if (ignoredDeprecated.length) {
        sendPlayerMessage(player, tr("ui.dorios.insight.feedback.deprecated_ignored", [ignoredDeprecated.join(", ")]));
    }
}

async function showStyleMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    const styleOptions = getLocalizedOptions(DisplayStyleLabels);
    const effectModeOptions = getLocalizedOptions(EffectDisplayModeLabels);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.style_menu.title"))
        .dropdown(
            tr("ui.dorios.insight.style_menu.display_style", [getLocalizedOptionByValue(DisplayStyleLabels, runtime.displayStyle)]),
            styleOptions,
            {
                defaultValueIndex: getDisplayStyleIndex(runtime.displayStyle)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.effect_mode", [getLocalizedOptionByValue(EffectDisplayModeLabels, runtime.effectDisplayMode)]),
            effectModeOptions,
            {
                defaultValueIndex: getEffectDisplayModeIndex(runtime.effectDisplayMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.health_style", [getLocalizedOptionByValue(DisplayStyleLabels, runtime.healthDisplayStyle)]),
            styleOptions,
            {
                defaultValueIndex: getDisplayStyleIndex(runtime.healthDisplayStyle)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.hunger_style", [getLocalizedOptionByValue(DisplayStyleLabels, runtime.hungerDisplayStyle)]),
            styleOptions,
            {
                defaultValueIndex: getDisplayStyleIndex(runtime.hungerDisplayStyle)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.armor_style", [getLocalizedOptionByValue(DisplayStyleLabels, runtime.armorDisplayStyle)]),
            styleOptions,
            {
                defaultValueIndex: getDisplayStyleIndex(runtime.armorDisplayStyle)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.absorption_style", [getLocalizedOptionByValue(DisplayStyleLabels, runtime.absorptionDisplayStyle)]),
            styleOptions,
            {
                defaultValueIndex: getDisplayStyleIndex(runtime.absorptionDisplayStyle)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.air_style", [getLocalizedOptionByValue(DisplayStyleLabels, runtime.airDisplayStyle)]),
            styleOptions,
            {
                defaultValueIndex: getDisplayStyleIndex(runtime.airDisplayStyle)
            }
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    const formValues = result.formValues;

    updatePlayerOverrides(player, {
        runtime: {
            displayStyle: DisplayStyleLabels[Number(formValues[0] ?? 0)]?.key ?? runtime.displayStyle,
            effectDisplayMode: EffectDisplayModeLabels[Number(formValues[1] ?? 0)]?.key ?? runtime.effectDisplayMode,
            healthDisplayStyle: DisplayStyleLabels[Number(formValues[2] ?? 0)]?.key ?? runtime.healthDisplayStyle,
            hungerDisplayStyle: DisplayStyleLabels[Number(formValues[3] ?? 0)]?.key ?? runtime.hungerDisplayStyle,
            armorDisplayStyle: DisplayStyleLabels[Number(formValues[4] ?? 0)]?.key ?? runtime.armorDisplayStyle,
            absorptionDisplayStyle: DisplayStyleLabels[Number(formValues[5] ?? 0)]?.key ?? runtime.absorptionDisplayStyle,
            airDisplayStyle: DisplayStyleLabels[Number(formValues[6] ?? 0)]?.key ?? runtime.airDisplayStyle
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.style_updated"));
}

async function showHudBarsMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;
    const hudDisplayOptions = getLocalizedOptions(HudDisplayModeLabels);
    const hudIndicatorOptions = getLocalizedOptions(HudIndicatorModeLabels);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.hud_menu.title"))
        .dropdown(
            tr("ui.dorios.insight.hud_menu.health_visibility", [getLocalizedOptionByValue(HudDisplayModeLabels, runtime.hudHealthVisibilityMode)]),
            hudDisplayOptions,
            {
                defaultValueIndex: getHudDisplayModeIndex(runtime.hudHealthVisibilityMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_menu.health_indicator", [getLocalizedOptionByValue(HudIndicatorModeLabels, runtime.hudHealthIndicatorMode)]),
            hudIndicatorOptions,
            {
                defaultValueIndex: getHudIndicatorModeIndex(runtime.hudHealthIndicatorMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_menu.hunger_visibility", [getLocalizedOptionByValue(HudDisplayModeLabels, runtime.hudHungerVisibilityMode)]),
            hudDisplayOptions,
            {
                defaultValueIndex: getHudDisplayModeIndex(runtime.hudHungerVisibilityMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_menu.hunger_indicator", [getLocalizedOptionByValue(HudIndicatorModeLabels, runtime.hudHungerIndicatorMode)]),
            hudIndicatorOptions,
            {
                defaultValueIndex: getHudIndicatorModeIndex(runtime.hudHungerIndicatorMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_menu.saturation_visibility", [getLocalizedOptionByValue(HudDisplayModeLabels, runtime.hudSaturationVisibilityMode)]),
            hudDisplayOptions,
            {
                defaultValueIndex: getHudDisplayModeIndex(runtime.hudSaturationVisibilityMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_menu.toughness_visibility", [getLocalizedOptionByValue(HudDisplayModeLabels, runtime.hudToughnessVisibilityMode)]),
            hudDisplayOptions,
            {
                defaultValueIndex: getHudDisplayModeIndex(runtime.hudToughnessVisibilityMode)
            }
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    const formValues = result.formValues;

    updatePlayerOverrides(player, {
        runtime: {
            hudHealthVisibilityMode: HudDisplayModeLabels[Number(formValues[0] ?? 0)]?.key
                ?? runtime.hudHealthVisibilityMode,
            hudHealthIndicatorMode: HudIndicatorModeLabels[Number(formValues[1] ?? 0)]?.key
                ?? runtime.hudHealthIndicatorMode,
            hudHungerVisibilityMode: HudDisplayModeLabels[Number(formValues[2] ?? 0)]?.key
                ?? runtime.hudHungerVisibilityMode,
            hudHungerIndicatorMode: HudIndicatorModeLabels[Number(formValues[3] ?? 0)]?.key
                ?? runtime.hudHungerIndicatorMode,
            hudSaturationVisibilityMode: HudDisplayModeLabels[Number(formValues[4] ?? 0)]?.key
                ?? runtime.hudSaturationVisibilityMode,
            hudToughnessVisibilityMode: HudDisplayModeLabels[Number(formValues[5] ?? 0)]?.key
                ?? runtime.hudToughnessVisibilityMode
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.hud_updated"));
}

async function showHudInventorySettingsMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    const hudElementPositionOptions = getLocalizedOptions(HudElementPositionModeLabels);
    const hudInventoryDisplayOptions = getLocalizedOptions(HudInventoryDisplayModeLabels);
    const hudElementOrientationOptions = getLocalizedOptions(HudElementOrientationModeLabels);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.hud_elements_menu.title"))
        .label(buildSectionLabel("ui.dorios.insight.hud_elements_menu.section.inventory"))
        .toggle(
            tr("ui.dorios.insight.hud_menu.inventory_hud", [getStateMessage(runtime.hudInventoryEnabled)]),
            { defaultValue: Boolean(runtime.hudInventoryEnabled) }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_elements_menu.inventory_position", [getLocalizedOptionByValue(HudElementPositionModeLabels, runtime.hudInventoryPosition)]),
            hudElementPositionOptions,
            {
                defaultValueIndex: getHudElementPositionModeIndex(runtime.hudInventoryPosition)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_elements_menu.inventory_display_mode", [getLocalizedOptionByValue(HudInventoryDisplayModeLabels, runtime.hudInventoryDisplayMode)]),
            hudInventoryDisplayOptions,
            {
                defaultValueIndex: getHudInventoryDisplayModeIndex(runtime.hudInventoryDisplayMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_elements_menu.inventory_orientation", [getLocalizedOptionByValue(HudElementOrientationModeLabels, runtime.hudInventoryOrientation)]),
            hudElementOrientationOptions,
            {
                defaultValueIndex: getHudElementOrientationModeIndex(runtime.hudInventoryOrientation)
            }
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            hudInventoryEnabled: Boolean(result.formValues[0] ?? runtime.hudInventoryEnabled),
            hudInventoryPosition: HudElementPositionModeLabels[Number(result.formValues[1] ?? 0)]?.key
                ?? runtime.hudInventoryPosition,
            hudInventoryDisplayMode: HudInventoryDisplayModeLabels[Number(result.formValues[2] ?? 0)]?.key
                ?? runtime.hudInventoryDisplayMode,
            hudInventoryOrientation: HudElementOrientationModeLabels[Number(result.formValues[3] ?? 0)]?.key
                ?? runtime.hudInventoryOrientation
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.hud_elements_updated"));
}

async function showToolIndicatorSettingsMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    const tierIndicatorOptions = getLocalizedOptions(ToolTierIndicatorModeLabels);
    const toolIndicatorPlacementOptions = getLocalizedOptions(ToolIndicatorPlacementModeLabels);
    const toolIndicatorColorOptions = getLocalizedOptions(ToolIndicatorColorOptions);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.hud_elements_menu.title"))
        .label(buildSectionLabel("ui.dorios.insight.hud_elements_menu.section.tool_indicator"))
        .dropdown(
            tr("ui.dorios.insight.system_menu.tier_indicator", [getLocalizedOptionByValue(ToolTierIndicatorModeLabels, runtime.toolTierIndicatorMode)]),
            tierIndicatorOptions,
            {
                defaultValueIndex: getToolTierIndicatorModeIndex(runtime.toolTierIndicatorMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.system_menu.tool_position", [getLocalizedOptionByValue(ToolIndicatorPlacementModeLabels, runtime.toolIndicatorPlacement)]),
            toolIndicatorPlacementOptions,
            {
                defaultValueIndex: getToolIndicatorPlacementModeIndex(runtime.toolIndicatorPlacement)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.system_menu.tool_color", [getLocalizedToolIndicatorColor(runtime.toolIndicatorColor)]),
            toolIndicatorColorOptions,
            {
                defaultValueIndex: getToolIndicatorColorIndex(runtime.toolIndicatorColor)
            }
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            toolTierIndicatorMode: ToolTierIndicatorModeLabels[Number(result.formValues[0] ?? 0)]?.key
                ?? runtime.toolTierIndicatorMode,
            toolIndicatorPlacement: ToolIndicatorPlacementModeLabels[Number(result.formValues[1] ?? 0)]?.key
                ?? runtime.toolIndicatorPlacement,
            toolIndicatorColor: ToolIndicatorColorOptions[Number(result.formValues[2] ?? 0)]?.key
                ?? runtime.toolIndicatorColor
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.hud_elements_updated"));
}

async function showHudDurabilitySettingsMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    const hudDurabilityDisplayOptions = getLocalizedOptions(HudDurabilityDisplayModeLabels);
    const hudDurabilityPositionOptions = getLocalizedOptions(HudDurabilityPositionModeLabels);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.hud_elements_menu.title"))
        .label(buildSectionLabel("ui.dorios.insight.hud_elements_menu.section.durability"))
        .dropdown(
            tr("ui.dorios.insight.hud_elements_menu.durability_display", [getLocalizedOptionByValue(HudDurabilityDisplayModeLabels, runtime.hudDurabilityDisplayMode)]),
            hudDurabilityDisplayOptions,
            {
                defaultValueIndex: getHudDurabilityDisplayModeIndex(runtime.hudDurabilityDisplayMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_elements_menu.durability_position", [getLocalizedOptionByValue(HudDurabilityPositionModeLabels, runtime.hudDurabilityPosition)]),
            hudDurabilityPositionOptions,
            {
                defaultValueIndex: getHudDurabilityPositionModeIndex(runtime.hudDurabilityPosition)
            }
        )
        .toggle(
            tr("ui.dorios.insight.hud_elements_menu.show_full_durability", [getStateMessage(runtime.hudDurabilityShowWhenFull)]),
            { defaultValue: Boolean(runtime.hudDurabilityShowWhenFull) }
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            hudDurabilityDisplayMode: HudDurabilityDisplayModeLabels[Number(result.formValues[0] ?? 0)]?.key
                ?? runtime.hudDurabilityDisplayMode,
            hudDurabilityPosition: HudDurabilityPositionModeLabels[Number(result.formValues[1] ?? 0)]?.key
                ?? runtime.hudDurabilityPosition,
            hudDurabilityShowWhenFull: Boolean(result.formValues[2] ?? runtime.hudDurabilityShowWhenFull)
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.hud_elements_updated"));
}

async function showHudQuickCounterSettingsMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    const hudQuickCounterOptions = getLocalizedOptions(HudQuickCounterModeLabels);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.hud_elements_menu.title"))
        .label(buildSectionLabel("ui.dorios.insight.hud_elements_menu.section.quick_counter"))
        .toggle(
            tr("ui.dorios.insight.hud_elements_menu.quick_counter_toggle", [getStateMessage(runtime.hudQuickCounterEnabled)]),
            { defaultValue: Boolean(runtime.hudQuickCounterEnabled) }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_elements_menu.primary_counter", [getLocalizedOptionByValue(HudQuickCounterModeLabels, runtime.hudQuickCounterPrimaryMode)]),
            hudQuickCounterOptions,
            {
                defaultValueIndex: getHudQuickCounterModeIndex(runtime.hudQuickCounterPrimaryMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.hud_elements_menu.secondary_counter", [getLocalizedOptionByValue(HudQuickCounterModeLabels, runtime.hudQuickCounterSecondaryMode)]),
            hudQuickCounterOptions,
            {
                defaultValueIndex: getHudQuickCounterModeIndex(runtime.hudQuickCounterSecondaryMode)
            }
        )
        .toggle(
            tr("ui.dorios.insight.hud_elements_menu.quick_counter_icon", [getStateMessage(runtime.hudQuickCounterShowIcon)]),
            { defaultValue: Boolean(runtime.hudQuickCounterShowIcon) }
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            hudQuickCounterEnabled: Boolean(result.formValues[0] ?? runtime.hudQuickCounterEnabled),
            hudQuickCounterPrimaryMode: HudQuickCounterModeLabels[Number(result.formValues[1] ?? 0)]?.key
                ?? runtime.hudQuickCounterPrimaryMode,
            hudQuickCounterSecondaryMode: HudQuickCounterModeLabels[Number(result.formValues[2] ?? 0)]?.key
                ?? runtime.hudQuickCounterSecondaryMode,
            hudQuickCounterShowIcon: Boolean(result.formValues[3] ?? runtime.hudQuickCounterShowIcon)
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.hud_elements_updated"));
}

async function showHudElementsMenu(player) {
    while (true) {
        const settings = getPlayerDisplaySettings(player);
        const runtime = settings.runtime;

        const form = new ActionFormData()
            .title(tr("ui.dorios.insight.hud_elements_menu.title"))
            .body(tr("ui.dorios.insight.hud_elements_menu.group_body", [
                getStateMessage(runtime.hudInventoryEnabled),
                getLocalizedOptionByValue(HudInventoryDisplayModeLabels, runtime.hudInventoryDisplayMode),
                getLocalizedOptionByValue(ToolTierIndicatorModeLabels, runtime.toolTierIndicatorMode),
                getLocalizedOptionByValue(ToolIndicatorPlacementModeLabels, runtime.toolIndicatorPlacement),
                getLocalizedOptionByValue(HudDurabilityDisplayModeLabels, runtime.hudDurabilityDisplayMode),
                getLocalizedOptionByValue(HudDurabilityPositionModeLabels, runtime.hudDurabilityPosition),
                getStateMessage(runtime.hudQuickCounterEnabled),
                getLocalizedOptionByValue(HudQuickCounterModeLabels, runtime.hudQuickCounterPrimaryMode)
            ]))
            .button(tr("ui.dorios.insight.hud_elements_menu.group.inventory_button"))
            .button(tr("ui.dorios.insight.hud_elements_menu.group.tool_indicator_button"))
            .button(tr("ui.dorios.insight.hud_elements_menu.group.durability_button"))
            .button(tr("ui.dorios.insight.hud_elements_menu.group.quick_counter_button"));

        const result = await form.show(player);
        if (result.canceled) {
            return;
        }

        switch (result.selection) {
            case 0:
                await showHudInventorySettingsMenu(player);
                break;
            case 1:
                await showToolIndicatorSettingsMenu(player);
                break;
            case 2:
                await showHudDurabilitySettingsMenu(player);
                break;
            case 3:
                await showHudQuickCounterSettingsMenu(player);
                break;
            default:
                return;
        }
    }
}

async function showWailaMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;
    const wailaColorOptions = getLocalizedOptions(WailaColorThemeLabels);
    const wailaAnchorOptions = getLocalizedOptions(WailaAnchorModeLabels);
    const wailaHorizontalOffsetOptions = getLocalizedOptions(WailaHorizontalOffsetModeLabels);
    const wailaVerticalOffsetOptions = getLocalizedOptions(WailaVerticalOffsetModeLabels);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.waila_menu.title"))
        .dropdown(
            tr("ui.dorios.insight.waila_menu.color_theme", [getLocalizedOptionByValue(WailaColorThemeLabels, runtime.wailaColorTheme)]),
            wailaColorOptions,
            {
                defaultValueIndex: getWailaColorThemeIndex(runtime.wailaColorTheme)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.waila_menu.anchor", [getLocalizedOptionByValue(WailaAnchorModeLabels, runtime.wailaAnchor)]),
            wailaAnchorOptions,
            {
                defaultValueIndex: getWailaAnchorModeIndex(runtime.wailaAnchor)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.waila_menu.horizontal_offset", [getLocalizedOptionByValue(WailaHorizontalOffsetModeLabels, runtime.wailaHorizontalOffset)]),
            wailaHorizontalOffsetOptions,
            {
                defaultValueIndex: getWailaOffsetModeIndex(runtime.wailaHorizontalOffset)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.waila_menu.vertical_offset", [getLocalizedOptionByValue(WailaVerticalOffsetModeLabels, runtime.wailaVerticalOffset)]),
            wailaVerticalOffsetOptions,
            {
                defaultValueIndex: getWailaOffsetModeIndex(runtime.wailaVerticalOffset)
            }
        )
        .toggle(
            tr("ui.dorios.insight.waila_menu.show_entity_render", [getStateMessage(runtime.wailaShowEntityRender)]),
            { defaultValue: Boolean(runtime.wailaShowEntityRender) }
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            wailaColorTheme: WailaColorThemeLabels[Number(result.formValues[0] ?? 0)]?.key
                ?? runtime.wailaColorTheme,
            wailaAnchor: WailaAnchorModeLabels[Number(result.formValues[1] ?? 0)]?.key
                ?? runtime.wailaAnchor,
            wailaHorizontalOffset: WailaHorizontalOffsetModeLabels[Number(result.formValues[2] ?? 0)]?.key
                ?? runtime.wailaHorizontalOffset,
            wailaVerticalOffset: WailaVerticalOffsetModeLabels[Number(result.formValues[3] ?? 0)]?.key
                ?? runtime.wailaVerticalOffset,
            wailaShowEntityRender: Boolean(result.formValues[4] ?? runtime.wailaShowEntityRender)
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.waila_updated"));
}

async function showConditionsMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    const displayModeOptions = getLocalizedOptions(EntityNameDisplayModeLabels);
    const resolveModeOptions = getLocalizedOptions(EntityNameResolveModeLabels);
    const villagerProfessionOptions = getLocalizedOptions(VillagerProfessionDisplayModeLabels);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.conditions_menu.title"))
        .dropdown(
            tr("ui.dorios.insight.conditions_menu.name_order", [getLocalizedOptionByValue(EntityNameDisplayModeLabels, runtime.nameDisplayMode)]),
            displayModeOptions,
            {
                defaultValueIndex: getEntityNameDisplayModeIndex(runtime.nameDisplayMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.conditions_menu.name_method", [getLocalizedOptionByValue(EntityNameResolveModeLabels, runtime.nameResolveMode)]),
            resolveModeOptions,
            {
                defaultValueIndex: getEntityNameResolveModeIndex(runtime.nameResolveMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.conditions_menu.villager_profession", [getLocalizedOptionByValue(VillagerProfessionDisplayModeLabels, runtime.villagerProfessionDisplay)]),
            villagerProfessionOptions,
            {
                defaultValueIndex: getVillagerProfessionDisplayModeIndex(runtime.villagerProfessionDisplay)
            }
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            nameDisplayMode: EntityNameDisplayModeLabels[Number(result.formValues[0] ?? 0)]?.key ?? runtime.nameDisplayMode,
            nameResolveMode: EntityNameResolveModeLabels[Number(result.formValues[1] ?? 0)]?.key ?? runtime.nameResolveMode,
            villagerProfessionDisplay: VillagerProfessionDisplayModeLabels[Number(result.formValues[2] ?? 0)]?.key
                ?? runtime.villagerProfessionDisplay
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.conditions_updated"));
}

async function showSystemSettingsMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    const modeSummaryOptions = getLocalizedOptions(ModePresetSummaryModeLabels);
    const resolveModeOptions = getLocalizedOptions(EntityNameResolveModeLabels);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.system_menu.title"))
        .dropdown(
            tr("ui.dorios.insight.system_menu.block_name_method", [getLocalizedOptionByValue(EntityNameResolveModeLabels, runtime.blockNameResolveMode)]),
            resolveModeOptions,
            {
                defaultValueIndex: getEntityNameResolveModeIndex(runtime.blockNameResolveMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.system_menu.mode_summary", [getLocalizedOptionByValue(ModePresetSummaryModeLabels, runtime.modePresetSummaryMode)]),
            modeSummaryOptions,
            {
                defaultValueIndex: getModePresetSummaryModeIndex(runtime.modePresetSummaryMode)
            }
        )
        .slider(
            tr("ui.dorios.insight.system_menu.state_columns", [runtime.stateColumns]),
            1,
            InsightConfig.system.maxLayoutColumns,
            { defaultValue: runtime.stateColumns }
        )
        .slider(
            tr("ui.dorios.insight.system_menu.tag_columns", [runtime.tagColumns]),
            1,
            InsightConfig.system.maxLayoutColumns,
            { defaultValue: runtime.tagColumns }
        )
        .slider(
            tr("ui.dorios.insight.system_menu.family_columns", [runtime.familyColumns]),
            1,
            InsightConfig.system.maxLayoutColumns,
            { defaultValue: runtime.familyColumns }
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            blockNameResolveMode: EntityNameResolveModeLabels[Number(result.formValues[0] ?? 0)]?.key
                ?? runtime.blockNameResolveMode,
            modePresetSummaryMode: ModePresetSummaryModeLabels[Number(result.formValues[1] ?? 0)]?.key
                ?? runtime.modePresetSummaryMode,
            stateColumns: resolveCustomNumberInput(
                result.formValues[2],
                runtime.stateColumns,
                1,
                InsightConfig.system.maxLayoutColumns
            ),
            tagColumns: resolveCustomNumberInput(
                result.formValues[3],
                runtime.tagColumns,
                1,
                InsightConfig.system.maxLayoutColumns
            ),
            familyColumns: resolveCustomNumberInput(
                result.formValues[4],
                runtime.familyColumns,
                1,
                InsightConfig.system.maxLayoutColumns
            )
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.system_updated"));
}

async function showRuntimeTimingMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;
    const customValueHint = tr("ui.dorios.insight.runtime.custom_hint");
    const customValueLabel = "";

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.runtime_menu.title"))
        .label(buildSectionLabel("ui.dorios.insight.runtime_menu.section.scan_refresh"))
        .slider(
            tr("ui.dorios.insight.runtime.range", [runtime.maxDistance]),
            InsightConfig.system.minMaxDistance,
            InsightConfig.system.maxMaxDistance,
            { defaultValue: runtime.maxDistance }
        )
        .textField(customValueLabel, customValueHint)
        .slider(
            tr("ui.dorios.insight.runtime.update_interval", [runtime.updateIntervalTicks]),
            InsightConfig.system.minUpdateIntervalTicks,
            InsightConfig.system.maxUpdateIntervalTicks,
            { defaultValue: runtime.updateIntervalTicks }
        )
        .textField(customValueLabel, customValueHint)
        .slider(
            tr("ui.dorios.insight.runtime.target_hold_ticks", [runtime.unchangedTargetRefreshTicks]),
            InsightConfig.system.minUnchangedTargetRefreshTicks,
            InsightConfig.system.maxUnchangedTargetRefreshTicks,
            { defaultValue: runtime.unchangedTargetRefreshTicks }
        )
        .textField(customValueLabel, customValueHint)
        .slider(
            tr("ui.dorios.insight.runtime.clear_no_target", [runtime.clearAfterNoTargetTicks]),
            InsightConfig.system.minClearAfterNoTargetTicks,
            InsightConfig.system.maxClearAfterNoTargetTicks,
            { defaultValue: runtime.clearAfterNoTargetTicks }
        )
        .textField(customValueLabel, customValueHint);

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            maxDistance: resolveCustomNumberInput(
                result.formValues[1],
                Number(result.formValues[0] ?? runtime.maxDistance),
                InsightConfig.system.minMaxDistance,
                InsightConfig.system.maxMaxDistance
            ),
            updateIntervalTicks: resolveCustomNumberInput(
                result.formValues[3],
                Number(result.formValues[2] ?? runtime.updateIntervalTicks),
                InsightConfig.system.minUpdateIntervalTicks,
                InsightConfig.system.maxUpdateIntervalTicks
            ),
            unchangedTargetRefreshTicks: resolveCustomNumberInput(
                result.formValues[5],
                Number(result.formValues[4] ?? runtime.unchangedTargetRefreshTicks),
                InsightConfig.system.minUnchangedTargetRefreshTicks,
                InsightConfig.system.maxUnchangedTargetRefreshTicks
            ),
            clearAfterNoTargetTicks: resolveCustomNumberInput(
                result.formValues[7],
                Number(result.formValues[6] ?? runtime.clearAfterNoTargetTicks),
                InsightConfig.system.minClearAfterNoTargetTicks,
                InsightConfig.system.maxClearAfterNoTargetTicks
            )
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.runtime_updated"));
}

async function showRuntimeVisibilityMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;
    const customValueHint = tr("ui.dorios.insight.runtime.custom_hint");
    const customValueLabel = "";

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.runtime_menu.title"))
        .label(buildSectionLabel("ui.dorios.insight.runtime_menu.section.visibility_caps"))
        .slider(
            tr("ui.dorios.insight.runtime.visible_block_states", [runtime.maxVisibleStates]),
            0,
            InsightConfig.system.maxVisibleStatesCap,
            { defaultValue: runtime.maxVisibleStates }
        )
        .textField(customValueLabel, customValueHint)
        .slider(
            tr("ui.dorios.insight.runtime.visible_block_tags", [runtime.maxVisibleBlockTags]),
            0,
            InsightConfig.system.maxVisibleTagsCap,
            { defaultValue: runtime.maxVisibleBlockTags }
        )
        .textField(customValueLabel, customValueHint)
        .slider(
            tr("ui.dorios.insight.runtime.visible_entity_tags", [runtime.maxVisibleEntityTags]),
            0,
            InsightConfig.system.maxVisibleTagsCap,
            { defaultValue: runtime.maxVisibleEntityTags }
        )
        .textField(customValueLabel, customValueHint)
        .slider(
            tr("ui.dorios.insight.runtime.visible_entity_families", [runtime.maxVisibleEntityFamilies]),
            0,
            InsightConfig.system.maxVisibleFamiliesCap,
            { defaultValue: runtime.maxVisibleEntityFamilies }
        )
        .textField(customValueLabel, customValueHint)
        .slider(
            tr("ui.dorios.insight.runtime.visible_effects", [runtime.maxVisibleEffects]),
            0,
            InsightConfig.system.maxVisibleEffectsCap,
            { defaultValue: runtime.maxVisibleEffects }
        )
        .textField(customValueLabel, customValueHint)
        .slider(
            tr("ui.dorios.insight.runtime.health_threshold", [runtime.maxHeartDisplayHealth]),
            InsightConfig.system.minMaxHeartDisplayHealth,
            InsightConfig.system.maxMaxHeartDisplayHealth,
            { defaultValue: runtime.maxHeartDisplayHealth }
        )
        .textField(customValueLabel, customValueHint);

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            maxVisibleStates: resolveCustomNumberInput(
                result.formValues[1],
                Number(result.formValues[0] ?? runtime.maxVisibleStates),
                0,
                InsightConfig.system.maxVisibleStatesCap
            ),
            maxVisibleBlockTags: resolveCustomNumberInput(
                result.formValues[3],
                Number(result.formValues[2] ?? runtime.maxVisibleBlockTags),
                0,
                InsightConfig.system.maxVisibleTagsCap
            ),
            maxVisibleEntityTags: resolveCustomNumberInput(
                result.formValues[5],
                Number(result.formValues[4] ?? runtime.maxVisibleEntityTags),
                0,
                InsightConfig.system.maxVisibleTagsCap
            ),
            maxVisibleEntityFamilies: resolveCustomNumberInput(
                result.formValues[7],
                Number(result.formValues[6] ?? runtime.maxVisibleEntityFamilies),
                0,
                InsightConfig.system.maxVisibleFamiliesCap
            ),
            maxVisibleEffects: resolveCustomNumberInput(
                result.formValues[9],
                Number(result.formValues[8] ?? runtime.maxVisibleEffects),
                0,
                InsightConfig.system.maxVisibleEffectsCap
            ),
            maxHeartDisplayHealth: resolveCustomNumberInput(
                result.formValues[11],
                Number(result.formValues[10] ?? runtime.maxHeartDisplayHealth),
                InsightConfig.system.minMaxHeartDisplayHealth,
                InsightConfig.system.maxMaxHeartDisplayHealth
            )
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.runtime_updated"));
}

async function showRuntimeLinkingMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;
    const customValueHint = tr("ui.dorios.insight.runtime.custom_hint");
    const customValueLabel = "";

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.runtime_menu.title"))
        .label(buildSectionLabel("ui.dorios.insight.runtime_menu.section.target_filters"))
        .toggle(
            tr("ui.dorios.insight.runtime.include_invisible", [
                getStateMessage(runtime.includeInvisibleEntities)
            ]),
            { defaultValue: runtime.includeInvisibleEntities }
        )
        .toggle(
            tr("ui.dorios.insight.runtime.include_liquids", [
                getStateMessage(runtime.includeLiquidBlocks)
            ]),
            { defaultValue: runtime.includeLiquidBlocks }
        )
        .label(buildSectionLabel("ui.dorios.insight.runtime_menu.section.linked_entity_scan"))
        .slider(
            tr("ui.dorios.insight.runtime_menu.linked_scan_interval", [runtime.linkedEntityScanIntervalTicks]),
            InsightConfig.system.minLinkedEntityScanIntervalTicks,
            InsightConfig.system.maxLinkedEntityScanIntervalTicks,
            { defaultValue: runtime.linkedEntityScanIntervalTicks }
        )
        .textField(customValueLabel, customValueHint)
        .slider(
            tr("ui.dorios.insight.runtime_menu.linked_scan_distance", [runtime.linkedEntityScanMaxDistance]),
            InsightConfig.system.minLinkedEntityScanMaxDistance,
            InsightConfig.system.maxLinkedEntityScanMaxDistance,
            { defaultValue: runtime.linkedEntityScanMaxDistance }
        )
        .textField(customValueLabel, customValueHint)
        .toggle(
            tr("ui.dorios.insight.runtime_menu.ignore_machine_helpers", [getStateMessage(runtime.ignoreMachineHelperEntities)]),
            { defaultValue: runtime.ignoreMachineHelperEntities }
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            includeInvisibleEntities: Boolean(result.formValues[0] ?? runtime.includeInvisibleEntities),
            includeLiquidBlocks: Boolean(result.formValues[1] ?? runtime.includeLiquidBlocks),
            linkedEntityScanIntervalTicks: resolveCustomNumberInput(
                result.formValues[3],
                Number(result.formValues[2] ?? runtime.linkedEntityScanIntervalTicks),
                InsightConfig.system.minLinkedEntityScanIntervalTicks,
                InsightConfig.system.maxLinkedEntityScanIntervalTicks
            ),
            linkedEntityScanMaxDistance: resolveCustomNumberInput(
                result.formValues[5],
                Number(result.formValues[4] ?? runtime.linkedEntityScanMaxDistance),
                InsightConfig.system.minLinkedEntityScanMaxDistance,
                InsightConfig.system.maxLinkedEntityScanMaxDistance
            ),
            ignoreMachineHelperEntities: Boolean(result.formValues[6] ?? runtime.ignoreMachineHelperEntities)
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.runtime_updated"));
}

async function showRuntimeMenu(player) {
    while (true) {
        const settings = getPlayerDisplaySettings(player);
        const runtime = settings.runtime;

        const form = new ActionFormData()
            .title(tr("ui.dorios.insight.runtime_menu.title"))
            .body(tr("ui.dorios.insight.runtime_menu.group_body", [
                runtime.maxDistance,
                runtime.updateIntervalTicks,
                runtime.maxVisibleStates,
                runtime.maxVisibleBlockTags,
                runtime.maxVisibleEntityTags,
                runtime.linkedEntityScanIntervalTicks,
                runtime.linkedEntityScanMaxDistance,
                getStateMessage(runtime.ignoreMachineHelperEntities)
            ]))
            .button(tr("ui.dorios.insight.runtime_menu.group.scan_refresh_button"))
            .button(tr("ui.dorios.insight.runtime_menu.group.visibility_caps_button"))
            .button(tr("ui.dorios.insight.runtime_menu.group.target_filters_button"));

        const result = await form.show(player);
        if (result.canceled) {
            return;
        }

        switch (result.selection) {
            case 0:
                await showRuntimeTimingMenu(player);
                break;
            case 1:
                await showRuntimeVisibilityMenu(player);
                break;
            case 2:
                await showRuntimeLinkingMenu(player);
                break;
            default:
                return;
        }
    }
}

function getNamespaceRegistrationSourceLabel(source) {
    return namespaceRegistrationSourceFallbackLabels[source] || namespaceRegistrationSourceFallbackLabels.all;
}

function buildNamespaceRegistrationButtonLabel(entry) {
    const details = [entry.namespace || "-"];

    if (entry.identifier) {
        details.push(`id: ${entry.identifier}`);
    }

    if (entry.typeId) {
        details.push(`target: ${entry.typeId}`);
    } else if (entry.contentCount > 0) {
        details.push(`tracked: ${entry.contentCount}`);
    }

    return `${entry.name || entry.target || entry.key || "Unnamed"}\n§7${details.join(" | ")}`;
}

function buildNamespaceRegistrationSamplesText(entry) {
    if (!Array.isArray(entry?.content) || !entry.content.length) {
        return "";
    }

    const rows = [];
    appendLimitedRows(rows, entry.content.map((value) => `- ${value}`), 6);
    return rows.join("\n");
}

function buildNamespaceRegistrationDetailBody(entry) {
    const samplesText = buildNamespaceRegistrationSamplesText(entry);
    const rawtext = [
        {
            translate: "ui.dorios.insight.namespace_menu.detail_body",
            with: [
                String(entry?.name || entry?.target || entry?.key || "-"),
                getNamespaceRegistrationSourceLabel(entry?.registrationSource),
                String(entry?.namespace || "-"),
                String(entry?.identifier || "-"),
                String(entry?.target || "-"),
                String(entry?.type || "addon"),
                String(entry?.contentCount || 0)
            ]
        }
    ];

    if (samplesText) {
        rawtext.push({ text: "\n\n" });
        rawtext.push({
            translate: "ui.dorios.insight.namespace_menu.detail_samples",
            with: [samplesText]
        });
    }

    return { rawtext };
}

function sendNamespaceResetScopeFeedback(player, sourceScope, resetResult) {
    if (!resetResult?.ok) {
        sendPlayerMessage(
            player,
            tr("ui.dorios.insight.feedback.namespace_reset_empty", [getNamespaceRegistrationSourceLabel(sourceScope)])
        );
        return false;
    }

    sendPlayerMessage(
        player,
        tr("ui.dorios.insight.feedback.namespace_reset_scope", [resetResult.count, getNamespaceRegistrationSourceLabel(sourceScope)])
    );
    return true;
}

async function showNamespaceRegistrationDetailMenu(player, entry) {
    const form = new ActionFormData()
        .title(tr("ui.dorios.insight.namespace_menu.detail_title"))
        .body(buildNamespaceRegistrationDetailBody(entry))
        .button(tr("ui.dorios.insight.namespace_menu.reset_entry_button"))
        .button(tr("ui.dorios.insight.namespace_menu.back_button"));

    const result = await form.show(player);
    if (result.canceled || result.selection !== 0) {
        return false;
    }

    const resetResult = resetRegisteredNamespaceEntries({
        key: entry.key,
        source: entry.registrationSource
    });

    if (!resetResult?.ok) {
        sendPlayerMessage(
            player,
            tr("ui.dorios.insight.feedback.namespace_reset_empty", [getNamespaceRegistrationSourceLabel(entry.registrationSource)])
        );
        return false;
    }

    sendPlayerMessage(
        player,
        tr("ui.dorios.insight.feedback.namespace_reset_entry", [entry.name || entry.target || entry.key || "-"])
    );
    return true;
}

async function showNamespaceRegistrationListMenu(player, source) {
    while (true) {
        const entries = getRegisteredNamespaceEntries(source);
        const sourceLabel = getNamespaceRegistrationSourceLabel(source);
        const form = new ActionFormData()
            .title(tr("ui.dorios.insight.namespace_menu.list_title", [sourceLabel]))
            .body(tr("ui.dorios.insight.namespace_menu.list_body", [sourceLabel, entries.length]));

        for (const entry of entries) {
            form.button(buildNamespaceRegistrationButtonLabel(entry));
        }

        form.button(tr("ui.dorios.insight.namespace_menu.back_button"));

        const result = await form.show(player);
        if (result.canceled || result.selection === entries.length) {
            return;
        }

        const selectedEntry = entries[result.selection];
        if (!selectedEntry) {
            return;
        }

        const didReset = await showNamespaceRegistrationDetailMenu(player, selectedEntry);
        if (!didReset && !entries.length) {
            return;
        }
    }
}

async function showNamespaceSettingsEditorMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;
    const namespaceDisplayOptions = getLocalizedOptions(NamespaceDisplayModeLabels);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.namespace_menu.title"))
        .dropdown(
            tr("ui.dorios.insight.namespace_menu.display_mode", [getLocalizedOptionByValue(NamespaceDisplayModeLabels, runtime.namespaceDisplayMode)]),
            namespaceDisplayOptions,
            {
                defaultValueIndex: getNamespaceDisplayModeIndex(runtime.namespaceDisplayMode)
            }
        )
        .textField(
            tr("ui.dorios.insight.namespace_menu.namespace_label"),
            tr("ui.dorios.insight.namespace_menu.namespace_hint")
        )
        .textField(
            tr("ui.dorios.insight.namespace_menu.display_label"),
            tr("ui.dorios.insight.namespace_menu.display_hint")
        )
        .textField(
            tr("ui.dorios.insight.namespace_menu.identifier_label"),
            tr("ui.dorios.insight.namespace_menu.identifier_hint")
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    const nextNamespaceDisplayMode = NamespaceDisplayModeLabels[Number(result.formValues[0] ?? 0)]?.key
        ?? runtime.namespaceDisplayMode;
    const namespaceInput = String(result.formValues[1] ?? "").trim();
    const displayName = String(result.formValues[2] ?? "").trim();
    const identifier = String(result.formValues[3] ?? "").trim();

    const hasMappingInput = namespaceInput.length > 0 || displayName.length > 0 || identifier.length > 0;

    if (!hasMappingInput) {
        updatePlayerOverrides(player, {
            runtime: {
                namespaceDisplayMode: nextNamespaceDisplayMode
            }
        });
        sendPlayerMessage(player, tr("ui.dorios.insight.feedback.namespace_updated"));
        return;
    }

    if (!namespaceInput || !displayName) {
        sendPlayerMessage(player, tr("ui.dorios.insight.namespace_menu.error_required"));
        return;
    }

    const registration = registerNamespaceAlias(namespaceInput, displayName, identifier, true);
    if (!registration?.ok) {
        sendPlayerMessage(player, tr("ui.dorios.insight.namespace_menu.error_invalid"));
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            namespaceDisplayMode: nextNamespaceDisplayMode
        }
    });

    sendPlayerMessage(
        player,
        tr("ui.dorios.insight.feedback.namespace_mapping_updated", [registration.target, registration.name])
    );

    if (registration.identifier) {
        sendPlayerMessage(
            player,
            tr("ui.dorios.insight.feedback.namespace_identifier_updated", [registration.identifier])
        );
    }
}

async function showNamespaceMenu(player) {
    while (true) {
        const settings = getPlayerDisplaySettings(player);
        const runtime = settings.runtime;
        const scriptEntries = getRegisteredNamespaceEntries(NamespaceRegistrationSources.Script);
        const commandEntries = getRegisteredNamespaceEntries(NamespaceRegistrationSources.Command);
        const form = new ActionFormData()
            .title(tr("ui.dorios.insight.namespace_menu.title"))
            .body(tr("ui.dorios.insight.namespace_menu.manager_body", [
                getLocalizedOptionByValue(NamespaceDisplayModeLabels, runtime.namespaceDisplayMode),
                scriptEntries.length,
                commandEntries.length
            ]))
            .button(tr("ui.dorios.insight.namespace_menu.configure_button"))
            .button(tr("ui.dorios.insight.namespace_menu.script_list_button", [scriptEntries.length]))
            .button(tr("ui.dorios.insight.namespace_menu.command_list_button", [commandEntries.length]))
            .button(tr("ui.dorios.insight.namespace_menu.reset_scripts_button"))
            .button(tr("ui.dorios.insight.namespace_menu.reset_commands_button"))
            .button(tr("ui.dorios.insight.namespace_menu.reset_all_button"));

        const result = await form.show(player);
        if (result.canceled) {
            return;
        }

        switch (result.selection) {
            case 0:
                await showNamespaceSettingsEditorMenu(player);
                break;
            case 1:
                await showNamespaceRegistrationListMenu(player, NamespaceRegistrationSources.Script);
                break;
            case 2:
                await showNamespaceRegistrationListMenu(player, NamespaceRegistrationSources.Command);
                break;
            case 3:
                sendNamespaceResetScopeFeedback(
                    player,
                    NamespaceRegistrationSources.Script,
                    resetRegisteredNamespaceEntries({ source: NamespaceRegistrationSources.Script })
                );
                break;
            case 4:
                sendNamespaceResetScopeFeedback(
                    player,
                    NamespaceRegistrationSources.Command,
                    resetRegisteredNamespaceEntries({ source: NamespaceRegistrationSources.Command })
                );
                break;
            case 5:
                sendNamespaceResetScopeFeedback(player, "all", resetRegisteredNamespaceEntries());
                break;
            default:
                return;
        }
    }
}

function getComponentGroups() {
    const byKey = (keys) => InsightComponentDefinitions.filter((component) => keys.includes(component.key));

    return {
        entity: {
            titleKey: "ui.dorios.insight.components.entity.title",
            components: byKey([
                "health",
                "absorption",
                "armor",
                "hunger",
                "hungerEffect",
                "airBubbles",
                "effects",
                "effectHearts",
                "animalHearts",
                "tameable",
                "tameFoods",
                "technical",
                "coordinates",
                "typeId",
                "velocity"
            ])
        },
        block: {
            titleKey: "ui.dorios.insight.components.block.title",
            components: byKey([
                "namespace",
                "technical",
                "coordinates",
                "typeId",
                "namespaceResolution"
            ])
        },
        custom: {
            titleKey: "ui.dorios.insight.components.custom.title",
            components: InsightComponentDefinitions.filter((component) => customComponentKeySet.has(component.key))
        },
        blockStates: {
            titleKey: "ui.dorios.insight.components.block_states.title",
            components: byKey(["blockStates"]),
            runtimeFields: ["maxVisibleStates", "stateColumns"]
        },
        blockTags: {
            titleKey: "ui.dorios.insight.components.block_tags.title",
            components: byKey(["blockTags"]),
            runtimeFields: ["maxVisibleBlockTags", "tagColumns"]
        },
        entityTags: {
            titleKey: "ui.dorios.insight.components.entity_tags.title",
            components: byKey(["entityTags"]),
            runtimeFields: ["maxVisibleEntityTags", "tagColumns"]
        },
        entityFamilies: {
            titleKey: "ui.dorios.insight.components.entity_families.title",
            components: byKey(["entityFamilies"]),
            runtimeFields: ["maxVisibleEntityFamilies", "familyColumns"]
        }
    };
}

function toggleLocalActivation(player, settings) {
    const shouldActivate = settings.disabled;
    setPlayerActivation(player, shouldActivate);

    sendPlayerMessage(
        player,
        shouldActivate
            ? tr("ui.dorios.insight.feedback.local_enabled")
            : tr("ui.dorios.insight.feedback.local_disabled")
    );
}

function toggleGlobalActivation(player, settings) {
    const nextGlobal = setInsightGlobalEnabled(!settings.globalEnabled);

    sendPlayerMessage(
        player,
        nextGlobal
            ? tr("ui.dorios.insight.feedback.global_enabled")
            : tr("ui.dorios.insight.feedback.global_disabled")
    );
}

function toggleAdminOnlyGlobalProfile(player, settings) {
    if (!isAdminPlayer(player)) {
        sendPlayerMessage(player, tr("ui.dorios.insight.feedback.admin_only_denied"));
        return;
    }

    const nextValue = setAdminOnlyGlobalProfileEnabled(!settings.adminOnlyGlobalProfile, player);
    sendPlayerMessage(
        player,
        nextValue
            ? tr("ui.dorios.insight.feedback.admin_only_enabled", [player.name])
            : tr("ui.dorios.insight.feedback.admin_only_disabled")
    );
}

// ---- Sub-menus for grouped sections ----

async function showActivationMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const localStateLabel = getStateMessage(!settings.disabled, "ui.dorios.insight.value.active", "ui.dorios.insight.value.disabled");
    const globalStateLabel = getStateMessage(settings.globalEnabled);
    const adminOnlyStateLabel = getStateMessage(settings.adminOnlyGlobalProfile);
    const adminSourceLabel = settings.adminGlobalProfileSourceName || "-";

    const form = new ActionFormData()
        .title(tr("ui.dorios.insight.activation_menu.title"))
        .button(tr("ui.dorios.insight.menu.local_toggle_button", [localStateLabel]))
        .button(tr("ui.dorios.insight.menu.global_toggle_button", [globalStateLabel]))
        .button(tr("ui.dorios.insight.menu.admin_only_button", [adminOnlyStateLabel, adminSourceLabel]));

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    switch (result.selection) {
        case 0:
            toggleLocalActivation(player, settings);
            break;
        case 1:
            toggleGlobalActivation(player, settings);
            break;
        case 2:
            toggleAdminOnlyGlobalProfile(player, settings);
            break;
    }
}

async function showDisplayMenu(player) {
    const settings = getPlayerDisplaySettings(player);

    const form = new ActionFormData()
        .title(tr("ui.dorios.insight.display_root.title"))
        .body(tr("ui.dorios.insight.display_root.body", [
            getLocalizedOptionByValue(DisplayStyleLabels, settings.displayStyle),
            getLocalizedOptionByValue(ToolTierIndicatorModeLabels, settings.toolTierIndicatorMode)
        ]))
        .button(tr("ui.dorios.insight.menu.style_button", [getLocalizedOptionByValue(DisplayStyleLabels, settings.displayStyle)]))
        .button(tr("ui.dorios.insight.display_root.hud_button"))
        .button(tr("ui.dorios.insight.display_root.hud_elements_button"))
        .button(tr("ui.dorios.insight.display_root.waila_button"))
        .button(tr("ui.dorios.insight.display_root.conditions_button"))
        .button(tr("ui.dorios.insight.display_root.system_button"))
        .button(tr("ui.dorios.insight.display_root.runtime_button"));

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    switch (result.selection) {
        case 0:
            await showStyleMenu(player);
            break;
        case 1:
            await showHudBarsMenu(player);
            break;
        case 2:
            await showHudElementsMenu(player);
            break;
        case 3:
            await showWailaMenu(player);
            break;
        case 4:
            await showConditionsMenu(player);
            break;
        case 5:
            await showSystemSettingsMenu(player);
            break;
        case 6:
            await showRuntimeMenu(player);
            break;
    }
}

async function showComponentsMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const componentGroups = getComponentGroups();

    const form = new ActionFormData()
        .title(tr("ui.dorios.insight.target_menu.title"))
        .body(tr("ui.dorios.insight.target_menu.body", [
            countEnabledComponents(settings.components),
            settings.maxVisibleStates,
            settings.maxVisibleBlockTags,
            settings.maxVisibleEntityTags,
            settings.maxVisibleEntityFamilies
        ]))
        .button(tr("ui.dorios.insight.target_menu.entity_button"))
        .button(tr("ui.dorios.insight.target_menu.block_button"))
        .button(tr("ui.dorios.insight.target_menu.custom_button"))
        .button(tr("ui.dorios.insight.target_menu.block_states_button"))
        .button(tr("ui.dorios.insight.target_menu.block_tags_button"))
        .button(tr("ui.dorios.insight.target_menu.entity_tags_button"))
        .button(tr("ui.dorios.insight.target_menu.entity_families_button"));

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    switch (result.selection) {
        case 0:
            await showComponentGroupMenu(player, componentGroups.entity);
            break;
        case 1:
            await showComponentGroupMenu(player, componentGroups.block);
            break;
        case 2:
            await showComponentGroupMenu(player, componentGroups.custom);
            break;
        case 3:
            await showComponentGroupWithRuntimeMenu(player, componentGroups.blockStates);
            break;
        case 4:
            await showComponentGroupWithRuntimeMenu(player, componentGroups.blockTags);
            break;
        case 5:
            await showComponentGroupWithRuntimeMenu(player, componentGroups.entityTags);
            break;
        case 6:
            await showComponentGroupWithRuntimeMenu(player, componentGroups.entityFamilies);
            break;
    }
}

export async function openInsightMenu(player) {
    const settings = getPlayerDisplaySettings(player);

    const modeLabel = getModeMessage(settings.mode);
    const localStateLabel = getStateMessage(!settings.disabled, "ui.dorios.insight.value.active", "ui.dorios.insight.value.disabled");
    const globalStateLabel = getStateMessage(settings.globalEnabled);

    const form = new ActionFormData()
        .title(tr("ui.dorios.insight.menu.title"))
        .body(tr("ui.dorios.insight.menu.body", [
            modeLabel,
            settings.maxDistance,
            settings.updateIntervalTicks,
            settings.unchangedTargetRefreshTicks,
            globalStateLabel,
            localStateLabel
        ]))
        .button(tr("ui.dorios.insight.menu.mode_button", [modeLabel]))
        .button(tr("ui.dorios.insight.menu.activation_button"))
        .button(tr("ui.dorios.insight.menu.target_insight_button"))
        .button(tr("ui.dorios.insight.menu.display_root_button"))
        .button(tr("ui.dorios.insight.menu.namespace_button"))
        .button(tr("ui.dorios.insight.menu.reset_button"))
        .button(tr("ui.dorios.insight.menu.close_button"));

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    switch (result.selection) {
        case 0:
            await showModeMenu(player);
            break;
        case 1:
            await showActivationMenu(player);
            break;
        case 2:
            await showComponentsMenu(player);
            break;
        case 3:
            await showDisplayMenu(player);
            break;
        case 4:
            await showNamespaceMenu(player);
            break;
        case 5:
            resetPlayerOverrides(player);
            sendPlayerMessage(player, tr("ui.dorios.insight.feedback.reset_done"));
            break;
        default:
            return;
    }

    await openInsightMenu(player);
}
