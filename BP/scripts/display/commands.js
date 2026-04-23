import { system, world } from "@minecraft/server";
import {
    HudQuickCounterModeLabels,
    HudQuickCounterModes,
    InsightComponentDefinitions,
    InsightModePresets,
    InsightModes,
    VisibilityPolicyLabels,
    WailaAnchorModeLabels,
    WailaColorThemeLabels,
    WailaHorizontalOffsetModeLabels,
    WailaVerticalOffsetModeLabels,
    getCurrentMode,
    getCurrentModeLabel,
    getModePreset,
    getPlayerDisplaySettings,
    getRecognizedHostName,
    isAdminPlayer,
    isInsightComponentDeprecated,
    isInsightGloballyEnabled,
    normalizeHudQuickCounterMode,
    normalizeVisibilityPolicy,
    normalizeWailaAnchorMode,
    normalizeWailaColorTheme,
    normalizeWailaOffsetMode,
    setCurrentMode,
    setInsightGlobalEnabled,
    setPlayerActivation,
    syncPlayerAdministrativeAccess,
    updatePlayerOverrides
} from "./config.js";
import {
    NamespaceRegistrationSources,
    getRegisteredNamespaceEntries,
    registerNamespaceAlias,
    resetRegisteredNamespaceEntries
} from "./namespaceInjection.js";
import { openInsightMenu } from "./menu.js";
import { resetVanillaHud, resetAllPlayersHud } from "./hudDataCollector.js";

const modeSet = new Set([InsightModes.Essential, InsightModes.Detailed, InsightModes.Debug]);
const commandActionSet = new Set(["menu", "mode", "activate", "global", "namespace", "reset", "waila", "qc"]);
const wailaCommandActionSet = new Set(["status", "style", "anchor", "horizontal", "vertical", "render", "reset"]);
const quickCounterCommandActionSet = new Set(["status", "toggle", "icon", "first", "second", "reset"]);
let commandsRegistered = false;

const wailaThemeKeySet = new Set(WailaColorThemeLabels.map((option) => option.key));
const wailaAnchorKeySet = new Set(WailaAnchorModeLabels.map((option) => option.key));
const wailaOffsetKeySet = new Set(WailaHorizontalOffsetModeLabels.map((option) => option.key));
const quickCounterModeKeySet = new Set(HudQuickCounterModeLabels.map((option) => option.key));

const wailaActionAliases = Object.freeze({
    theme: "style",
    color: "style",
    colour: "style",
    x: "horizontal",
    horizontal_offset: "horizontal",
    h: "horizontal",
    y: "vertical",
    vertical_offset: "vertical",
    v: "vertical",
    entity: "render",
    entity_render: "render",
    entityrender: "render",
    show_entity: "render",
    showentity: "render"
});

const quickCounterActionAliases = Object.freeze({
    primary: "first",
    secondary: "second"
});

const quickCounterModeAliases = Object.freeze({
    selected: HudQuickCounterModes.HandStack,
    hand: HudQuickCounterModes.HandStack,
    hand_stack: HudQuickCounterModes.HandStack,
    handstack: HudQuickCounterModes.HandStack,
    stack: HudQuickCounterModes.HandStack,
    total: HudQuickCounterModes.InventoryTotal,
    inventory: HudQuickCounterModes.InventoryTotal,
    inventory_total: HudQuickCounterModes.InventoryTotal,
    inventorytotal: HudQuickCounterModes.InventoryTotal,
    durability: HudQuickCounterModes.DurabilityCurrent,
    current: HudQuickCounterModes.DurabilityCurrent,
    durability_current: HudQuickCounterModes.DurabilityCurrent,
    durabilitycurrent: HudQuickCounterModes.DurabilityCurrent,
    max: HudQuickCounterModes.DurabilityMax,
    durability_max: HudQuickCounterModes.DurabilityMax,
    durabilitymax: HudQuickCounterModes.DurabilityMax,
    percent: HudQuickCounterModes.DurabilityPercent,
    durability_percent: HudQuickCounterModes.DurabilityPercent,
    durabilitypercent: HudQuickCounterModes.DurabilityPercent,
    xp: HudQuickCounterModes.XpLevel,
    level: HudQuickCounterModes.XpLevel,
    xp_level: HudQuickCounterModes.XpLevel,
    xplevel: HudQuickCounterModes.XpLevel,
    speed: HudQuickCounterModes.Speed,
    velocity: HudQuickCounterModes.Speed,
    hide: HudQuickCounterModes.Hidden,
    hidden: HudQuickCounterModes.Hidden,
    none: HudQuickCounterModes.Hidden,
    off: HudQuickCounterModes.Hidden
});

const componentAliases = Object.freeze({
    namespace: "namespace",
    states: "blockStates",
    blockstates: "blockStates",
    tags: "blockTags",
    blocktags: "blockTags",
    health: "health",
    armor: "armor",
    air: "airBubbles",
    bubbles: "airBubbles",
    airbubbles: "airBubbles",
    technical: "technical",
    coordinates: "coordinates",
    position: "coordinates",
    id: "typeId",
    typeid: "typeId",
    effecthearts: "effectHearts",
    frozenhearts: "frozenHearts",
    hunger: "hunger",
    hungereffect: "hungerEffect",
    animalhearts: "animalHearts",
    entitytags: "entityTags",
    families: "entityFamilies",
    entityfamilies: "entityFamilies",
    velocity: "velocity",
    namespacedebug: "namespaceResolution",
    namespaceresolution: "namespaceResolution"
});

