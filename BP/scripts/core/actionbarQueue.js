import { system, world } from "@minecraft/server";
import { CHANNEL_ACTIONBAR_SECONDARY } from "./const.js";
import { clearLatched, sendLatchedTitle } from "./titleBus.js";

export const ACTIONBAR_QUEUE_LIFETIME_TICKS = 100;

const ACTIONBAR_KEEPALIVE_TICKS = 40;
const MAX_VISIBLE_MESSAGES = 2;

const stateByPlayer = new Map();
let initialized = false;

function normalizeNamespace(namespace) {
  const value = String(namespace ?? "").trim().toLowerCase();
  return /^[a-z0-9_.-]+$/.test(value) ? value : "";
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
  return `{${entries.join(",")}}`;
}

function payloadKey(payload) {
  return typeof payload === "string"
    ? `string:${payload}`
    : `raw:${stableStringify(payload)}`;
}

function toRawtextParts(payload) {
  if (typeof payload === "string") {
    return [{ text: payload }];
  }

  if (Array.isArray(payload)) {
    return payload.flatMap(toRawtextParts);
  }

  if (Array.isArray(payload?.rawtext)) {
    return payload.rawtext;
  }

  return payload && typeof payload === "object" ? [payload] : [];
}

function selectDisplays(entries) {
  if (entries.length === 1) {
    return entries[0].slot === "secondary"
      ? { primary: undefined, secondary: entries[0] }
      : { primary: entries[0], secondary: undefined };
  }

  return {
    secondary: entries[0],
    primary: entries[1],
  };
}

function composeSecondaryTitle(entry) {
  return {
    rawtext: [
      { text: CHANNEL_ACTIONBAR_SECONDARY },
      ...toRawtextParts(entry.payload),
    ],
  };
}

function ensurePlayerState(player) {
  const playerId = String(player?.id ?? "");
  if (!playerId) {
    return undefined;
  }

  if (!stateByPlayer.has(playerId)) {
    stateByPlayer.set(playerId, {
      player,
      entries: [],
      lastRenderedKey: undefined,
      lastRenderTick: -Infinity,
      ownsPrimary: false,
      showsSecondary: false,
    });
  }

  const state = stateByPlayer.get(playerId);
  state.player = player;
  return state;
}

function normalizeLifetimeTicks(value) {
  const ticks = Math.floor(Number(value));
  return Number.isFinite(ticks) && ticks > 0
    ? ticks
    : ACTIONBAR_QUEUE_LIFETIME_TICKS;
}

function normalizeSlot(value) {
  return value === "secondary" ? "secondary" : "primary";
}

function insertEntry(state, entry) {
  if (entry.slot === "secondary") {
    const primary = [...state.entries]
      .reverse()
      .find((value) => value.slot !== "secondary");
    state.entries = primary ? [entry, primary] : [entry];
    return;
  }

  const secondary = state.entries.find((value) => value.slot === "secondary");
  if (secondary) {
    state.entries = [secondary, entry];
    return;
  }

  state.entries.push(entry);
  if (state.entries.length > MAX_VISIBLE_MESSAGES) {
    state.entries.splice(0, state.entries.length - MAX_VISIBLE_MESSAGES);
  }
}

function removeExpiredEntries(state, currentTick) {
  const nextEntries = state.entries.filter(
    (entry) => entry.expiresAt > currentTick,
  );
  const changed = nextEntries.length !== state.entries.length;
  state.entries = nextEntries;
  return changed;
}

