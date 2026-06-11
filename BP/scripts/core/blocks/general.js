import {
  formatTypeIdToText,
  resolveNamespaceLabel,
  safeTranslateOrText,
  shouldShowNamespaceLine,
} from "../format.js";

/**
 * @typedef {object} RawTextPart
 * @property {string} [text]
 * @property {string} [translate]
 */

/** @typedef {import("../const.js").BlockSettings} BlockSettings */

const BLOCK_TOOL_DESCRIPTORS = [
  {
    label: "Pickaxe",
    tags: ["minecraft:is_pickaxe_item_destructible", "minecraft:pickaxe_item_destructible"],
  },
  {
    label: "Axe",
    tags: ["minecraft:is_axe_item_destructible", "minecraft:axe_item_destructible"],
  },
  {
    label: "Shovel",
    tags: ["minecraft:is_shovel_item_destructible", "minecraft:shovel_item_destructible"],
  },
  {
    label: "Hoe",
    tags: ["minecraft:is_hoe_item_destructible", "minecraft:hoe_item_destructible"],
  },
  {
    label: "Shears",
    tags: ["minecraft:is_shears_item_destructible", "minecraft:shears_item_destructible"],
  },
  {
    label: "Sword",
    tags: ["minecraft:is_sword_item_destructible", "minecraft:sword_item_destructible"],
  },
];

const BLOCK_TOOL_TIER_DESCRIPTORS = [
  {
    label: "Netherite",
    tags: ["minecraft:netherite_tier_destructible", "minecraft:is_netherite_tier_destructible"],
  },
  {
    label: "Diamond",
    tags: ["minecraft:diamond_tier_destructible", "minecraft:is_diamond_tier_destructible"],
  },
  {
    label: "Iron",
    tags: ["minecraft:iron_tier_destructible", "minecraft:is_iron_tier_destructible"],
  },
  {
    label: "Stone",
    tags: ["minecraft:stone_tier_destructible", "minecraft:is_stone_tier_destructible"],
  },
];

/**
 * @param {import("@minecraft/server").Block | undefined} block
 * @returns {RawTextPart[]}
 */
function getBlockName(block) {
  const typeId = String(block?.typeId || "").trim();
  const fallbackName = formatTypeIdToText(typeId || "minecraft:unknown");
  const localizationKey = typeof block?.localizationKey === "string"
    ? block.localizationKey.trim()
    : "";
  const rawtext = [
    safeTranslateOrText(localizationKey, fallbackName),
  ];

  if (shouldShowNamespaceLine(typeId)) {
    rawtext.push({ text: `\n§o§9@${resolveNamespaceLabel(typeId)}§r` });
  }

  return rawtext;
}

/**
 * @param {import("@minecraft/server").Block | undefined} block
 * @returns {string[]}
 */
function getBlockTags(block) {
  try {
    const tags = block?.getTags?.();
    if (!Array.isArray(tags)) {
      return [];
    }

    return tags
      .map((tag) => String(tag || "").trim())
      .filter((tag) => tag.length > 0);
  } catch {
    return [];
  }
}

/**
 * @param {ReadonlySet<string>} tagSet
 * @returns {RawTextPart}
 */
function getPreferredToolLine(tagSet) {
  const tools = BLOCK_TOOL_DESCRIPTORS
    .filter((descriptor) => descriptor.tags.some((tag) => tagSet.has(tag)))
    .map((descriptor) => descriptor.label);

  return { text: `\n§8Tool: §7${tools.length ? tools.join(", ") : "Hand"}§r` };
}

/**
 * @param {ReadonlySet<string>} tagSet
 * @returns {RawTextPart}
 */
function getToolTierLine(tagSet) {
  const tier = BLOCK_TOOL_TIER_DESCRIPTORS.find((descriptor) => (
    descriptor.tags.some((tag) => tagSet.has(tag))
  ));

  return { text: `\n§8Tier: §7${tier?.label || "Hand"}§r` };
}

/**
 * @param {string[]} blockTags
 * @returns {RawTextPart | undefined}
 */
function getBlockTagsLine(blockTags) {
  if (!blockTags.length) {
    return undefined;
  }

  return { text: `\n§8Tags: ${blockTags.join(", ")}§r` };
}

/**
 * @param {import("@minecraft/server").Block | undefined} block
 * @param {BlockSettings} [settings]
 * @returns {RawTextPart[]}
 */
export function buildBlockLabel(block, settings = {}) {
  const blockTags = getBlockTags(block);
  const tagSet = new Set(blockTags);
  const rawtext = [
    { text: "§f" },
    ...getBlockName(block),
  ];

  if (settings.preferredTool) {
    rawtext.push(getPreferredToolLine(tagSet));
  }

  if (settings.toolTier) {
    rawtext.push(getToolTierLine(tagSet));
  }

  if (settings.blockTags) {
    const tagsLine = getBlockTagsLine(blockTags);
    if (tagsLine) {
      rawtext.push(tagsLine);
    }
  }

  return rawtext;
}
