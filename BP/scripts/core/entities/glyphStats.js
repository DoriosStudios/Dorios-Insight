const GLYPHS = Object.freeze({
  armorFull: "\uF5B9",
  armorHalf: "\uF5BA",
  armorEmpty: "\uF5BB",
  heartFull: "\uF50D",
  heartHalf: "\uF50E",
  heartEmpty: "\uF50F",
  heartFireFull: "\uF5A9",
  heartFireHalf: "\uF5AA",
  heartAnimalFull: "\uF5CB",
  heartAnimalHalf: "\uF5CC",
  heartWitherFull: "\uF5CD",
  heartWitherHalf: "\uF5CE",
  heartAbsorptionFull: "\uF5D9",
  heartAbsorptionHalf: "\uF5DA",
  heartFrozenFull: "\uF5DB",
  heartFrozenHalf: "\uF5DC",
  heartPoisonFull: "\uF5DD",
  heartPoisonHalf: "\uF5DE",
  hungerFull: "\uF5E9",
  hungerHalf: "\uF5EA",
  hungerEmpty: "\uF5EB",
  hungerEffectFull: "\uF5ED",
  hungerEffectHalf: "\uF5EC",
  hungerEffectEmpty: "\uF5EE",
  hungerFullSaturationFull: "\uF5AB",
  hungerFullSaturationHalf: "\uF5AC",
  hungerHalfSaturationFull: "\uF5AD",
  hungerHalfSaturationHalf: "\uF5AE",
  hungerEmptySaturationFull: "\uF5AF",
  hungerEmptySaturationHalf: "\uF5BF",
  bubbleFull: "\uF5BC",
  bubblePopping: "\uF5BD",
  bubbleEmpty: "\uF5BE",
  attackDamage: "\uF517",
  walkingSpeed: "\uF518",
  swimmingSpeed: "\uF519",
  fire: "\uF54D",
});

const HEART_GLYPH_SETS = Object.freeze({
  normal: Object.freeze({
    full: GLYPHS.heartFull,
    half: GLYPHS.heartHalf,
    empty: GLYPHS.heartEmpty,
  }),
  fire: Object.freeze({
    full: GLYPHS.heartFireFull,
    half: GLYPHS.heartFireHalf,
    empty: GLYPHS.heartEmpty,
  }),
  animal: Object.freeze({
    full: GLYPHS.heartAnimalFull,
    half: GLYPHS.heartAnimalHalf,
    empty: GLYPHS.heartEmpty,
  }),
  wither: Object.freeze({
    full: GLYPHS.heartWitherFull,
    half: GLYPHS.heartWitherHalf,
    empty: GLYPHS.heartEmpty,
  }),
  frozen: Object.freeze({
    full: GLYPHS.heartFrozenFull,
    half: GLYPHS.heartFrozenHalf,
    empty: GLYPHS.heartEmpty,
  }),
  poison: Object.freeze({
    full: GLYPHS.heartPoisonFull,
    half: GLYPHS.heartPoisonHalf,
    empty: GLYPHS.heartEmpty,
  }),
});

const HUNGER_GLYPH_SETS = Object.freeze({
  normal: Object.freeze({
    full: GLYPHS.hungerFull,
    half: GLYPHS.hungerHalf,
    empty: GLYPHS.hungerEmpty,
  }),
  effect: Object.freeze({
    full: GLYPHS.hungerEffectFull,
    half: GLYPHS.hungerEffectHalf,
    empty: GLYPHS.hungerEffectEmpty,
  }),
});

const SATURATION_GLYPHS = Object.freeze({
  fullSaturationFull: GLYPHS.hungerFullSaturationFull,
  fullSaturationHalf: GLYPHS.hungerFullSaturationHalf,
  halfSaturationFull: GLYPHS.hungerHalfSaturationFull,
  halfSaturationHalf: GLYPHS.hungerHalfSaturationHalf,
  emptySaturationFull: GLYPHS.hungerEmptySaturationFull,
  emptySaturationHalf: GLYPHS.hungerEmptySaturationHalf,
});

const ARMOR_GLYPHS = Object.freeze({
  full: GLYPHS.armorFull,
  half: GLYPHS.armorHalf,
  empty: GLYPHS.armorEmpty,
});