function renderState(state, currentTick, force = false) {
  const renderKey = state.entries
    .map((entry) => `${entry.slot}:${entry.namespace}:${entry.payloadKey}`)
    .join("\n");
  const keepaliveDue = currentTick - state.lastRenderTick >=
    ACTIONBAR_KEEPALIVE_TICKS;

  if (!force && renderKey === state.lastRenderedKey && !keepaliveDue) {
    return;
  }

  const { primary, secondary } = selectDisplays(state.entries);
  let rendered = true;

  try {
    if (primary) {
      state.player.onScreenDisplay.setActionBar(primary.payload);
      state.ownsPrimary = true;
    } else if (state.ownsPrimary) {
      state.player.onScreenDisplay.setActionBar("");
      state.ownsPrimary = false;
    }
  } catch {
    rendered = false;
  }

  try {
    if (secondary) {
      sendLatchedTitle(
        state.player,
        CHANNEL_ACTIONBAR_SECONDARY,
        composeSecondaryTitle(secondary),
      );
      state.showsSecondary = true;
    } else if (state.showsSecondary) {
      clearLatched(state.player, CHANNEL_ACTIONBAR_SECONDARY);
      state.showsSecondary = false;
    }
  } catch {
    rendered = false;
  }

  if (rendered) {
    state.lastRenderedKey = renderKey;
    state.lastRenderTick = currentTick;
  }
}

/**
 * Sends or refreshes one message in the cooperative actionbar queue.
 *
 * The oldest visible message occupies Insight's secondary HUD element above
 * the native actionbar, while the newest message uses the native actionbar.
 * A sender may pin its entry to the secondary element with `options.slot`.
 * Re-sending the same payload from the same namespace only renews that entry,
 * which lets two addons update without swapping displays.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {string} namespace Stable addon/channel namespace.
 * @param {import("@minecraft/server").RawMessage|string|Array<import("@minecraft/server").RawMessage|string>} payload
 * @param {{ lifetimeTicks?: number, slot?: "primary"|"secondary" }} [options]
 * @returns {boolean}
 */
export function sendQueuedActionbar(
  player,
  namespace,
  payload,
  options = {},
) {
  const normalizedNamespace = normalizeNamespace(namespace);
  const state = ensurePlayerState(player);

  if (!normalizedNamespace || !state) {
    return false;
  }

  if (payload === undefined || payload === null || payload === "") {
    return clearQueuedActionbar(player, normalizedNamespace);
  }

  const currentTick = system.currentTick;
  removeExpiredEntries(state, currentTick);

  const nextPayloadKey = payloadKey(payload);
  const nextSlot = normalizeSlot(options.slot);
  const existing = state.entries.find(
    (entry) => entry.namespace === normalizedNamespace &&
      entry.payloadKey === nextPayloadKey,
  );
  const expiresAt = currentTick + normalizeLifetimeTicks(options.lifetimeTicks);

  if (existing) {
    existing.payload = payload;
    existing.expiresAt = expiresAt;
    if (existing.slot !== nextSlot) {
      state.entries = state.entries.filter((entry) => entry !== existing);
      existing.slot = nextSlot;
      if (nextSlot === "secondary") {
        state.entries = state.entries.filter(
          (entry) => entry.slot !== "secondary",
        );
      }
      insertEntry(state, existing);
    }
    return true;
  }

  if (nextSlot === "secondary") {
    state.entries = state.entries.filter(
      (entry) => entry.slot !== "secondary",
    );
  }

  insertEntry(state, {
    namespace: normalizedNamespace,
    payload,
    payloadKey: nextPayloadKey,
    expiresAt,
    slot: nextSlot,
  });

  return true;
}

/**
 * Clears all messages, or only messages owned by one namespace.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {string} [namespace]
 * @returns {boolean}
 */
export function clearQueuedActionbar(player, namespace) {
  const state = ensurePlayerState(player);
  if (!state) {
    return false;
  }

  if (namespace === undefined) {
    state.entries = [];
    return true;
  }

  const normalizedNamespace = normalizeNamespace(namespace);
  if (!normalizedNamespace) {
    return false;
  }

  state.entries = state.entries.filter(
    (entry) => entry.namespace !== normalizedNamespace,
  );
  return true;
}

export function initializeActionbarQueue() {
  if (initialized) {
    return;
  }

  initialized = true;

  system.runInterval(() => {
    const currentTick = system.currentTick;

    for (const [playerId, state] of stateByPlayer) {
      removeExpiredEntries(state, currentTick);
      renderState(state, currentTick);

      if (!state.entries.length && state.lastRenderedKey === "") {
        stateByPlayer.delete(playerId);
      }
    }
  }, 1);

  world.afterEvents.playerLeave.subscribe((event) => {
    stateByPlayer.delete(event.playerId);
  });
}
