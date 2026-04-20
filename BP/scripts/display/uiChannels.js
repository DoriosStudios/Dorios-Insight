/**
 * @module uiChannels
 * @description Channel definitions for the Insight UI Queue pipeline.
 *
 * Each channel defines:
 *   1. A unique name (used as suffix in the title text payload).
 *   2. Section schemas for encoding/decoding fields.
 *   3. Total expected payload length (for validation).
 *
 * Channels correspond to UI JSON data-binding panels that parse
 * the positional string and extract numeric values.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Channel: insight_hud                                             │
 * │ Purpose: Player's own HUD bars (health, hunger, armor, etc.)     │
 * │                                                                  │
 * │ Sections:                                                        │
 * │   a: health(3) maxHealth(3) absorption(2) healthGap(2)           │
 * │   b: hunger(2) maxHunger(2) saturation(2) exhaustion(2)          │
 * │   c: armor(2) toughness(2) extraArmor(2) extraArmorFull(2)       │
 * │   d: hungerPreview(2) airSupply(2) maxAir(2) flags(2)            │
 * │   e: hudHealthIndicator(2) hudHungerIndicator(2)                  │
 * │      durPercent(2) durVisible(2)                                  │
 * │   f: durCurHi(2) durCurLo(2) durMaxHi(2) durMaxLo(2)              │
 * │   g: hudInventory(2) hudInventoryPosition(2)                      │
 * │      hudInventoryDisplayMode(2) hudInventoryOrientation(2)        │
 * │   h: stackCurrent(3) stackVisible(1)                              │
 * │      stackTotalHi(2) stackTotalLo(2)                              │
 * │                                                                  │
 * │ Total: 11 + (7 × 9) = 74 chars + suffix                          │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Channel: insight_target                                          │
 * │ Purpose: Looked-at entity/block data for WAILA panel             │
 * │                                                                  │
 * │ Sections:                                                        │
 * │   a: targetType(2) health(2) maxHealth(2) armorOrHardness(2)     │
 * │   b: isBaby(2) variant(2) markColor(2) reserved(2)               │
 * │                                                                  │
 * │ Total: 2 sections × (1 delim + 8 digits) = 18 chars + suffix     │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Channel: insight_biome                                           │
 * │ Purpose: Biome/dimension/coordinate indicator                    │
 * │                                                                  │
 * │ Sections:                                                        │
 * │   a: dimension(2) biomeId(2) coordX_hi(2) coordX_lo(2)           │
 * │   b: coordY(2) coordZ_hi(2) coordZ_lo(2) reserved(2)             │
 * │                                                                  │
 * │ Total: 2 sections × (1 delim + 8 digits) = 18 chars + suffix     │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * @author Kauziin (Dorios Studios), Kamii
 * @version 1.0.0
 */

import { defineSchema, encodePayload, computePayloadLength } from "./uiDataEncoder.js";

// ===========================================================================
// Channel: insight_hud
// ===========================================================================

const HUD_SECTION_A = defineSchema("a", [
    { name: "health",      digits: 3 },
    { name: "maxHealth",   digits: 3 },
    { name: "absorption",  digits: 2 },
    { name: "healthGap",   digits: 2 }
]);

const HUD_SECTION_B = defineSchema("b", [
    { name: "hunger",      digits: 2 },
    { name: "maxHunger",   digits: 2, defaultValue: 20 },
    { name: "saturation",  digits: 2 },
    { name: "exhaustion",  digits: 2 }
]);

const HUD_SECTION_C = defineSchema("c", [
    { name: "armor",          digits: 2 },
    { name: "toughness",      digits: 2 },
    { name: "extraArmor",     digits: 2 },
    { name: "extraArmorFull", digits: 2 }
]);

const HUD_SECTION_D = defineSchema("d", [
    { name: "hungerPreview", digits: 2 },
    { name: "airSupply",     digits: 2 },
    { name: "maxAir",        digits: 2, defaultValue: 15 },
    { name: "flags",         digits: 2 }
]);

const HUD_SECTION_E = defineSchema("e", [
    { name: "hudHealthIndicator", digits: 2 },
    { name: "hudHungerIndicator", digits: 2 },
    { name: "durPercent",         digits: 2 },
    { name: "durVisible",         digits: 2 }
]);

const HUD_SECTION_F = defineSchema("f", [
    { name: "durCurHi",  digits: 2 },
    { name: "durCurLo",  digits: 2 },
    { name: "durMaxHi",  digits: 2 },
    { name: "durMaxLo",  digits: 2 }
]);