function sendMessage(player, message) {
    try {
        player.sendMessage(message);
    } catch {
        // Ignore message errors.
    }
}

function getVisibilityPolicyValues() {
    return VisibilityPolicyLabels.map((option) => option.key);
}

function normalizeCommandToken(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");
}

function getOptionLabel(options, value) {
    const normalized = normalizeCommandToken(value);
    const option = options.find((entry) => normalizeCommandToken(entry?.key) === normalized);
    return option?.label || String(value || "-");
}

function getCurrentRuntimePreset() {
    return getModePreset(getCurrentMode())?.runtime ?? {};
}

function getQuickCounterSlotRuntimeKey(slot) {
    return slot === "first" ? "hudQuickCounterPrimaryMode" : "hudQuickCounterSecondaryMode";
}

function getQuickCounterSlotLabel(slot) {
    return slot === "first" ? "first" : "second";
}

function resolveToggleCommand(rawValue, currentValue, defaultValue = currentValue) {
    const normalized = normalizeCommandToken(rawValue || "status");

    switch (normalized) {
        case "":
        case "status":
            return { type: "status", value: Boolean(currentValue) };
        case "on":
        case "enable":
        case "enabled":
        case "true":
            return { type: "set", value: true };
        case "off":
        case "disable":
        case "disabled":
        case "false":
            return { type: "set", value: false };
        case "toggle":
            return { type: "set", value: !Boolean(currentValue) };
        case "reset":
            return { type: "set", value: Boolean(defaultValue) };
        default:
            return undefined;
    }
}

function resolveWailaAction(rawValue) {
    const normalized = normalizeCommandToken(rawValue || "status");
    const resolved = wailaActionAliases[normalized] || normalized;
    return wailaCommandActionSet.has(resolved) ? resolved : undefined;
}

function resolveWailaThemeValue(rawValue) {
    const normalized = normalizeCommandToken(rawValue);
    if (!normalized || !wailaThemeKeySet.has(normalized)) {
        return undefined;
    }

    return normalizeWailaColorTheme(normalized);
}

function resolveWailaAnchorValue(rawValue) {
    const normalized = normalizeCommandToken(rawValue);
    if (!normalized || !wailaAnchorKeySet.has(normalized)) {
        return undefined;
    }

    return normalizeWailaAnchorMode(normalized);
}

function resolveWailaOffsetValue(rawValue, axis) {
    const normalized = normalizeCommandToken(rawValue);
    const axisAliases = axis === "horizontal"
        ? { left: "negative", center: "center", right: "positive" }
        : { up: "negative", center: "center", down: "positive" };
    const resolved = axisAliases[normalized] || normalized;

    if (!resolved || !wailaOffsetKeySet.has(resolved)) {
        return undefined;
    }

    return normalizeWailaOffsetMode(resolved);
}

function resolveQuickCounterAction(rawValue) {
    const normalized = normalizeCommandToken(rawValue || "status");
    const resolved = quickCounterActionAliases[normalized] || normalized;
    return quickCounterCommandActionSet.has(resolved) ? resolved : undefined;
}

function resolveQuickCounterModeValue(rawValue) {
    const normalized = normalizeCommandToken(rawValue);
    if (!normalized) {
        return undefined;
    }

    if (quickCounterModeAliases[normalized]) {
        return quickCounterModeAliases[normalized];
    }

    if (!quickCounterModeKeySet.has(normalized)) {
        return undefined;
    }

    return normalizeHudQuickCounterMode(normalized);
}

function ensureAdminControl(player, actionLabel) {
    if (isAdminPlayer(player)) {
        return true;
    }

    const hostName = getRecognizedHostName();
    const hostSuffix = hostName ? ` Recognized host: ${hostName}.` : "";
    sendMessage(player, `§cOnly the world host/admin can ${actionLabel}.${hostSuffix}`);
    return false;
}

function resolveComponentKey(rawValue) {
    const normalized = String(rawValue || "").trim().toLowerCase();
    if (!normalized) {
        return undefined;
    }

    if (componentAliases[normalized]) {
        return componentAliases[normalized];
    }

    const direct = InsightComponentDefinitions.find((component) => component.key.toLowerCase() === normalized);
    return direct?.key;
}

