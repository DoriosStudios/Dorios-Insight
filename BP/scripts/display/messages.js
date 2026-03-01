import { EntityHealthComponent, world } from "@minecraft/server";
import { BlockNames, BlockPrefixes, ItemTranslationKeys } from "../const.js";
import {
    DisplayStyles,
    EffectDisplayModes,
    EntityNameDisplayModes,
    EntityNameResolveModes,
    InsightConfig,
    ToolIndicatorPlacementModes,
    ToolTierIndicatorModes,
    VillagerProfessionDisplayModes
} from "./config.js";
import {
    formatNamespaceLabel,
    formatStateName,
    formatTypeIdToText,
    splitTypeId,
    toTitleWords,
    toMessageText
} from "./formatters.js";
import {
    collectCustomBlockFieldLines,
    collectCustomEntityFieldLines
} from "./customFieldInjectors.js";
import {
    getBlockTagsSafe,
    resolveInjectedNamespace,
    sortBlockTagsForDisplay
} from "./namespaceInjection.js";
import { transformBlockStateEntries } from "./stateTraitInjection.js";

// -----------------------------------------------------------------------------
// Actionbar message composer
// -----------------------------------------------------------------------------
// Quick guide:
// 1) Tweak visual assets in "Customizable visual assets".
// 2) Start reading behavior from exported entry points.
// 3) Keep helper sections grouped by concern (translation, tags, metrics, layout).

// -----------------------------------------------------------------------------
// Customizable visual assets
// -----------------------------------------------------------------------------
const Emojis = Object.freeze({
    armorFull: "\uF5B9",
    armorHalf: "\uF5BA",
    armorEmpty: "\uF5BB",
    heartCreative: "\uF5CF",
    heartEmpty: "",
    heartHalf: "",
    heartFull: "",
    heartHardcoreHalf: "\uF5CA",
    heartHardcoreFull: "\uF5C9",
    heartWitherHalf: "\uF5CE",
    heartWitherFull: "\uF5CD",
    heartPoisonHalf: "\uF5DE",
    heartPoisonFull: "\uF5DD",
    heartFrozenHalf: "\uF5DC",
    heartFrozenFull: "\uF5DB",
    heartAbsorptionHalf: "\uF5DA",
    heartAbsorptionFull: "\uF5D9",
    heartAnimalHalf: "\uF5CC",
    heartAnimalFull: "\uF5CB",
    hungerEmpty: "",
    hungerHalf: "",
    hungerFull: "",
    hungerEffectEmpty: "\uF5EE",
    hungerEffectHalf: "\uF5EC",
    hungerEffectFull: "\uF5ED",
    waterBubbleEmpty: "\uF5BE",
    waterBubblePop: "\uF5BD", // Also kwown as half
    waterBubbleFull: "\uF5BC"
});

const HeartGlyphSets = Object.freeze({
    normal: Object.freeze({
        full: Emojis.heartFull,
        half: Emojis.heartHalf,
        empty: Emojis.heartEmpty
    }),
    wither: Object.freeze({
        full: Emojis.heartWitherFull,
        half: Emojis.heartWitherHalf,
        empty: Emojis.heartEmpty
    }),
    poison: Object.freeze({
        full: Emojis.heartPoisonFull,
        half: Emojis.heartPoisonHalf,
        empty: Emojis.heartEmpty
    }),
    frozen: Object.freeze({
        full: Emojis.heartFrozenFull,
        half: Emojis.heartFrozenHalf,
        empty: Emojis.heartEmpty
    }),
    animal: Object.freeze({
        full: Emojis.heartAnimalFull,
        half: Emojis.heartAnimalHalf,
        empty: Emojis.heartEmpty
    })
});

const HungerGlyphSets = Object.freeze({
    normal: Object.freeze({
        full: Emojis.hungerFull,
        half: Emojis.hungerHalf,
        empty: Emojis.hungerEmpty
    }),
    effect: Object.freeze({
        full: Emojis.hungerEffectFull,
        half: Emojis.hungerEffectHalf,
        empty: Emojis.hungerEffectEmpty
    })
});

const ArmorGlyphs = Object.freeze({
    full: Emojis.armorFull,
    half: Emojis.armorHalf,
    empty: Emojis.armorEmpty
});

const BubbleGlyphs = Object.freeze({
    full: Emojis.waterBubbleFull,
    half: Emojis.waterBubblePop,
    empty: Emojis.waterBubbleEmpty
});

const BubbleDisplay = Object.freeze({
    maxUnits: InsightConfig.system.maxHeartsPerLine * 2
});

const ToolTierColors = Object.freeze({
    any: "§e",
    stone: "§7",
    iron: "§i",
    diamond: "§q",
    netherite: "§n"
});

const ToolTierOreGlyphs = Object.freeze({
    any: "◇",
    stone: "🪨",
    iron: "⛓",
    diamond: "💎",
    netherite: "🧱"
});

const ToolGlyphs = Object.freeze({
    // Updated glyphs from glyph_F5 page.
    shears: "",
    hoe: "",
    shovel: "",
    axe: "",
    pickaxe: "",
    sword: ""
});

const EmojiLayout = Object.freeze({
    blockNameToolSpacing: "  ",
    toolGlyphSpacing: " "
});

const PlayerAttributeComponentIds = Object.freeze({
    // From official Script API docs:
    // - EntityHungerComponent.componentId = "minecraft:player.hunger"
    // - EntitySaturationComponent.componentId = "minecraft:player.saturation"
    // - Player absorption attribute is exposed as "minecraft:absorption"
    hunger: "minecraft:player.hunger",
    saturation: "minecraft:player.saturation",
    absorption: "minecraft:absorption",
    armor: "minecraft:armor"
});

const PlayerAttributeComponentCandidates = Object.freeze({
    armor: ["minecraft:armor", "minecraft:player.armor"]
});

const EntityComponentIds = Object.freeze({
    tameable: "minecraft:tameable",
    rideable: "minecraft:rideable",
    breathable: "minecraft:breathable",
    freezing: "minecraft:freezing"
});

const TameableDisplay = Object.freeze({
    foodsPerLine: 3
});

const EffectDisplay = Object.freeze({
    unknownGlyph: "•", 
    infiniteDurationLabel: "∞", 
    iconAmplifierSpacing: " "
});

// Glyphs sourced from Dorios-Trinkets RP/texts/*.lang effect descriptions.
// Stored as explicit hex escapes to keep source readable and deterministic.
const EffectGlyphByTypeId = Object.freeze({
    blindness: "\uF51C",
    conduit: "\uF51D",
    conduit_power: "\uF51D",
    haste: "\uF51E",
    darkness: "\uF51F",
    fire_resistance: "\uF529",
    absorption: "\uF52A",
    health_boost: "\uF52A",
    hunger: "\uF52B",
    invisibility: "\uF52C",
    jump_boost: "\uF52D",
    levitation: "\uF52E",
    mining_fatigue: "\uF52F",
    resistance: "\uF539",
    slow_falling: "\uF53A",
    speed: "\uF53B",
    slowness: "\uF53C",
    strength: "\uF53D",
    weakness: "\uF53E",
    village_hero: "\uF53F",
    night_vision: "\uF549",
    water_breathing: "\uF54A",
    wither: "\uF54B",
    decay: "\uF54B",
    poison: "\uF54C",
    regeneration: "\uF516",
    dolphins_grace: "\uE119",
    fatal_poison: "\uF54C \uF531",
});

const PositiveEffectTypeIds = new Set([
    "speed",
    "haste",
    "strength",
    "regeneration",
    "resistance",
    "fire_resistance",
    "water_breathing",
    "night_vision",
    "health_boost",
    "absorption",
    "jump_boost",
    "slow_falling",
    "invisibility",
    "conduit",
    "conduit_power",
    "dolphins_grace",
    "village_hero",
    "saturation",
    "luck"
]);

const NegativeEffectTypeIds = new Set([
    "slowness",
    "mining_fatigue",
    "weakness",
    "poison",
    "wither",
    "decay",
    "blindness",
    "darkness",
    "hunger",
    "nausea",
    "levitation",
    "bad_omen",
    "fatal_poison",
    "unluck",
    "instant_damage"
]);

const EffectTextColors = Object.freeze({
    positive: "§a",
    negative: "§c",
    neutral: InsightConfig.display.technicalColor
});

const BlockToolTagGlyphs = Object.freeze([
    {
        tags: ["minecraft:is_pickaxe_item_destructible", "minecraft:pickaxe_item_destructible"],
        type: "pickaxe",
        glyph: ToolGlyphs.pickaxe,
        label: "Pickaxe"
    }, // label: ui.insight.breakableBy.pickaxe
    {
        tags: ["minecraft:is_axe_item_destructible", "minecraft:axe_item_destructible"],
        type: "axe",
        glyph: ToolGlyphs.axe,
        label: "Axe"
    }, // label: ui.insight.breakableBy.axe
    {
        tags: ["minecraft:is_shovel_item_destructible", "minecraft:shovel_item_destructible"],
        type: "shovel",
        glyph: ToolGlyphs.shovel,
        label: "Shovel"
    }, // label: ui.insight.breakableBy.shovel
    {
        tags: ["minecraft:is_hoe_item_destructible", "minecraft:hoe_item_destructible"],
        type: "hoe",
        glyph: ToolGlyphs.hoe,
        label: "Hoe"
    }, // label: ui.insight.breakableBy.hoe
    {
        tags: ["minecraft:is_shears_item_destructible", "minecraft:shears_item_destructible"],
        type: "shears",
        glyph: ToolGlyphs.shears,
        label: "Shears"
    }, // label: ui.insight.breakableBy.shears
    {
        tags: ["minecraft:is_sword_item_destructible", "minecraft:sword_item_destructible"],
        type: "sword",
        glyph: ToolGlyphs.sword,
        label: "Sword"
    } // label: ui.insight.breakableBy.sword
]);

