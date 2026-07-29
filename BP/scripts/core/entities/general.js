import {
  formatTypeIdToText,
  normalizeHeaderText,
  resolveNamespaceLabel,
  safeTranslateOrText,
  shouldShowNamespaceLine,
} from "../format.js";
import {
  collectEntitySpecialInfo,
  collectItemStackInfo,
  getItemStackFromEntity,
} from "./specialInfo.js";
import {
  collectEntityGlyphStats,
  renderEntityGlyphStats,
} from "./glyphStats.js";

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

function pushSection(rawtext, lines, showSeparator) {
  if (lines.length) {
    if (showSeparator) {
      rawtext.push(getDividerLine());
    }
    rawtext.push(...lines);
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

function getItemStackTags(itemStack) {
  try {
    return (itemStack?.getTags?.() || [])
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
  const normalizedFamilies = new Set(
    families.map((family) => family.toLowerCase()),
  );
  if (
    HOSTILE_ENTITY_FAMILIES.some((family) => normalizedFamilies.has(family))
  ) {
    return true;
  }

  try {
    const typeFamily = entity?.getComponent?.("minecraft:type_family");
    if (typeFamily && typeof typeFamily.hasTypeFamily === "function") {
      return HOSTILE_ENTITY_FAMILIES.some((family) =>
        typeFamily.hasTypeFamily(family)
      );
    }
  } catch {
    // Try components fallback.
  }

  return HOSTILE_COMPONENT_IDS.some((componentId) =>
    hasEntityComponent(entity, componentId)
  );
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
  const entityTypeId = String(entity?.typeId || "").trim();
  const itemStack = entityTypeId === "minecraft:item"
    ? getItemStackFromEntity(entity)
    : undefined;
  const isDroppedItem = Boolean(itemStack);
  const typeId = String(itemStack?.typeId || entityTypeId).trim();
  const fallbackName = formatTypeIdToText(typeId || "minecraft:unknown");
  const nameTag = normalizeHeaderText(
    isDroppedItem ? itemStack?.nameTag : entity?.nameTag,
    "",
  );
  const localizationKey =
    typeof (isDroppedItem
        ? itemStack?.localizationKey
        : entity?.localizationKey) === "string"
      ? (isDroppedItem ? itemStack.localizationKey : entity.localizationKey)
        .trim()
      : "";
  const headerText = nameTag || fallbackName;
  const families = isDroppedItem ? [] : getEntityTypeFamilies(entity);
  const glyphStats = isDroppedItem
    ? undefined
    : collectEntityGlyphStats(entity);

  return {
    typeId,
    entityTypeId,
    headerText: normalizeHeaderText(headerText, "Entity"),
    name: nameTag
      ? { text: nameTag }
      : safeTranslateOrText(localizationKey, fallbackName),
    namespaceLabel: resolveNamespaceLabel(typeId),
    showNamespaceLine: shouldShowNamespaceLine(typeId),
    health: glyphStats?.health,
    glyphStats,
    families,
    entity,
    itemStack,
    isDroppedItem,
    isHostile: isDroppedItem ? false : isEntityHostile(entity, families),
    tags: isDroppedItem ? getItemStackTags(itemStack) : getEntityTags(entity),
    properties: isDroppedItem ? [] : getEntityProperties(entity),
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

  details.push(...renderEntityGlyphStats(data.glyphStats, settings));
  if (data.isDroppedItem) {
    details.push(...collectItemStackInfo(data.itemStack));
  }

  if (settings.hostile && !data.isDroppedItem) {
    details.push({ text: `\n§fHostile: ${data.isHostile ? "Yes" : "No"}§r` });
  }

  const showSeparators = settings.separators !== false;
  pushSection(rawtext, details, showSeparators);

  if (settings.specialInfo && !data.isDroppedItem) {
    pushSection(
      rawtext,
      collectEntitySpecialInfo(data.entity, { families: data.families }),
      showSeparators,
    );
  }

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

  pushSection(rawtext, technical, showSeparators);

  if (settings.properties && data.properties.length) {
    const propertyLines = data.properties
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) =>
        `\n§7${name}: ${formatEntityPropertyValue(value)}§r`
      );

    pushSection(rawtext, [{ text: propertyLines.join("") }], showSeparators);
  }

  return rawtext;
}