function getUsage() {
    return [
        "§6Dorios' Insight Commands",
        "§e/utilitycraft:insight menu §7- Open the configuration menu",
        "§e/utilitycraft:insightmenu §7- Open the configuration menu",
        "§e/utilitycraft:insight mode <essential|detailed|debug> §7- Set global mode",
        "§e/utilitycraft:insightmode <essential|detailed|debug> §7- Set global mode",
        "§e/utilitycraft:insight activate <on|off|toggle> §7- Toggle your local activation",
        "§e/utilitycraft:insightactivate <on|off|toggle> §7- Toggle your local activation",
        "§e/utilitycraft:insight activate <component> <show|sneak|creative|sneak_creative|hide> §7- Set component visibility",
        "§e/utilitycraft:insight global <on|off|toggle|status> §7- Toggle Insight globally",
        "§e/utilitycraft:insightglobal <on|off|toggle|status> §7- Toggle Insight globally",
        "§e/utilitycraft:insight waila <status|style|anchor|horizontal|vertical|render|reset> §7- Control WAILA settings",
        "§e/utilitycraft:insightwaila style <default|dark|copper|magenta|cyan|blood|ascane> §7- Set WAILA style",
        "§e/utilitycraft:insightwaila anchor <top_left|top_middle|top_right|left_middle|right_middle|bottom_left|bottom_right> §7- Set WAILA anchor",
        "§e/utilitycraft:insightwaila horizontal <left|center|right> §7- Set WAILA horizontal offset",
        "§e/utilitycraft:insightwaila vertical <up|center|down> §7- Set WAILA vertical offset",
        "§e/utilitycraft:insightwaila render <on|off|toggle|status> §7- Toggle entity render",
        "§e/utilitycraft:insight qc <status|toggle|icon|first|second|reset> §7- Control quick counter settings",
        "§e/utilitycraft:insightqc first <selected|total|durability|durability_max|durability_percent|xp|speed|hidden|reset> §7- Set the first quick counter",
        "§e/utilitycraft:insightqc second <selected|total|durability|durability_max|durability_percent|xp|speed|hidden|reset> §7- Set the second quick counter",
        "§e/utilitycraft:insight namespace add <namespace|identifier> <displayName> §7- Map a namespace or type identifier to an addon name",
        "§e/utilitycraft:insight namespace list [scripts|commands|all] §7- List namespace registrations",
        "§e/utilitycraft:insight namespace reset [commands|scripts|all] §7- Reset namespace registrations",
        "§e/utilitycraft:insight reset §7- Reset vanilla HUD for yourself",
        "§e/utilitycraft:insight reset all §7- Reset vanilla HUD for all players",
        "§e/utilitycraft:insightreset §7- Reset vanilla HUD for all players"
    ].join("\n");
}

function getPlayerFromOrigin(origin) {
    const player = origin?.sourceEntity;
    if (player?.typeId !== "minecraft:player") {
        console.warn("[Dorios' Insight] utilitycraft:insight command can only be used by players.");
        return undefined;
    }

    try {
        syncPlayerAdministrativeAccess(player);
    } catch {
        // Ignore admin sync errors during command execution.
    }

    return player;
}

function registerInsightCommand(definition) {
    try {
        DoriosAPI.register.command(definition);
    } catch (error) {
        console.warn(`[Dorios' Insight] Failed to register command ${definition?.name}: ${error}`);
    }
}

function handleModeCommand(player, modeValue) {
    const modeArg = String(modeValue || "").trim().toLowerCase();

    if (!modeArg) {
        sendMessage(player, `§aCurrent mode: ${getCurrentModeLabel()}`);
        return;
    }

    if (!modeSet.has(modeArg)) {
        sendMessage(player, "§cInvalid mode. Use: essential, detailed, debug.");
        return;
    }

    const applied = setCurrentMode(modeArg);
    sendMessage(player, `§aDorios' Insight global mode set to ${InsightModePresets[applied].label}.`);
}

function handleActivateCommand(player, primaryValue, secondaryValue) {
    const firstArg = String(primaryValue || "").trim().toLowerCase();

    if (!firstArg) {
        sendMessage(player, "§cUsage: /utilitycraft:insight activate <on|off|toggle|component policy>");
        return;
    }

    if (firstArg === "on") {
        setPlayerActivation(player, true);
        sendMessage(player, "§aDorios' Insight activated for your player.");
        return;
    }

    if (firstArg === "off") {
        setPlayerActivation(player, false);
        sendMessage(player, "§eDorios' Insight deactivated for your player.");
        return;
    }

    if (firstArg === "toggle") {
        const current = updatePlayerOverrides(player, {});
        const nextActive = current.disabled;
        setPlayerActivation(player, nextActive);
        sendMessage(player, `§aDorios' Insight is now ${nextActive ? "active" : "disabled"} for your player.`);
        return;
    }

    const componentKey = resolveComponentKey(firstArg);
    if (!componentKey) {
        sendMessage(player, "§cUnknown component key.");
        return;
    }

    if (isInsightComponentDeprecated(componentKey)) {
        sendMessage(player, `§8Component ${componentKey} is deprecated/non-functional for now.§r`);
        return;
    }

    const policyArg = String(secondaryValue || "").trim().toLowerCase();
    if (!policyArg) {
        sendMessage(player, "§cUsage: /utilitycraft:insight activate <component> <show|sneak|creative|sneak_creative|hide>");
        return;
    }

    const policy = normalizeVisibilityPolicy(policyArg);
    if (!getVisibilityPolicyValues().includes(policy)) {
        sendMessage(player, "§cInvalid policy. Use: show, sneak, creative, sneak_creative, hide.");
        return;
    }

    updatePlayerOverrides(player, {
        components: {
            [componentKey]: policy
        }
    });

    sendMessage(player, `§aComponent ${componentKey} set to ${policy}.`);
}