const BUBBLE_GLYPHS = Object.freeze({
  full: GLYPHS.bubbleFull,
  half: GLYPHS.bubblePopping,
  empty: GLYPHS.bubbleEmpty,
});

// Only effects explicitly present in root_extras/emojis.txt are listed here.
const EFFECT_GLYPHS = Object.freeze({
  bad_omen: "\uF548",
  blindness: "\uF51C",
  conduit: "\uF51D",
  conduit_power: "\uF51D",
  darkness: "\uF51F",
  dolphins_grace: "\uF528",
  fatal_poison: "\uF547",
  fire_resistance: "\uF529",
  haste: "\uF51E",
  health_boost: "\uF54F",
  hunger: "\uF52B",
  infested: "\uF527",
  invisibility: "\uF52C",
  jump_boost: "\uF52D",
  levitation: "\uF52E",
  mining_fatigue: "\uF52F",
  poison: "\uF54C",
  raid_omen: "\uF54E",
  resistance: "\uF539",
  slow_falling: "\uF53A",
  slowness: "\uF53C",
  speed: "\uF53B",
  sticky: "\uF537",
  strength: "\uF53D",
  trial_omen: "\uF538",
  village_hero: "\uF53F",
  water_breathing: "\uF54A",
  weakness: "\uF53E",
  weaving: "\uF526",
  wind_charged: "\uF536",
  wither: "\uF54B",
  decay: "\uF54B",
});

const NEGATIVE_EFFECT_IDS = new Set([
  "bad_omen",
  "blindness",
  "darkness",
  "fatal_poison",
  "hunger",
  "levitation",
  "mining_fatigue",
  "poison",
  "raid_omen",
  "slowness",
  "trial_omen",
  "weakness",
  "wither",
  "decay",
]);

function asFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function safeGetComponent(entity, componentId) {
  try {
    return entity?.getComponent?.(componentId);
  } catch {
    return undefined;
  }
}

function getAttributeRange(entity, componentId) {
  const component = safeGetComponent(entity, componentId);
  if (!component) {
    return undefined;
  }

  const current = asFiniteNumber(component.currentValue ?? component.value);
  const max = asFiniteNumber(
    component.effectiveMax ??
      component.defaultValue ??
      component.maxValue ??
      component.value,
  );

  if (current === undefined || max === undefined || max <= 0) {
    return undefined;
  }

  return {
    current: Math.max(0, current),
    max: Math.max(1, max),
  };
}

function getAttributeCurrentValue(entity, componentId) {
  const component = safeGetComponent(entity, componentId);
  const current = asFiniteNumber(component?.currentValue ?? component?.value);
  return current === undefined ? undefined : Math.max(0, current);
}

function getArmorInfo(entity) {
  const equippable = safeGetComponent(entity, "minecraft:equippable");
  const equippedArmor = asFiniteNumber(equippable?.totalArmor);
  if (equippedArmor !== undefined) {
    return {
      current: Math.max(0, equippedArmor),
      max: Math.max(20, equippedArmor),
    };
  }

  const armorAttribute = getAttributeRange(entity, "minecraft:armor") ??
    getAttributeRange(entity, "minecraft:player.armor");
  if (armorAttribute) {
    return {
      current: armorAttribute.current,
      max: Math.max(20, armorAttribute.max, armorAttribute.current),
    };
  }

  return undefined;
}

function getAirSupplyInfo(entity) {
  const breathable = safeGetComponent(entity, "minecraft:breathable");
  if (!breathable) {
    return undefined;
  }

  const current = asFiniteNumber(
    breathable.airSupply ??
      breathable.currentAirSupply ??
      breathable.currentValue,
  );
  const max = asFiniteNumber(
    breathable.totalSupply ??
      breathable.totalAirSupply ??
      breathable.maxAirSupply ??
      breathable.maxValue,
  );

  if (current === undefined || max === undefined || max <= 0) {
    return undefined;
  }

  return {
    current: Math.max(0, current),
    max: Math.max(1, max),
  };
}

function getEffects(entity) {
  try {
    const effects = entity?.getEffects?.();
    return Array.isArray(effects) ? effects : [];
  } catch {
    return [];
  }
}

