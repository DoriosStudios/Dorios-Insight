import { EntityHealthComponent } from "@minecraft/server";
import { BlockNames, BlockPrefixes, ItemTranslationKeys } from "../const.js";
import { DisplayStyles, EffectDisplayModes, InsightConfig } from "./config.js";
import {
    formatNamespaceLabel,
    formatStateName,
    formatTypeIdToText,
    splitTypeId,
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
    foodsPerLine: 3,
    yesLabel: "Yes", // ui.insight.tamable.yes
    noLabel: "No", // ui.insight.tamable.no
    noneLabel: "None" // ui.insight.tamable.none
});

const EffectDisplay = Object.freeze({
    label: "Effects", // ui.insight.effects.label
    moreSuffix: "more...", // ui.insight.effects.more
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
    hero_of_the_village: "\uF53F",
    night_vision: "\uF549",
    water_breathing: "\uF54A",
    wither: "\uF54B",
    decay: "\uF54B",
    poison: "\uF54C",
    regeneration: "\uE110",
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
    "hero_of_the_village",
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
    { tag: "minecraft:is_pickaxe_item_destructible", glyph: ToolGlyphs.pickaxe, label: "Pickaxe" }, // label: ui.insight.breakableBy.pickaxe
    { tag: "minecraft:is_axe_item_destructible", glyph: ToolGlyphs.axe, label: "Axe" }, // label: ui.insight.breakableBy.axe
    { tag: "minecraft:is_shovel_item_destructible", glyph: ToolGlyphs.shovel, label: "Shovel" }, // label: ui.insight.breakableBy.shovel
    { tag: "minecraft:is_hoe_item_destructible", glyph: ToolGlyphs.hoe, label: "Hoe" }, // label: ui.insight.breakableBy.hoe
    { tag: "minecraft:is_shears_item_destructible", glyph: ToolGlyphs.shears, label: "Shears" }, // label: ui.insight.breakableBy.shears
    { tag: "minecraft:is_sword_item_destructible", glyph: ToolGlyphs.sword, label: "Sword" } // label: ui.insight.breakableBy.sword
]);

// -----------------------------------------------------------------------------
// Main flow (entry points)
// -----------------------------------------------------------------------------
export function createBlockActionbar(block, playerSettings) {
    return buildBlockActionbarPayload(block, playerSettings);
}

export function createEntityActionbar(entity, playerSettings) {
    return buildEntityActionbarPayload(entity, playerSettings);
}

// -----------------------------------------------------------------------------
// Translation helpers
// -----------------------------------------------------------------------------