function handleGlobalCommand(player, primaryValue) {
    const action = String(primaryValue || "status").trim().toLowerCase();
    const current = isInsightGloballyEnabled();

    if (action === "status") {
        sendMessage(player, `§aGlobal Insight status: ${current ? "enabled" : "disabled"}.`);
        sendMessage(player, `§7Recognized host/admin: §b${getRecognizedHostName() || "not assigned"}§r.`);
        return;
    }

    if (!ensureAdminControl(player, "change Insight globally")) {
        return;
    }

    if (action === "toggle") {
        const next = setInsightGlobalEnabled(!current);
        sendMessage(player, `§aDorios' Insight is now ${next ? "enabled" : "disabled"} globally.`);
        return;
    }

    if (action === "on") {
        setInsightGlobalEnabled(true);
        sendMessage(player, "§aDorios' Insight enabled globally.");
        return;
    }

    if (action === "off") {
        setInsightGlobalEnabled(false);
        sendMessage(player, "§eDorios' Insight disabled globally.");
        return;
    }

    sendMessage(player, "§cUsage: /utilitycraft:insight global <on|off|toggle|status>");
}

function sendWailaStatus(player) {
    const settings = getPlayerDisplaySettings(player);

    sendMessage(player, [
        "§6WAILA Settings",
        `§7Style: §b${getOptionLabel(WailaColorThemeLabels, settings.wailaColorTheme)}§r`,
        `§7Anchor: §b${getOptionLabel(WailaAnchorModeLabels, settings.wailaAnchor)}§r`,
        `§7Horizontal: §b${getOptionLabel(WailaHorizontalOffsetModeLabels, settings.wailaHorizontalOffset)}§r`,
        `§7Vertical: §b${getOptionLabel(WailaVerticalOffsetModeLabels, settings.wailaVerticalOffset)}§r`,
        `§7Entity Render: §b${settings.wailaShowEntityRender ? "on" : "off"}§r`
    ].join("\n"));
}

function handleWailaReset(player, secondaryValue) {
    const presetRuntime = getCurrentRuntimePreset();
    const scope = normalizeCommandToken(secondaryValue || "all");
    const runtimePatch = {};

    switch (scope) {
        case "all":
            runtimePatch.wailaColorTheme = presetRuntime.wailaColorTheme;
            runtimePatch.wailaAnchor = presetRuntime.wailaAnchor;
            runtimePatch.wailaHorizontalOffset = presetRuntime.wailaHorizontalOffset;
            runtimePatch.wailaVerticalOffset = presetRuntime.wailaVerticalOffset;
            runtimePatch.wailaShowEntityRender = Boolean(presetRuntime.wailaShowEntityRender);
            break;
        case "style":
        case "theme":
            runtimePatch.wailaColorTheme = presetRuntime.wailaColorTheme;
            break;
        case "anchor":
            runtimePatch.wailaAnchor = presetRuntime.wailaAnchor;
            break;
        case "horizontal":
        case "x":
            runtimePatch.wailaHorizontalOffset = presetRuntime.wailaHorizontalOffset;
            break;
        case "vertical":
        case "y":
            runtimePatch.wailaVerticalOffset = presetRuntime.wailaVerticalOffset;
            break;
        case "render":
        case "entity":
        case "entity_render":
            runtimePatch.wailaShowEntityRender = Boolean(presetRuntime.wailaShowEntityRender);
            break;
        default:
            sendMessage(player, "§cUsage: /utilitycraft:insightwaila reset [all|style|anchor|horizontal|vertical|render]");
            return;
    }

    updatePlayerOverrides(player, { runtime: runtimePatch });
    sendMessage(player, `§aWAILA ${scope === "all" ? "settings" : scope} reset.`);
}

