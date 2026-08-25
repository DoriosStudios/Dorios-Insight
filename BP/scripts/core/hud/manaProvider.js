import { system } from "@minecraft/server";

const MAX_MANA_VALUE = 9999;
const MANA_FRAME_COUNT = 76;
const EMPTY_FRAME_CODE_POINT = 0xe84b;
const FONT_SCALE_OPTIONS = [50, 75, 100, 125, 150];
const PROVIDER_TIMEOUT_TICKS = 40;

const runtimeManaByPlayer = new Map();

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

function getPlayerId(playerOrId) {
    if (typeof playerOrId === "string") {
        return playerOrId;
    }

    return typeof playerOrId?.id === "string" ? playerOrId.id : undefined;
}

function readRuntimeSnapshot(player) {
    const playerId = getPlayerId(player);
    if (!playerId) {
        return undefined;
    }

    const entry = runtimeManaByPlayer.get(playerId);
    if (!entry) {
        return undefined;
    }

    const age = system.currentTick - entry.updatedTick;
    if (age < 0 || age > PROVIDER_TIMEOUT_TICKS) {
        runtimeManaByPlayer.delete(playerId);
        return undefined;
    }

    return entry.data;
}

/**
 * Accepts an optional Mana snapshot from another add-on in the shared script
 * runtime. Nothing is persisted, so removing or reloading the provider cannot
 * leave a stale Mana bar behind.
 *
 * @param {import("@minecraft/server").Player | string} playerOrId
 * @param {object} snapshot
 */
export function publishManaHudData(playerOrId, snapshot) {
    const playerId = getPlayerId(playerOrId);
    const data = normalizeSnapshot(snapshot);
    if (!playerId || !data) {
        if (playerId) runtimeManaByPlayer.delete(playerId);
        return false;
    }

    runtimeManaByPlayer.set(playerId, {
        data,
        updatedTick: system.currentTick
    });
    return true;
}

/**
 * @param {import("@minecraft/server").Player | string} playerOrId
 */
export function clearManaHudData(playerOrId) {
    const playerId = getPlayerId(playerOrId);
    return playerId ? runtimeManaByPlayer.delete(playerId) : false;
}

/**
 * Reads the optional Mana presentation contract without importing Trinkets.
 *
 * Preferred providers call DoriosAPI.insight.manaHud.publish with currentMana,
 * maxMana and optional text/textScale fields. Missing, expired or malformed
 * provider state produces a hidden, zero-sized HUD entry.
 *
 * @param {import("@minecraft/server").Player} player
 */
export function collectManaHudData(player) {
    return readRuntimeSnapshot(player)
        ?? HIDDEN_MANA_DATA;
}
