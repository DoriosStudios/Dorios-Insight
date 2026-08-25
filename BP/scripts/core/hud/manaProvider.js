import { world } from "@minecraft/server";

const MANA_HUD_PROPERTY = "dorios:mana_hud";
const LEGACY_STATS_PROPERTY = "dorios:playerData.stats";
const LEGACY_MANA_OBJECTIVE = "dorios:mana";
const MAX_MANA_VALUE = 9999;
const MANA_FRAME_COUNT = 76;
const EMPTY_FRAME_CODE_POINT = 0xe84b;
const FONT_SCALE_OPTIONS = [50, 75, 100, 125, 150];

const HIDDEN_MANA_DATA = Object.freeze({
    manaVisible: 0,
    manaCurrent: 0,
    manaMax: 0,
    manaPercent: 0,
    manaTextScale: 100,
    manaText: ""
});

function clampInteger(value, min, max, fallback = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, Math.round(number)));
}

function readDynamicProperty(player, propertyId) {
    try {
        return player?.getDynamicProperty?.(propertyId);
    } catch {
        return undefined;
    }
}

function parseObject(raw) {
    if (raw && typeof raw === "object") {
        return raw;
    }

    if (typeof raw !== "string" || raw.length === 0) {
        return undefined;
    }

    try {
        const value = JSON.parse(raw);
        return value && typeof value === "object" ? value : undefined;
    } catch {
        return undefined;
    }
}

function normalizeManaText(value) {
    if (typeof value !== "string") {
        return "";
    }

    return Array.from(value.replace(/[\r\n]/g, ""))
        .slice(0, 8)
        .join("");
}

function normalizeTextScale(value) {
    const numeric = Number(value);
    const percent = Number.isFinite(numeric) && numeric > 0 && numeric <= 2
        ? numeric * 100
        : numeric;

    if (!Number.isFinite(percent)) {
        return 100;
    }

    return FONT_SCALE_OPTIONS.reduce((nearest, option) => (
        Math.abs(option - percent) < Math.abs(nearest - percent)
            ? option
            : nearest
    ), FONT_SCALE_OPTIONS[0]);
}

function buildFallbackManaText(percent) {
    const frameIndex = clampInteger(
        Math.floor((percent / 100) * (MANA_FRAME_COUNT - 1)),
        0,
        MANA_FRAME_COUNT - 1
    );

    return String.fromCodePoint(EMPTY_FRAME_CODE_POINT - frameIndex);
}

function normalizeSnapshot(snapshot) {
    if (!snapshot || snapshot.visible === false) {
        return undefined;
    }

    const manaMax = clampInteger(
        snapshot.maxMana ?? snapshot.max,
        0,
        MAX_MANA_VALUE
    );
    if (manaMax <= 0) {
        return undefined;
    }

    const manaCurrent = clampInteger(
        snapshot.currentMana ?? snapshot.current,
        0,
        manaMax
    );
    const manaPercent = clampInteger(
        (manaCurrent / manaMax) * 100,
        0,
        100
    );
    const manaText = normalizeManaText(
        snapshot.text ?? snapshot.glyph
    ) || buildFallbackManaText(manaPercent);

    return {
        manaVisible: 1,
        manaCurrent,
        manaMax,
        manaPercent,
        manaTextScale: normalizeTextScale(
            snapshot.textScale ?? snapshot.fontScale
        ),
        manaText
    };
}

function readPublishedSnapshot(player) {
    return normalizeSnapshot(parseObject(
        readDynamicProperty(player, MANA_HUD_PROPERTY)
    ));
}

function readLegacySnapshot(player) {
    const stats = parseObject(readDynamicProperty(player, LEGACY_STATS_PROPERTY));
    const manaMax = clampInteger(stats?.mana, 0, MAX_MANA_VALUE);
    if (manaMax <= 0) {
        return undefined;
    }

    let objective;
    try {
        objective = world.scoreboard.getObjective(LEGACY_MANA_OBJECTIVE);
    } catch {
        return undefined;
    }
    if (!objective) {
        return undefined;
    }

    let current = 0;
    try {
        current = objective.getScore(player?.scoreboardIdentity) ?? 0;
    } catch {
        current = 0;
    }

    return normalizeSnapshot({
        currentMana: current,
        maxMana: manaMax
    });
}

/**
 * Reads the optional Mana presentation contract without importing Trinkets.
 *
 * Preferred providers publish `dorios:mana_hud` as JSON with currentMana,
 * maxMana and optional text/textScale fields. The current Trinkets build is
 * supported through its scoreboard + stats dynamic-property pair. Missing or
 * malformed provider state always produces a hidden, zero-sized HUD entry.
 *
 * @param {import("@minecraft/server").Player} player
 */
export function collectManaHudData(player) {
    return readPublishedSnapshot(player)
        ?? readLegacySnapshot(player)
        ?? HIDDEN_MANA_DATA;
}
