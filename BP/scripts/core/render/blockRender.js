import { auxOffset } from "./generated/auxOffset.js";
import { customBlockAuxValues } from "./generated/customBlockAuxValues.js";
import { vanillaAuxValues } from "./generated/vanillaAuxValues.js";

const VANILLA_NAMESPACE = "minecraft:";
const MAX_SHIFTED_VANILLA_RAW_ID = 256;

function normalizeVanillaBlockTypeId(typeId) {
  const exceptions = {
    "minecraft:reeds": "minecraft:sugar_cane",
  };

  if (exceptions[typeId]) {
    return exceptions[typeId];
  }

  if (!typeId.startsWith(VANILLA_NAMESPACE) || !typeId.includes("slab") || !typeId.includes("double")) {
    return typeId;
  }

  const base = typeId
    .slice(VANILLA_NAMESPACE.length)
    .replace(/^double_/, "")
    .replace(/_double$/, "")
    .replace(/_double_/, "_")
    .replace(/^slab_/, "")
    .replace(/_slab$/, "");

  const candidates = [
    base,
    `${base}s`,
    base.replace(/brick$/, "bricks"),
    base.replace(/bricks$/, "brick"),
    base.replace(/stone$/, "stones"),
    base.replace(/stones$/, "stone"),
  ];

  for (const candidate of candidates) {
    const candidateTypeId = `${VANILLA_NAMESPACE}${candidate}`;
    if (vanillaAuxValues[candidateTypeId] !== undefined) {
      return candidateTypeId;
    }
  }

  return `${VANILLA_NAMESPACE}${base}`;
}

function resolveVanillaAux(typeId) {
  const normalizedTypeId = normalizeVanillaBlockTypeId(typeId);
  const value = vanillaAuxValues[normalizedTypeId];

  if (typeof value !== "number") {
    return 0;
  }

  const rawId = value / 65536;
  if (rawId > MAX_SHIFTED_VANILLA_RAW_ID) {
    return (rawId + auxOffset) * 65536;
  }

  return value;
}

/**
 * Gets the numeric item aux used by Minecraft UI inventory_item_renderer.
 * @param {import("@minecraft/server").Block | undefined} block
 * @returns {number}
 */
export function getBlockRenderAux(block) {
  const typeId = String(block?.typeId || "").trim();
  if (!typeId || typeId === "minecraft:air") {
    return 0;
  }

  if (typeId.startsWith(VANILLA_NAMESPACE)) {
    return resolveVanillaAux(typeId);
  }

  return customBlockAuxValues[typeId] ?? 0;
}
