import { system, world } from "@minecraft/server";
import {
    CHANNEL_WAILA,
    CORE_LIMITS,
    CORE_SETTINGS_DYNAMIC_PROPERTY,
    DEFAULT_CORE_SETTINGS,
    EMPTY_WAILA_TEXT
} from "./const.js";
import { resolvePlayerTarget, TargetKinds } from "./target.js";
import { composeBlockTarget } from "./blocks/index.js";
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

function sanitizeLine(value) {
    return String(value ?? "")
        .replace(/\r/g, "")
        .replace(/\t/g, " ")
        .trim();
}

function buildWailaText(lines) {
    const body = lines
        .map(sanitizeLine)
        .filter((line) => line.length > 0)
        .join("\n");

    return body.length ? `${CHANNEL_WAILA}${body}` : EMPTY_WAILA_TEXT;
}

function composeTargetText(player, settings) {
    const target = resolvePlayerTarget(player, settings);

    if (target.kind === TargetKinds.Entity) {
        const entityTarget = composeEntityTarget(target.entity);
        return buildWailaText(entityTarget.lines);
    }

    if (target.kind === TargetKinds.Block) {
        const blockTarget = composeBlockTarget(target.block);
        return buildWailaText(blockTarget.lines);
    }

    return EMPTY_WAILA_TEXT;
}

function sendWailaText(player, text) {
    try {
        player.runCommand(`titleraw @s title ${JSON.stringify({ rawtext: [{ text }] })}`);
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
            sendWailaText(player, composeTargetText(player, settings));
        } catch {
            sendWailaText(player, EMPTY_WAILA_TEXT);
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
