import { system, world } from "@minecraft/server";
import { CHANNEL_EFFECTS } from "../const.js";
import { sendLatchedTitle } from "../titleBus.js";
import {
  EFFECTS_MAX_VISIBLE,
  EFFECTS_NAME_LENGTH,
  EFFECTS_PROTOCOL_VERSION,
  getInsightEffectDefinition,
  normalizeInsightEffectId,
} from "./catalog.js";
import {
  clearInsightEntityEffects,
  removeInsightEntityEffect,
  replaceInsightEntityEffects,
  upsertInsightEntityEffect,
} from "./store.js";

export const CUSTOM_EFFECTS_MAX_VISIBLE = EFFECTS_MAX_VISIBLE;

const EFFECTS_DISCOVER_EVENT = "insight:effects_discover_v1";
const EFFECTS_READY_EVENT = "insight:effects_ready_v1";
const EFFECTS_SEND_EVENT = "insight:effects_send_v1";
const LEGACY_EFFECTS_DISCOVER_EVENT = "insight:custom_effects_discover_v1";
const LEGACY_EFFECTS_READY_EVENT = "insight:custom_effects_ready_v1";
const LEGACY_EFFECTS_SEND_EVENT = "insight:custom_effects_send_v1";
const RENDER_INTERVAL_TICKS = 5;
const KEEPALIVE_TICKS = 80;
const READY_HEARTBEAT_TICKS = 20;
const DEFAULT_NAMESPACE = "custom";
const EFFECT_FIELD_NAMES = Object.freeze(["duration", "name", "glyph"]);

const READY_PAYLOAD = JSON.stringify({
  version: EFFECTS_PROTOCOL_VERSION,
  channel: CHANNEL_EFFECTS,
  maxVisibleEffects: EFFECTS_MAX_VISIBLE,
  hudFormat: "duration-text-emoji-lines",
  supports: ["upsert", "remove", "replace", "clear", "charge-display"],
});

const effectsByPlayer = new Map();
let insertionSequence = 0;
let initialized = false;