function buildBlockTranslationRawtext(blockTypeId, blockIdentifier) {
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

function isTextDisplayStyle(playerSettings) {
    return playerSettings?.displayStyle === DisplayStyles.Text;
}

// Collects all matching tool descriptors by known vanilla block-destruction tags.
function getBlockToolDescriptors(block, blockTags) {
    const descriptors = [];

    for (const entry of BlockToolTagGlyphs) {
        if (hasBlockTag(block, blockTags, entry.tag)) {
            descriptors.push(entry);
        }
    }

    return descriptors;
}

function buildBreakableToolsSuffix(toolDescriptors, playerSettings) {
    if (!toolDescriptors.length) {
        return "";
    }

    if (isTextDisplayStyle(playerSettings)) {
        const toolLabels = toolDescriptors.map((entry) => entry.label);
        return `${EmojiLayout.blockNameToolSpacing}${InsightConfig.display.technicalColor}Breakable: ${toolLabels.join(", ")}§r`;
    }

    const toolGlyphs = toolDescriptors.map((entry) => entry.glyph);
    return `${EmojiLayout.blockNameToolSpacing}${toolGlyphs.join(EmojiLayout.toolGlyphSpacing)}`;
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
    if (hiddenEffects > 0) {
        body += useTextMode
            ? `§7, §8+${hiddenEffects} ${EffectDisplay.moreSuffix}§r`
            : ` §8+${hiddenEffects}§r`;
    }

    return `\n${InsightConfig.display.technicalColor}${EffectDisplay.label}: ${body}§r`;
}

function buildWrappedCommaList(values, entriesPerLine) {
    if (!values.length) {
        return TameableDisplay.noneLabel;
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

    if (displayStyle === DisplayStyles.Text) {
        return `§cHealth: ${current.toFixed(1)}§f/§c${max.toFixed(1)}§r`;
    }

    const threshold = Number.isFinite(maxHeartDisplayHealth)
        ? Math.max(1, maxHeartDisplayHealth)
        : InsightConfig.system.maxHeartDisplayHealth;

    if (max > threshold || current > threshold) {
        return `§c${Math.ceil(current)}§f/§c${Math.ceil(max)}${glyphs.full}`;
    }

    return buildHalfStepEmojiBar(
        current,
        max,
        glyphs,
        InsightConfig.system.maxHeartsPerLine
    );
}

function buildHungerDisplay(currentValue, maxValue, displayStyle, glyphs = HungerGlyphSets.normal) {
    if (displayStyle === DisplayStyles.Text) {
        const current = Math.max(0, Number(currentValue) || 0);
        const max = Math.max(1, Number(maxValue) || 1);
        return `§6Hunger: ${current.toFixed(1)}§f/§6${max.toFixed(1)}§r`;
    }

    return buildHalfStepEmojiBar(
        currentValue,
        maxValue,
        glyphs,
        InsightConfig.system.maxHeartsPerLine
    );
}

function buildAbsorptionDisplay(currentValue, displayStyle) {
    const current = Number(currentValue);
    if (!Number.isFinite(current) || current <= 0) {
        return undefined;
    }

    if (displayStyle === DisplayStyles.Text) {
        return `§6Absorption: ${current.toFixed(1)}§r`;
    }

    const roundedCurrent = getRoundedHalfHearts(current);
    const fullGlyphs = Math.floor(roundedCurrent / 2);
    const hasHalfGlyph = roundedCurrent % 2 !== 0;

    let absorptionHearts = Emojis.heartAbsorptionFull.repeat(fullGlyphs);
    if (hasHalfGlyph) {
        absorptionHearts += Emojis.heartAbsorptionHalf;
    }

    const wrappedHearts = addLineBreakEvery(absorptionHearts, InsightConfig.system.maxHeartsPerLine);
    return `§6${wrappedHearts}§r`;
}

function buildArmorDisplay(currentValue, maxValue, displayStyle) {
    if (displayStyle === DisplayStyles.Text) {
        const current = Math.max(0, Number(currentValue) || 0);
        const max = Math.max(1, Number(maxValue) || 1);
        return `§bArmor: ${current.toFixed(1)}§f/§b${max.toFixed(1)}§r`;
    }

    return buildHalfStepEmojiBar(
        currentValue,
        maxValue,
        ArmorGlyphs,
        InsightConfig.system.maxHeartsPerLine
    );
}

function buildAirBubbleDisplay(currentValue, maxValue, displayStyle) {
    if (displayStyle === DisplayStyles.Text) {
        const current = Math.max(0, Number(currentValue) || 0);
        const max = Math.max(1, Number(maxValue) || 1);
        return `§bAir: ${current.toFixed(1)}§f/§b${max.toFixed(1)}§r`;
    }

    const normalized = normalizeAirSupplyToBubbleUnits(currentValue, maxValue);
    return buildHalfStepEmojiBar(
        normalized.current,
        normalized.max,
        BubbleGlyphs,
        InsightConfig.system.maxHeartsPerLine
    );
}

function getBlockLocationLine(block) {
    const location = block?.location;

    if (!location) {
        return "";
    }

    return `\n${InsightConfig.display.technicalColor}Pos: ${location.x}, ${location.y}, ${location.z}§r`;
}

function getEntityLocationLine(entity) {
    const location = entity?.location;

    if (!location) {
        return "";
    }

    return `\n${InsightConfig.display.technicalColor}Pos: ${location.x.toFixed(1)}, ${location.y.toFixed(1)}, ${location.z.toFixed(1)}§r`;
}

function getEntityVelocityLine(entity) {
    let velocity;
    try {
        velocity = entity.getVelocity?.();
    } catch {
        velocity = undefined;
    }

    if (!velocity) {
        return "";
    }

    return `\n${InsightConfig.display.technicalColor}Vel: ${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)}§r`;
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

    rawtext.push({
        text: `\n${InsightConfig.display.tagsColor}Tags: ${visibleTags.join(", ")}§r`
    });

    const hiddenTags = blockTags.length - visibleTags.length;
    if (hiddenTags > 0) {
        rawtext.push({
            text: ` & ${hiddenTags} ${InsightConfig.display.moreTagsLabel}`
        });
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

    rawtext.push({
        text: `\n${InsightConfig.display.tagsColor}Tags: ${visibleTags.join(", ")}§r`
    });

    const hiddenTags = entityTags.length - visibleTags.length;
    if (hiddenTags > 0) {
        rawtext.push({
            text: ` & ${hiddenTags} ${InsightConfig.display.moreTagsLabel}`
        });
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

    rawtext.push({
        text: `\n${InsightConfig.display.tagsColor}Families: ${visibleFamilies.join(", ")}§r`
    });

    const hiddenFamilies = entityFamilies.length - visibleFamilies.length;
    if (hiddenFamilies > 0) {
        rawtext.push({
            text: ` & ${hiddenFamilies} ${InsightConfig.display.moreFamiliesLabel}`
        });
    }
}

// -----------------------------------------------------------------------------
// Main flow implementation
// -----------------------------------------------------------------------------

function buildBlockActionbarPayload(block, playerSettings) {
    // Step 1: collect block identity + namespace context.
    const { id } = splitTypeId(block.typeId);
    const normalizedId = id.replace("double_slab", "slab");
    const blockTags = sortBlockTagsForDisplay(getBlockTagsSafe(block));
    const namespaceInfo = resolveInjectedNamespace(block.typeId, blockTags);

    const rawtext = [];
    // Step 2: compose title line (translated block name + optional tool suffix).
    const toolDescriptors = getBlockToolDescriptors(block, blockTags);

    rawtext.push(buildBlockTranslationRawtext(block.typeId, normalizedId));

    const breakableToolsSuffix = buildBreakableToolsSuffix(toolDescriptors, playerSettings);
    if (breakableToolsSuffix) {
        rawtext.push({
            text: breakableToolsSuffix
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

    const stateEntries = Object.entries(states);
    // Step 3: append optional state rows.
    if (playerSettings.showBlockStates && stateEntries.length) {
        rawtext.push({ text: InsightConfig.display.separator });

        const maxRows = Math.max(0, playerSettings.maxVisibleStates);
        const visibleEntries = stateEntries.slice(0, maxRows);

        for (const [stateKey, stateValue] of visibleEntries) {
            rawtext.push({
                text: `\n${formatStateName(stateKey)}: ${toMessageText(stateValue)}`
            });
        }

        const hiddenRows = stateEntries.length - visibleEntries.length;
        if (hiddenRows > 0) {
            rawtext.push({
                text: ` & ${hiddenRows} ${InsightConfig.display.moreRowsLabel}`
            });
        }
    }

    // Step 4: append optional technical sections (tags, ids, coordinates, debug).
    appendBlockTags(rawtext, blockTags, playerSettings);

    if (playerSettings.showTypeId) {
        rawtext.push({ text: `\n${InsightConfig.display.technicalColor}ID: ${block.typeId}§r` });
    }

    if (playerSettings.showCoordinates) {
        rawtext.push({ text: getBlockLocationLine(block) });
    }

    if (playerSettings.showTechnicalData) {
        rawtext.push({
            text: `\n${InsightConfig.display.technicalColor}States: ${stateEntries.length} | Tags: ${blockTags.length}§r`
        });

        if (namespaceInfo.injected && playerSettings.showNamespaceResolutionDebug) {
            rawtext.push({
                text: `\n${InsightConfig.display.technicalColor}Namespace: ${namespaceInfo.originalNamespace} -> ${namespaceInfo.displayNamespace}§r`
            });
            rawtext.push({
                text: `\n${InsightConfig.display.technicalColor}Mapped by: ${namespaceInfo.source}§r`
            });
        }
    }

    return { rawtext };
}

function buildEntityActionbarPayload(entity, playerSettings) {
    // Step 1: gather context about target type and optional player attributes.
    const { id } = splitTypeId(entity.typeId);
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

    // Step 2: compose title line (nameTag > dropped item name > localized entity name).
    if (entity.nameTag) {
        rawtext.push({ text: entity.nameTag });
    } else if (itemStack?.typeId) {
        rawtext.push(buildItemTranslationRawtext(itemStack));

        if (itemStack.amount > 1) {
            rawtext.push({ text: ` §7x${itemStack.amount}§r` });
        }
    } else if (entity.typeId.startsWith("minecraft:")) {
        rawtext.push({ translate: `entity.${id}.name` });
    } else {
        rawtext.push({ translate: `entity.${entity.typeId}.name` });
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

    // Step 3: append visual bars (health and hunger) when enabled.
    if (playerSettings.showHealth && healthComponent) {
        rawtext.push({
            text: `\n${buildHealthDisplay(
                healthComponent.currentValue,
                healthComponent.effectiveMax,
                playerSettings.maxHeartDisplayHealth,
                playerSettings.displayStyle,
                healthGlyphs
            )}`
        });
    }

    if (playerSettings.showAbsorption && Number.isFinite(absorptionValue) && absorptionValue > 0) {
        const absorptionLine = buildAbsorptionDisplay(absorptionValue, playerSettings.displayStyle);
        if (absorptionLine) {
            rawtext.push({
                text: `\n${absorptionLine}`
            });
        }
    }

    if (isTargetPlayer && playerSettings.showArmor && armorInfo) {
        rawtext.push({
            text: `\n${buildArmorDisplay(armorInfo.current, armorInfo.max, playerSettings.displayStyle)}`
        });
    }

    // Show hunger for targeted players using official player hunger attribute component.
    if (playerSettings.showHunger && hungerInfo) {
        rawtext.push({
            text: `\n${buildHungerDisplay(hungerInfo.current, hungerInfo.max, playerSettings.displayStyle, hungerGlyphs)}`
        });
    }

    if (isTargetPlayer && playerSettings.showAirBubbles && airInfo && airInfo.current < airInfo.max) {
        rawtext.push({
            text: `\n${buildAirBubbleDisplay(airInfo.current, airInfo.max, playerSettings.displayStyle)}`
        });
    }

    if (playerSettings.showEffects) {
        const effectsLine = buildEffectsDisplay(effects, playerSettings);
        if (effectsLine) {
            rawtext.push({
                text: effectsLine
            });
        }
    }

    if (playerSettings.showTameable) {
        rawtext.push({
            text: `\n${InsightConfig.display.technicalColor}Tameable: ${tameableData.isTameable ? TameableDisplay.yesLabel : TameableDisplay.noLabel}§r`
        });

        if (tameableData.isTameable) {
            rawtext.push({
                text: `\n${InsightConfig.display.technicalColor}Tamed: ${tameableData.isTamed ? TameableDisplay.yesLabel : TameableDisplay.noLabel}§r`
            });
        }
    }

    if (playerSettings.showTameFoods && tameableData.isTameable) {
        rawtext.push({
            text: `\n${InsightConfig.display.technicalColor}Foods: ${buildTameFoodsDisplay(tameableData.foodTypeIds)}§r`
        });
    }

    // Step 4: append optional metadata blocks.
    appendEntityTags(rawtext, entityTags, playerSettings);
    appendEntityFamilies(rawtext, entityFamilies, playerSettings);

    if (playerSettings.showTypeId) {
        rawtext.push({ text: `\n${InsightConfig.display.technicalColor}ID: ${typeIdForDisplay}§r` });
    }

    if (playerSettings.showCoordinates) {
        rawtext.push({ text: getEntityLocationLine(entity) });
    }

    if (playerSettings.showVelocity) {
        const velocityLine = getEntityVelocityLine(entity);
        if (velocityLine) {
            rawtext.push({ text: velocityLine });
        }
    }

    if (playerSettings.showTechnicalData) {
        rawtext.push({
            text: `\n${InsightConfig.display.technicalColor}Tags: ${entityTags.length} | Families: ${entityFamilies.length}§r`
        });

        if (namespaceInfo.injected && playerSettings.showNamespaceResolutionDebug) {
            rawtext.push({
                text: `\n${InsightConfig.display.technicalColor}Namespace: ${namespaceInfo.originalNamespace} -> ${namespaceInfo.displayNamespace}§r`
            });
            rawtext.push({
                text: `\n${InsightConfig.display.technicalColor}Mapped by: ${namespaceInfo.source}§r`
            });
        }

        if (playerSettings.showHealth && healthComponent) {
            const current = Math.max(0, healthComponent.currentValue);
            const max = Math.max(1, healthComponent.effectiveMax);
            const healthPercent = Math.floor((current / max) * 1000) / 10;

            rawtext.push({
                text: `\n${InsightConfig.display.technicalColor}HP: ${current.toFixed(1)}/${max.toFixed(1)} (${healthPercent}%)§r`
            });
        }

        if (playerSettings.showHunger && hungerInfo) {
            rawtext.push({
                text: `\n${InsightConfig.display.technicalColor}Hunger: ${hungerInfo.current.toFixed(1)}/${hungerInfo.max.toFixed(1)}§r`
            });
        }

        if (playerSettings.showHunger && Number.isFinite(saturationValue)) {
            rawtext.push({
                text: `\n${InsightConfig.display.technicalColor}Saturation: ${saturationValue.toFixed(2)}§r`
            });
        }

        if (playerSettings.showAbsorption && Number.isFinite(absorptionValue) && absorptionValue > 0) {
            rawtext.push({
                text: `\n${InsightConfig.display.technicalColor}Absorption: ${absorptionValue.toFixed(1)}§r`
            });
        }

        if (playerSettings.showEffects) {
            rawtext.push({
                text: `\n${InsightConfig.display.technicalColor}Effects: ${effects.length}§r`
            });
        }
    }

    return { rawtext };
}