function handleWailaCommand(player, primaryValue, secondaryValue) {
    const action = resolveWailaAction(primaryValue || "status");
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    if (!action) {
        sendMessage(player, "§cUsage: /utilitycraft:insightwaila <status|style|anchor|horizontal|vertical|render|reset> ...");
        return;
    }

    if (action === "status") {
        sendWailaStatus(player);
        return;
    }

    if (action === "reset") {
        handleWailaReset(player, secondaryValue);
        return;
    }

    const value = normalizeCommandToken(secondaryValue);

    if (action === "style") {
        if (!value || value === "status") {
            sendMessage(player, `§aCurrent WAILA style: ${getOptionLabel(WailaColorThemeLabels, runtime.wailaColorTheme)}.`);
            return;
        }

        if (value === "reset") {
            updatePlayerOverrides(player, { runtime: { wailaColorTheme: getCurrentRuntimePreset().wailaColorTheme } });
            sendMessage(player, "§aWAILA style reset.");
            return;
        }

        const nextTheme = resolveWailaThemeValue(value);
        if (!nextTheme) {
            sendMessage(player, "§cUsage: /utilitycraft:insightwaila style <default|dark|copper|magenta|cyan|blood|ascane>");
            return;
        }

        updatePlayerOverrides(player, { runtime: { wailaColorTheme: nextTheme } });
        sendMessage(player, `§aWAILA style set to ${getOptionLabel(WailaColorThemeLabels, nextTheme)}.`);
        return;
    }

    if (action === "anchor") {
        if (!value || value === "status") {
            sendMessage(player, `§aCurrent WAILA anchor: ${getOptionLabel(WailaAnchorModeLabels, runtime.wailaAnchor)}.`);
            return;
        }

        if (value === "reset") {
            updatePlayerOverrides(player, { runtime: { wailaAnchor: getCurrentRuntimePreset().wailaAnchor } });
            sendMessage(player, "§aWAILA anchor reset.");
            return;
        }

        const nextAnchor = resolveWailaAnchorValue(value);
        if (!nextAnchor) {
            sendMessage(player, "§cUsage: /utilitycraft:insightwaila anchor <top_left|top_middle|top_right|left_middle|right_middle|bottom_left|bottom_right>");
            return;
        }

        updatePlayerOverrides(player, { runtime: { wailaAnchor: nextAnchor } });
        sendMessage(player, `§aWAILA anchor set to ${getOptionLabel(WailaAnchorModeLabels, nextAnchor)}.`);
        return;
    }

    if (action === "horizontal") {
        if (!value || value === "status") {
            sendMessage(player, `§aCurrent WAILA horizontal offset: ${getOptionLabel(WailaHorizontalOffsetModeLabels, runtime.wailaHorizontalOffset)}.`);
            return;
        }

        if (value === "reset") {
            updatePlayerOverrides(player, { runtime: { wailaHorizontalOffset: getCurrentRuntimePreset().wailaHorizontalOffset } });
            sendMessage(player, "§aWAILA horizontal offset reset.");
            return;
        }

        const nextHorizontalOffset = resolveWailaOffsetValue(value, "horizontal");
        if (!nextHorizontalOffset) {
            sendMessage(player, "§cUsage: /utilitycraft:insightwaila horizontal <left|center|right>");
            return;
        }

        updatePlayerOverrides(player, { runtime: { wailaHorizontalOffset: nextHorizontalOffset } });
        sendMessage(player, `§aWAILA horizontal offset set to ${getOptionLabel(WailaHorizontalOffsetModeLabels, nextHorizontalOffset)}.`);
        return;
    }

    if (action === "vertical") {
        if (!value || value === "status") {
            sendMessage(player, `§aCurrent WAILA vertical offset: ${getOptionLabel(WailaVerticalOffsetModeLabels, runtime.wailaVerticalOffset)}.`);
            return;
        }

        if (value === "reset") {
            updatePlayerOverrides(player, { runtime: { wailaVerticalOffset: getCurrentRuntimePreset().wailaVerticalOffset } });
            sendMessage(player, "§aWAILA vertical offset reset.");
            return;
        }

        const nextVerticalOffset = resolveWailaOffsetValue(value, "vertical");
        if (!nextVerticalOffset) {
            sendMessage(player, "§cUsage: /utilitycraft:insightwaila vertical <up|center|down>");
            return;
        }

        updatePlayerOverrides(player, { runtime: { wailaVerticalOffset: nextVerticalOffset } });
        sendMessage(player, `§aWAILA vertical offset set to ${getOptionLabel(WailaVerticalOffsetModeLabels, nextVerticalOffset)}.`);
        return;
    }

    if (action === "render") {
        const renderAction = resolveToggleCommand(secondaryValue, runtime.wailaShowEntityRender, getCurrentRuntimePreset().wailaShowEntityRender);
        if (!renderAction) {
            sendMessage(player, "§cUsage: /utilitycraft:insightwaila render <on|off|toggle|status|reset>");
            return;
        }

        if (renderAction.type === "status") {
            sendMessage(player, `§aWAILA entity render is ${runtime.wailaShowEntityRender ? "enabled" : "disabled"}.`);
            return;
        }

        updatePlayerOverrides(player, { runtime: { wailaShowEntityRender: renderAction.value } });
        sendMessage(player, `§aWAILA entity render ${renderAction.value ? "enabled" : "disabled"}.`);
        return;
    }

    sendMessage(player, "§cUsage: /utilitycraft:insightwaila <status|style|anchor|horizontal|vertical|render|reset> ...");
}

function sendQuickCounterStatus(player) {
    const settings = getPlayerDisplaySettings(player);

    sendMessage(player, [
        "§6Quick Counter Settings",
        `§7Enabled: §b${settings.hudQuickCounterEnabled ? "on" : "off"}§r`,
        `§7Icon: §b${settings.hudQuickCounterShowIcon ? "on" : "off"}§r`,
        `§7First: §b${getOptionLabel(HudQuickCounterModeLabels, settings.hudQuickCounterPrimaryMode)}§r`,
        `§7Second: §b${getOptionLabel(HudQuickCounterModeLabels, settings.hudQuickCounterSecondaryMode)}§r`
    ].join("\n"));
}

function handleQuickCounterReset(player, secondaryValue) {
    const presetRuntime = getCurrentRuntimePreset();
    const scope = normalizeCommandToken(secondaryValue || "all");
    const runtimePatch = {};

    switch (scope) {
        case "all":
            runtimePatch.hudQuickCounterEnabled = Boolean(presetRuntime.hudQuickCounterEnabled);
            runtimePatch.hudQuickCounterPrimaryMode = presetRuntime.hudQuickCounterPrimaryMode;
            runtimePatch.hudQuickCounterSecondaryMode = presetRuntime.hudQuickCounterSecondaryMode;
            runtimePatch.hudQuickCounterShowIcon = Boolean(presetRuntime.hudQuickCounterShowIcon);
            break;
        case "first":
        case "primary":
            runtimePatch.hudQuickCounterPrimaryMode = presetRuntime.hudQuickCounterPrimaryMode;
            break;
        case "second":
        case "secondary":
            runtimePatch.hudQuickCounterSecondaryMode = presetRuntime.hudQuickCounterSecondaryMode;
            break;
        case "toggle":
        case "enabled":
            runtimePatch.hudQuickCounterEnabled = Boolean(presetRuntime.hudQuickCounterEnabled);
            break;
        case "icon":
            runtimePatch.hudQuickCounterShowIcon = Boolean(presetRuntime.hudQuickCounterShowIcon);
            break;
        default:
            sendMessage(player, "§cUsage: /utilitycraft:insightqc reset [all|first|second|toggle|icon]");
            return;
    }

    updatePlayerOverrides(player, { runtime: runtimePatch });
    sendMessage(player, `§aQuick counter ${scope === "all" ? "settings" : scope} reset.`);
}