const BlockTierTags = Object.freeze({
    netherite: Object.freeze([
        "minecraft:requires_netherite_tool",
        "minecraft:netherite_tier_destructible",
        "minecraft:is_netherite_tier_destructible"
    ]),
    diamond: Object.freeze([
        "minecraft:requires_diamond_tool",
        "minecraft:diamond_tier_destructible",
        "minecraft:is_diamond_tier_destructible"
    ]),
    iron: Object.freeze([
        "minecraft:requires_iron_tool",
        "minecraft:iron_tier_destructible",
        "minecraft:is_iron_tier_destructible"
    ]),
    stone: Object.freeze([
        "minecraft:requires_stone_tool",
        "minecraft:stone_tier_destructible",
        "minecraft:is_stone_tier_destructible"
    ])
});

const ToolTierStrength = Object.freeze({
    any: 0,
    wood: 0,
    wooden: 0,
    gold: 0,
    golden: 0,
    stone: 1,
    copper: 1,
    iron: 2,
    diamond: 3,
    netherite: 4
});

const ItemToolTypeSuffixes = Object.freeze([
    Object.freeze({ suffix: "_pickaxe", type: "pickaxe" }),
    Object.freeze({ suffix: "_axe", type: "axe" }),
    Object.freeze({ suffix: "_shovel", type: "shovel" }),
    Object.freeze({ suffix: "_hoe", type: "hoe" }),
    Object.freeze({ suffix: "_sword", type: "sword" })
]);

const ItemToolTypeTagAliases = Object.freeze({
    pickaxe: Object.freeze(["pickaxe", "is_pickaxe"]),
    axe: Object.freeze(["axe", "is_axe"]),
    shovel: Object.freeze(["shovel", "is_shovel"]),
    hoe: Object.freeze(["hoe", "is_hoe"]),
    shears: Object.freeze(["shears", "is_shears"]),
    sword: Object.freeze(["sword", "is_sword"])
});

const ItemTierTagAliases = Object.freeze({
    netherite: Object.freeze(["netherite_tier", "is_netherite_tier"]),
    diamond: Object.freeze(["diamond_tier", "is_diamond_tier"]),
    iron: Object.freeze(["iron_tier", "is_iron_tier"]),
    stone: Object.freeze(["stone_tier", "is_stone_tier"]),
    copper: Object.freeze(["copper_tier", "is_copper_tier"]),
    golden: Object.freeze(["gold_tier", "golden_tier", "is_gold_tier", "is_golden_tier"]),
    wooden: Object.freeze(["wood_tier", "wooden_tier", "is_wood_tier", "is_wooden_tier"])
});

const VillagerEntityTypeIds = new Set([
    "minecraft:villager",
    "minecraft:villager_v2",
    "minecraft:zombie_villager",
    "minecraft:zombie_villager_v2"
]);

const VillagerProfessionTokenLabels = Object.freeze({
    unskilled: "Unemployed",
    unemployed: "Unemployed",
    farmer: "Farmer",
    fisherman: "Fisherman",
    shepherd: "Shepherd",
    fletcher: "Fletcher",
    librarian: "Librarian",
    cartographer: "Cartographer",
    cleric: "Cleric",
    armorer: "Armorer",
    weaponsmith: "Weaponsmith",
    toolsmith: "Toolsmith",
    butcher: "Butcher",
    leatherworker: "Leatherworker",
    mason: "Mason",
    stone_mason: "Mason",
    nitwit: "Nitwit"
});

// -----------------------------------------------------------------------------
// Main flow (entry points)
// -----------------------------------------------------------------------------
export function createBlockActionbar(block, playerSettings, context) {
    return buildBlockActionbarPayload(block, playerSettings, context);
}

export function createEntityActionbar(entity, playerSettings, context) {
    return buildEntityActionbarPayload(entity, playerSettings, context);
}

// -----------------------------------------------------------------------------
// Rawtext / localization helpers
// -----------------------------------------------------------------------------

/**
 * Builds a translate rawtext element.
 * @param {string} key - Localization key.
 * @param {Array} [withArgs] - Substitution args (strings or rawtext objects).
 */
function tr(key, withArgs = []) {
    const entry = { translate: key };
    if (withArgs.length) {
        entry.with = withArgs.map((arg) =>
            arg === undefined || arg === null
                ? ""
                : typeof arg === "object"
                    ? arg
                    : String(arg)
        );
    }
    return entry;
}

/**
 * Appends a display result on a new line. Handles both plain strings and rawtext objects.
 */
function appendDisplayLine(rawtext, displayResult) {
    if (!displayResult) {
        return;
    }

    rawtext.push({ text: "\n" });

    if (typeof displayResult === "string") {
        rawtext.push({ text: displayResult });
    } else if (Array.isArray(displayResult)) {
        rawtext.push(...displayResult);
    } else if (typeof displayResult === "object") {
        rawtext.push(displayResult);
    }
}

// -----------------------------------------------------------------------------
// Translation helpers
// -----------------------------------------------------------------------------

function buildBlockTranslationRawtext(block) {
    const localizationKey = typeof block?.localizationKey === "string"
        ? block.localizationKey.trim()
        : "";

    if (localizationKey.length) {
        return {
            translate: localizationKey
        };
    }

    const blockTypeId = String(block?.typeId || "");
    if (!blockTypeId.length) {
        return { text: "Block" };
    }

    const { id } = splitTypeId(blockTypeId);
    const blockIdentifier = id.replace("double_slab", "slab");
    const translationPrefix = BlockPrefixes[blockIdentifier] || "tile";
    const translationName = BlockNames[blockIdentifier] || blockIdentifier;

    if (!blockTypeId.startsWith("minecraft:")) {
        return {
            translate: `tile.${blockTypeId}.name`
        };
    }

    return {
        translate: `${translationPrefix}.${translationName}.name`
    };
}

function hasBlockTag(block, tags, targetTag) {
    if (Array.isArray(tags) && tags.includes(targetTag)) {
        return true;
    }

    try {
        if (typeof block?.hasTag === "function") {
            return block.hasTag(targetTag);
        }
    } catch {
        // Ignore block.hasTag failures.
    }

    return false;
}

function hasAnyBlockTag(block, tags, targetTags) {
    if (!Array.isArray(targetTags) || !targetTags.length) {
        return false;
    }

    for (const targetTag of targetTags) {
        if (hasBlockTag(block, tags, targetTag)) {
            return true;
        }
    }

    return false;
}

function isTextDisplayStyle(playerSettings) {
    const style = normalizeDisplayStyleValue(playerSettings?.displayStyle);
    return style !== DisplayStyles.Icon;
}

function isTextOnlyDisplayStyle(playerSettings) {
    const style = normalizeDisplayStyleValue(playerSettings?.displayStyle);
    return style === DisplayStyles.TextFull || style === DisplayStyles.TextPercent;
}

function isHybridDisplayStyle(playerSettings) {
    const style = normalizeDisplayStyleValue(playerSettings?.displayStyle);
    return style === DisplayStyles.HybridFull || style === DisplayStyles.HybridPercent;
}

function isPercentDisplayStyle(displayStyle) {
    const style = normalizeDisplayStyleValue(displayStyle);
    return style === DisplayStyles.TextPercent || style === DisplayStyles.HybridPercent;
}

function normalizeDisplayStyleValue(displayStyle) {
    if (displayStyle === DisplayStyles.Text) {
        return DisplayStyles.TextFull;
    }

    return String(displayStyle || DisplayStyles.Icon);
}

// Collects all matching tool descriptors by known vanilla block-destruction tags.
function getBlockToolDescriptors(block, blockTags) {
    const descriptors = [];

    for (const entry of BlockToolTagGlyphs) {
        if (hasAnyBlockTag(block, blockTags, entry.tags)) {
            descriptors.push(entry);
        }
    }

    return descriptors;
}

function getRequiredToolTier(blockTags) {
    if (!Array.isArray(blockTags) || !blockTags.length) {
        return "any";
    }

    if (hasAnyBlockTag(undefined, blockTags, BlockTierTags.netherite)) {
        return "netherite";
    }

    if (hasAnyBlockTag(undefined, blockTags, BlockTierTags.diamond)) {
        return "diamond";
    }

    if (hasAnyBlockTag(undefined, blockTags, BlockTierTags.iron)) {
        return "iron";
    }

    if (hasAnyBlockTag(undefined, blockTags, BlockTierTags.stone)) {
        return "stone";
    }

    return "any";
}

function getToolIndicatorTextColor(playerSettings) {
    const configured = String(playerSettings?.toolIndicatorColor || InsightConfig.display.technicalColor).trim();
    return /^§[0-9a-fr]$/i.test(configured)
        ? configured
        : InsightConfig.display.technicalColor;
}

function normalizeTagToken(rawTag) {
    const normalized = String(rawTag || "").trim().toLowerCase();
    if (!normalized.length) {
        return "";
    }

    return normalized.startsWith("minecraft:")
        ? normalized.slice("minecraft:".length)
        : normalized;
}

function getItemTagTokenSet(itemStack) {
    const tokenSet = new Set();
    if (!itemStack) {
        return tokenSet;
    }

    try {
        if (typeof itemStack.getTags === "function") {
            const itemTags = itemStack.getTags();
            if (Array.isArray(itemTags)) {
                for (const rawTag of itemTags) {
                    const normalized = normalizeTagToken(rawTag);
                    if (!normalized) {
                        continue;
                    }

                    tokenSet.add(normalized);
                }
            }
        }
    } catch {
        // Ignore tag read failures.
    }

    return tokenSet;
}

function hasAnyItemTagToken(itemStack, itemTagTokens, candidateTags) {
    if (!Array.isArray(candidateTags) || !candidateTags.length) {
        return false;
    }

    for (const candidateTag of candidateTags) {
        const normalizedCandidate = normalizeTagToken(candidateTag);
        if (!normalizedCandidate) {
            continue;
        }

        if (itemTagTokens.has(normalizedCandidate)) {
            return true;
        }

        try {
            if (typeof itemStack?.hasTag === "function") {
                if (itemStack.hasTag(candidateTag) || itemStack.hasTag(`minecraft:${normalizedCandidate}`) || itemStack.hasTag(normalizedCandidate)) {
                    return true;
                }
            }
        } catch {
            // Ignore hasTag failures and continue matching.
        }
    }

    return false;
}