function normalizeEffectTypeId(effect) {
  const rawTypeId = effect?.typeId ??
    effect?.type?.id ??
    effect?.effectType?.id ??
    effect?.effectType;
  if (typeof rawTypeId !== "string") {
    return "";
  }

  const typeId = rawTypeId.trim().toLowerCase();
  return typeId.includes(":") ? typeId.split(":").pop() : typeId;
}

function getEffectFlags(effects) {
  const ids = new Set(effects.map(normalizeEffectTypeId).filter(Boolean));
  return {
    hunger: ids.has("hunger"),
    poison: ids.has("poison") || ids.has("fatal_poison"),
    wither: ids.has("wither") || ids.has("decay"),
  };
}

function isEntityOnFire(entity) {
  const onFire = safeGetComponent(entity, "minecraft:onfire") ??
    safeGetComponent(entity, "minecraft:on_fire");
  if (onFire) {
    const ticks = asFiniteNumber(onFire.onFireTicksRemaining ?? onFire.value);
    return {
      active: ticks === undefined || ticks > 0,
      ticks: ticks ?? 0,
    };
  }

  try {
    const ticks = asFiniteNumber(entity?.getFireTicks?.());
    return {
      active: ticks !== undefined && ticks > 0,
      ticks: ticks ?? 0,
    };
  } catch {
    return { active: false, ticks: 0 };
  }
}

function isEntityFrozen(entity) {
  try {
    if (typeof entity?.isFrozen === "boolean") {
      return entity.isFrozen;
    }
  } catch {
    // Try the component fallback.
  }

  const freezing = safeGetComponent(entity, "minecraft:freezing");
  if (!freezing) {
    return false;
  }

  const booleanValue = freezing.isFrozen ?? freezing.isFreezing;
  if (typeof booleanValue === "boolean") {
    return booleanValue;
  }

  const value = asFiniteNumber(
    freezing.freezeTicks ??
      freezing.frozenTicks ??
      freezing.ticksFrozen ??
      freezing.value,
  );
  return value !== undefined && value > 0;
}

const TAMED_HEART_MOUNT_EXCEPTIONS = new Set([
  "minecraft:horse",
  "minecraft:skeleton_horse",
  "minecraft:zombie_horse",
  "minecraft:mule",
  "minecraft:donkey",
]);

const MAX_STAT_GLYPHS_PER_LINE = 10;

function shouldUseTamedHeart(entity) {
  const typeId = String(entity?.typeId || "");
  if (typeId === "minecraft:player") {
    return false;
  }

  if (TAMED_HEART_MOUNT_EXCEPTIONS.has(typeId)) {
    return true;
  }

  if (safeGetComponent(entity, "minecraft:is_tamed")) {
    return true;
  }

  const tameable = safeGetComponent(entity, "minecraft:tameable");
  if (
    tameable?.isTamed === true ||
    tameable?.tamed === true ||
    Boolean(tameable?.tamedToPlayerId) ||
    Boolean(tameable?.tamedToPlayer)
  ) {
    return true;
  }

  try {
    return entity?.getProperty?.("minecraft:is_tamed") === true;
  } catch {
    return false;
  }
}

function resolveHeartGlyphs(stats, settings) {
  if (settings.effectHearts !== false) {
    if (stats.frozen) {
      return HEART_GLYPH_SETS.frozen;
    }

    if (stats.onFire.active) {
      return HEART_GLYPH_SETS.fire;
    }

    if (stats.effectFlags.wither) {
      return HEART_GLYPH_SETS.wither;
    }

    if (stats.effectFlags.poison) {
      return HEART_GLYPH_SETS.poison;
    }
  }

  if (settings.tamedHearts !== false && stats.tamedHeart) {
    return HEART_GLYPH_SETS.animal;
  }

  return HEART_GLYPH_SETS.normal;
}

function roundToHalfUnits(value) {
  return Math.max(0, Math.ceil(Number(value) || 0));
}

function wrapStatGlyphs(glyphBar) {
  const glyphs = Array.from(String(glyphBar || ""));
  const lines = [];

  for (
    let index = 0;
    index < glyphs.length;
    index += MAX_STAT_GLYPHS_PER_LINE
  ) {
    lines.push(glyphs.slice(index, index + MAX_STAT_GLYPHS_PER_LINE).join(""));
  }

  return lines.join("\n");
}