function handleQuickCounterCommand(player, primaryValue, secondaryValue) {
    const action = resolveQuickCounterAction(primaryValue || "status");
    const settings = getPlayerDisplaySettings(player);
    const runtime = settings.runtime;

    if (!action) {
        sendMessage(player, "§cUsage: /utilitycraft:insightqc <status|toggle|icon|first|second|reset> ...");
        return;
    }

    if (action === "status") {
        sendQuickCounterStatus(player);
        return;
    }

    if (action === "reset") {
        handleQuickCounterReset(player, secondaryValue);
        return;
    }

    if (action === "toggle") {
        const toggleAction = resolveToggleCommand(secondaryValue, runtime.hudQuickCounterEnabled, getCurrentRuntimePreset().hudQuickCounterEnabled);
        if (!toggleAction) {
            sendMessage(player, "§cUsage: /utilitycraft:insightqc toggle <on|off|toggle|status|reset>");
            return;
        }

        if (toggleAction.type === "status") {
            sendMessage(player, `§aQuick counter is ${runtime.hudQuickCounterEnabled ? "enabled" : "disabled"}.`);
            return;
        }

        updatePlayerOverrides(player, { runtime: { hudQuickCounterEnabled: toggleAction.value } });
        sendMessage(player, `§aQuick counter ${toggleAction.value ? "enabled" : "disabled"}.`);
        return;
    }

    if (action === "icon") {
        const iconAction = resolveToggleCommand(secondaryValue, runtime.hudQuickCounterShowIcon, getCurrentRuntimePreset().hudQuickCounterShowIcon);
        if (!iconAction) {
            sendMessage(player, "§cUsage: /utilitycraft:insightqc icon <on|off|toggle|status|reset>");
            return;
        }

        if (iconAction.type === "status") {
            sendMessage(player, `§aQuick counter icon is ${runtime.hudQuickCounterShowIcon ? "enabled" : "disabled"}.`);
            return;
        }

        updatePlayerOverrides(player, { runtime: { hudQuickCounterShowIcon: iconAction.value } });
        sendMessage(player, `§aQuick counter icon ${iconAction.value ? "enabled" : "disabled"}.`);
        return;
    }

    const modeValue = normalizeCommandToken(secondaryValue);
    const runtimeKey = getQuickCounterSlotRuntimeKey(action);
    const slotLabel = getQuickCounterSlotLabel(action);

    if (!modeValue || modeValue === "status") {
        sendMessage(player, `§aQuick counter ${slotLabel}: ${getOptionLabel(HudQuickCounterModeLabels, runtime[runtimeKey])}.`);
        return;
    }

    if (modeValue === "reset") {
        updatePlayerOverrides(player, { runtime: { [runtimeKey]: getCurrentRuntimePreset()[runtimeKey] } });
        sendMessage(player, `§aQuick counter ${slotLabel} reset.`);
        return;
    }

    const nextMode = resolveQuickCounterModeValue(modeValue);
    if (!nextMode) {
        sendMessage(player, "§cUsage: /utilitycraft:insightqc <first|second> <selected|total|durability|durability_max|durability_percent|xp|speed|hidden|reset>");
        return;
    }

    updatePlayerOverrides(player, {
        runtime: {
            hudQuickCounterEnabled: true,
            [runtimeKey]: nextMode
        }
    });

    sendMessage(player, `§aQuick counter ${slotLabel} set to ${getOptionLabel(HudQuickCounterModeLabels, nextMode)}.`);
}

function normalizeNamespaceRegistrationSourceScope(value, allowAll = true) {
    const normalized = String(value || "").trim().toLowerCase();

    if (!normalized) {
        return allowAll ? "all" : undefined;
    }

    if (allowAll && normalized === "all") {
        return "all";
    }

    if (normalized === "script" || normalized === "scripts") {
        return NamespaceRegistrationSources.Script;
    }

    if (normalized === "command" || normalized === "commands") {
        return NamespaceRegistrationSources.Command;
    }

    return undefined;
}

function getNamespaceRegistrationScopeLabel(scope) {
    switch (scope) {
        case NamespaceRegistrationSources.Script:
            return "script";
        case NamespaceRegistrationSources.Command:
            return "command";
        default:
            return "all";
    }
}