function getToolTypeFromItemTypeId(itemTypeId) {
    if (!itemTypeId) {
        return undefined;
    }

    const { id } = splitTypeId(itemTypeId);
    const normalizedId = String(id || "").toLowerCase();
    if (!normalizedId.length) {
        return undefined;
    }

    if (normalizedId === "shears") {
        return "shears";
    }

    for (const entry of ItemToolTypeSuffixes) {
        if (normalizedId.endsWith(entry.suffix)) {
            return entry.type;
        }
    }

    return undefined;
}

function getToolTypeFromItemTags(itemStack, itemTagTokens) {
    for (const [toolType, tagAliases] of Object.entries(ItemToolTypeTagAliases)) {
        if (hasAnyItemTagToken(itemStack, itemTagTokens, tagAliases)) {
            return toolType;
        }
    }

    return undefined;
}

function getToolTierFromItemTypeId(itemTypeId) {
    if (!itemTypeId) {
        return "any";
    }

    const { id } = splitTypeId(itemTypeId);
    const normalizedId = String(id || "").toLowerCase();
    if (!normalizedId.length) {
        return "any";
    }

    const tierPrefix = normalizedId.split("_")[0];
    if (ToolTierStrength[tierPrefix] !== undefined) {
        return tierPrefix;
    }

    return "any";
}

function getToolTierFromItemTags(itemStack, itemTagTokens) {
    const orderedTiers = ["netherite", "diamond", "iron", "stone", "copper", "golden", "wooden"];

    for (const tierName of orderedTiers) {
        const aliases = ItemTierTagAliases[tierName];
        if (!Array.isArray(aliases) || !aliases.length) {
            continue;
        }

        if (hasAnyItemTagToken(itemStack, itemTagTokens, aliases)) {
            return tierName;
        }
    }

    return undefined;
}

function getHeldToolInfo(heldItemStack) {
    if (!heldItemStack) {
        return undefined;
    }

    const itemTagTokens = getItemTagTokenSet(heldItemStack);
    const heldTypeId = heldItemStack?.typeId;
    const toolType = getToolTypeFromItemTags(heldItemStack, itemTagTokens) || getToolTypeFromItemTypeId(heldTypeId);
    const toolTier = getToolTierFromItemTags(heldItemStack, itemTagTokens) || getToolTierFromItemTypeId(heldTypeId);

    if (!toolType && toolTier === "any") {
        return undefined;
    }

    return {
        toolType,
        toolTier
    };
}

function isHeldToolTierSufficient(heldTier, requiredTier) {
    if (requiredTier === "any") {
        return true;
    }

    const heldStrength = ToolTierStrength[heldTier] ?? -1;
    const requiredStrength = ToolTierStrength[requiredTier] ?? 0;
    return heldStrength >= requiredStrength;
}

function isBreakableWithHeldTool(toolDescriptors, requiredTier, heldItemStack) {
    const requiresSpecificToolType = Array.isArray(toolDescriptors) && toolDescriptors.length > 0;
    const heldToolInfo = getHeldToolInfo(heldItemStack);

    if (!requiresSpecificToolType && requiredTier === "any") {
        return true;
    }

    if (!heldToolInfo) {
        return false;
    }

    if (requiresSpecificToolType) {
        if (!heldToolInfo.toolType) {
            return false;
        }

        const matchesToolType = toolDescriptors.some((entry) => entry.type === heldToolInfo.toolType);
        if (!matchesToolType) {
            return false;
        }
    }

    return isHeldToolTierSufficient(heldToolInfo.toolTier, requiredTier);
}

function buildToolTierIndicator(requiredTier, playerSettings, context = {}) {
    const mode = String(playerSettings?.toolTierIndicatorMode || ToolTierIndicatorModes.BooleanIndicator);
    if (mode === ToolTierIndicatorModes.Hidden) {
        return "";
    }

    const colorCode = getToolIndicatorTextColor(playerSettings);

    const requiresTool = requiredTier !== "any";

    if (mode === ToolTierIndicatorModes.BooleanIndicator) {
        const canBreakWithHeldTool = isBreakableWithHeldTool(
            context.toolDescriptors,
            requiredTier,
            context.heldItemStack
        );
        return `${colorCode}Breakable: ${canBreakWithHeldTool ? "Yes" : "No"}§r`;
    }

    if (!requiresTool) {
        return `${colorCode}Tier: Any§r`;
    }

    if (mode === ToolTierIndicatorModes.TierIndicatorColor) {
        const color = ToolTierColors[requiredTier] || "§7";
        return `${color}■§r`;
    }

    if (mode === ToolTierIndicatorModes.TierIndicatorOre) {
        const oreGlyph = ToolTierOreGlyphs[requiredTier] || ToolTierOreGlyphs.any;
        return `${oreGlyph}`;
    }

    if (mode === ToolTierIndicatorModes.TextIndicator) {
        return `${colorCode}Tier: ${toTitleWords([requiredTier])}§r`;
    }

    return "";
}

function buildBreakableToolsText(toolDescriptors, blockTags, playerSettings, context = {}) {
    const toolTierIndicator = buildToolTierIndicator(getRequiredToolTier(blockTags), playerSettings, {
        ...context,
        toolDescriptors
    });
    const colorCode = getToolIndicatorTextColor(playerSettings);

    if (!toolDescriptors.length) {
        return toolTierIndicator;
    }

    if (isTextOnlyDisplayStyle(playerSettings)) {
        const toolLabels = toolDescriptors.map((entry) => entry.label);
        const breakableText = `${colorCode}Breakable: ${toolLabels.join(", ")}§r`;
        return toolTierIndicator
            ? `${breakableText} ${toolTierIndicator}`
            : breakableText;
    }

    const toolGlyphs = toolDescriptors.map((entry) => entry.glyph);
    const glyphText = toolGlyphs.join(EmojiLayout.toolGlyphSpacing);
    return toolTierIndicator
        ? `${glyphText} ${toolTierIndicator}`
        : glyphText;
}

function getToolIndicatorPlacement(playerSettings) {
    const rawPlacement = String(playerSettings?.toolIndicatorPlacement || ToolIndicatorPlacementModes.BeforeName);
    if (rawPlacement === ToolIndicatorPlacementModes.AfterName) {
        return ToolIndicatorPlacementModes.AfterName;
    }

    if (rawPlacement === ToolIndicatorPlacementModes.BelowName) {
        return ToolIndicatorPlacementModes.BelowName;
    }

    return ToolIndicatorPlacementModes.BeforeName;
}

function buildBreakableToolsPlacement(toolDescriptors, blockTags, playerSettings, context = {}) {
    const toolText = buildBreakableToolsText(toolDescriptors, blockTags, playerSettings, context);
    if (!toolText) {
        return {
            prefixText: "",
            suffixText: "",
            belowLineText: ""
        };
    }

    const placement = getToolIndicatorPlacement(playerSettings);

    if (placement === ToolIndicatorPlacementModes.BelowName) {
        return {
            prefixText: "",
            suffixText: "",
            belowLineText: `\n${toolText}`
        };
    }

    if (placement === ToolIndicatorPlacementModes.AfterName) {
        return {
            prefixText: "",
            suffixText: `${EmojiLayout.blockNameToolSpacing}${toolText}`,
            belowLineText: ""
        };
    }

    return {
        prefixText: `${toolText}${EmojiLayout.blockNameToolSpacing}`,
        suffixText: "",
        belowLineText: ""
    };
}

function buildColumnWrappedList(values, columns = 1) {
    if (!Array.isArray(values) || !values.length) {
        return "";
    }

    const normalizedColumns = Math.max(1, Math.floor(columns));
    const rows = [];

    for (let index = 0; index < values.length; index += normalizedColumns) {
        rows.push(values.slice(index, index + normalizedColumns).join(", "));
    }

    return rows.join("\n");
}

// Tries to resolve a block type ID from an item stack.
// Uses component-based detection first, then WAILA-style heuristics from known block maps.
function checkBlockFromItem(itemStack) {
    if (!itemStack?.typeId) {
        return undefined;
    }

    try {
        const blockPlacer = itemStack.getComponent?.("minecraft:block_placer");
        if (blockPlacer) {
            const candidates = [
                blockPlacer.block,
                blockPlacer.blockType,
                blockPlacer.blockItem,
                blockPlacer.blockId,
                blockPlacer.blockTypeId
            ];

            for (const candidate of candidates) {
                if (!candidate) {
                    continue;
                }

                if (typeof candidate === "string") {
                    return candidate.includes(":") ? candidate : `minecraft:${candidate}`;
                }

                if (typeof candidate === "object") {
                    const candidateTypeId = candidate.typeId || candidate.id;
                    if (typeof candidateTypeId === "string" && candidateTypeId.length) {
                        return candidateTypeId.includes(":")
                            ? candidateTypeId
                            : `minecraft:${candidateTypeId}`;
                    }
                }
            }
        }
    } catch {
        // Ignore component read failures and fallback to heuristics.
    }

    const { namespace, id } = splitTypeId(itemStack.typeId);

    if (namespace === "minecraft" && (BlockNames[id] || BlockPrefixes[id])) {
        return itemStack.typeId;
    }

    return undefined;
}


function buildVanillaBlockTranslationKey(blockId) {
    const translationPrefix = BlockPrefixes[blockId] || "tile";
    const translationName = BlockNames[blockId] || blockId;
    return `${translationPrefix}.${translationName}.name`;
}

function buildItemTranslationRawtext(itemStack) {
    const itemTypeId = itemStack?.typeId;
    if (!itemTypeId) {
        return { text: "Item" };
    }

    const { namespace, id } = splitTypeId(itemTypeId);
    const mappedKey = ItemTranslationKeys[id];
    const blockTypeId = checkBlockFromItem(itemStack);

    if (mappedKey) {
        return { translate: mappedKey };
    }

    if (blockTypeId) {
        const { namespace: blockNamespace, id: blockId } = splitTypeId(blockTypeId);

        if (blockNamespace !== "minecraft") {
            return {
                translate: `tile.${blockTypeId}.name`
            };
        }

        return {
            translate: buildVanillaBlockTranslationKey(blockId)
        };
    }

    if (namespace !== "minecraft") {
        return {
            translate: `item.${itemTypeId}`
        };
    }

    return {
        translate: `item.${id}`
    };
}