function buildHalfStepBar(currentValue, maxValue, glyphs) {
  const currentHalfUnits = roundToHalfUnits(currentValue);
  const maxHalfUnits = Math.max(1, roundToHalfUnits(maxValue));
  const slotCount = Math.max(1, Math.ceil(maxHalfUnits / 2));
  const clampedCurrent = Math.min(currentHalfUnits, slotCount * 2);
  const fullCount = Math.floor(clampedCurrent / 2);
  const halfCount = clampedCurrent % 2;
  const emptyCount = Math.max(0, slotCount - fullCount - halfCount);

  return wrapStatGlyphs(
    `${glyphs.full.repeat(fullCount)}${halfCount ? glyphs.half : ""}${
      glyphs.empty.repeat(emptyCount)
    }`,
  );
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0";
  }

  const rounded = Math.round(number * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function getDisplayStyle(settings, property) {
  const style = String(settings?.[property] ?? "glyphs").toLowerCase();
  return style === "text" || style === "both" ? style : "glyphs";
}

function formatStyledStat(style, glyphDisplay, textDisplay) {
  if (style === "text") {
    return textDisplay;
  }

  if (style === "both") {
    return `${glyphDisplay} §7${textDisplay}§r`;
  }

  return glyphDisplay;
}

function formatValueText(label, value, maxValue) {
  const amount = maxValue === undefined
    ? formatNumber(value)
    : `${formatNumber(value)}/${formatNumber(maxValue)}`;
  return `${label}: §f${amount}§r`;
}

function formatEffectLabel(effectId) {
  return String(effectId ?? "")
    .split("_")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function buildHealthDisplay(stats, settings) {
  const glyphs = resolveHeartGlyphs(stats, settings);
  const current = stats.health.current;
  const max = stats.health.max;
  const threshold = Math.max(1, Number(settings.maxHeartDisplayHealth) || 40);

  if (current > threshold || max > threshold) {
    return `${glyphs.full} §c${formatNumber(current)}§7/§c${
      formatNumber(max)
    }§r`;
  }

  return buildHalfStepBar(current, max, glyphs);
}

function buildAbsorptionDisplay(value) {
  const halfUnits = roundToHalfUnits(value);
  const fullCount = Math.floor(halfUnits / 2);
  const halfCount = halfUnits % 2;
  return wrapStatGlyphs(
    `${GLYPHS.heartAbsorptionFull.repeat(fullCount)}${
      halfCount ? GLYPHS.heartAbsorptionHalf : ""
    }`,
  );
}

function buildHalfUnitSlotMap(totalHalfUnits, slotCount) {
  const slots = Array.from({ length: Math.max(0, slotCount) }, () => 0);
  let remaining = Math.max(
    0,
    Math.min(roundToHalfUnits(totalHalfUnits), slots.length * 2),
  );

  for (let index = 0; index < slots.length && remaining > 0; index += 1) {
    slots[index] = Math.min(2, remaining);
    remaining -= slots[index];
  }

  return slots;
}

function getBaseHungerGlyph(hungerHalfUnits, glyphs) {
  if (hungerHalfUnits >= 2) {
    return glyphs.full;
  }

  if (hungerHalfUnits === 1) {
    return glyphs.half;
  }

  return glyphs.empty;
}

function getSaturationHungerGlyph(
  hungerHalfUnits,
  saturationHalfUnits,
  hungerGlyphs,
) {
  if (saturationHalfUnits <= 0) {
    return getBaseHungerGlyph(hungerHalfUnits, hungerGlyphs);
  }

  if (saturationHalfUnits >= 2) {
    if (hungerHalfUnits >= 2) {
      return SATURATION_GLYPHS.fullSaturationFull;
    }

    if (hungerHalfUnits === 1) {
      return SATURATION_GLYPHS.halfSaturationFull;
    }

    return SATURATION_GLYPHS.emptySaturationFull;
  }

  if (hungerHalfUnits >= 2) {
    return SATURATION_GLYPHS.fullSaturationHalf;
  }

  if (hungerHalfUnits === 1) {
    return SATURATION_GLYPHS.halfSaturationHalf;
  }

  return SATURATION_GLYPHS.emptySaturationHalf;
}

// Saturation is deliberately isolated here so its slot-order rule can evolve
// without changing collection, settings persistence, or the entity renderer.
function buildHungerDisplay(stats, settings) {
  const hungerGlyphs = stats.effectFlags.hunger
    ? HUNGER_GLYPH_SETS.effect
    : HUNGER_GLYPH_SETS.normal;
  const maxHalfUnits = Math.max(1, roundToHalfUnits(stats.hunger.max));
  const slotCount = Math.max(1, Math.ceil(maxHalfUnits / 2));
  const hungerSlots = buildHalfUnitSlotMap(stats.hunger.current, slotCount);
  const showSaturation = settings.saturation !== false &&
    Number.isFinite(stats.saturation) &&
    stats.saturation > 0;

  if (!showSaturation) {
    return wrapStatGlyphs(
      hungerSlots.map((halfUnits) =>
        getBaseHungerGlyph(halfUnits, hungerGlyphs)
      ).join(""),
    );
  }

  // Current rule: saturation overlays hunger slots from left to right.
  const saturationSlots = buildHalfUnitSlotMap(
    Math.min(stats.saturation, stats.hunger.max),
    slotCount,
  );
  return wrapStatGlyphs(
    hungerSlots
      .map((halfUnits, index) =>
        getSaturationHungerGlyph(
          halfUnits,
          saturationSlots[index],
          hungerGlyphs,
        )
      )
      .join(""),
  );
}

function buildArmorDisplay(armor) {
  if (armor.current > 20) {
    return `${GLYPHS.armorFull} §b${formatNumber(armor.current)}§r`;
  }

  return buildHalfStepBar(armor.current, 20, ARMOR_GLYPHS);
}

function buildAirDisplay(air) {
  const ratio = air.max > 0 ? air.current / air.max : 0;
  return buildHalfStepBar(
    Math.max(0, Math.min(20, ratio * 20)),
    20,
    BUBBLE_GLYPHS,
  );
}

function formatEffectDuration(ticks) {
  const duration = Number(ticks);
  if (!Number.isFinite(duration) || duration < 0) {
    return "∞";
  }

  const seconds = Math.max(1, Math.ceil(duration / 20));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function toRomanNumeral(value) {
  const number = Math.max(1, Math.floor(Number(value) || 1));
  const numerals = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remaining = number;
  let result = "";

  for (const [amount, glyph] of numerals) {
    while (remaining >= amount) {
      result += glyph;
      remaining -= amount;
    }
  }

  return result;
}

function buildEffectsDisplay(stats, settings) {
  const entries = [];
  const style = getDisplayStyle(settings, "effectsDisplayStyle");
  const maxVisible = Math.max(
    1,
    Math.floor(Number(settings.maxVisibleEffects) || 4),
  );

  if (stats.onFire.active) {
    const duration = stats.onFire.ticks > 0
      ? ` §7(${formatEffectDuration(stats.onFire.ticks)})`
      : "";
    entries.push(
      formatStyledStat(
        style,
        `${GLYPHS.fire}§r`,
        `On Fire${duration}`,
      ),
    );
  }

  for (const effect of stats.effects) {
    if (entries.length >= maxVisible) {
      break;
    }

    const typeId = normalizeEffectTypeId(effect);
    const glyph = EFFECT_GLYPHS[typeId];
    if (!glyph) {
      continue;
    }

    const level = Math.max(1, Math.floor(Number(effect?.amplifier) || 0) + 1);
    const levelSuffix = level > 1 ? ` ${toRomanNumeral(level)}` : "";
    const duration = formatEffectDuration(effect?.duration);
    entries.push(
      formatStyledStat(
        style,
        `${glyph}§r`,
        `${formatEffectLabel(typeId)}${levelSuffix} §7(${duration})§r`,
      ),
    );
  }

  return entries.join("  ");
}

function buildAttributeDisplay(attributes, settings) {
  const parts = [];
  const style = getDisplayStyle(settings, "attributesDisplayStyle");

  if (settings.attackDamage !== false && attributes.attack !== undefined) {
    parts.push(
      formatStyledStat(
        style,
        `${GLYPHS.attackDamage}§r`,
        formatValueText("Attack Damage", attributes.attack),
      ),
    );
  }

  if (settings.movementSpeed === true && attributes.movement !== undefined) {
    parts.push(
      formatStyledStat(
        style,
        `${GLYPHS.walkingSpeed}§r`,
        formatValueText("Movement Speed", attributes.movement),
      ),
    );
  }

  if (
    settings.movementSpeed === true &&
    attributes.underwaterMovement !== undefined
  ) {
    parts.push(
      formatStyledStat(
        style,
        `${GLYPHS.swimmingSpeed}§r`,
        formatValueText("Swimming Speed", attributes.underwaterMovement),
      ),
    );
  }

  return parts.join("  ");
}

export function collectEntityGlyphStats(entity) {
  const isPlayer = String(entity?.typeId || "") === "minecraft:player";
  const effects = getEffects(entity);
  const onFire = isEntityOnFire(entity);

  return {
    health: getAttributeRange(entity, "minecraft:health"),
    absorption: getAttributeCurrentValue(entity, "minecraft:absorption"),
    hunger: isPlayer
      ? getAttributeRange(entity, "minecraft:player.hunger")
      : undefined,
    saturation: isPlayer
      ? getAttributeCurrentValue(entity, "minecraft:player.saturation")
      : undefined,
    armor: getArmorInfo(entity),
    air: getAirSupplyInfo(entity),
    effects,
    effectFlags: getEffectFlags(effects),
    onFire,
    frozen: isEntityFrozen(entity),
    tamedHeart: shouldUseTamedHeart(entity),
    attributes: {
      attack: getAttributeCurrentValue(entity, "minecraft:attack"),
      movement: getAttributeCurrentValue(entity, "minecraft:movement"),
      underwaterMovement: getAttributeCurrentValue(
        entity,
        "minecraft:underwater_movement",
      ),
    },
  };
}

export function renderEntityGlyphStats(stats, settings = {}) {
  if (!stats) {
    return [];
  }

  const lines = [];

  if (settings.health !== false && stats.health) {
    lines.push({
      text: `\n${formatStyledStat(
        getDisplayStyle(settings, "healthDisplayStyle"),
        buildHealthDisplay(stats, settings),
        formatValueText("Health", stats.health.current, stats.health.max),
      )}`,
    });
  }

  if (settings.absorption !== false && stats.absorption > 0) {
    lines.push({
      text: `\n${formatStyledStat(
        getDisplayStyle(settings, "healthDisplayStyle"),
        buildAbsorptionDisplay(stats.absorption),
        formatValueText("Absorption", stats.absorption),
      )}`,
    });
  }

  if (settings.hunger !== false && stats.hunger) {
    const hungerText = [
      formatValueText("Hunger", stats.hunger.current, stats.hunger.max),
      settings.saturation !== false && Number.isFinite(stats.saturation)
        ? formatValueText("Saturation", stats.saturation)
        : "",
    ].filter(Boolean).join(" §7| ");
    lines.push({
      text: `\n${formatStyledStat(
        getDisplayStyle(settings, "hungerDisplayStyle"),
        buildHungerDisplay(stats, settings),
        hungerText,
      )}`,
    });
  }

  if (settings.armor !== false && stats.armor) {
    lines.push({
      text: `\n${formatStyledStat(
        getDisplayStyle(settings, "armorAirDisplayStyle"),
        buildArmorDisplay(stats.armor),
        formatValueText("Armor", stats.armor.current),
      )}`,
    });
  }

  if (
    settings.air !== false && stats.air && stats.air.current < stats.air.max
  ) {
    lines.push({
      text: `\n${formatStyledStat(
        getDisplayStyle(settings, "armorAirDisplayStyle"),
        buildAirDisplay(stats.air),
        formatValueText("Air", stats.air.current, stats.air.max),
      )}`,
    });
  }

  const attributes = buildAttributeDisplay(stats.attributes, settings);
  if (attributes) {
    lines.push({ text: `\n${attributes}` });
  }

  if (settings.effects !== false) {
    const effects = buildEffectsDisplay(stats, settings);
    if (effects) {
      lines.push({ text: `\n${effects}` });
    }
  }

  return lines;
}