function sanitizeText(value, maxLength) {
  return String(value ?? "")
    .replace(/\u00A7.?/g, "")
    .replace(/[~\r\n\uD800-\uDFFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeHudGlyph(value, fallback = "\uF5FF") {
  const glyph = String(value ?? "")
    .replace(/\u00A7.?/g, "")
    .replace(/[~\r\n]/g, "")
    .trim()
    .charAt(0);
  return glyph && !/[\uD800-\uDFFF]/.test(glyph) ? glyph : fallback;
}

function normalizeNamespace(value) {
  const namespace = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9_.-]+$/.test(namespace) ? namespace : DEFAULT_NAMESPACE;
}

function titleCaseIdentifier(value) {
  return String(value ?? "")
    .replace(/^.*:/, "")
    .replace(/[_.-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function romanNumeral(value) {
  const number = Math.max(1, Math.min(20, Math.floor(Number(value) || 1)));
  /** @type {Array<[number, string]>} */
  const values = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let remaining = number;
  let result = "";
  for (const [amount, numeral] of values) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}

function getPlayerById(playerId) {
  return world.getAllPlayers().find((player) => player.id === playerId);
}

function getEntityById(entityId) {
  if (!entityId) return undefined;
  try {
    return world.getEntity?.(entityId) ?? getPlayerById(entityId);
  } catch {
    return getPlayerById(entityId);
  }
}

function isPlayer(target) {
  return target?.typeId === "minecraft:player" && Boolean(target?.id);
}

function ensurePlayerEffects(player) {
  const playerId = String(player?.id ?? "");
  if (!playerId) return undefined;

  if (!effectsByPlayer.has(playerId)) {
    effectsByPlayer.set(playerId, {
      player,
      effects: new Map(),
      dirty: true,
      lastFrame: undefined,
      lastRenderTick: -Infinity,
    });
  }

  const state = effectsByPlayer.get(playerId);
  state.player = player;
  return state;
}

function resolveExpiresAt(effect) {
  if (effect?.persistent === true && effect?.expiresAtTick == null) {
    return Infinity;
  }
  if (Object.prototype.hasOwnProperty.call(effect, "expiresAtTick")) {
    const absolute = Math.floor(Number(effect.expiresAtTick));
    return Number.isFinite(absolute) && absolute > system.currentTick
      ? absolute
      : undefined;
  }

  const durationSource = effect?.durationTicks ??
    effect?.remainingTicks ??
    effect?.duration;
  if (durationSource !== undefined) {
    const duration = Math.floor(Number(durationSource));
    return Number.isFinite(duration) && duration > 0
      ? system.currentTick + duration
      : undefined;
  }

  return effect?.persistent === true ? Infinity : undefined;
}

function normalizeEffect(effect, namespace, existing) {
  if (!effect || typeof effect !== "object") return undefined;

  const id = normalizeInsightEffectId(effect.id ?? effect.key ?? effect.kind);
  if (!id) return undefined;

  const expiresAt = resolveExpiresAt(effect);
  if (expiresAt === undefined) return undefined;

  const definition = getInsightEffectDefinition(id);
  const requestedDisplayMode = String(
    effect.displayMode
      ?? effect.display?.mode
      ?? existing?.displayMode
      ?? definition?.displayMode
      ?? "duration",
  ).trim().toLowerCase();
  const maxCharges = Math.max(0, Math.floor(Number(
    effect.maxCharges
      ?? effect.display?.max
      ?? existing?.maxCharges
      ?? definition?.maxCharges
      ?? 0,
  ) || 0));
  const displayMode = requestedDisplayMode === "charges" && maxCharges > 0
    ? "charges"
    : "duration";
  const currentCharges = displayMode === "charges"
    ? Math.min(maxCharges, Math.max(0, Math.floor(Number(
      effect.currentCharges
        ?? effect.charges
        ?? effect.display?.current
        ?? effect.level
        ?? existing?.currentCharges
        ?? 0,
    ) || 0)))
    : 0;
  const level = Math.max(1, Math.min(
    20,
    Math.floor(Number(effect.level ?? effect.stacks) || 1),
  ));
  const baseName = sanitizeText(
    effect.name ?? effect.label ?? definition?.name ?? titleCaseIdentifier(id),
    EFFECTS_NAME_LENGTH,
  );
  const levelSuffix = displayMode !== "charges" && level > 1 && effect.showLevel !== false
    ? ` ${romanNumeral(level)}`
    : "";
  return {
    id,
    key: `${namespace}:${id}`,
    namespace,
    name: sanitizeText(`${baseName}${levelSuffix}`, EFFECTS_NAME_LENGTH),
    glyph: normalizeHudGlyph(
      effect.glyph ?? definition?.glyph,
      "\uF5FF",
    ),
    expiresAt,
    displayMode,
    currentCharges,
    maxCharges: displayMode === "charges" ? maxCharges : 0,
    order: Number.isFinite(Number(effect.order)) ? Number(effect.order) : 0,
    sequence: existing?.sequence ?? insertionSequence++,
  };
}

function removeEffectByKey(state, key) {
  if (!key || !state.effects.delete(key)) return false;
  state.dirty = true;
  return true;
}

/** Adds or refreshes one custom effect for a player. */
export function upsertCustomEffect(player, effect, namespace = DEFAULT_NAMESPACE) {
  const stored = upsertInsightEntityEffect(player, effect, namespace);
  if (!isPlayer(player)) return stored;
  const state = ensurePlayerEffects(player);
  if (!state) return false;

  const normalizedNamespace = normalizeNamespace(namespace);
  const id = normalizeInsightEffectId(effect?.id ?? effect?.key ?? effect?.kind);
  const key = id ? `${normalizedNamespace}:${id}` : "";
  const normalized = normalizeEffect(
    effect,
    normalizedNamespace,
    state.effects.get(key),
  );

  if (!normalized) {
    if (removeEffectByKey(state, key)) renderPlayerEffects(state, true);
    return false;
  }

  state.effects.set(normalized.key, normalized);
  state.dirty = true;
  renderPlayerEffects(state, true);
  return true;
}

/** Removes one custom effect owned by a namespace. */
export function removeCustomEffect(player, effectId, namespace = DEFAULT_NAMESPACE) {
  const stored = removeInsightEntityEffect(player, effectId, namespace);
  if (!isPlayer(player)) return stored;
  const state = ensurePlayerEffects(player);
  if (!state) return false;

  const id = normalizeInsightEffectId(effectId);
  const removed = removeEffectByKey(
    state,
    id ? `${normalizeNamespace(namespace)}:${id}` : "",
  );
  if (removed) renderPlayerEffects(state, true);
  return removed;
}

/** Replaces every effect owned by a namespace without touching other addons. */
export function replaceCustomEffects(player, effects, namespace = DEFAULT_NAMESPACE) {
  const stored = replaceInsightEntityEffects(player, effects, namespace);
  if (!isPlayer(player)) return stored;
  const state = ensurePlayerEffects(player);
  if (!state) return false;

  const normalizedNamespace = normalizeNamespace(namespace);
  for (const [key, effect] of state.effects) {
    if (effect.namespace === normalizedNamespace) state.effects.delete(key);
  }
  for (const effect of Array.isArray(effects) ? effects : []) {
    const normalized = normalizeEffect(effect, normalizedNamespace);
    if (normalized) state.effects.set(normalized.key, normalized);
  }
  state.dirty = true;
  renderPlayerEffects(state, true);
  return true;
}

/** Clears one namespace, or all custom effects when no namespace is supplied. */
export function clearCustomEffects(player, namespace) {
  const stored = clearInsightEntityEffects(player, namespace);
  if (!isPlayer(player)) return stored;
  const state = ensurePlayerEffects(player);
  if (!state) return false;

  if (namespace === undefined) {
    state.effects.clear();
  } else {
    const normalizedNamespace = normalizeNamespace(namespace);
    for (const [key, effect] of state.effects) {
      if (effect.namespace === normalizedNamespace) state.effects.delete(key);
    }
  }
  state.dirty = true;
  renderPlayerEffects(state, true);
  return true;
}

function formatRemainingTicks(expiresAt) {
  if (!Number.isFinite(expiresAt)) return "∞";
  const seconds = Math.max(0, Math.ceil((expiresAt - system.currentTick) / 20));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function removeExpiredEffects(state) {
  for (const [key, effect] of state.effects) {
    if (Number.isFinite(effect.expiresAt) && effect.expiresAt <= system.currentTick) {
      state.effects.delete(key);
      state.dirty = true;
    }
  }
}

function emptyEffectFrame() {
  return Array.from({ length: EFFECTS_MAX_VISIBLE }, () => ({
    duration: "",
    name: "",
    glyph: "",
  }));
}

function formatEffectValue(effect) {
  if (effect?.displayMode === "charges" && Number(effect.maxCharges) > 0) {
    return `${Math.max(0, Number(effect.currentCharges) || 0)}/${Math.max(1, Number(effect.maxCharges) || 1)}`;
  }
  return formatRemainingTicks(effect?.expiresAt);
}

function buildEffectsFrame(state) {
  removeExpiredEffects(state);
  const visible = [...state.effects.values()]
    .sort((left, right) =>
      left.order - right.order ||
      left.sequence - right.sequence ||
      left.name.localeCompare(right.name)
    )
    .slice(0, EFFECTS_MAX_VISIBLE);
  return Array.from({ length: EFFECTS_MAX_VISIBLE }, (_, index) => {
    const effect = visible[index];
    return effect
      ? {
        duration: sanitizeText(formatEffectValue(effect), 12),
        name: effect.name,
        glyph: effect.glyph,
      }
      : { duration: "", name: "", glyph: "" };
  });
}

export const EMPTY_EFFECTS_PAYLOAD = "";

function getEffectFieldChannel(slot, field) {
  return `${CHANNEL_EFFECTS}${slot}:${field}:`;
}

function composeEffectsTitle(channel, payload) {
  return {
    rawtext: [
      { text: channel },
      { text: payload },
    ],
  };
}

function renderPlayerEffects(state, force = false) {
  const frame = buildEffectsFrame(state);
  const keepaliveDue = system.currentTick - state.lastRenderTick >= KEEPALIVE_TICKS;
  let sent = false;

  for (let slot = 0; slot < EFFECTS_MAX_VISIBLE; slot++) {
    for (const field of EFFECT_FIELD_NAMES) {
      const payload = frame[slot][field];
      const previous = state.lastFrame?.[slot]?.[field];
      if (!force && !keepaliveDue && payload === previous) continue;

      const channel = getEffectFieldChannel(slot, field);
      sendLatchedTitle(
        state.player,
        channel,
        composeEffectsTitle(channel, payload),
      );
      sent = true;
    }
  }

  if (!sent && !state.dirty) return;
  state.lastFrame = frame;
  state.lastRenderTick = system.currentTick;
  state.dirty = false;
}

function resetPlayerEffectsFrame(player) {
  const state = effectsByPlayer.get(String(player?.id ?? ""));
  if (state) {
    renderPlayerEffects(state, true);
    return;
  }
  const emptyState = {
    player,
    effects: new Map(),
    dirty: true,
    lastFrame: undefined,
    lastRenderTick: -Infinity,
  };
  renderPlayerEffects(emptyState, true);
}

function announceReady() {
  for (const eventId of [EFFECTS_READY_EVENT, LEGACY_EFFECTS_READY_EVENT]) {
    try {
      system.sendScriptEvent(eventId, READY_PAYLOAD);
    } catch {
      // The scripting runtime may still be entering the world.
    }
  }
}

function receiveEffects(message) {
  const request = JSON.parse(String(message ?? "{}"));
  const entityId = String(
    request?.targetId ?? request?.entityId ?? request?.playerId ?? "",
  );
  const entity = getEntityById(entityId) ?? entityId;
  if (!entityId) return;

  const namespace = normalizeNamespace(request.namespace);
  const action = String(request.action ?? "upsert").trim().toLowerCase();
  if (action === "clear") {
    clearCustomEffects(entity, namespace);
    return;
  }
  if (action === "remove") {
    const ids = request.ids ?? request.effectIds ?? [request.id];
    for (const id of Array.isArray(ids) ? ids : [ids]) {
      removeCustomEffect(entity, id, namespace);
    }
    return;
  }
  if (action === "replace") {
    replaceCustomEffects(entity, request.effects, namespace);
    return;
  }

  const effects = request.effects ?? [request.effect ?? request];
  for (const effect of Array.isArray(effects) ? effects : [effects]) {
    upsertCustomEffect(entity, effect, namespace);
  }
}

export function initializeCustomEffectsHud() {
  if (initialized) return;
  initialized = true;

  system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (
      event.id === EFFECTS_DISCOVER_EVENT ||
      event.id === LEGACY_EFFECTS_DISCOVER_EVENT
    ) {
      announceReady();
      return;
    }
    if (event.id !== EFFECTS_SEND_EVENT && event.id !== LEGACY_EFFECTS_SEND_EVENT) {
      return;
    }

    try {
      receiveEffects(event.message);
    } catch {
      // Ignore malformed or foreign custom-effect requests.
    }
  });

  system.run(() => {
    announceReady();
    for (const player of world.getAllPlayers()) resetPlayerEffectsFrame(player);
  });
  system.runInterval(announceReady, READY_HEARTBEAT_TICKS);
  system.runInterval(() => {
    for (const [playerId, state] of effectsByPlayer) {
      renderPlayerEffects(state);
      if (
        !state.effects.size &&
        state.lastFrame?.every((slot) => EFFECT_FIELD_NAMES.every(
          (field) => slot[field] === EMPTY_EFFECTS_PAYLOAD
        ))
      ) {
        effectsByPlayer.delete(playerId);
      }
    }
  }, RENDER_INTERVAL_TICKS);

  world.afterEvents.playerSpawn.subscribe((event) => {
    if (!event.initialSpawn) return;
    system.runTimeout(() => resetPlayerEffectsFrame(event.player), 20);
  });
  world.afterEvents.playerLeave.subscribe((event) => {
    effectsByPlayer.delete(event.playerId);
    clearInsightEntityEffects(event.playerId);
  });
  world.afterEvents.entityDie.subscribe((event) => {
    clearCustomEffects(event.deadEntity);
  });
}
