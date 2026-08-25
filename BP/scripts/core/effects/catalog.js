export const EFFECTS_PROTOCOL_VERSION = 2;
export const EFFECTS_MAX_VISIBLE = 7;
export const EFFECTS_SLOT_LENGTH = 35;
export const EFFECTS_NAME_LENGTH = 24;
export const EFFECTS_DURATION_LENGTH = 8;

export const EFFECT_POLARITY_CODES = Object.freeze({
  neutral: 0,
  buff: 1,
  debuff: 2,
});

export const EFFECT_ICON_CODES = Object.freeze({
  unknown: 0,
  marked: 1,
  bleeding: 2,
  blessed: 3,
  berserk: 4,
  adaptive_resilience: 5,
  soul_collector: 6,
  cursed: 7,
});

export const INSIGHT_EFFECT_CATALOG = Object.freeze({
  marked: Object.freeze({
    id: "marked",
    name: "Marked",
    polarity: "debuff",
    icon: "marked",
    glyph: "\uF530",
  }),
  bleeding: Object.freeze({
    id: "bleeding",
    name: "Bleeding",
    polarity: "debuff",
    icon: "bleeding",
    glyph: "\uF56C",
  }),
  blessed: Object.freeze({
    id: "blessed",
    name: "Blessed",
    polarity: "buff",
    icon: "blessed",
    glyph: "\uF599",
  }),
  cursed: Object.freeze({
    id: "cursed",
    name: "Curse",
    polarity: "debuff",
    icon: "cursed",
    glyph: "\uF520",
  }),
  berserk: Object.freeze({
    id: "berserk",
    name: "Berserk",
    polarity: "buff",
    icon: "berserk",
    glyph: "\uF510",
  }),
  adaptive_resilience: Object.freeze({
    id: "adaptive_resilience",
    name: "Adaptive Resilience",
    polarity: "buff",
    icon: "adaptive_resilience",
    glyph: "\uF5B9",
  }),
  soul_collector: Object.freeze({
    id: "soul_collector",
    name: "Soul Collector",
    polarity: "buff",
    icon: "soul_collector",
    glyph: "\uF532",
    displayMode: "charges",
    maxCharges: 5,
  }),
});

export function normalizeInsightEffectId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, "_")
    .slice(0, 64);
}

export function getInsightEffectDefinition(effectId) {
  const id = normalizeInsightEffectId(effectId).replace(/^.*:/, "");
  return INSIGHT_EFFECT_CATALOG[id];
}

export function normalizeInsightEffectPolarity(value, effectId) {
  const fallback = getInsightEffectDefinition(effectId)?.polarity ?? "neutral";
  const polarity = String(value ?? fallback).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(EFFECT_POLARITY_CODES, polarity)
    ? polarity
    : "neutral";
}

export function getInsightEffectIconCode(value, effectId) {
  const numeric = Math.floor(Number(value));
  if (Object.values(EFFECT_ICON_CODES).some((code) => code === numeric)) {
    return numeric;
  }

  const iconId = normalizeInsightEffectId(value).replace(/^.*:/, "") ||
    getInsightEffectDefinition(effectId)?.icon ||
    normalizeInsightEffectId(effectId).replace(/^.*:/, "");
  return EFFECT_ICON_CODES[iconId] ?? EFFECT_ICON_CODES.unknown;
}