function buildEntityTranslationRawtext(entity, typeIdForDisplay) {
    const localizationKey = typeof entity?.localizationKey === "string"
        ? entity.localizationKey.trim()
        : "";

    if (localizationKey.length) {
        return { translate: localizationKey };
    }

    const { id } = splitTypeId(typeIdForDisplay);

    if (typeIdForDisplay.startsWith("minecraft:")) {
        return { translate: `entity.${id}.name` };
    }

    return { translate: `entity.${typeIdForDisplay}.name` };
}

function buildEntityResolvedNameRawtext(entity, typeIdForDisplay, itemStack, playerSettings) {
    if (itemStack?.typeId) {
        return buildItemTranslationRawtext(itemStack);
    }

    if (playerSettings?.nameResolveMode === EntityNameResolveModes.TypeIdToText) {
        return {
            text: formatTypeIdToText(typeIdForDisplay)
        };
    }

    return buildEntityTranslationRawtext(entity, typeIdForDisplay);
}

function pushRawtextPart(rawtext, part) {
    if (!part) {
        return;
    }

    rawtext.push(part);
}

function appendEntityTitle(rawtext, context) {
    const {
        nickname,
        resolvedNameRawtext,
        nameDisplayMode,
        itemStack
    } = context;

    const mode = String(nameDisplayMode || EntityNameDisplayModes.NicknameFirst);
    const hasNickname = typeof nickname === "string" && nickname.trim().length > 0;
    const nicknameValue = hasNickname ? nickname.trim() : "";
    const canShowResolvedName = Boolean(resolvedNameRawtext);

    if (!hasNickname) {
        if (canShowResolvedName) {
            pushRawtextPart(rawtext, resolvedNameRawtext);
        }

        if (itemStack?.amount > 1) {
            rawtext.push({ text: ` §7x${itemStack.amount}§r` });
        }

        return;
    }

    if (mode === EntityNameDisplayModes.NicknameOnly) {
        rawtext.push({ text: nicknameValue });
        return;
    }

    if (mode === EntityNameDisplayModes.MobNameOnly) {
        pushRawtextPart(rawtext, canShowResolvedName ? resolvedNameRawtext : { text: nicknameValue });
        return;
    }

    if (!canShowResolvedName) {
        rawtext.push({ text: nicknameValue });
        return;
    }

    if (mode === EntityNameDisplayModes.MobNameAfterNickname) {
        rawtext.push({ text: nicknameValue });
        rawtext.push({ text: " §7- §r" });
        pushRawtextPart(rawtext, resolvedNameRawtext);
        return;
    }

    if (mode === EntityNameDisplayModes.NicknameAfterMobName) {
        pushRawtextPart(rawtext, resolvedNameRawtext);
        rawtext.push({ text: ` §7- ${nicknameValue}§r` });
        return;
    }

    if (mode === EntityNameDisplayModes.MobNameFirst) {
        pushRawtextPart(rawtext, resolvedNameRawtext);
        rawtext.push({ text: `\n§7${nicknameValue}§r` });
        return;
    }

    rawtext.push({ text: nicknameValue });
    rawtext.push({ text: "\n§7" });
    pushRawtextPart(rawtext, resolvedNameRawtext);
    rawtext.push({ text: "§r" });
}

function normalizeVillagerProfessionName(rawValue) {
    if (typeof rawValue === "string") {
        const normalized = rawValue.trim().toLowerCase();
        if (!normalized.length || normalized === "none") {
            return undefined;
        }

        const label = normalizeVillagerProfessionToken(normalized);
        if (label) {
            return label;
        }

        const sanitized = normalized.includes(":") ? normalized.split(":")[1] : normalized;
        return toTitleWords(sanitized.split("_"));
    }

    if (Number.isFinite(rawValue)) {
        const professionByIndex = [
            "Unemployed",
            "Farmer",
            "Fisherman",
            "Shepherd",
            "Fletcher",
            "Librarian",
            "Cartographer",
            "Cleric",
            "Armorer",
            "Weaponsmith",
            "Toolsmith",
            "Butcher",
            "Leatherworker",
            "Mason",
            "Nitwit"
        ];

        const index = Math.max(0, Math.floor(rawValue));
        return professionByIndex[index];
    }

    return undefined;
}