const HUD_SECTION_G = defineSchema("g", [
    { name: "hudInventory",          digits: 2 },
    { name: "hudInventoryPosition",  digits: 2 },
    { name: "hudInventoryDisplayMode", digits: 2 },
    { name: "hudInventoryOrientation", digits: 2 }
]);

const HUD_SECTION_H = defineSchema("h", [
    { name: "stackCurrent", digits: 3 },
    { name: "stackVisible", digits: 1 },
    { name: "stackTotalHi", digits: 2 },
    { name: "stackTotalLo", digits: 2 }
]);

const HUD_SCHEMAS = [HUD_SECTION_A, HUD_SECTION_B, HUD_SECTION_C, HUD_SECTION_D, HUD_SECTION_E, HUD_SECTION_F, HUD_SECTION_G, HUD_SECTION_H];

/** @readonly */
export const CHANNEL_HUD = "insight_hud";

/** Total character length of HUD payload (excluding suffix) */
export const HUD_PAYLOAD_LENGTH = computePayloadLength(HUD_SCHEMAS);

/**
 * Encode player HUD data into a payload string.
 *
 * @param {Object} data - Flat object with field values from hudDataCollector.
 * @returns {string} Full encoded payload with channel suffix.
 */
export function encodeHudData(data) {
    return encodePayload(HUD_SCHEMAS, data, CHANNEL_HUD);
}

// ===========================================================================
// Channel: insight_target
// ===========================================================================

const TARGET_SECTION_A = defineSchema("a", [
    { name: "targetType",       digits: 2 },
    { name: "targetHealth",     digits: 2 },
    { name: "targetMaxHealth",  digits: 2 },
    { name: "targetArmor",      digits: 2 }
]);

const TARGET_SECTION_B = defineSchema("b", [
    { name: "targetIsBaby",    digits: 2 },
    { name: "targetVariant",   digits: 2 },
    { name: "targetMarkColor", digits: 2 },
    { name: "targetReserved",  digits: 2 }
]);

const TARGET_SCHEMAS = [TARGET_SECTION_A, TARGET_SECTION_B];

/** @readonly */
export const CHANNEL_TARGET = "insight_target";

/** Total character length of target payload (excluding suffix) */
export const TARGET_PAYLOAD_LENGTH = computePayloadLength(TARGET_SCHEMAS);

/**
 * Encode target entity/block data into a payload string.
 *
 * @param {Object} data - Flat object with target field values.
 * @returns {string} Full encoded payload with channel suffix.
 */
export function encodeTargetData(data) {
    return encodePayload(TARGET_SCHEMAS, data, CHANNEL_TARGET);
}

// ===========================================================================
// Channel: insight_biome
// ===========================================================================

const BIOME_SECTION_A = defineSchema("a", [
    { name: "dimension",   digits: 2 },
    { name: "biomeId",     digits: 2 },
    { name: "coordX_hi",   digits: 2 },
    { name: "coordX_lo",   digits: 2 }
]);

const BIOME_SECTION_B = defineSchema("b", [
    { name: "coordY",      digits: 2 },
    { name: "coordZ_hi",   digits: 2 },
    { name: "coordZ_lo",   digits: 2 },
    { name: "reserved",    digits: 2 }
]);

const BIOME_SCHEMAS = [BIOME_SECTION_A, BIOME_SECTION_B];

/** @readonly */
export const CHANNEL_BIOME = "insight_biome";

/** Total character length of biome payload (excluding suffix) */
export const BIOME_PAYLOAD_LENGTH = computePayloadLength(BIOME_SCHEMAS);

/**
 * Encode biome/coordinate data into a payload string.
 *
 * @param {Object} data - Flat object with biome field values.
 * @returns {string} Full encoded payload with channel suffix.
 */
export function encodeBiomeData(data) {
    return encodePayload(BIOME_SCHEMAS, data, CHANNEL_BIOME);
}

// ===========================================================================
// HUD Flags Encoding Helpers
// ===========================================================================

/**
 * Bit flags packed into the `flags` field of HUD_SECTION_D.
 *
 * Since we have 2 digits (0–99), we can pack up to ~6 boolean flags
 * using powers of 2: 1, 2, 4, 8, 16, 32 (max sum = 63).
 *
 * @enum {number}
 */
