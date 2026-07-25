import { formatTypeIdToText, safeTranslateOrText } from "../format.js";

const VILLAGER_PROFESSION_KEYS = Object.freeze({
  farmer: "entity.villager.farmer",
  fisherman: "entity.villager.fisherman",
  shepherd: "entity.villager.shepherd",
  fletcher: "entity.villager.fletcher",
  librarian: "entity.villager.librarian",
  cartographer: "entity.villager.cartographer",
  cleric: "entity.villager.cleric",
  armorer: "entity.villager.armor",
  armor: "entity.villager.armor",
  weaponsmith: "entity.villager.weapon",
  weapon: "entity.villager.weapon",
  toolsmith: "entity.villager.tool",
  tool: "entity.villager.tool",
  butcher: "entity.villager.butcher",
  leatherworker: "entity.villager.leather",
  leather: "entity.villager.leather",
  mason: "entity.villager.mason",
  stone_mason: "entity.villager.mason",
});

const VILLAGER_UNSKILLED_FAMILIES = new Set([
  "peasant",
  "unemployed",
  "unskilled",
]);

function normalizeFamilyToken(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized.length) {
    return "";
  }

  return normalized.includes(":") ? normalized.split(":").pop() : normalized;
}

function getVillagerJobRawtext(families = []) {
  const familyTokens = families.map(normalizeFamilyToken).filter((family) => family.length);

  if (familyTokens.includes("nitwit")) {
    return { text: "Nitwit" };
  }

  for (const family of familyTokens) {
    const localizationKey = VILLAGER_PROFESSION_KEYS[family];
    if (localizationKey) {
      return { translate: localizationKey };
    }
  }

  if (!familyTokens.length || familyTokens.some((family) => VILLAGER_UNSKILLED_FAMILIES.has(family))) {
    return { translate: "entity.villager.unskilled" };
  }

  return { translate: "entity.villager.unskilled" };
}

function collectVillagerSpecialInfo(_entity, context = {}) {
  return [
    { text: "\n§fJob: §r" },
    getVillagerJobRawtext(context.families),
    { text: "§r" },
  ];
}

function getItemStackFromEntity(entity) {
  try {
    const itemComponent = entity?.getComponent?.("minecraft:item");
    const itemStack = itemComponent?.itemStack;

    if (!itemStack?.typeId) {
      return undefined;
    }

    return itemStack;
  } catch {
    return undefined;
  }
}

function collectItemEntitySpecialInfo(entity) {
  const itemStack = getItemStackFromEntity(entity);
  if (!itemStack) {
    return [];
  }

  const typeId = String(itemStack.typeId || "").trim();
  const localizationKey = typeof itemStack.localizationKey === "string" ? itemStack.localizationKey.trim() : "";
  const amount = Number(itemStack.amount);
  const count = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 1;

  return [
    { text: "\n§fItemStack: §r" },
    safeTranslateOrText(localizationKey, formatTypeIdToText(typeId || "minecraft:item")),
    { text: `\n§fCount: §e${count}§r` },
  ];
}

const ENTITY_SPECIAL_INFO_HANDLERS = Object.freeze({
  "minecraft:item": collectItemEntitySpecialInfo,
  "minecraft:villager_v2": collectVillagerSpecialInfo,
});

export function collectEntitySpecialInfo(entity, context = {}) {
  const typeId = String(entity?.typeId || "").trim();
  const handler = ENTITY_SPECIAL_INFO_HANDLERS[typeId];

  if (!handler) {
    return [];
  }

  try {
    return handler(entity, context).filter((part) => part?.text || part?.translate);
  } catch {
    return [];
  }
}
