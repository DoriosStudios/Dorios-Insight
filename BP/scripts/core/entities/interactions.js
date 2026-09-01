import {
  BREEDING_ITEMS_BY_ENTITY,
  KNOWN_TAMEABLE_ENTITY_IDS,
} from "./breedingCatalog.js";

const ITEM_ID_ALIASES = Object.freeze({
  "minecraft:fish": "minecraft:cod",
  "minecraft:clownfish": "minecraft:tropical_fish",
  "minecraft:appleEnchanted": "minecraft:enchanted_golden_apple",
  "minecraft:muttonRaw": "minecraft:mutton",
  "minecraft:muttonCooked": "minecraft:cooked_mutton",
  "minecraft:cooked_fish": "minecraft:cooked_cod",
});

function safeGetComponent(entity, componentId) {
  try {
    return entity?.getComponent?.(componentId);
  } catch {
    return undefined;
  }
}

function normalizeItemId(value) {
  const raw = typeof value === "string" ? value : value?.typeId ?? value?.item;
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const typeId = raw.includes(":") ? raw.trim() : `minecraft:${raw.trim()}`;
  return ITEM_ID_ALIASES[typeId] ?? typeId;
}

function addItems(target, values) {
  const list = Array.isArray(values) ? values : values ? [values] : [];
  for (const value of list) {
    const typeId = normalizeItemId(value);
    if (typeId) target.add(typeId);
  }
}

function readComponentItems(component, memberName) {
  if (!component) return [];
  try {
    const member = component[memberName];
    return typeof member === "function" ? member.call(component) ?? [] : member ?? [];
  } catch {
    return [];
  }
}

function readBoolean(component, ...names) {
  for (const name of names) {
    try {
      if (typeof component?.[name] === "boolean") return component[name];
    } catch {
      // Try the next supported state property.
    }
  }
  return false;
}

function readTamedProperty(entity) {
  try {
    return entity?.getProperty?.("minecraft:is_tamed") === true;
  } catch {
    return false;
  }
}

export function collectEntityInteractions(entity) {
  const typeId = String(entity?.typeId ?? "").trim();
  const tameable = safeGetComponent(entity, "minecraft:tameable");
  const tameMount = safeGetComponent(entity, "minecraft:tamemount");
  const isTamedMarker = safeGetComponent(entity, "minecraft:is_tamed");
  const isTamed = Boolean(isTamedMarker) ||
    readBoolean(tameable, "isTamed", "tamed") ||
    readBoolean(tameMount, "isTamed", "isTamedToPlayer") ||
    readTamedProperty(entity);
  const isTameable = Boolean(tameable || tameMount || isTamedMarker) ||
    KNOWN_TAMEABLE_ENTITY_IDS.has(typeId);

  const itemIds = new Set();
  addItems(itemIds, readComponentItems(tameable, "getTameItems"));
  addItems(itemIds, BREEDING_ITEMS_BY_ENTITY[typeId]);

  const ageable = safeGetComponent(entity, "minecraft:ageable");
  addItems(itemIds, readComponentItems(ageable, "getFeedItems"));

  const healable = safeGetComponent(entity, "minecraft:healable");
  addItems(itemIds, readComponentItems(healable, "getFeedItems"));

  return {
    isTameable,
    isTamed,
    isBreedable: Boolean(BREEDING_ITEMS_BY_ENTITY[typeId]),
    itemIds: [...itemIds],
  };
}

