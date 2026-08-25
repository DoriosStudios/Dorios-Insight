import { system } from "@minecraft/server";
import {
  getInsightEffectDefinition,
  normalizeInsightEffectId,
  normalizeInsightEffectPolarity,
} from "./catalog.js";

const DEFAULT_NAMESPACE = "custom";
const MAX_EFFECT_LEVEL = 20;
const statesByEntity = new Map();
let sequence = 0;

function entityKey(entityOrId) {
  return typeof entityOrId === "string"
    ? entityOrId
    : String(entityOrId?.id ?? "");
}

function normalizeNamespace(value) {
  const namespace = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9_.-]+$/.test(namespace) ? namespace : DEFAULT_NAMESPACE;
}

function sanitizeText(value, maxLength = 48) {
  return String(value ?? "")
    .replace(/§.?/g, "")
    .replace(/[\r\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeGlyph(value, fallback) {
  const glyph = String(value ?? "").replace(/§./g, "").trim();
  return Array.from(glyph)[0] ?? fallback ?? "\uF5FF";
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

function ensureState(entityOrId) {
  const id = entityKey(entityOrId);
  if (!id) return undefined;
  if (!statesByEntity.has(id)) {
    statesByEntity.set(id, { effects: new Map() });
  }
  return statesByEntity.get(id);
}

function normalizeEffect(effect, namespace, existing) {
  if (!effect || typeof effect !== "object") return undefined;
  const id = normalizeInsightEffectId(effect.id ?? effect.key ?? effect.kind);
  if (!id) return undefined;

  const expiresAtTick = resolveExpiresAt(effect);
  if (expiresAtTick === undefined) return undefined;
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

  return {
    id,
    key: `${namespace}:${id}`,
    namespace,
    name: sanitizeText(effect.name ?? definition?.name ?? id),
    polarity: normalizeInsightEffectPolarity(effect.polarity, id),
    glyph: normalizeGlyph(effect.glyph, definition?.glyph),
    level: Math.max(
      1,
      Math.min(MAX_EFFECT_LEVEL, Math.floor(Number(
        effect.level ?? effect.stacks,
      ) || 1)),
    ),
    order: Number.isFinite(Number(effect.order)) ? Number(effect.order) : 0,
    expiresAtTick,
    displayMode,
    currentCharges,
    maxCharges: displayMode === "charges" ? maxCharges : 0,
    sequence: existing?.sequence ?? sequence++,
  };
}

function removeExpired(state) {
  for (const [key, effect] of state.effects) {
    if (
      Number.isFinite(effect.expiresAtTick) &&
      effect.expiresAtTick <= system.currentTick
    ) {
      state.effects.delete(key);
    }
  }
}

export function upsertInsightEntityEffect(
  entityOrId,
  effect,
  namespace = DEFAULT_NAMESPACE,
) {
  const entityId = entityKey(entityOrId);
  const state = ensureState(entityOrId);
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
    if (key) state.effects.delete(key);
    if (!state.effects.size) statesByEntity.delete(entityId);
    return false;
  }
  state.effects.set(normalized.key, normalized);
  return true;
}

export function replaceInsightEntityEffects(
  entityOrId,
  effects,
  namespace = DEFAULT_NAMESPACE,
) {
  const entityId = entityKey(entityOrId);
  const state = ensureState(entityOrId);
  if (!state) return false;
  const normalizedNamespace = normalizeNamespace(namespace);
  for (const [key, effect] of state.effects) {
    if (effect.namespace === normalizedNamespace) state.effects.delete(key);
  }
  for (const effect of Array.isArray(effects) ? effects : []) {
    const normalized = normalizeEffect(effect, normalizedNamespace);
    if (normalized) state.effects.set(normalized.key, normalized);
  }
  if (!state.effects.size) statesByEntity.delete(entityId);
  return true;
}

export function removeInsightEntityEffect(
  entityOrId,
  effectId,
  namespace = DEFAULT_NAMESPACE,
) {
  const state = statesByEntity.get(entityKey(entityOrId));
  if (!state) return false;
  const id = normalizeInsightEffectId(effectId);
  const removed = Boolean(id) && state.effects.delete(
    `${normalizeNamespace(namespace)}:${id}`,
  );
  if (!state.effects.size) statesByEntity.delete(entityKey(entityOrId));
  return removed;
}

export function clearInsightEntityEffects(entityOrId, namespace) {
  const id = entityKey(entityOrId);
  const state = statesByEntity.get(id);
  if (!state) return false;
  if (namespace === undefined) {
    statesByEntity.delete(id);
    return true;
  }

  const normalizedNamespace = normalizeNamespace(namespace);
  for (const [key, effect] of state.effects) {
    if (effect.namespace === normalizedNamespace) state.effects.delete(key);
  }
  if (!state.effects.size) statesByEntity.delete(id);
  return true;
}

export function getStoredInsightEntityEffects(entityOrId) {
  const id = entityKey(entityOrId);
  const state = statesByEntity.get(id);
  if (!state) return [];
  removeExpired(state);
  if (!state.effects.size) {
    statesByEntity.delete(id);
    return [];
  }

  return [...state.effects.values()]
    .sort((left, right) =>
      left.order - right.order ||
      left.sequence - right.sequence ||
      left.name.localeCompare(right.name)
    )
    .map((effect) => ({
      id: effect.id,
      key: effect.key,
      namespace: effect.namespace,
      name: effect.name,
      polarity: effect.polarity,
      glyph: effect.glyph,
      level: effect.level,
      order: effect.order,
      remainingTicks: Number.isFinite(effect.expiresAtTick)
        ? Math.max(0, effect.expiresAtTick - system.currentTick)
        : -1,
      displayMode: effect.displayMode,
      currentCharges: effect.currentCharges,
      maxCharges: effect.maxCharges,
    }));
}