function normalizeVillagerProfessionToken(rawValue) {
    if (typeof rawValue !== "string") {
        return undefined;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (!normalized.length || normalized === "none") {
        return undefined;
    }

    const baseToken = normalized.includes(":")
        ? normalized.split(":").pop()
        : normalized;

    const candidates = [baseToken];

    if (baseToken.startsWith("villager_profession_")) {
        candidates.push(baseToken.slice("villager_profession_".length));
    }

    if (baseToken.startsWith("profession_")) {
        candidates.push(baseToken.slice("profession_".length));
    }

    if (baseToken.startsWith("is_")) {
        candidates.push(baseToken.slice(3));
    }

    if (baseToken.endsWith("_profession")) {
        candidates.push(baseToken.slice(0, -"_profession".length));
    }

    for (const candidate of candidates) {
        const label = VillagerProfessionTokenLabels[candidate];
        if (label) {
            return label;
        }
    }

    return undefined;
}

function getVillagerProfessionLabelFromList(values) {
    if (!Array.isArray(values) || !values.length) {
        return undefined;
    }

    for (const value of values) {
        const label = normalizeVillagerProfessionToken(String(value || ""));
        if (label) {
            return label;
        }
    }

    return undefined;
}

function getVillagerProfessionLabel(entity, entityTags, entityFamilies) {
    const entityTypeId = String(entity?.typeId || "").toLowerCase();
    if (!VillagerEntityTypeIds.has(entityTypeId)) {
        return undefined;
    }

    const propertyCandidates = [
        "minecraft:profession",
        "profession",
        "minecraft:villager_profession"
    ];

    for (const propertyName of propertyCandidates) {
        try {
            if (typeof entity?.getProperty !== "function") {
                continue;
            }

            const rawValue = entity.getProperty(propertyName);
            const normalizedLabel = normalizeVillagerProfessionName(rawValue);
            if (normalizedLabel) {
                return normalizedLabel;
            }
        } catch {
            // Continue trying other property names.
        }
    }

    const labelFromTags = getVillagerProfessionLabelFromList(entityTags);
    if (labelFromTags) {
        return labelFromTags;
    }

    const labelFromFamilies = getVillagerProfessionLabelFromList(entityFamilies);
    if (labelFromFamilies) {
        return labelFromFamilies;
    }

    return undefined;
}

// -----------------------------------------------------------------------------
// Entity attribute helpers (health / hunger / saturation)
// -----------------------------------------------------------------------------

function getEntityItemStack(entity) {
    try {
        const itemComponent = entity.getComponent("minecraft:item");
        const itemStack = itemComponent?.itemStack;

        if (!itemStack?.typeId) {
            return undefined;
        }

        return itemStack;
    } catch {
        return undefined;
    }
}

function getRoundedHalfHearts(value) {
    return Math.max(0, Math.ceil(value));
}

// Reads a numeric attribute component safely.
// Returns undefined when the component does not exist or is not readable.
function getAttributeValueRange(entity, componentId) {
    try {
        const component = entity.getComponent(componentId);
        if (!component) {
            return undefined;
        }

        const current = Number(component.currentValue);
        const max = Number(component.effectiveMax);

        if (!Number.isFinite(current) || !Number.isFinite(max)) {
            return undefined;
        }

        return {
            current: Math.max(0, current),
            max: Math.max(1, max)
        };
    } catch {
        return undefined;
    }
}

// Reads saturation current value safely (max is not relevant for display right now).
function getAttributeCurrentValue(entity, componentId) {
    try {
        const component = entity.getComponent(componentId);
        if (!component) {
            return undefined;
        }

        const current = Number(component.currentValue);
        return Number.isFinite(current) ? Math.max(0, current) : undefined;
    } catch {
        return undefined;
    }
}

function getAttributeValueRangeFromIds(entity, componentIds) {
    if (!Array.isArray(componentIds)) {
        return getAttributeValueRange(entity, componentIds);
    }

    for (const componentId of componentIds) {
        const range = getAttributeValueRange(entity, componentId);
        if (range) {
            return range;
        }
    }

    return undefined;
}

function getNumericFieldValue(source, fieldNames) {
    if (!source) {
        return undefined;
    }

    for (const field of fieldNames) {
        const value = Number(source[field]);
        if (Number.isFinite(value)) {
            return value;
        }
    }

    return undefined;
}

function getNumericMethodValue(source, methodNames) {
    if (!source) {
        return undefined;
    }

    for (const methodName of methodNames) {
        const method = source[methodName];
        if (typeof method !== "function") {
            continue;
        }

        try {
            const value = Number(method.call(source));
            if (Number.isFinite(value)) {
                return value;
            }
        } catch {
            // Ignore failed accessors.
        }
    }

    return undefined;
}

function getArmorValueRange(entity) {
    const range = getAttributeValueRangeFromIds(entity, PlayerAttributeComponentCandidates.armor);
    if (range) {
        return range;
    }

    const fallbackCurrent = getAttributeCurrentValue(entity, PlayerAttributeComponentIds.armor);
    if (!Number.isFinite(fallbackCurrent)) {
        return undefined;
    }

    const current = Math.max(0, fallbackCurrent);
    return {
        current,
        max: Math.max(20, current)
    };
}

function getAirSupplyInfo(entity) {
    try {
        const component = entity.getComponent(EntityComponentIds.breathable);
        if (!component) {
            return undefined;
        }

        const current = getNumericFieldValue(component, [
            "airSupply",
            "currentAirSupply",
            "remainingAir",
            "air",
            "airLevel"
        ]) ?? getNumericMethodValue(component, [
            "getAirSupply",
            "getCurrentAirSupply",
            "getRemainingAir"
        ]);

        const max = getNumericFieldValue(component, [
            "totalAirSupply",
            "maxAirSupply",
            "maxAir",
            "maximumAirSupply",
            "airSupplyMax"
        ]) ?? getNumericMethodValue(component, [
            "getTotalAirSupply",
            "getMaxAirSupply",
            "getMaximumAirSupply"
        ]);

        if (!Number.isFinite(current) || !Number.isFinite(max)) {
            return undefined;
        }

        return {
            current: Math.max(0, current),
            max: Math.max(1, max)
        };
    } catch {
        return undefined;
    }
}

function normalizeAirSupplyToBubbleUnits(currentValue, maxValue) {
    const current = Math.max(0, Number(currentValue));
    const max = Math.max(1, Number(maxValue));
    const maxUnits = Math.max(2, BubbleDisplay.maxUnits);
    const ratio = max > 0 ? current / max : 0;
    const normalizedCurrent = Math.max(0, Math.min(maxUnits, ratio * maxUnits));

    return {
        current: normalizedCurrent,
        max: maxUnits
    };
}

function isEntityFreezing(entity) {
    try {
        const component = entity.getComponent(EntityComponentIds.freezing);
        if (!component) {
            return false;
        }

        const boolCandidate = component.isFrozen ?? component.isFreezing;
        if (typeof boolCandidate === "boolean") {
            return boolCandidate;
        }

        const numericCandidate = getNumericFieldValue(component, [
            "freezeTicks",
            "frozenTicks",
            "ticksFrozen",
            "freezeTime",
            "frozenTime",
            "totalFreezeTime",
            "remainingFreezeTicks"
        ]) ?? getNumericMethodValue(component, [
            "getFreezeTicks",
            "getFrozenTicks",
            "getFreezeTime"
        ]);

        return Number.isFinite(numericCandidate) ? numericCandidate > 0 : false;
    } catch {
        return false;
    }
}

function isEntityRideable(entity, entityFamilies) {
    try {
        const component = entity.getComponent(EntityComponentIds.rideable);
        if (component) {
            if (Array.isArray(component.seats) && component.seats.length) {
                return true;
            }

            if (typeof component.getSeats === "function") {
                const seats = component.getSeats();
                if (Array.isArray(seats) && seats.length) {
                    return true;
                }
            }

            const seatCount = Number(component.seatCount ?? component.numberOfSeats ?? component.seatCountMax);
            if (Number.isFinite(seatCount)) {
                return seatCount > 0;
            }

            return true;
        }
    } catch {
        // Ignore rideable access failures.
    }

    if (Array.isArray(entityFamilies) && entityFamilies.length) {
        const normalizedFamilies = entityFamilies
            .map((family) => String(family || "").toLowerCase())
            .filter((family) => family.length > 0);

        if (normalizedFamilies.includes("rideable") || normalizedFamilies.includes("mount")) {
            return true;
        }
    }

    return false;
}

function getEffectFlags(effects) {
    const flags = {
        hasWither: false,
        hasPoison: false,
        hasHunger: false
    };

    for (const effect of effects) {
        const typeId = resolveEffectTypeId(effect);
        if (!typeId) {
            continue;
        }

        const normalizedTypeId = normalizeEffectTypeId(typeId);
        if (normalizedTypeId === "wither" || normalizedTypeId === "decay") {
            flags.hasWither = true;
        }

        if (normalizedTypeId === "poison" || normalizedTypeId === "fatal_poison") {
            flags.hasPoison = true;
        }

        if (normalizedTypeId === "hunger") {
            flags.hasHunger = true;
        }
    }

    return flags;
}

function getTameableData(entity) {
    try {
        const tameableComponent = entity.getComponent(EntityComponentIds.tameable);
        if (!tameableComponent) {
            return {
                isTameable: false,
                isTamed: false,
                foodTypeIds: []
            };
        }

        let tameItems = tameableComponent.getTameItems;
        if (typeof tameItems === "function") {
            tameItems = tameItems.call(tameableComponent);
        }

        const rawItems = Array.isArray(tameItems) ? tameItems : [];
        const seenTypeIds = new Set();
        const foodTypeIds = [];

        for (const itemStack of rawItems) {
            const typeId = itemStack?.typeId;
            if (!typeId || seenTypeIds.has(typeId)) {
                continue;
            }

            seenTypeIds.add(typeId);
            foodTypeIds.push(typeId);
        }

        return {
            isTameable: true,
            isTamed: Boolean(tameableComponent.isTamed),
            foodTypeIds
        };
    } catch {
        return {
            isTameable: false,
            isTamed: false,
            foodTypeIds: []
        };
    }
}

function getEntityEffects(entity) {
    try {
        if (typeof entity.getEffects !== "function") {
            return [];
        }

        const effects = entity.getEffects();
        return Array.isArray(effects) ? effects : [];
    } catch {
        return [];
    }
}

function resolveEffectTypeId(effect) {
    const rawTypeId = effect?.typeId
        ?? effect?.type?.id
        ?? effect?.effectType?.id
        ?? effect?.effectType;

    if (typeof rawTypeId !== "string" || !rawTypeId.length) {
        return undefined;
    }

    return rawTypeId.includes(":") ? rawTypeId : `minecraft:${rawTypeId}`;
}

function normalizeEffectTypeId(typeId) {
    const { id } = splitTypeId(typeId);
    return id.toLowerCase();
}

function getEffectLevel(effect) {
    const amplifier = Number(effect?.amplifier);
    if (!Number.isFinite(amplifier)) {
        return 1;
    }

    return Math.max(1, Math.floor(amplifier) + 1);
}

function toRomanNumeral(value) {
    const integerValue = Math.max(1, Math.floor(value));
    const doriosApiConverter = globalThis?.DoriosAPI?.math?.integerToRoman;

    if (typeof doriosApiConverter === "function") {
        const converted = doriosApiConverter(integerValue);
        if (typeof converted === "string" && converted.length) {
            return converted;
        }
    }

    const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    if (integerValue >= 1 && integerValue <= numerals.length) {
        return numerals[integerValue - 1];
    }

    return `${integerValue}`;
}

function getEffectDurationTicks(effect) {
    const directCandidates = [
        effect?.duration,
        effect?.durationTicks,
        effect?.remainingDuration,
        effect?.remainingDurationTicks
    ];

    for (const candidate of directCandidates) {
        const numericValue = Number(candidate);
        if (Number.isFinite(numericValue)) {
            return Math.max(0, Math.floor(numericValue));
        }
    }

    try {
        if (typeof effect?.getDuration === "function") {
            const durationValue = Number(effect.getDuration());
            if (Number.isFinite(durationValue)) {
                return Math.max(0, Math.floor(durationValue));
            }
        }
    } catch {
        // Ignore duration accessor failures.
    }

    return undefined;
}

function formatSecondsAsClock(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatEffectDuration(effect) {
    const durationTicks = getEffectDurationTicks(effect);
    if (!Number.isFinite(durationTicks)) {
        return undefined;
    }

    // Bedrock uses very large durations to represent effectively permanent effects.
    if (durationTicks >= 2_000_000_000) {
        return EffectDisplay.infiniteDurationLabel;
    }

    const durationSeconds = Math.floor(durationTicks / 20);
    return formatSecondsAsClock(durationSeconds);
}

function getEffectPolarity(normalizedTypeId) {
    if (PositiveEffectTypeIds.has(normalizedTypeId)) {
        return "positive";
    }

    if (NegativeEffectTypeIds.has(normalizedTypeId)) {
        return "negative";
    }

    return "neutral";
}

function buildEffectTextEntry(effect) {
    const typeId = resolveEffectTypeId(effect);
    if (!typeId) {
        return undefined;
    }

    const normalizedTypeId = normalizeEffectTypeId(typeId);
    const effectName = formatTypeIdToText(typeId);
    const effectLevel = toRomanNumeral(getEffectLevel(effect));
    const effectPolarity = getEffectPolarity(normalizedTypeId);
    const colorCode = EffectTextColors[effectPolarity] || EffectTextColors.neutral;
    const effectDuration = formatEffectDuration(effect);

    let entryText = `${colorCode}${effectName} ${effectLevel}`;
    if (effectDuration) {
        entryText += ` §7(${effectDuration})`;
    }

    return `${entryText}§r`;
}

function buildEffectEmojiEntry(effect) {
    const typeId = resolveEffectTypeId(effect);
    if (!typeId) {
        return undefined;
    }

    const normalizedTypeId = normalizeEffectTypeId(typeId);
    const glyph = EffectGlyphByTypeId[normalizedTypeId] || EffectDisplay.unknownGlyph;
    const effectLevel = toRomanNumeral(getEffectLevel(effect));
    const effectDuration = formatEffectDuration(effect);

    let entryText = `${glyph}${EffectDisplay.iconAmplifierSpacing}${effectLevel}`;
    if (effectDuration) {
        entryText += ` §7(${effectDuration})`;
    }

    return `${entryText}§r`;
}

function buildEffectsDisplay(effects, playerSettings) {
    if (!effects.length) {
        return undefined;
    }

    const maxVisibleEffects = Math.max(0, playerSettings.maxVisibleEffects);
    const visibleEffects = effects.slice(0, maxVisibleEffects);
    if (!visibleEffects.length) {
        return undefined;
    }

    const useTextMode = playerSettings.effectDisplayMode === EffectDisplayModes.Text || isTextDisplayStyle(playerSettings);
    const entries = [];

    for (const effect of visibleEffects) {
        const entry = useTextMode
            ? buildEffectTextEntry(effect)
            : buildEffectEmojiEntry(effect);

        if (entry) {
            entries.push(entry);
        }
    }

    if (!entries.length) {
        return undefined;
    }

    let body = useTextMode
        ? entries.join("§7, §r")
        : entries.join(" ");

    const hiddenEffects = effects.length - visibleEffects.length;

    const result = [tr("ui.dorios.insight.display.effects", [body])];

    if (hiddenEffects > 0) {
        result.push(useTextMode ? { text: "§7, §8" } : { text: " §8" });
        result.push(tr("ui.dorios.insight.display.more_items", [`${hiddenEffects}`]));
    }

    result.push({ text: "§r" });
    return result;
}

function buildWrappedCommaList(values, entriesPerLine) {
    if (!values.length) {
        return "";
    }

    const perLine = Math.max(1, Math.floor(entriesPerLine));
    let text = "";

    for (let index = 0; index < values.length; index++) {
        if (index > 0) {
            text += index % perLine === 0 ? ",\n" : ", ";
        }

        text += values[index];
    }

    return text;
}

function buildTameFoodsDisplay(foodTypeIds) {
    const foodLabels = foodTypeIds.map((typeId) => formatTypeIdToText(typeId));
    return buildWrappedCommaList(foodLabels, TameableDisplay.foodsPerLine);
}

function appendCustomFieldLines(rawtext, lines) {
    if (!Array.isArray(lines) || !lines.length) {
        return;
    }

    for (const line of lines) {
        if (typeof line !== "string" || !line.length) {
            continue;
        }

        rawtext.push({
            text: `\n${InsightConfig.display.technicalColor}${line}§r`
        });
    }
}

function resolveHealthGlyphSet({
    isPlayer,
    isFreezing,
    effectFlags,
    isRideable,
    playerSettings
}) {
    if (isPlayer && playerSettings.showFrozenHearts && isFreezing) {
        return HeartGlyphSets.frozen;
    }

    if (playerSettings.showEffectHearts) {
        if (effectFlags.hasWither) {
            return HeartGlyphSets.wither;
        }

        if (effectFlags.hasPoison) {
            return HeartGlyphSets.poison;
        }
    }

    if (!isPlayer && playerSettings.showAnimalHearts && isRideable) {
        return HeartGlyphSets.animal;
    }

    return HeartGlyphSets.normal;
}

function resolveHungerGlyphSet(effectFlags, playerSettings) {
    if (playerSettings.showHungerEffect && effectFlags.hasHunger) {
        return HungerGlyphSets.effect;
    }

    return HungerGlyphSets.normal;
}

// Shared helper to render attribute bars that support full / half / empty glyphs.
// Used for hearts and hunger bars.
function buildHalfStepEmojiBar(currentValue, maxValue, glyphs, maxIconsPerLine) {
    const current = Math.max(0, currentValue);
    const max = Math.max(1, maxValue);

    const roundedCurrent = getRoundedHalfHearts(current);
    const roundedMax = getRoundedHalfHearts(max);

    const fullGlyphs = Math.floor(roundedCurrent / 2);
    const hasHalfGlyph = roundedCurrent % 2 !== 0;
    const emptyGlyphs = Math.max(0, Math.floor((roundedMax - roundedCurrent) / 2));

    let bar = glyphs.full.repeat(fullGlyphs);
    if (hasHalfGlyph) {
        bar += glyphs.half;
    }
    bar += glyphs.empty.repeat(emptyGlyphs);

    return addLineBreakEvery(bar, maxIconsPerLine);
}

function addLineBreakEvery(input, chunkSize) {
    if (!input || input.length <= chunkSize) {
        return input;
    }

    let output = "";
    for (let index = 0; index < input.length; index++) {
        if (index > 0 && index % chunkSize === 0) {
            output += "\n";
        }
        output += input[index];
    }

    return output;
}

function buildHealthDisplay(currentValue, maxValue, maxHeartDisplayHealth, displayStyle, glyphs = HeartGlyphSets.normal) {
    const current = Math.max(0, currentValue);
    const max = Math.max(1, maxValue);
    const normalizedDisplayStyle = normalizeDisplayStyleValue(displayStyle);
    const percentValue = Math.max(0, Math.min(100, (current / max) * 100));
    const roundedPercentValue = Math.floor(percentValue * 10) / 10;

    if (normalizedDisplayStyle === DisplayStyles.TextFull) {
        return tr("ui.dorios.insight.display.health_full", [current.toFixed(1), max.toFixed(1)]);
    }

    if (normalizedDisplayStyle === DisplayStyles.TextPercent) {
        return tr("ui.dorios.insight.display.health_percent", [`${roundedPercentValue}`]);
    }

    if (normalizedDisplayStyle === DisplayStyles.HybridFull) {
        return tr("ui.dorios.insight.display.health_hybrid_full", [glyphs.full, current.toFixed(1), max.toFixed(1)]);
    }

    if (normalizedDisplayStyle === DisplayStyles.HybridPercent) {
        return tr("ui.dorios.insight.display.health_hybrid_percent", [glyphs.full, `${roundedPercentValue}`]);
    }

    const threshold = Number.isFinite(maxHeartDisplayHealth)
        ? Math.max(1, maxHeartDisplayHealth)
        : InsightConfig.system.maxHeartDisplayHealth;

    if (max > threshold || current > threshold) {
        return { text: `§c${Math.ceil(current)}§f/§c${Math.ceil(max)}${glyphs.full}` };
    }

    return { text: buildHalfStepEmojiBar(
        current,
        max,
        glyphs,
        InsightConfig.system.maxHeartsPerLine
    ) };
}

function buildHungerDisplay(currentValue, maxValue, displayStyle, glyphs = HungerGlyphSets.normal) {
    const current = Math.max(0, Number(currentValue) || 0);
    const max = Math.max(1, Number(maxValue) || 1);
    const normalizedDisplayStyle = normalizeDisplayStyleValue(displayStyle);
    const roundedPercentValue = Math.floor(Math.max(0, Math.min(100, (current / max) * 100)) * 10) / 10;

    if (normalizedDisplayStyle === DisplayStyles.TextFull) {
        return tr("ui.dorios.insight.display.hunger_full", [current.toFixed(1), max.toFixed(1)]);
    }

    if (normalizedDisplayStyle === DisplayStyles.TextPercent) {
        return tr("ui.dorios.insight.display.hunger_percent", [`${roundedPercentValue}`]);
    }

    if (normalizedDisplayStyle === DisplayStyles.HybridFull) {
        return tr("ui.dorios.insight.display.hunger_hybrid_full", [glyphs.full, current.toFixed(1), max.toFixed(1)]);
    }

    if (normalizedDisplayStyle === DisplayStyles.HybridPercent) {
        return tr("ui.dorios.insight.display.hunger_hybrid_percent", [glyphs.full, `${roundedPercentValue}`]);
    }

    return { text: buildHalfStepEmojiBar(
        currentValue,
        maxValue,
        glyphs,
        InsightConfig.system.maxHeartsPerLine
    ) };
}

function buildAbsorptionDisplay(currentValue, displayStyle) {
    const current = Number(currentValue);
    if (!Number.isFinite(current) || current <= 0) {
        return undefined;
    }

    if (normalizeDisplayStyleValue(displayStyle) !== DisplayStyles.Icon) {
        return tr("ui.dorios.insight.display.absorption_text", [current.toFixed(1)]);
    }

    const roundedCurrent = getRoundedHalfHearts(current);
    const fullGlyphs = Math.floor(roundedCurrent / 2);
    const hasHalfGlyph = roundedCurrent % 2 !== 0;

    let absorptionHearts = Emojis.heartAbsorptionFull.repeat(fullGlyphs);
    if (hasHalfGlyph) {
        absorptionHearts += Emojis.heartAbsorptionHalf;
    }

    const wrappedHearts = addLineBreakEvery(absorptionHearts, InsightConfig.system.maxHeartsPerLine);
    return { text: `§6${wrappedHearts}§r` };
}

function buildArmorDisplay(currentValue, maxValue, displayStyle) {
    const current = Math.max(0, Number(currentValue) || 0);
    const max = Math.max(1, Number(maxValue) || 1);
    const normalizedDisplayStyle = normalizeDisplayStyleValue(displayStyle);
    const roundedPercentValue = Math.floor(Math.max(0, Math.min(100, (current / max) * 100)) * 10) / 10;

    if (normalizedDisplayStyle === DisplayStyles.TextFull) {
        return tr("ui.dorios.insight.display.armor_full", [current.toFixed(1), max.toFixed(1)]);
    }

    if (normalizedDisplayStyle === DisplayStyles.TextPercent) {
        return tr("ui.dorios.insight.display.armor_percent", [`${roundedPercentValue}`]);
    }

    if (normalizedDisplayStyle === DisplayStyles.HybridFull) {
        return tr("ui.dorios.insight.display.armor_hybrid_full", [ArmorGlyphs.full, current.toFixed(1), max.toFixed(1)]);
    }

    if (normalizedDisplayStyle === DisplayStyles.HybridPercent) {
        return tr("ui.dorios.insight.display.armor_hybrid_percent", [ArmorGlyphs.full, `${roundedPercentValue}`]);
    }

    return { text: buildHalfStepEmojiBar(
        currentValue,
        maxValue,
        ArmorGlyphs,
        InsightConfig.system.maxHeartsPerLine
    ) };
}

function buildAirBubbleDisplay(currentValue, maxValue, displayStyle) {
    const current = Math.max(0, Number(currentValue) || 0);
    const max = Math.max(1, Number(maxValue) || 1);
    const normalizedDisplayStyle = normalizeDisplayStyleValue(displayStyle);
    const roundedPercentValue = Math.floor(Math.max(0, Math.min(100, (current / max) * 100)) * 10) / 10;

    if (normalizedDisplayStyle === DisplayStyles.TextFull) {
        return tr("ui.dorios.insight.display.air_full", [current.toFixed(1), max.toFixed(1)]);
    }

    if (normalizedDisplayStyle === DisplayStyles.TextPercent) {
        return tr("ui.dorios.insight.display.air_percent", [`${roundedPercentValue}`]);
    }

    if (normalizedDisplayStyle === DisplayStyles.HybridFull) {
        return tr("ui.dorios.insight.display.air_hybrid_full", [BubbleGlyphs.full, current.toFixed(1), max.toFixed(1)]);
    }

    if (normalizedDisplayStyle === DisplayStyles.HybridPercent) {
        return tr("ui.dorios.insight.display.air_hybrid_percent", [BubbleGlyphs.full, `${roundedPercentValue}`]);
    }

    const normalized = normalizeAirSupplyToBubbleUnits(currentValue, maxValue);
    return { text: buildHalfStepEmojiBar(
        normalized.current,
        normalized.max,
        BubbleGlyphs,
        InsightConfig.system.maxHeartsPerLine
    ) };
}

function getBlockLocationLine(block) {
    const location = block?.location;

    if (!location) {
        return undefined;
    }

    return tr("ui.dorios.insight.display.position", [`${location.x}`, `${location.y}`, `${location.z}`]);
}

function getEntityLocationLine(entity) {
    const location = entity?.location;

    if (!location) {
        return undefined;
    }

    return tr("ui.dorios.insight.display.position", [location.x.toFixed(1), location.y.toFixed(1), location.z.toFixed(1)]);
}

function getEntityVelocityLine(entity) {
    let velocity;
    try {
        velocity = entity.getVelocity?.();
    } catch {
        velocity = undefined;
    }

    if (!velocity) {
        return undefined;
    }

    return tr("ui.dorios.insight.display.velocity", [velocity.x.toFixed(2), velocity.y.toFixed(2), velocity.z.toFixed(2)]);
}

// -----------------------------------------------------------------------------
// Entity scoreboard display
// -----------------------------------------------------------------------------

/**
 * Reads a scoreboard objective value from an entity.
 * Returns the numeric score or undefined if not available.
 */
function getEntityScoreboardValue(entity, objectiveId) {
    try {
        const identity = entity.scoreboardIdentity;
        if (!identity) {
            return undefined;
        }

        const objective = world.scoreboard.getObjective(objectiveId);
        if (!objective) {
            return undefined;
        }

        const score = objective.getScore(identity);
        return Number.isFinite(score) ? score : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Reads a mantissa + exponent pair from scoreboards and returns the decoded value.
 * The pattern follows: value = mantissa * 10^exponent
 * Used by UtilityCraft energy system (energy/energyExp, energyCap/energyCapExp).
 */
function decodeScoreboardMantissaExponent(entity, mantissaObjective, exponentObjective) {
    const mantissa = getEntityScoreboardValue(entity, mantissaObjective);
    if (mantissa === undefined) {
        return undefined;
    }

    const exponent = getEntityScoreboardValue(entity, exponentObjective);
    if (exponent === undefined || exponent === 0) {
        return mantissa;
    }

    return mantissa * Math.pow(10, exponent);
}

/**
 * Formats a large number with SI suffixes for display.
 */
function formatLargeNumber(value) {
    if (!Number.isFinite(value) || value < 0) {
        return "0";
    }

    const suffixes = ["", "K", "M", "B", "T"];
    let tier = Math.floor(Math.log10(Math.max(1, Math.abs(value))) / 3);
    tier = Math.min(tier, suffixes.length - 1);

    if (tier === 0) {
        return value % 1 === 0 ? `${value}` : value.toFixed(1);
    }

    const scaled = value / Math.pow(10, tier * 3);
    return `${scaled.toFixed(1)}${suffixes[tier]}`;
}

/**
 * Known scoreboard field definitions for display.
 * Each entry describes how to read and display a scoreboard-based value.
 */
const ScoreboardFieldDefinitions = [
    {
        key: "energy",
        labelKey: "ui.dorios.insight.display.scoreboard_energy",
        mantissa: "energy",
        exponent: "energyExp",
        capMantissa: "energyCap",
        capExponent: "energyCapExp",
        mode: "mantissa_exponent_pair"
    },
    {
        key: "capacity",
        labelKey: "ui.dorios.insight.display.scoreboard_capacity",
        objective: "capacity",
        capObjective: "max_capacity",
        mode: "simple_pair"
    }
];

/**
 * Appends scoreboard-based fields to the rawtext array for entities that have matching scores.
 */
function appendEntityScoreboardFields(rawtext, entity, playerSettings) {
    if (!playerSettings.showEntityScoreboards) {
        return;
    }

    try {
        const identity = entity.scoreboardIdentity;
        if (!identity) {
            return;
        }
    } catch {
        return;
    }

    for (const field of ScoreboardFieldDefinitions) {
        if (field.mode === "mantissa_exponent_pair") {
            const value = decodeScoreboardMantissaExponent(entity, field.mantissa, field.exponent);
            if (value === undefined) {
                continue;
            }

            const cap = decodeScoreboardMantissaExponent(entity, field.capMantissa, field.capExponent);
            if (cap !== undefined && cap > 0) {
                appendDisplayLine(rawtext, tr(field.labelKey, [formatLargeNumber(value), formatLargeNumber(cap)]));
            } else {
                appendDisplayLine(rawtext, tr(field.labelKey, [formatLargeNumber(value), "---"]));
            }
        } else if (field.mode === "simple_pair") {
            const value = getEntityScoreboardValue(entity, field.objective);
            if (value === undefined) {
                continue;
            }

            const cap = field.capObjective
                ? getEntityScoreboardValue(entity, field.capObjective)
                : undefined;

            if (cap !== undefined && cap > 0) {
                appendDisplayLine(rawtext, tr(field.labelKey, [formatLargeNumber(value), formatLargeNumber(cap)]));
            } else {
                appendDisplayLine(rawtext, tr(field.labelKey, [formatLargeNumber(value), "---"]));
            }
        }
    }
}

function appendBlockTags(rawtext, blockTags, playerSettings) {
    if (!playerSettings.showBlockTags || !blockTags.length) {
        return;
    }

    const maxTags = Math.max(0, playerSettings.maxVisibleBlockTags);
    const visibleTags = blockTags.slice(0, maxTags);
    if (!visibleTags.length) {
        return;
    }

    const formattedTags = buildColumnWrappedList(visibleTags, playerSettings.tagColumns);

    rawtext.push({ text: "\n" });
    rawtext.push(tr("ui.dorios.insight.display.tags", [`${InsightConfig.display.tagsColor}${formattedTags}§r`]));

    const hiddenTags = blockTags.length - visibleTags.length;
    if (hiddenTags > 0) {
        rawtext.push({ text: " " });
        rawtext.push(tr("ui.dorios.insight.display.more_items", [`${hiddenTags}`]));
    }
}

function appendEntityTags(rawtext, entityTags, playerSettings) {
    if (!playerSettings.showEntityTags || !entityTags.length) {
        return;
    }

    const maxTags = Math.max(0, playerSettings.maxVisibleEntityTags);
    const visibleTags = entityTags.slice(0, maxTags);
    if (!visibleTags.length) {
        return;
    }

    const formattedTags = buildColumnWrappedList(visibleTags, playerSettings.tagColumns);

    rawtext.push({ text: "\n" });
    rawtext.push(tr("ui.dorios.insight.display.tags", [`${InsightConfig.display.tagsColor}${formattedTags}§r`]));

    const hiddenTags = entityTags.length - visibleTags.length;
    if (hiddenTags > 0) {
        rawtext.push({ text: " " });
        rawtext.push(tr("ui.dorios.insight.display.more_items", [`${hiddenTags}`]));
    }
}

function getEntityFamilies(entity) {
    try {
        const typeFamily = entity.getComponent("minecraft:type_family");
        if (!typeFamily || typeof typeFamily.getTypeFamilies !== "function") {
            return [];
        }

        return typeFamily.getTypeFamilies() ?? [];
    } catch {
        return [];
    }
}

function appendEntityFamilies(rawtext, entityFamilies, playerSettings) {
    if (!playerSettings.showEntityFamilies || !entityFamilies.length) {
        return;
    }

    const maxFamilies = Math.max(0, playerSettings.maxVisibleEntityFamilies);
    const visibleFamilies = entityFamilies.slice(0, maxFamilies);
    if (!visibleFamilies.length) {
        return;
    }

    const formattedFamilies = buildColumnWrappedList(visibleFamilies, playerSettings.familyColumns);

    rawtext.push({ text: "\n" });
    rawtext.push(tr("ui.dorios.insight.display.families", [`${InsightConfig.display.tagsColor}${formattedFamilies}§r`]));

    const hiddenFamilies = entityFamilies.length - visibleFamilies.length;
    if (hiddenFamilies > 0) {
        rawtext.push({ text: " " });
        rawtext.push(tr("ui.dorios.insight.display.more_items", [`${hiddenFamilies}`]));
    }
}

// -----------------------------------------------------------------------------
// Main flow implementation
// -----------------------------------------------------------------------------

function buildBlockActionbarPayload(block, playerSettings, context = {}) {
    // Step 1: collect block identity + namespace context.
    const blockTags = sortBlockTagsForDisplay(getBlockTagsSafe(block));
    const namespaceInfo = resolveInjectedNamespace(block.typeId, blockTags);

    const rawtext = [];
    // Step 2: compose title line (translated block name + optional tool suffix).
    const toolDescriptors = getBlockToolDescriptors(block, blockTags);
    const breakableToolsPlacement = buildBreakableToolsPlacement(toolDescriptors, blockTags, playerSettings, context);

    if (breakableToolsPlacement.prefixText) {
        rawtext.push({
            text: breakableToolsPlacement.prefixText
        });
    }

    rawtext.push(buildBlockTranslationRawtext(block));

    if (breakableToolsPlacement.suffixText) {
        rawtext.push({
            text: breakableToolsPlacement.suffixText
        });
    }

    if (breakableToolsPlacement.belowLineText) {
        rawtext.push({
            text: breakableToolsPlacement.belowLineText
        });
    }

    if (playerSettings.showNamespace) {
        rawtext.push({
            text: formatNamespaceLabel(namespaceInfo.displayNamespace, InsightConfig.display.namespaceColor)
        });
    }

    if (playerSettings.showCustomFields) {
        const customFieldLines = collectCustomBlockFieldLines({
            block,
            playerSettings,
            blockTags,
            namespaceInfo,
            formatStateName,
            formatTypeIdToText,
            splitTypeId,
            toMessageText
        });

        appendCustomFieldLines(rawtext, customFieldLines);
    }

    let states = {};
    try {
        states = block.permutation.getAllStates();
    } catch {
        states = {};
    }

    const rawStateEntries = Object.entries(states);
    const stateEntries = transformBlockStateEntries({
        block,
        typeId: block.typeId,
        rawStates: states,
        blockTags,
        namespaceInfo,
        formatStateName,
        toMessageText
    });

    // Step 3: append optional state rows.
    if (playerSettings.showBlockStates && stateEntries.length) {
        rawtext.push({ text: InsightConfig.display.separator });

        const maxRows = Math.max(0, playerSettings.maxVisibleStates);
        const visibleEntries = stateEntries.slice(0, maxRows);

        if (visibleEntries.length) {
            const stateColumns = Math.max(1, playerSettings.stateColumns || 1);
            const renderedStateEntries = visibleEntries.map((entry) => `${entry.label}: ${entry.valueText}`);
            const wrappedStates = buildColumnWrappedList(renderedStateEntries, stateColumns);

            rawtext.push({
                text: `\n${wrappedStates}`
            });
        }

        const hiddenRows = stateEntries.length - visibleEntries.length;
        if (hiddenRows > 0) {
            rawtext.push({ text: " " });
            rawtext.push(tr("ui.dorios.insight.display.more_items", [`${hiddenRows}`]));
        }
    }

    // Step 4: append optional technical sections (tags, ids, coordinates, debug).
    appendBlockTags(rawtext, blockTags, playerSettings);

    if (playerSettings.showTypeId) {
        appendDisplayLine(rawtext, tr("ui.dorios.insight.display.type_id", [block.typeId]));
    }

    if (playerSettings.showCoordinates) {
        appendDisplayLine(rawtext, getBlockLocationLine(block));
    }

    if (playerSettings.showTechnicalData) {
        appendDisplayLine(rawtext, tr("ui.dorios.insight.display.technical_block", [`${rawStateEntries.length}`, `${stateEntries.length}`, `${blockTags.length}`]));

        if (namespaceInfo.injected && playerSettings.showNamespaceResolutionDebug) {
            appendDisplayLine(rawtext, tr("ui.dorios.insight.display.namespace_debug", [namespaceInfo.originalNamespace, namespaceInfo.displayNamespace]));
            appendDisplayLine(rawtext, tr("ui.dorios.insight.display.namespace_mapped_by", [namespaceInfo.source]));
        }
    }

    return { rawtext };
}

function buildEntityActionbarPayload(entity, playerSettings) {
    // Step 1: gather context about target type and optional player attributes.
    const rawtext = [];
    let entityTags = [];
    let healthComponent;
    const tameableData = getTameableData(entity);
    const isTargetPlayer = entity.typeId === "minecraft:player";
    const hungerInfo = isTargetPlayer
        ? getAttributeValueRange(entity, PlayerAttributeComponentIds.hunger)
        : undefined;
    const armorInfo = isTargetPlayer
        ? getArmorValueRange(entity)
        : undefined;
    const absorptionValue = isTargetPlayer
        ? getAttributeCurrentValue(entity, PlayerAttributeComponentIds.absorption)
        : undefined;
    const saturationValue = isTargetPlayer
        ? getAttributeCurrentValue(entity, PlayerAttributeComponentIds.saturation)
        : undefined;
    const airInfo = isTargetPlayer
        ? getAirSupplyInfo(entity)
        : undefined;
    const isFreezing = isTargetPlayer && playerSettings.showFrozenHearts
        ? isEntityFreezing(entity)
        : false;
    const effects = getEntityEffects(entity);
    const effectFlags = getEffectFlags(effects);

    const itemStack = entity.typeId === "minecraft:item" ? getEntityItemStack(entity) : undefined;
    const typeIdForDisplay = itemStack?.typeId || entity.typeId;

    try {
        if (typeof entity.getTags === "function") {
            entityTags = entity.getTags() ?? [];
        }
    } catch {
        entityTags = [];
    }

    const namespaceInfo = resolveInjectedNamespace(typeIdForDisplay, entityTags);
    const entityFamilies = getEntityFamilies(entity);
    const villagerProfessionLabel = getVillagerProfessionLabel(entity, entityTags, entityFamilies);
    const isRideable = !isTargetPlayer && playerSettings.showAnimalHearts
        ? isEntityRideable(entity, entityFamilies)
        : false;
    const healthGlyphs = resolveHealthGlyphSet({
        isPlayer: isTargetPlayer,
        isFreezing,
        effectFlags,
        isRideable,
        playerSettings
    });
    const hungerGlyphs = resolveHungerGlyphSet(effectFlags, playerSettings);

    try {
        healthComponent = entity.getComponent(EntityHealthComponent.componentId);
    } catch {
        healthComponent = undefined;
    }

    // Step 2: compose title line using configurable naming modes.
    appendEntityTitle(rawtext, {
        nickname: entity.nameTag,
        resolvedNameRawtext: buildEntityResolvedNameRawtext(entity, typeIdForDisplay, itemStack, playerSettings),
        nameDisplayMode: playerSettings.nameDisplayMode,
        itemStack
    });

    if (villagerProfessionLabel && playerSettings.villagerProfessionDisplay === VillagerProfessionDisplayModes.AfterName) {
        rawtext.push({ text: ` §7(${villagerProfessionLabel})§r` });
    }

    if (villagerProfessionLabel && playerSettings.villagerProfessionDisplay === VillagerProfessionDisplayModes.BelowName) {
        rawtext.push({ text: "\n" });
        rawtext.push(tr("ui.dorios.insight.display.profession", [villagerProfessionLabel]));
    }

    if (playerSettings.showNamespace) {
        rawtext.push({
            text: formatNamespaceLabel(namespaceInfo.displayNamespace, InsightConfig.display.namespaceColor)
        });
    }

    if (playerSettings.showCustomFields) {
        const customFieldLines = collectCustomEntityFieldLines({
            entity,
            playerSettings,
            typeIdForDisplay,
            namespaceInfo,
            formatTypeIdToText,
            splitTypeId,
            toMessageText
        });

        appendCustomFieldLines(rawtext, customFieldLines);
    }

    // Step 2.5: append scoreboard-based fields (energy, capacity, etc.).
    appendEntityScoreboardFields(rawtext, entity, playerSettings);

    // Step 3: append visual bars (health and hunger) when enabled.
    if (playerSettings.showHealth && healthComponent) {
        appendDisplayLine(rawtext, buildHealthDisplay(
            healthComponent.currentValue,
            healthComponent.effectiveMax,
            playerSettings.maxHeartDisplayHealth,
            playerSettings.displayStyle,
            healthGlyphs
        ));
    }

    if (playerSettings.showAbsorption && Number.isFinite(absorptionValue) && absorptionValue > 0) {
        appendDisplayLine(rawtext, buildAbsorptionDisplay(absorptionValue, playerSettings.displayStyle));
    }

    if (isTargetPlayer && playerSettings.showArmor && armorInfo) {
        appendDisplayLine(rawtext, buildArmorDisplay(armorInfo.current, armorInfo.max, playerSettings.displayStyle));
    }

    // Show hunger for targeted players using official player hunger attribute component.
    if (playerSettings.showHunger && hungerInfo) {
        appendDisplayLine(rawtext, buildHungerDisplay(hungerInfo.current, hungerInfo.max, playerSettings.displayStyle, hungerGlyphs));
    }

    if (isTargetPlayer && playerSettings.showAirBubbles && airInfo && airInfo.current < airInfo.max) {
        appendDisplayLine(rawtext, buildAirBubbleDisplay(airInfo.current, airInfo.max, playerSettings.displayStyle));
    }

    if (playerSettings.showEffects) {
        appendDisplayLine(rawtext, buildEffectsDisplay(effects, playerSettings));
    }

    if (playerSettings.showTameable) {
        appendDisplayLine(rawtext, tr(
            tameableData.isTameable
                ? "ui.dorios.insight.display.tameable_yes"
                : "ui.dorios.insight.display.tameable_no"
        ));

        if (tameableData.isTameable) {
            appendDisplayLine(rawtext, tr(
                tameableData.isTamed
                    ? "ui.dorios.insight.display.tamed_yes"
                    : "ui.dorios.insight.display.tamed_no"
            ));
        }
    }

    if (playerSettings.showTameFoods && tameableData.isTameable) {
        appendDisplayLine(rawtext, tr("ui.dorios.insight.display.foods", [buildTameFoodsDisplay(tameableData.foodTypeIds)]));
    }

    // Step 4: append optional metadata blocks.
    appendEntityTags(rawtext, entityTags, playerSettings);
    appendEntityFamilies(rawtext, entityFamilies, playerSettings);

    if (playerSettings.showTypeId) {
        appendDisplayLine(rawtext, tr("ui.dorios.insight.display.type_id", [typeIdForDisplay]));
    }

    if (playerSettings.showCoordinates) {
        appendDisplayLine(rawtext, getEntityLocationLine(entity));
    }

    if (playerSettings.showVelocity) {
        appendDisplayLine(rawtext, getEntityVelocityLine(entity));
    }

    if (playerSettings.showTechnicalData) {
        appendDisplayLine(rawtext, tr("ui.dorios.insight.display.technical_entity", [`${entityTags.length}`, `${entityFamilies.length}`]));

        if (namespaceInfo.injected && playerSettings.showNamespaceResolutionDebug) {
            appendDisplayLine(rawtext, tr("ui.dorios.insight.display.namespace_debug", [namespaceInfo.originalNamespace, namespaceInfo.displayNamespace]));
            appendDisplayLine(rawtext, tr("ui.dorios.insight.display.namespace_mapped_by", [namespaceInfo.source]));
        }

        if (playerSettings.showHealth && healthComponent) {
            const current = Math.max(0, healthComponent.currentValue);
            const max = Math.max(1, healthComponent.effectiveMax);
            const healthPercent = Math.floor((current / max) * 1000) / 10;

            appendDisplayLine(rawtext, tr("ui.dorios.insight.display.technical_hp", [current.toFixed(1), max.toFixed(1), `${healthPercent}`]));
        }

        if (playerSettings.showHunger && hungerInfo) {
            appendDisplayLine(rawtext, tr("ui.dorios.insight.display.technical_hunger", [hungerInfo.current.toFixed(1), hungerInfo.max.toFixed(1)]));
        }

        if (playerSettings.showHunger && Number.isFinite(saturationValue)) {
            appendDisplayLine(rawtext, tr("ui.dorios.insight.display.technical_saturation", [saturationValue.toFixed(2)]));
        }

        if (playerSettings.showAbsorption && Number.isFinite(absorptionValue) && absorptionValue > 0) {
            appendDisplayLine(rawtext, tr("ui.dorios.insight.display.technical_absorption", [absorptionValue.toFixed(1)]));
        }

        if (playerSettings.showEffects) {
            appendDisplayLine(rawtext, tr("ui.dorios.insight.display.technical_effects", [`${effects.length}`]));
        }
    }

    return { rawtext };
}