function buildNamespaceRegistrationLine(entry) {
    const sourceLabel = entry.registrationSource === NamespaceRegistrationSources.Script
        ? "script"
        : "command";
    const identifierPart = entry.identifier ? ` | identifier: ${entry.identifier}` : "";
    const targetPart = entry.typeId ? ` | target: ${entry.typeId}` : "";
    const contentPart = entry.type === "identifier" || entry.type === "namespace"
        ? ""
        : ` | tracked: ${entry.contentCount}`;

    return `§7[${sourceLabel}] §b${entry.name}§r §8(${entry.namespace})§r${identifierPart}${targetPart}${contentPart}`;
}

function sendNamespaceRegistrationList(player, sourceScope) {
    if (sourceScope === "all") {
        const scriptEntries = getRegisteredNamespaceEntries(NamespaceRegistrationSources.Script);
        const commandEntries = getRegisteredNamespaceEntries(NamespaceRegistrationSources.Command);

        if (!scriptEntries.length && !commandEntries.length) {
            sendMessage(player, "§eNo namespace registrations found.");
            return;
        }

        sendMessage(player, `§6Namespace registrations | scripts: ${scriptEntries.length} | commands: ${commandEntries.length}`);

        if (scriptEntries.length) {
            sendMessage(player, "§bScripts:");
            for (const entry of scriptEntries) {
                sendMessage(player, buildNamespaceRegistrationLine(entry));
            }
        }

        if (commandEntries.length) {
            sendMessage(player, "§dCommands:");
            for (const entry of commandEntries) {
                sendMessage(player, buildNamespaceRegistrationLine(entry));
            }
        }

        return;
    }

    const entries = getRegisteredNamespaceEntries(sourceScope);
    if (!entries.length) {
        sendMessage(player, `§eNo ${getNamespaceRegistrationScopeLabel(sourceScope)} namespace registrations found.`);
        return;
    }

    sendMessage(player, `§6${getNamespaceRegistrationScopeLabel(sourceScope)} namespace registrations: ${entries.length}`);
    for (const entry of entries) {
        sendMessage(player, buildNamespaceRegistrationLine(entry));
    }
}

function resetNamespaceRegistrationsForScope(player, sourceScope) {
    const resetResult = sourceScope === "all"
        ? resetRegisteredNamespaceEntries()
        : resetRegisteredNamespaceEntries({ source: sourceScope });

    if (!resetResult.ok) {
        sendMessage(player, `§eNo ${getNamespaceRegistrationScopeLabel(sourceScope)} namespace registrations found.`);
        return;
    }

    sendMessage(
        player,
        `§aReset ${resetResult.count} ${getNamespaceRegistrationScopeLabel(sourceScope)} namespace registration${resetResult.count === 1 ? "" : "s"}.`
    );
}

function handleNamespaceCommand(player, primaryValue, secondaryValue, tertiaryValue) {
    const action = String(primaryValue || "").trim().toLowerCase();

    if (!action) {
        sendMessage(player, "§cUsage: /utilitycraft:insight namespace <add|set|list|reset> ...");
        return;
    }

    if (action === "list") {
        const sourceScope = normalizeNamespaceRegistrationSourceScope(secondaryValue, true);
        if (!sourceScope) {
            sendMessage(player, "§cUsage: /utilitycraft:insight namespace list [scripts|commands|all]");
            return;
        }

        sendNamespaceRegistrationList(player, sourceScope);
        return;
    }

    if (action === "reset") {
        const sourceScope = normalizeNamespaceRegistrationSourceScope(secondaryValue || "commands", true);
        if (!sourceScope) {
            sendMessage(player, "§cUsage: /utilitycraft:insight namespace reset [commands|scripts|all]");
            return;
        }

        resetNamespaceRegistrationsForScope(player, sourceScope);
        return;
    }

    let namespaceArg;
    let displayNameArg;

    if (action === "add" || action === "set") {
        namespaceArg = secondaryValue;
        displayNameArg = tertiaryValue;
    } else {
        namespaceArg = primaryValue;
        displayNameArg = secondaryValue;
    }

    const namespaceValue = typeof namespaceArg === "string" ? namespaceArg.trim() : "";
    const displayNameValue = typeof displayNameArg === "string" ? displayNameArg.trim() : "";

    if (!namespaceValue || !displayNameValue) {
        sendMessage(player, "§cUsage: /utilitycraft:insight namespace add <namespace|identifier> <displayName>");
        return;
    }

    const result = registerNamespaceAlias(namespaceValue, displayNameValue, true);
    if (!result?.ok) {
        sendMessage(player, "§cInvalid namespace, identifier or display name.");
            return; // Stop execution after invalid input
    }

    sendMessage(player, `§aMapping ${result.target} set to ${result.name}.`);
}

function handleResetCommand(player, primaryValue) {
    const scope = String(primaryValue || "").trim().toLowerCase();

    if (scope === "all") {
        resetAllPlayersHud(world);
        sendMessage(player, "§aVanilla HUD reset for all players.");
        return;
    }

    // Default: reset just this player.
    resetVanillaHud(player);
    sendMessage(player, "§aVanilla HUD reset for your player.");
}

