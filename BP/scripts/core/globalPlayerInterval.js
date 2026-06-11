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

/** @typedef {import("./const.js").CoreSettings} CoreSettings */
/** @typedef {import("./const.js").MainSettings} MainSettings */

function clampNumber(value, min, max, fallback) {
    const number = Math.floor(Number(value));
    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, number));
}

function getSettingsSection(settings, key) {
    const section = settings?.[key];
    return section && typeof section === "object" ? section : settings;
}

function normalizeMainSettings(settings = {}) {
    const main = getSettingsSection(settings, "main");

    return {
        enabled: main.enabled !== false,
        updateIntervalTicks: clampNumber(
            main.updateIntervalTicks,
            CORE_LIMITS.minUpdateIntervalTicks,
            CORE_LIMITS.maxUpdateIntervalTicks,
            DEFAULT_CORE_SETTINGS.main.updateIntervalTicks
        ),
        maxDistance: clampNumber(
            main.maxDistance,
            CORE_LIMITS.minMaxDistance,
            CORE_LIMITS.maxMaxDistance,
            DEFAULT_CORE_SETTINGS.main.maxDistance
        ),
        panelStyleId: clampNumber(
            main.panelStyleId,
            CORE_LIMITS.minPanelStyleId,
            CORE_LIMITS.maxPanelStyleId,
            DEFAULT_CORE_SETTINGS.main.panelStyleId
        )
    };
}

function normalizeBlockSettings(settings = {}) {
    const block = getSettingsSection(settings, "block");

    return {
        energyContainers: block.energyContainers === true,
        fluidContainers: block.fluidContainers === true,
        preferredTool: block.preferredTool === true,
        toolTier: block.toolTier === true,
        location: block.location === true,
        identifier: block.identifier === true,
        blockTags: block.blockTags === true,
        states: block.states === true
    };
}

function normalizeEntitySettings(settings = {}) {
    const entity = settings?.entity;
    return entity && typeof entity === "object" ? { ...entity } : {};
}

/**
 * @param {Partial<CoreSettings> | Record<string, unknown>} [settings]
 * @returns {CoreSettings}
 */
function normalizeSettings(settings = {}) {
    return {
        main: normalizeMainSettings(settings),
        block: normalizeBlockSettings(settings),
        entity: normalizeEntitySettings(settings),
    };
}

/** @returns {CoreSettings} */
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

/**
 * @param {Partial<CoreSettings> | Record<string, unknown>} settings
 * @returns {CoreSettings}
 */
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

/** @returns {CoreSettings} */
export function getCoreSettings() {
    if (!cachedSettings) {
        cachedSettings = loadSettings();
    }

    return cachedSettings;
}

/**
 * @param {Partial<CoreSettings> | Record<string, unknown>} settings
 * @returns {CoreSettings}
 */
export function setCoreSettings(settings) {
    const current = getCoreSettings();
    const hasSections = Boolean(settings?.main || settings?.block || settings?.entity);

    if (!hasSections) {
        return saveSettings({
            main: {
                ...current.main,
                ...settings
            },
            block: {
                ...current.block,
                ...settings
            },
            entity: current.entity
        });
    }

    return saveSettings({
        main: {
            ...current.main,
            ...settings?.main
        },
        block: {
            ...current.block,
            ...settings?.block
        },
        entity: {
            ...current.entity,
            ...settings?.entity
        }
    });
}

/** @param {MainSettings} mainSettings */
function buildStyleTextureField(mainSettings) {
    const style = PANEL_STYLES[mainSettings.panelStyleId] ?? PANEL_STYLES[0];
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

/**
 * @param {Array<object>} parts
 * @param {MainSettings} mainSettings
 */
function buildWailaRawMessage(parts, mainSettings) {
    const rawtext = normalizeRawtextParts(parts);

    if (!rawtext.length) {
        return {
            rawtext: [{ text: EMPTY_WAILA_TEXT }]
        };
    }

    return {
        rawtext: [
            { text: `${CHANNEL_WAILA}${buildStyleTextureField(mainSettings)}` },
            ...rawtext
        ]
    };
}

/** @param {CoreSettings} settings */
function composeTargetMessage(player, settings) {
    const target = resolvePlayerTarget(player, settings.main);

    if (target.kind === TargetKinds.Entity) {
        const entityTarget = composeEntityTarget(target.entity);
        return buildWailaRawMessage(entityTarget.rawtext, settings.main);
    }

    if (target.kind === TargetKinds.Block) {
        return buildWailaRawMessage(buildBlockLabel(target.block, settings.block), settings.main);
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
    if (!settings.main.enabled || systemTick % settings.main.updateIntervalTicks !== 0) {
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
