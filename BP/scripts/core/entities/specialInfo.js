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
  const familyTokens = families.map(normalizeFamilyToken).filter((family) =>
    family.length
  );

  if (familyTokens.includes("nitwit")) {
    return { text: "Nitwit" };
  }

  for (const family of familyTokens) {
    const localizationKey = VILLAGER_PROFESSION_KEYS[family];
    if (localizationKey) {
      return { translate: localizationKey };
    }
  }

  if (
    !familyTokens.length ||
    familyTokens.some((family) => VILLAGER_UNSKILLED_FAMILIES.has(family))
  ) {
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

export function getItemStackFromEntity(entity) {
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

export function collectItemStackInfo(itemStack) {
  if (!itemStack) {
    return [];
  }

  const amount = Number(itemStack.amount);
  const count = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 1;
  const lines = [{ text: `\n§r§7Count: ${count}§r` }];

  try {
    const durability = itemStack.getComponent?.("minecraft:durability");
    const max = Number(durability?.maxDurability);
    const damage = Number(durability?.damage);

    if (Number.isFinite(max) && max > 0 && Number.isFinite(damage)) {
      lines.push({
        text: `\n§r§7Durability: §e${
          Math.max(0, Math.floor(max - damage))
        }§7/§g${Math.floor(max)}§r`,
      });
    }
  } catch {
    // Count is still useful when this stack has no durability component.
  }

  return lines;
}

const ENTITY_SPECIAL_INFO_HANDLERS = Object.freeze({
  "minecraft:villager_v2": collectVillagerSpecialInfo,
});

export function collectEntitySpecialInfo(entity, context = {}) {
  const typeId = String(entity?.typeId || "").trim();
  const handler = ENTITY_SPECIAL_INFO_HANDLERS[typeId];

  if (!handler) {
    return [];
  }

  try {
    return handler(entity, context).filter((part) =>
      part?.text || part?.translate
    );
  } catch {
    return [];
  }
}