function handleRootInsightCommand(player, action, value, value2, value3) {
    const normalizedAction = String(action || "").trim().toLowerCase();

    if (!commandActionSet.has(normalizedAction)) {
        sendMessage(player, getUsage());
        return;
    }

    if (normalizedAction === "menu") {
        system.run(async () => {
            await openInsightMenu(player);
        });
        return;
    }

    if (normalizedAction === "mode") {
        handleModeCommand(player, value);
        return;
    }

    if (normalizedAction === "activate") {
        handleActivateCommand(player, value, value2);
        return;
    }

    if (normalizedAction === "global") {
        handleGlobalCommand(player, value);
        return;
    }

    if (normalizedAction === "namespace") {
        handleNamespaceCommand(player, value, value2, value3);
        return;
    }

    if (normalizedAction === "waila") {
        handleWailaCommand(player, value, value2);
        return;
    }

    if (normalizedAction === "qc") {
        handleQuickCounterCommand(player, value, value2);
        return;
    }

    if (normalizedAction === "reset") {
        handleResetCommand(player, value);
        return;
    }

    sendMessage(player, getUsage());
}

export function initializeInsightCommands() {
    if (commandsRegistered) {
        return;
    }

    commandsRegistered = true;

    registerInsightCommand({
        name: "insight",
        description: "Dorios Insight runtime controls",
        permissionLevel: "any",
        parameters: [
            {
                name: "action",
                type: "enum",
                enum: ["menu", "mode", "activate", "global", "namespace", "waila", "qc", "reset"]
            },
            {
                name: "value",
                type: "string",
                optional: true
            },
            {
                name: "value2",
                type: "string",
                optional: true
            },
            {
                name: "value3",
                type: "string",
                optional: true
            }
        ],
        callback(origin, action, value, value2, value3) {
            const player = getPlayerFromOrigin(origin);
            if (!player) {
                return;
            }

            handleRootInsightCommand(player, action, value, value2, value3);
        }
    });

    registerInsightCommand({
        name: "insightmenu",
        description: "Open Dorios Insight menu",
        permissionLevel: "any",
        parameters: [],
        callback(origin) {
            const player = getPlayerFromOrigin(origin);
            if (!player) {
                return;
            }

            handleRootInsightCommand(player, "menu");
        }
    });

    registerInsightCommand({
        name: "insightmode",
        description: "Set Dorios Insight mode",
        permissionLevel: "any",
        parameters: [
            {
                name: "mode",
                type: "string",
                optional: true
            }
        ],
        callback(origin, mode) {
            const player = getPlayerFromOrigin(origin);
            if (!player) {
                return;
            }

            handleRootInsightCommand(player, "mode", mode);
        }
    });

    registerInsightCommand({
        name: "insightactivate",
        description: "Activate Dorios Insight or set component policy",
        permissionLevel: "any",
        parameters: [
            {
                name: "value",
                type: "string",
                optional: true
            },
            {
                name: "value2",
                type: "string",
                optional: true
            }
        ],
        callback(origin, value, value2) {
            const player = getPlayerFromOrigin(origin);
            if (!player) {
                return;
            }

            handleRootInsightCommand(player, "activate", value, value2);
        }
    });

    registerInsightCommand({
        name: "insightglobal",
        description: "Set Dorios Insight global status",
        permissionLevel: "any",
        parameters: [
            {
                name: "value",
                type: "string",
                optional: true
            }
        ],
        callback(origin, value) {
            const player = getPlayerFromOrigin(origin);
            if (!player) {
                return;
            }

            handleRootInsightCommand(player, "global", value);
        }
    });

    registerInsightCommand({
        name: "insightnamespace",
        description: "Register namespace alias for Dorios Insight",
        permissionLevel: "any",
        parameters: [
            {
                name: "action",
                type: "string",
                optional: true
            },
            {
                name: "namespace",
                type: "string",
                optional: true
            },
            {
                name: "displayName",
                type: "string",
                optional: true
            }
        ],
        callback(origin, action, namespaceValue, displayNameValue) {
            const player = getPlayerFromOrigin(origin);
            if (!player) {
                return;
            }

            handleRootInsightCommand(player, "namespace", action, namespaceValue, displayNameValue);
        }
    });

    registerInsightCommand({
        name: "insightwaila",
        description: "Adjust Dorios Insight WAILA settings",
        permissionLevel: "any",
        parameters: [
            {
                name: "action",
                type: "enum",
                enum: ["status", "style", "anchor", "horizontal", "vertical", "render", "reset"],
                optional: true
            },
            {
                name: "value",
                type: "string",
                optional: true
            }
        ],
        callback(origin, action, value) {
            const player = getPlayerFromOrigin(origin);
            if (!player) {
                return;
            }

            handleWailaCommand(player, action, value);
        }
    });

    registerInsightCommand({
        name: "insightqc",
        description: "Adjust Dorios Insight quick counter settings",
        permissionLevel: "any",
        parameters: [
            {
                name: "action",
                type: "enum",
                enum: ["status", "toggle", "icon", "first", "second", "reset"],
                optional: true
            },
            {
                name: "value",
                type: "string",
                optional: true
            }
        ],
        callback(origin, action, value) {
            const player = getPlayerFromOrigin(origin);
            if (!player) {
                return;
            }

            handleQuickCounterCommand(player, action, value);
        }
    });

    registerInsightCommand({
        name: "insightreset",
        description: "Reset vanilla HUD for all players (fallback)",
        permissionLevel: "any",
        parameters: [],
        callback(origin) {
            const player = getPlayerFromOrigin(origin);
            if (!player) {
                return;
            }

            handleResetCommand(player, "all");
        }
    });
}
