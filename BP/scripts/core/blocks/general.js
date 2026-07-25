import { formatTypeIdToText, resolveNamespaceLabel, safeTranslateOrText, shouldShowNamespaceLine } from "../format.js";
import { getEnergyLine } from "./energyContainers.js";
import { getFluidLines } from "./fluidContainers.js";
import { getGasLines } from "./gasContainers.js";
import { getOverclockLine } from "./overclockLevel.js";

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

function getDividerLine() {
  return { text: "\n§7--------------------§r" };
}

/**
 * @param {RawTextPart[]} rawtext
 * @param {RawTextPart[]} lines
 */
function pushSection(rawtext, lines) {
  if (!lines.length) {
    return;
  }

  rawtext.push(getDividerLine(), ...lines);
}

/**
 * @param {import("@minecraft/server").Block | undefined} block
 * @returns {RawTextPart[]}
 */
function getBlockName(block) {
  const typeId = String(block?.typeId || "").trim();
  const fallbackName = formatTypeIdToText(typeId || "minecraft:unknown");
  const localizationKey = typeof block?.localizationKey === "string" ? block.localizationKey.trim() : "";
  const rawtext = [safeTranslateOrText(localizationKey, fallbackName)];

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

    return tags.map((tag) => String(tag || "").trim()).filter((tag) => tag.length > 0);
  } catch {
    return [];
  }
}

/**
 * @param {ReadonlySet<string>} tagSet
 * @returns {RawTextPart}
 */
function getPreferredToolLine(tagSet) {
  const tools = getPreferredTools(tagSet);

  return { text: `\n§fTool: ${tools.length ? tools.join(", ") : "Hand"}§r` };
}

/**
 * @param {ReadonlySet<string>} tagSet
 * @returns {string[]}
 */
function getPreferredTools(tagSet) {
  return BLOCK_TOOL_DESCRIPTORS.filter((descriptor) => descriptor.tags.some((tag) => tagSet.has(tag))).map((descriptor) => descriptor.label);
}

/**
 * @param {ReadonlySet<string>} tagSet
 * @returns {RawTextPart}
 */
function getToolTierLine(tagSet) {
  const tier = BLOCK_TOOL_TIER_DESCRIPTORS.find((descriptor) => descriptor.tags.some((tag) => tagSet.has(tag)));
  const tools = getPreferredTools(tagSet);
  const onlyHandTierTools = tools.length > 0 && tools.every((tool) => tool === "Shovel" || tool === "Hoe");
  const fallbackTier = !tools.length || onlyHandTierTools ? "Hand" : "Wood";

  return { text: `\n§fTier: ${tier?.label || fallbackTier}§r` };
}

/**
 * @param {import("@minecraft/server").Block | undefined} block
 * @returns {RawTextPart | undefined}
 */
function getBlockLocationLine(block) {
  const location = block?.location;
  if (!location) {
    return undefined;
  }

  return { text: `\n§fLocation: ${Math.floor(location.x)} ${Math.floor(location.y)} ${Math.floor(location.z)}§r` };
}

/**
 * @param {import("@minecraft/server").Block | undefined} block
 * @returns {RawTextPart | undefined}
 */
function getBlockIdentifierLine(block) {
  const typeId = String(block?.typeId || "").trim();
  if (!typeId) {
    return undefined;
  }

  return { text: `\n§7ID: ${typeId}§r` };
}

/**
 * @param {string[]} blockTags
 * @returns {RawTextPart | undefined}
 */
function getBlockTagsLine(blockTags) {
  if (!blockTags.length) {
    return undefined;
  }

  return { text: `\n§7Tags: ${blockTags.join(", ")}§r` };
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatStateValue(value) {
  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

/**
 * @param {import("@minecraft/server").Block | undefined} block
 * @returns {RawTextPart | undefined}
 */
function getBlockStatesLine(block) {
  try {
    const states = block?.permutation?.getAllStates?.();
    if (!states || typeof states !== "object") {
      return undefined;
    }

    const stateLines = Object.entries(states)
      .filter(([stateName]) => String(stateName || "").trim().length > 0)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([stateName, value]) => `\n§7${stateName}: ${formatStateValue(value)}§r`);

    if (!stateLines.length) {
      return undefined;
    }

    return { text: stateLines.join("") };
  } catch {
    return undefined;
  }
}

/**
 * @param {import("@minecraft/server").Block | undefined} block
 * @param {BlockSettings} [settings]
 * @returns {RawTextPart[]}
 */
export function buildBlockLabel(block, settings = {}) {
  const blockTags = getBlockTags(block);
  const tagSet = new Set(blockTags);
  const rawtext = [{ text: "§f" }, ...getBlockName(block)];
  const containerDetails = [];

  if (settings.energyContainers) {
    const energyLine = getEnergyLine(block);
    if (energyLine) {
      containerDetails.push(energyLine);
    }
  }

  if (settings.fluidContainers) {
    containerDetails.push(...getFluidLines(block));
  }

  if (settings.gasContainers) {
    containerDetails.push(...getGasLines(block));
  }

  if (settings.overclockLevel) {
    const overclockLine = getOverclockLine(block);
    if (overclockLine) {
      containerDetails.push(overclockLine);
    }
  }

  pushSection(rawtext, containerDetails);

  const details = [];

  if (settings.preferredTool) {
    details.push(getPreferredToolLine(tagSet));
  }

  if (settings.toolTier) {
    details.push(getToolTierLine(tagSet));
  }

  if (settings.location) {
    const locationLine = getBlockLocationLine(block);
    if (locationLine) {
      details.push(locationLine);
    }
  }

  pushSection(rawtext, details);

  const tagDetails = [];

  if (settings.identifier) {
    const identifierLine = getBlockIdentifierLine(block);
    if (identifierLine) {
      tagDetails.push(identifierLine);
    }
  }

  if (settings.blockTags) {
    const tagsLine = getBlockTagsLine(blockTags);
    if (tagsLine) {
      tagDetails.push(tagsLine);
    }
  }

  pushSection(rawtext, tagDetails);

  if (settings.states) {
    const statesLine = getBlockStatesLine(block);
    if (statesLine) {
      pushSection(rawtext, [statesLine]);
    }
  }

  return rawtext;
}