export const HudFlags = Object.freeze({
    /** Player is poisoned (wither/poison heart icons) */
    POISONED:       1,
    /** Player is withered */
    WITHERED:       2,
    /** Player has absorption effect */
    HAS_ABSORPTION: 4,
    /** Player is frozen (powdered snow) */
    FROZEN:         8,
    /** Player has hunger effect */
    HUNGER_EFFECT:  16,
    /** Hunger preview is active (holding food item) */
    HUNGER_PREVIEW: 32
});

/**
 * Pack boolean flags into a single 2-digit number.
 *
 * @param {Object} flagValues - Object with boolean values keyed by flag names.
 * @returns {number} Packed flags value (0–63).
 */
export function packHudFlags(flagValues) {
    let packed = 0;
    if (flagValues.poisoned)      packed |= HudFlags.POISONED;
    if (flagValues.withered)      packed |= HudFlags.WITHERED;
    if (flagValues.hasAbsorption) packed |= HudFlags.HAS_ABSORPTION;
    if (flagValues.frozen)        packed |= HudFlags.FROZEN;
    if (flagValues.hungerEffect)  packed |= HudFlags.HUNGER_EFFECT;
    if (flagValues.hungerPreview) packed |= HudFlags.HUNGER_PREVIEW;
    return Math.min(99, packed);
}

// ===========================================================================
// Target Type Constants
// ===========================================================================

/**
 * Target type identifiers for the `targetType` field.
 *
 * @enum {number}
 */
export const TargetTypes = Object.freeze({
    NONE:   0,
    BLOCK:  1,
    ENTITY: 2,
    ITEM:   3,
    PLAYER: 4
});

// ===========================================================================
// Dimension ID Mapping
// ===========================================================================

/**
 * Dimension IDs for the `dimension` field (2-digit).
 *
 * @enum {number}
 */
export const DimensionIds = Object.freeze({
    "minecraft:overworld": 1,
    "minecraft:nether":    2,
    "minecraft:the_end":   3
});

/**
 * Get numeric dimension ID from Minecraft dimension string.
 *
 * @param {string} dimensionId - Full dimension identifier.
 * @returns {number} 2-digit dimension ID (0 if unknown).
 */
export function getDimensionNumericId(dimensionId) {
    return DimensionIds[dimensionId] ?? 0;
}

// ===========================================================================
// Coordinate Encoding Helpers
// ===========================================================================

/**
 * Encode a coordinate value (which can be negative and large) into two
 * 2-digit fields: high and low.
 *
 * Strategy: offset by +9999 to make all values positive, then split.
 * Range: -9999 to +9999 → 0000 to 19998
 * High = floor(value / 100), Low = value % 100
 *
 * Since each field is 2 digits (0-99), we can represent 0000-9999 directly.
 * For the high part: max = 99 → 99*100 = 9900, so max coord = 9900+99 = 9999.
 * With offset: actual range is -9999 to 0 (offset 0-9999) — but we need negatives.
 *
 * Better approach: use signed encoding.
 * - high = floor(abs(coord) / 100), capped at 99
 * - low = abs(coord) % 100
 * - Sign is encoded as the top bit of reserved or via separate flag.
 *
 * Actually, simplest: clamp coord to -9999..+9999, add 99 offset per pair.
 * High: floor((coord + 9999) / 100), Low: (coord + 9999) % 100
 *
 * @param {number} coord - World coordinate value.
 * @returns {{hi: number, lo: number}} Two 2-digit values.
 */
export function encodeCoordinate(coord) {
    const clamped = Math.max(-9999, Math.min(9999, Math.round(coord)));
    const shifted = clamped + 9999; // Range: 0–19998
    return {
        hi: Math.min(99, Math.floor(shifted / 100)),
        lo: shifted % 100
    };
}

/**
 * Encode Y coordinate (typically 0–320 in overworld, -64–320 with caves).
 * Uses same approach as X/Z but with appropriate clamping.
 *
 * @param {number} y - Y coordinate.
 * @returns {number} Single 2-digit value (0–99). Maps -64..320 → 0..99.
 */
export function encodeYCoordinate(y) {
    // Map -64..320 range to 0..99
    const clamped = Math.max(-64, Math.min(320, Math.round(y)));
    const normalized = (clamped + 64) / 384; // 0..1
    return Math.min(99, Math.max(0, Math.round(normalized * 99)));
}

// ===========================================================================
// Schema Exports (for documentation/test tooling)
// ===========================================================================

export const HudSchemas = HUD_SCHEMAS;
export const TargetSchemas = TARGET_SCHEMAS;
export const BiomeSchemas = BIOME_SCHEMAS;
