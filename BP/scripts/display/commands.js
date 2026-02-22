import { system } from "@minecraft/server";
import {
    InsightComponentDefinitions,
    InsightModePresets,
    InsightModes,
    VisibilityPolicyLabels,
    getCurrentModeLabel,
    isInsightComponentDeprecated,
    isInsightGloballyEnabled,
    normalizeVisibilityPolicy,
    setCurrentMode,
    setInsightGlobalEnabled,
    setPlayerActivation,
    updatePlayerOverrides
} from "./config.js";
import { registerNamespaceAlias } from "./namespaceInjection.js";
import { openInsightMenu } from "./menu.js";

const modeSet = new Set([InsightModes.Essential, InsightModes.Detailed, InsightModes.Debug]);
const commandActionSet = new Set(["menu", "mode", "activate", "global", "namespace"]);
let commandsRegistered = false;

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
        "§e/utilitycraft:insight mode <essential|detailed|debug> §7- Set global mode",
        "§e/utilitycraft:insight activate <on|off|toggle> §7- Toggle your local activation",
        "§e/utilitycraft:insight activate <component> <show|sneak|creative|hide> §7- Set component visibility",
        "§e/utilitycraft:insight global <on|off|toggle|status> §7- Toggle Insight globally",
        "§e/utilitycraft:insight namespace add <namespace> <displayName> §7- Map a namespace to an addon name"
    ].join("\n");
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
        sendMessage(player, "§cUsage: /utilitycraft:insight activate <component> <show|sneak|creative|hide>");
        return;
    }

    const policy = normalizeVisibilityPolicy(policyArg);
    if (!getVisibilityPolicyValues().includes(policy)) {
        sendMessage(player, "§cInvalid policy. Use: show, sneak, creative, hide.");
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

function handleNamespaceCommand(player, primaryValue, secondaryValue, tertiaryValue) {
    const action = String(primaryValue || "").trim().toLowerCase();

    if (!action) {
        sendMessage(player, "§cUsage: /utilitycraft:insight namespace add <namespace> <displayName>");
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
        sendMessage(player, "§cUsage: /utilitycraft:insight namespace add <namespace> <displayName>");
        return;
    }

    const result = registerNamespaceAlias(namespaceValue, displayNameValue, true);
    if (!result?.ok) {
        sendMessage(player, "§cInvalid namespace or display name.");
        return;
    }

    sendMessage(player, `§aNamespace ${result.namespace} mapped to ${result.name}.`);
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

    sendMessage(player, getUsage());
}

export function initializeInsightCommands() {
    if (commandsRegistered) {
        return;
    }

    commandsRegistered = true;

    DoriosAPI.register.command({
        name: "insight",
        description: "Dorios Insight runtime controls",
        permissionLevel: "any",
        parameters: [
            {
                name: "action",
                type: "enum",
                enum: ["menu", "mode", "activate", "global", "namespace"]
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
            const player = origin?.sourceEntity;
            if (player?.typeId !== "minecraft:player") {
                console.warn("[Dorios' Insight] utilitycraft:insight can only be used by players.");
                return;
            }

            handleRootInsightCommand(player, action, value, value2, value3);
        }
    });
}
