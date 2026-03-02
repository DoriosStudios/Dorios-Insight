import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import {
    DisplayStyleLabels,
    EntityNameDisplayModeLabels,
    EntityNameResolveModeLabels,
    EffectDisplayModeLabels,
    FieldDisplayStyleOverrideLabels,
    InsightComponentDefinitions,
    InsightConfig,
    InsightModes,
    ToolIndicatorColorOptions,
    ToolIndicatorPlacementModeLabels,
    ToolTierIndicatorModeLabels,
    VisibilityPolicyLabels,
    VillagerProfessionDisplayModeLabels,
    getCurrentMode,
    getDisplayStyleIndex,
    getEntityNameDisplayModeIndex,
    getEntityNameResolveModeIndex,
    getEffectDisplayModeIndex,
    getFieldDisplayStyleOverrideIndex,
    getModePreset,
    getPlayerDisplaySettings,
    getToolIndicatorColorIndex,
    getToolIndicatorPlacementModeIndex,
    getToolTierIndicatorModeIndex,
    getVisibilityPolicyIndex,
    getVillagerProfessionDisplayModeIndex,
    isInsightComponentDeprecated,
    normalizeVisibilityPolicy,
    resetPlayerOverrides,
    setCurrentMode,
    setInsightGlobalEnabled,
    setPlayerActivation,
    updatePlayerOverrides
} from "./config.js";
import { registerNamespaceAlias } from "./namespaceInjection.js";

const modeSequence = [InsightModes.Essential, InsightModes.Detailed, InsightModes.Debug];

const customComponentKeySet = new Set([
    "customFields",
    "customEnergyInfo",
    "customRotationInfo",
    "customMachineProgress",
    "customFluidInfo",
    "customGasInfo",
    "customCobblestoneCount",
    "customVariantPreview"
]);

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

