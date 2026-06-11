import { system, world } from "@minecraft/server";
import {
    CHANNEL_WAILA,
    CORE_LIMITS,
    CORE_SETTINGS_DYNAMIC_PROPERTY,
    DEFAULT_CORE_SETTINGS,
    EMPTY_WAILA_TEXT,
    PANEL_STYLES,
    WAILA_STYLE_TEXTURE_FIELD_LENGTH
} from "./const.js";
import { resolvePlayerTarget, TargetKinds } from "./target.js";
import { buildBlockLabel } from "./blocks/general.js";
import { composeEntityTarget } from "./entities/index.js";

let initialized = false;
let systemTick = 0;
let cachedSettings;

function clampNumber(value, min, max, fallback) {
    const number = Math.floor(Number(value));
    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, number));
}

function normalizeSettings(settings = {}) {
    return {
        enabled: settings.enabled !== false,
        updateIntervalTicks: clampNumber(
            settings.updateIntervalTicks,
            CORE_LIMITS.minUpdateIntervalTicks,
            CORE_LIMITS.maxUpdateIntervalTicks,
            DEFAULT_CORE_SETTINGS.updateIntervalTicks
        ),
        maxDistance: clampNumber(
            settings.maxDistance,
            CORE_LIMITS.minMaxDistance,
            CORE_LIMITS.maxMaxDistance,
            DEFAULT_CORE_SETTINGS.maxDistance
        ),
        panelStyleId: clampNumber(
            settings.panelStyleId,
            CORE_LIMITS.minPanelStyleId,
            CORE_LIMITS.maxPanelStyleId,
            DEFAULT_CORE_SETTINGS.panelStyleId
        )
    };
}

function loadSettings() {
    try {
        const raw = world.getDynamicProperty(CORE_SETTINGS_DYNAMIC_PROPERTY);
        if (typeof raw === "string" && raw.length) {
            return normalizeSettings(JSON.parse(raw));
        }
    } catch {
        // Use defaults when the property is missing or malformed.
    }

    return normalizeSettings(DEFAULT_CORE_SETTINGS);
}

function saveSettings(settings) {
    const normalized = normalizeSettings(settings);

    try {
        world.setDynamicProperty(CORE_SETTINGS_DYNAMIC_PROPERTY, JSON.stringify(normalized));
    } catch {
        // Runtime settings still work in memory if persistence is unavailable.
    }

    cachedSettings = normalized;
    return normalized;
}

export function getCoreSettings() {
    if (!cachedSettings) {
        cachedSettings = loadSettings();
    }

    return cachedSettings;
}

export function setCoreSettings(settings) {
    return saveSettings({
        ...getCoreSettings(),
        ...settings
    });
}

function buildStyleTextureField(settings) {
    const style = PANEL_STYLES[settings.panelStyleId] ?? PANEL_STYLES[0];
    return style.texture
        .slice(0, WAILA_STYLE_TEXTURE_FIELD_LENGTH)
        .padEnd(WAILA_STYLE_TEXTURE_FIELD_LENGTH, "~");
}

function normalizeRawtextParts(parts) {
    if (!Array.isArray(parts)) {
        return [];
    }

    return parts.filter((part) => {
        if (!part || typeof part !== "object") {
            return false;
        }

        return typeof part.text === "string" || typeof part.translate === "string";
    });
}

function buildWailaRawMessage(parts, settings) {
    const rawtext = normalizeRawtextParts(parts);

    if (!rawtext.length) {
        return {
            rawtext: [{ text: EMPTY_WAILA_TEXT }]
        };
    }

    return {
        rawtext: [
            { text: `${CHANNEL_WAILA}${buildStyleTextureField(settings)}` },
            ...rawtext
        ]
    };
}

function composeTargetMessage(player, settings) {
    const target = resolvePlayerTarget(player, settings);

    if (target.kind === TargetKinds.Entity) {
        const entityTarget = composeEntityTarget(target.entity);
        return buildWailaRawMessage(entityTarget.rawtext, settings);
    }

    if (target.kind === TargetKinds.Block) {
        return buildWailaRawMessage(buildBlockLabel(target.block), settings);
    }

    return {
        rawtext: [{ text: EMPTY_WAILA_TEXT }]
    };
}

function sendWailaMessage(player, message) {
    try {
        player.runCommand(`titleraw @s title ${JSON.stringify(message)}`);
        player.runCommand(`titleraw @s subtitle ${JSON.stringify({ rawtext: [{ text: "" }] })}`);
    } catch {
        // Skip players that are not ready yet.
    }
}

function tickPlayers() {
    systemTick += 1;

    const settings = getCoreSettings();
    if (!settings.enabled || systemTick % settings.updateIntervalTicks !== 0) {
        return;
    }

    for (const player of world.getAllPlayers()) {
        try {
            sendWailaMessage(player, composeTargetMessage(player, settings));
        } catch {
            sendWailaMessage(player, { rawtext: [{ text: EMPTY_WAILA_TEXT }] });
        }
    }
}

export function initializeGlobalPlayerInterval() {
    if (initialized) {
        return;
    }

    initialized = true;

    system.runInterval(tickPlayers, 1);
}
