import {
  formatTypeIdToText,
  normalizeHeaderText,
  resolveNamespaceLabel,
  safeTranslateOrText,
  shouldShowNamespaceLine,
} from "../format.js";

const HOSTILE_ENTITY_FAMILIES = [
  "monster",
  "hostile",
  "enemy",
  "illager",
  "raider",
  "undead",
];

const HOSTILE_COMPONENT_IDS = [
  "minecraft:attack",
  "minecraft:behavior.melee_attack",
  "minecraft:behavior.ranged_attack",
  "minecraft:behavior.nearest_attackable_target",
];

function getDividerLine() {
  return { text: "\n§7--------------------§r" };
}

function pushSection(rawtext, lines) {
  if (lines.length) {
    rawtext.push(getDividerLine(), ...lines);
  }
}

function getEntityHealth(entity) {
  try {
    const health = entity?.getComponent?.("minecraft:health");
    if (!health) {
      return undefined;
    }

    const current = Number(health.currentValue);
    const max = Number(health.effectiveMax ?? health.defaultValue ?? health.value);

    if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) {
      return undefined;
    }

    return {
      current: Math.max(0, Math.round(current * 10) / 10),
      max: Math.max(1, Math.round(max * 10) / 10),
    };
  } catch {
    return undefined;
  }
}

function getEntityTypeFamilies(entity) {
  try {
    const typeFamily = entity?.getComponent?.("minecraft:type_family");
    if (!typeFamily) {
      return [];
    }

    if (typeof typeFamily.getTypeFamilies === "function") {
      return (typeFamily.getTypeFamilies() || [])
        .map((family) => String(family || "").trim())
        .filter((family) => family.length > 0);
    }

    if (Array.isArray(typeFamily.typeFamilies)) {
      return typeFamily.typeFamilies
        .map((family) => String(family || "").trim())
        .filter((family) => family.length > 0);
    }
  } catch {
    return [];
  }

  return [];
}

function getEntityTags(entity) {
  try {
    return (entity?.getTags?.() || [])
      .map((tag) => String(tag || "").trim())
      .filter((tag) => tag.length > 0);
  } catch {
    return [];
  }
}

function hasEntityComponent(entity, componentId) {
  try {
    return Boolean(entity?.getComponent?.(componentId));
  } catch {
    return false;
  }
}

function isEntityHostile(entity, families) {
  const normalizedFamilies = new Set(families.map((family) => family.toLowerCase()));
  if (HOSTILE_ENTITY_FAMILIES.some((family) => normalizedFamilies.has(family))) {
    return true;
  }

  try {
    const typeFamily = entity?.getComponent?.("minecraft:type_family");
    if (typeFamily && typeof typeFamily.hasTypeFamily === "function") {
      return HOSTILE_ENTITY_FAMILIES.some((family) => typeFamily.hasTypeFamily(family));
    }
  } catch {
    // Try components fallback.
  }

  return HOSTILE_COMPONENT_IDS.some((componentId) => hasEntityComponent(entity, componentId));
}

function formatEntityPropertyValue(value) {
  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

function getEntityProperties(entity) {
  try {
    if (typeof entity?.getProperties === "function") {
      const properties = entity.getProperties();
      if (properties && typeof properties === "object") {
        return Object.entries(properties)
          .filter(([name]) => String(name || "").trim().length > 0)
          .map(([name, value]) => [String(name), value]);
      }
    }
  } catch {
    // Try property ids fallback.
  }

  try {
    const ids = typeof entity?.getPropertyIds === "function"
      ? entity.getPropertyIds()
      : typeof entity?.getPropertyNames === "function"
        ? entity.getPropertyNames()
        : [];

    return (ids || [])
      .map((id) => String(id || "").trim())
      .filter((id) => id.length > 0)
      .map((id) => [id, entity.getProperty(id)]);
  } catch {
    return [];
  }
}

export function collectEntityGeneral(entity) {
  const typeId = String(entity?.typeId || "").trim();
  const fallbackName = formatTypeIdToText(typeId || "minecraft:unknown");
  const nameTag = normalizeHeaderText(entity?.nameTag, "");
  const localizationKey = typeof entity?.localizationKey === "string"
    ? entity.localizationKey.trim()
    : "";
  const headerText = nameTag || fallbackName;
  const families = getEntityTypeFamilies(entity);

  return {
    typeId,
    headerText: normalizeHeaderText(headerText, "Entity"),
    name: nameTag
      ? { text: nameTag }
      : safeTranslateOrText(localizationKey, fallbackName),
    namespaceLabel: resolveNamespaceLabel(typeId),
    showNamespaceLine: shouldShowNamespaceLine(typeId),
    health: getEntityHealth(entity),
    families,
    isHostile: isEntityHostile(entity, families),
    tags: getEntityTags(entity),
    properties: getEntityProperties(entity),
  };
}

export function renderEntityGeneral(data, settings = {}) {
  if (!data) {
    return [];
  }

  const rawtext = [
    { text: "§f" },
    data.name,
  ];

  if (data.showNamespaceLine) {
    rawtext.push({ text: `\n§o§9@${data.namespaceLabel}§r` });
  }

  const details = [];

  if (settings.health !== false && data.health) {
    details.push({ text: `\n§fHealth: §c${data.health.current}§7 / §c${data.health.max}§r` });
  }

  if (settings.hostile) {
    details.push({ text: `\n§fHostile: ${data.isHostile ? "Yes" : "No"}§r` });
  }

  pushSection(rawtext, details);

  const technical = [];

  if (settings.identifier && data.typeId) {
    technical.push({ text: `\n§7ID: ${data.typeId}§r` });
  }

  if (settings.typeFamilies && data.families.length) {
    technical.push({ text: `\n§7Families: ${data.families.join(", ")}§r` });
  }

  if (settings.tags && data.tags.length) {
    technical.push({ text: `\n§7Tags: ${data.tags.join(", ")}§r` });
  }

  pushSection(rawtext, technical);

  if (settings.properties && data.properties.length) {
    const propertyLines = data.properties
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) => `\n§7${name}: ${formatEntityPropertyValue(value)}§r`);

    pushSection(rawtext, [{ text: propertyLines.join("") }]);
  }

  return rawtext;
}