function getFieldDisplayStyleOverrideLabel(style) {
    const normalized = String(style || "").toLowerCase();
    const option = FieldDisplayStyleOverrideLabels.find((entry) => entry.key === normalized);
    return option?.label || FieldDisplayStyleOverrideLabels[0].label;
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

function getStateLabel(isEnabled, enabledLabel = "Enabled", disabledLabel = "Disabled") {
    return isEnabled ? enabledLabel : disabledLabel;
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
            { text: "\n§7" },
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

async function showModeMenu(player) {
    const currentMode = getCurrentMode();

    const form = new ActionFormData()
        .title(tr("ui.dorios.insight.mode_menu.title"))
        .body(tr("ui.dorios.insight.mode_menu.body", [getModeLabel(currentMode)]));

    for (const mode of modeSequence) {
        const preset = getModePreset(mode);
        const runtime = preset.runtime;

        form.button(
            tr("ui.dorios.insight.mode_menu.option", [
                getModeLabel(mode),
                runtime.maxDistance,
                runtime.updateIntervalTicks,
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
    const appliedMode = setCurrentMode(selectedMode);

    sendPlayerMessage(
        player,
        tr("ui.dorios.insight.feedback.mode_set", [getModeLabel(appliedMode)])
    );
}

async function showComponentGroupMenu(player, componentGroup) {
    const settings = getPlayerDisplaySettings(player);
    const visibilityLabels = VisibilityPolicyLabels.map((option) => option.label);

    const form = new ModalFormData()
        .title(tr(componentGroup.titleKey));

    for (const component of componentGroup.components) {
        const currentPolicy = settings.components[component.key];
        const componentTitle = getComponentOptionTitle(component);
        const componentDescription = buildComponentDescriptionRawtext(component);
        const currentPolicyLabel = getPolicyLabel(currentPolicy);
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

async function showStyleMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    const styleOptions = DisplayStyleLabels.map((option) => option.label);
    const effectModeOptions = EffectDisplayModeLabels.map((option) => option.label);
    const fieldOverrideOptions = FieldDisplayStyleOverrideLabels.map((option) => option.label);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.style_menu.title"))
        .dropdown(
            tr("ui.dorios.insight.style_menu.display_style", [getDisplayStyleLabel(runtime.displayStyle)]),
            styleOptions,
            {
                defaultValueIndex: getDisplayStyleIndex(runtime.displayStyle)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.effect_mode", [getEffectModeLabel(runtime.effectDisplayMode)]),
            effectModeOptions,
            {
                defaultValueIndex: getEffectDisplayModeIndex(runtime.effectDisplayMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.health_style", [getFieldDisplayStyleOverrideLabel(runtime.healthDisplayStyle)]),
            fieldOverrideOptions,
            {
                defaultValueIndex: getFieldDisplayStyleOverrideIndex(runtime.healthDisplayStyle)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.hunger_style", [getFieldDisplayStyleOverrideLabel(runtime.hungerDisplayStyle)]),
            fieldOverrideOptions,
            {
                defaultValueIndex: getFieldDisplayStyleOverrideIndex(runtime.hungerDisplayStyle)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.armor_style", [getFieldDisplayStyleOverrideLabel(runtime.armorDisplayStyle)]),
            fieldOverrideOptions,
            {
                defaultValueIndex: getFieldDisplayStyleOverrideIndex(runtime.armorDisplayStyle)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.absorption_style", [getFieldDisplayStyleOverrideLabel(runtime.absorptionDisplayStyle)]),
            fieldOverrideOptions,
            {
                defaultValueIndex: getFieldDisplayStyleOverrideIndex(runtime.absorptionDisplayStyle)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.style_menu.air_style", [getFieldDisplayStyleOverrideLabel(runtime.airDisplayStyle)]),
            fieldOverrideOptions,
            {
                defaultValueIndex: getFieldDisplayStyleOverrideIndex(runtime.airDisplayStyle)
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
            healthDisplayStyle: FieldDisplayStyleOverrideLabels[Number(formValues[2] ?? 0)]?.key ?? runtime.healthDisplayStyle,
            hungerDisplayStyle: FieldDisplayStyleOverrideLabels[Number(formValues[3] ?? 0)]?.key ?? runtime.hungerDisplayStyle,
            armorDisplayStyle: FieldDisplayStyleOverrideLabels[Number(formValues[4] ?? 0)]?.key ?? runtime.armorDisplayStyle,
            absorptionDisplayStyle: FieldDisplayStyleOverrideLabels[Number(formValues[5] ?? 0)]?.key ?? runtime.absorptionDisplayStyle,
            airDisplayStyle: FieldDisplayStyleOverrideLabels[Number(formValues[6] ?? 0)]?.key ?? runtime.airDisplayStyle
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.style_updated"));
}

async function showConditionsMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    const displayModeOptions = EntityNameDisplayModeLabels.map((option) => option.label);
    const resolveModeOptions = EntityNameResolveModeLabels.map((option) => option.label);
    const villagerProfessionOptions = VillagerProfessionDisplayModeLabels.map((option) => option.label);

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.conditions_menu.title"))
        .dropdown(
            tr("ui.dorios.insight.conditions_menu.name_order", [getEntityNameDisplayModeLabel(runtime.nameDisplayMode)]),
            displayModeOptions,
            {
                defaultValueIndex: getEntityNameDisplayModeIndex(runtime.nameDisplayMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.conditions_menu.name_method", [getEntityNameResolveModeLabel(runtime.nameResolveMode)]),
            resolveModeOptions,
            {
                defaultValueIndex: getEntityNameResolveModeIndex(runtime.nameResolveMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.conditions_menu.villager_profession", [getVillagerProfessionDisplayModeLabel(runtime.villagerProfessionDisplay)]),
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

    const blockNameResolveModeOptions = EntityNameResolveModeLabels.map((option) => option.label);
    const tierIndicatorOptions = ToolTierIndicatorModeLabels.map((option) => option.label);
    const toolIndicatorPlacementOptions = ToolIndicatorPlacementModeLabels.map((option) => option.label);
    const toolIndicatorColorOptions = ToolIndicatorColorOptions.map((option) => option.label);
    const customValueHint = tr("ui.dorios.insight.runtime.custom_hint");

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.system_menu.title"))
        .dropdown(
            tr("ui.dorios.insight.system_menu.block_name_method", [getEntityNameResolveModeLabel(runtime.blockNameResolveMode)]),
            blockNameResolveModeOptions,
            {
                defaultValueIndex: getEntityNameResolveModeIndex(runtime.blockNameResolveMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.system_menu.tier_indicator", [getToolTierIndicatorModeLabel(runtime.toolTierIndicatorMode)]),
            tierIndicatorOptions,
            {
                defaultValueIndex: getToolTierIndicatorModeIndex(runtime.toolTierIndicatorMode)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.system_menu.tool_position", [getToolIndicatorPlacementModeLabel(runtime.toolIndicatorPlacement)]),
            toolIndicatorPlacementOptions,
            {
                defaultValueIndex: getToolIndicatorPlacementModeIndex(runtime.toolIndicatorPlacement)
            }
        )
        .dropdown(
            tr("ui.dorios.insight.system_menu.tool_color", [getToolIndicatorColorLabel(runtime.toolIndicatorColor)]),
            toolIndicatorColorOptions,
            {
                defaultValueIndex: getToolIndicatorColorIndex(runtime.toolIndicatorColor)
            }
        )
        .slider(
            tr("ui.dorios.insight.system_menu.state_columns", [`${runtime.stateColumns}`]),
            1,
            InsightConfig.system.maxLayoutColumns,
            { defaultValue: runtime.stateColumns }
        )
        .textField("", customValueHint)
        .slider(
            tr("ui.dorios.insight.system_menu.tag_columns", [`${runtime.tagColumns}`]),
            1,
            InsightConfig.system.maxLayoutColumns,
            { defaultValue: runtime.tagColumns }
        )
        .textField("", customValueHint)
        .slider(
            tr("ui.dorios.insight.system_menu.family_columns", [`${runtime.familyColumns}`]),
            1,
            InsightConfig.system.maxLayoutColumns,
            { defaultValue: runtime.familyColumns }
        )
        .textField("", customValueHint);

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            blockNameResolveMode: EntityNameResolveModeLabels[Number(result.formValues[0] ?? 0)]?.key
                ?? runtime.blockNameResolveMode,
            toolTierIndicatorMode: ToolTierIndicatorModeLabels[Number(result.formValues[1] ?? 0)]?.key
                ?? runtime.toolTierIndicatorMode,
            toolIndicatorPlacement: ToolIndicatorPlacementModeLabels[Number(result.formValues[2] ?? 0)]?.key
                ?? runtime.toolIndicatorPlacement,
            toolIndicatorColor: ToolIndicatorColorOptions[Number(result.formValues[3] ?? 0)]?.key
                ?? runtime.toolIndicatorColor,
            stateColumns: resolveCustomNumberInput(
                result.formValues[5],
                Number(result.formValues[4] ?? runtime.stateColumns),
                1,
                InsightConfig.system.maxLayoutColumns
            ),
            tagColumns: resolveCustomNumberInput(
                result.formValues[7],
                Number(result.formValues[6] ?? runtime.tagColumns),
                1,
                InsightConfig.system.maxLayoutColumns
            ),
            familyColumns: resolveCustomNumberInput(
                result.formValues[9],
                Number(result.formValues[8] ?? runtime.familyColumns),
                1,
                InsightConfig.system.maxLayoutColumns
            )
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.system_updated"));
}

async function showRuntimeMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;
    const customValueHint = tr("ui.dorios.insight.runtime.custom_hint");
    const customValueLabel = "";

    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.runtime_menu.title"))
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
        .textField(customValueLabel, customValueHint)
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
        .textField(customValueLabel, customValueHint)
        .toggle(
            tr("ui.dorios.insight.runtime.include_invisible", [
                getStateLabel(runtime.includeInvisibleEntities)
            ]),
            { defaultValue: runtime.includeInvisibleEntities }
        )
        .toggle(
            tr("ui.dorios.insight.runtime.include_liquids", [
                getStateLabel(runtime.includeLiquidBlocks)
            ]),
            { defaultValue: runtime.includeLiquidBlocks }
        );

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
            ),
            maxVisibleStates: resolveCustomNumberInput(
                result.formValues[9],
                Number(result.formValues[8] ?? runtime.maxVisibleStates),
                0,
                InsightConfig.system.maxVisibleStatesCap
            ),
            maxVisibleBlockTags: resolveCustomNumberInput(
                result.formValues[11],
                Number(result.formValues[10] ?? runtime.maxVisibleBlockTags),
                0,
                InsightConfig.system.maxVisibleTagsCap
            ),
            maxVisibleEntityTags: resolveCustomNumberInput(
                result.formValues[13],
                Number(result.formValues[12] ?? runtime.maxVisibleEntityTags),
                0,
                InsightConfig.system.maxVisibleTagsCap
            ),
            maxVisibleEntityFamilies: resolveCustomNumberInput(
                result.formValues[15],
                Number(result.formValues[14] ?? runtime.maxVisibleEntityFamilies),
                0,
                InsightConfig.system.maxVisibleFamiliesCap
            ),
            maxVisibleEffects: resolveCustomNumberInput(
                result.formValues[17],
                Number(result.formValues[16] ?? runtime.maxVisibleEffects),
                0,
                InsightConfig.system.maxVisibleEffectsCap
            ),
            maxHeartDisplayHealth: resolveCustomNumberInput(
                result.formValues[19],
                Number(result.formValues[18] ?? runtime.maxHeartDisplayHealth),
                InsightConfig.system.minMaxHeartDisplayHealth,
                InsightConfig.system.maxMaxHeartDisplayHealth
            ),
            includeInvisibleEntities: Boolean(result.formValues[20] ?? runtime.includeInvisibleEntities),
            includeLiquidBlocks: Boolean(result.formValues[21] ?? runtime.includeLiquidBlocks)
        }
    });

    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.runtime_updated"));
}

async function showNamespaceMenu(player) {
    const form = new ModalFormData()
        .title(tr("ui.dorios.insight.namespace_menu.title"))
        .textField(
            tr("ui.dorios.insight.namespace_menu.namespace_label"),
            tr("ui.dorios.insight.namespace_menu.namespace_hint")
        )
        .textField(
            tr("ui.dorios.insight.namespace_menu.display_label"),
            tr("ui.dorios.insight.namespace_menu.display_hint")
        );

    const result = await form.show(player);
    if (result.canceled || !result.formValues) {
        return;
    }

    const namespaceInput = String(result.formValues[0] ?? "").trim();
    const displayName = String(result.formValues[1] ?? "").trim();

    if (!namespaceInput || !displayName) {
        sendPlayerMessage(player, tr("ui.dorios.insight.namespace_menu.error_required"));
        return;
    }

    const registration = registerNamespaceAlias(namespaceInput, displayName, true);
    if (!registration?.ok) {
        sendPlayerMessage(player, tr("ui.dorios.insight.namespace_menu.error_invalid"));
        return;
    }

    sendPlayerMessage(
        player,
        tr("ui.dorios.insight.namespace_menu.success", [registration.namespace, registration.name])
    );
}

function getComponentGroups() {
    const generalComponents = InsightComponentDefinitions.filter((component) => !customComponentKeySet.has(component.key));
    const customComponents = InsightComponentDefinitions.filter((component) => customComponentKeySet.has(component.key));

    return {
        general: {
            titleKey: "ui.dorios.insight.components.general.title",
            components: generalComponents
        },
        custom: {
            titleKey: "ui.dorios.insight.components.custom.title",
            components: customComponents
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

// ---- Sub-menus for grouped sections ----

async function showActivationMenu(player) {
    const settings = getPlayerDisplaySettings(player);
    const localStateLabel = getStateLabel(!settings.disabled, "Active", "Disabled");
    const globalStateLabel = getStateLabel(settings.globalEnabled, "Enabled", "Disabled");

    const form = new ActionFormData()
        .title(tr("ui.dorios.insight.activation_menu.title"))
        .button(tr("ui.dorios.insight.menu.local_toggle_button", [localStateLabel]))
        .button(tr("ui.dorios.insight.menu.global_toggle_button", [globalStateLabel]));

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
    }
}

async function showDisplayMenu(player) {
    const settings = getPlayerDisplaySettings(player);

    const form = new ActionFormData()
        .title(tr("ui.dorios.insight.display_menu.title"))
        .button(tr("ui.dorios.insight.menu.style_button", [getDisplayStyleLabel(settings.displayStyle)]))
        .button(tr("ui.dorios.insight.display_menu.entity_display_button"))
        .button(tr("ui.dorios.insight.display_menu.block_display_button"));

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    switch (result.selection) {
        case 0:
            await showStyleMenu(player);
            break;
        case 1:
            await showConditionsMenu(player);
            break;
        case 2:
            await showSystemSettingsMenu(player);
            break;
    }
}

async function showComponentsMenu(player) {
    const componentGroups = getComponentGroups();

    const form = new ActionFormData()
        .title(tr("ui.dorios.insight.components_menu.title"))
        .button(tr("ui.dorios.insight.menu.components_general_button"))
        .button(tr("ui.dorios.insight.menu.components_custom_button"));

    const result = await form.show(player);
    if (result.canceled) {
        return;
    }

    switch (result.selection) {
        case 0:
            await showComponentGroupMenu(player, componentGroups.general);
            break;
        case 1:
            await showComponentGroupMenu(player, componentGroups.custom);
            break;
    }
}

export async function openInsightMenu(player) {
    const settings = getPlayerDisplaySettings(player);

    const modeLabel = getModeLabel(settings.mode);
    const localStateLabel = getStateLabel(!settings.disabled, "Active", "Disabled");
    const globalStateLabel = getStateLabel(settings.globalEnabled, "Enabled", "Disabled");

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
        .button(tr("ui.dorios.insight.menu.display_button"))
        .button(tr("ui.dorios.insight.menu.components_button"))
        .button(tr("ui.dorios.insight.menu.namespace_button"))
        .button(tr("ui.dorios.insight.menu.runtime_button"))
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
            await showDisplayMenu(player);
            break;
        case 3:
            await showComponentsMenu(player);
            break;
        case 4:
            await showNamespaceMenu(player);
            break;
        case 5:
            await showRuntimeMenu(player);
            break;
        case 6:
            resetPlayerOverrides(player);
            sendPlayerMessage(player, tr("ui.dorios.insight.feedback.reset_done"));
            break;
        default:
            return;
    }

    await openInsightMenu(player);
}
