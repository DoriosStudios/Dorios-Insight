/**
 * @module targetDataCollector
 * @description WAILA (What Am I Looking At) target indicator for Dorios' Insight.
 *
 * Inherits and improves upon the Coldbar Indicator's target_indicator approach,
 * encoding entity/block data as positional strings in the title text for
 * JSON UI extraction. Entity render IDs are sent via subtitle for the
 * live_horse_renderer.
 *
 * Title payload format (RawMessage):
 *   rawtext: [
 *     { text: prefix(1) + tools(6) + height(2) + "b" + currentHP(3) + maxHP(3) + "00" + key(48~) },
 *     ...detail rawtext (health text, effects, inventory, states, tags, custom fields),
 *     { text: "insight_target" }
 *   ]
 *
 * Subtitle: entity aux render ID (signed 12-digit padded string) for live_horse_renderer
 *
 * @author Kauziin (Dorios Studios), Kamii
 * @version 1.0.3
 */

import * as uiQueue from "./uiQueue.js";
import { CHANNEL_TARGET } from "./uiChannels.js";
import {
    composeBlockDisplayForTarget,
    composeEntityDisplayForTarget
} from "./wailaComposer.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANNEL_SUFFIX = "insight_target";

/** Tool tier hierarchy for pickaxe tier checking */
const TIER_LIST = {
    "minecraft:stone_tier_destructible": [
        "minecraft:stone_tier", "minecraft:copper_tier",
        "minecraft:iron_tier", "minecraft:diamond_tier", "minecraft:netherite_tier"
    ],
    "minecraft:iron_tier_destructible": [
        "minecraft:iron_tier", "minecraft:diamond_tier", "minecraft:netherite_tier"
    ],
    "minecraft:diamond_tier_destructible": [
        "minecraft:diamond_tier", "minecraft:netherite_tier"
    ]
};

const TIER_KEYS = Object.keys(TIER_LIST);

/** Effects considered debuffs (shown in red) */
const DEBUFF_EFFECTS = new Set([
    "minecraft:slowness", "minecraft:mining_fatigue", "minecraft:nausea",
    "minecraft:blindness", "minecraft:hunger", "minecraft:weakness",
    "minecraft:poison", "minecraft:wither", "minecraft:levitation",
    "minecraft:fatal_poison", "minecraft:darkness", "minecraft:bad_omen",
    "minecraft:unluck"
]);

const IGNORED_MACHINE_HELPER_IDENTIFIERS = Object.freeze([
    "utilitycraft:machine",
    "utilitycraft:machine_entity",
    "entity.utilitycraft:machine",
    "entity.utilitycraft:machine.name",
    "entity.utilitycraft:machine_entity",
    "entity.utilitycraft:machine_entity.name"
]);

// ---------------------------------------------------------------------------
// Visual assets (ported from messages.js)
// ---------------------------------------------------------------------------

/**
 * Effect icon glyphs mapped by effect type ID (stripped of "minecraft:" prefix).
 * These PUA chars are defined in the resource pack font.
 */
const EffectGlyphByTypeId = Object.freeze({
    blindness: "\uF51C",
    conduit: "\uF51D",
    conduit_power: "\uF51D",
    haste: "\uF51E",
    darkness: "\uF51F",
    fire_resistance: "\uF529",
    absorption: "\uF52A",
    health_boost: "\uF54F",
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
    dolphins_grace: "\uF528",
    fatal_poison: "\uF547",
    raid_omen: "\uF54E",
    trial_omen: "\uF548",
    bad_omen: "\uF538",
    weaving: "\uF526",
    wind_charged: "\uF536",
    infested: "\uF527",
    oozing: "\uF537"
});

/** Villager-family entity type IDs */
const VillagerEntityTypeIds = new Set([
    "minecraft:villager",
    "minecraft:villager_v2",
    "minecraft:zombie_villager",
    "minecraft:zombie_villager_v2"
]);

/** Villager profession → vanilla localization key */
const VillagerProfessionLocKeys = Object.freeze({
    unskilled: "entity.villager.unskilled",
    unemployed: "entity.villager.unskilled",
    farmer: "entity.villager.farmer",
    fisherman: "entity.villager.fisherman",
    shepherd: "entity.villager.shepherd",
    fletcher: "entity.villager.fletcher",
    librarian: "entity.villager.librarian",
    cartographer: "entity.villager.cartographer",
    cleric: "entity.villager.cleric",
    armorer: "entity.villager.armor",
    weaponsmith: "entity.villager.weapon",
    toolsmith: "entity.villager.tool",
    butcher: "entity.villager.butcher",
    leatherworker: "entity.villager.leather",
    mason: "entity.villager.mason",
    stone_mason: "entity.villager.mason",
    nitwit: "entity.villager.unskilled"
});

/** Heart glyph for numeric health display (animal/mob heart) */
const HEART_GLYPH = "\uF5CB";

// ---------------------------------------------------------------------------
// Per-type caches (persist across players, like Coldbar)
// ---------------------------------------------------------------------------

/** @type {Object<string, number>} entityTypeId → measured render height */
const entityHeightCache = { "minecraft:player": 2 };

// ---------------------------------------------------------------------------
// Per-player state
// ---------------------------------------------------------------------------

/** @type {Map<string, Object>} playerId → last screen_data */
const playerTargetCache = new Map();

/** @type {Map<string, number>} playerId → accumulated no-target ticks */
const playerNoTargetTicks = new Map();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeHeaderKey(value, fallback = "unknown") {
    const normalized = String(value ?? "")
        .replace(/[\r\n\t]+/g, " ")
        .trim();

    return normalized.length ? normalized : fallback;
}

function getEntityHeaderKey(entity) {
    if (!entity) {
        return "unknown";
    }

    if (entity.typeId === "minecraft:player") {
        return normalizeHeaderKey(
            entity.nameTag || entity.name || entity.typeId,
            "minecraft:player"
        );
    }

    if (entity.typeId === "minecraft:item") {
        try {
            const itemStack = entity.getComponent("minecraft:item")?.itemStack;
            return normalizeHeaderKey(
                itemStack?.localizationKey || itemStack?.typeId || entity.localizationKey || entity.typeId,
                "minecraft:item"
            );
        } catch {
            return normalizeHeaderKey(entity.localizationKey || entity.typeId, "minecraft:item");
        }
    }

    return normalizeHeaderKey(entity.localizationKey || entity.typeId, "unknown");
}

function getBlockHeaderKey(block) {
    return normalizeHeaderKey(block?.localizationKey || block?.typeId, "minecraft:unknown");
}

function stripLeadingTitleLine(rawtextParts) {
    if (!Array.isArray(rawtextParts) || !rawtextParts.length) {
        return [];
    }

    const detailParts = [];
    let bodyStarted = false;

    for (const part of rawtextParts) {
        if (!part || typeof part !== "object") {
            continue;
        }

        if (bodyStarted) {
            detailParts.push(part);
            continue;
        }

        const text = typeof part.text === "string" ? part.text : undefined;
        if (text === undefined) {
            continue;
        }

        const newlineIndex = text.indexOf("\n");
        if (newlineIndex === -1) {
            continue;
        }

        bodyStarted = true;
        const remainingText = text.slice(newlineIndex + 1);
        if (remainingText.length) {
            detailParts.push({
                ...part,
                text: remainingText
            });
        }
    }

    return detailParts;
}

/**
 * Get the entity aux render ID for the live_horse_renderer.
 * @param {import("@minecraft/server").Entity} entity
 * @returns {string}
 */
function getEntityAux(entity) {
    const sign = entity.id > 0;
    return (sign ? "" : "-") + Math.abs(entity.id).toString().padStart(12, "0");
}

/**
 * Format effect duration as MM:SS.
 * @param {number} ticks
 * @returns {string}
 */
function ticksToTime(ticks) {
    if (ticks === -1) return "∞";
    if (ticks === 0) return "00:00";
    if (ticks < 20) return "00:01";
    const seconds = Math.floor(ticks / 20);
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

/**
 * Strip "minecraft:" prefix from a type ID.
 * @param {string} typeId
 * @returns {string}
 */
function stripNamespace(typeId) {
    if (typeof typeId !== "string") return "";
    return typeId.includes(":") ? typeId.split(":").pop() : typeId;
}

/**
 * Convert a number to a Roman numeral string (for effect amplifiers).
 * @param {number} num
 * @returns {string}
 */
function romanNumeral(num) {
    if (num <= 1) return "";
    if (num === 2) return "II";
    if (num === 3) return "III";
    if (num === 4) return "IV";
    if (num === 5) return "V";
    if (num === 6) return "VI";
    if (num === 7) return "VII";
    if (num === 8) return "VIII";
    if (num === 9) return "IX";
    if (num === 10) return "X";
    if (num > 10) return String(num);
    return "";
}

/**
 * Build rawtext array for container inventory listing.
 * @param {import("@minecraft/server").Container} container
 * @param {number} [maxItems=5]
 * @returns {Array}
 */
function getInventoryListRawtext(container, maxItems = 5) {
    const rawtext = [];
    let remaining = container.size - container.emptySlotsCount;
    if (remaining === 0) return rawtext;

    rawtext.push({ text: "\n" });
    let shown = 0;

    for (let i = 0; i < container.size; i++) {
        if (shown >= maxItems || remaining <= 0) break;
        try {
            const item = container.getItem(i);
            if (item) {
                rawtext.push({ translate: item.localizationKey });
                rawtext.push({ text: ` x${item.amount}\n` });
                shown++;
                remaining--;
            }
        } catch { break; }
    }

    if (shown >= maxItems && remaining > 0) {
        rawtext.push({ text: "...\n" });
    }
    return rawtext;
}

/**
 * Build text for block states (Creative mode only).
 * @param {import("@minecraft/server").Block} block
 * @returns {string|undefined}
 */
function getBlockStatesText(block) {
    try {
        const states = block.permutation.getAllStates();
        const entries = Object.entries(states);
        if (entries.length === 0) return undefined;
        return "\n" + entries.map(([k, v]) => `${k}: ${v}`).join("\n") + "\n";
    } catch { return undefined; }
}

/**
 * Build text for block tags (Creative mode only).
 * @param {import("@minecraft/server").Block} block
 * @returns {string|undefined}
 */
function getBlockTagsText(block) {
    try {
        const tags = block.getTags();
        if (tags.length === 0) return undefined;
        return "\n" + tags.join(", ") + "\n";
    } catch { return undefined; }
}

/**
 * Build enriched rawtext for entity effects with glyph icons.
 * Uses EffectGlyphByTypeId for icon display and color-codes debuffs red.
 * @param {import("@minecraft/server").Entity} entity
 * @param {number} maxEffects - Maximum effects to show.
 * @returns {Array|undefined}
 */
function getEntityEffectsRawtext(entity, maxEffects = 6) {
    try {
        const effects = entity.getEffects();
        if (!effects || effects.length === 0) return undefined;

        const rawtext = [];
        let shown = 0;

        for (const effect of effects) {
            if (shown >= maxEffects) break;

            const typeId = stripNamespace(effect.typeId || "");
            const isDebuff = DEBUFF_EFFECTS.has(effect.typeId)
                || DEBUFF_EFFECTS.has(`minecraft:${typeId}`);
            const color = isDebuff ? "§c" : "§a";
            const glyph = EffectGlyphByTypeId[typeId] || "";
            const amplifier = (effect.amplifier || 0) > 0
                ? ` ${romanNumeral(effect.amplifier + 1)}`
                : "";
            const duration = ticksToTime(effect.duration);

            if (glyph) {
                rawtext.push({ text: `\n${glyph} ${color}` });
            } else {
                rawtext.push({ text: `\n${color}` });
            }

            rawtext.push({ text: `${effect.displayName}${amplifier} §7${duration}` });
            shown++;
        }

        if (shown < effects.length) {
            rawtext.push({ text: `\n§8+${effects.length - shown} more...` });
        }

        return rawtext.length > 0 ? rawtext : undefined;
    } catch { return undefined; }
}

/**
 * Check if an entity is invisible.
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
function isEntityInvisible(entity) {
    try {
        if (typeof entity.isInvisible === "boolean") return entity.isInvisible;
    } catch { /* Ignore. */ }
    try {
        if (entity.getComponent?.("minecraft:is_invisible")) return true;
    } catch { /* Ignore. */ }
    try {
        const effects = entity.getEffects?.();
        if (Array.isArray(effects)) {
            for (const effect of effects) {
                if ((effect?.typeId ?? "").toLowerCase().includes("invisibility")) return true;
            }
        }
    } catch { /* Ignore. */ }
    return false;
}

function normalizeEntityIdentity(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().toLowerCase();
}

function isIgnoredMachineHelperEntity(entity, settings) {
    if (!settings?.ignoreMachineHelperEntities) {
        return false;
    }

    const typeId = normalizeEntityIdentity(entity?.typeId);
    const localizationKey = normalizeEntityIdentity(entity?.localizationKey);
    const nameTag = normalizeEntityIdentity(entity?.nameTag);

    if (typeId.endsWith(":machine_entity")) {
        return true;
    }

    const candidateSet = new Set(IGNORED_MACHINE_HELPER_IDENTIFIERS);
    if (typeId && candidateSet.has(typeId)) {
        return true;
    }

    if (localizationKey && candidateSet.has(localizationKey)) {
        return true;
    }

    if (nameTag && candidateSet.has(nameTag)) {
        return true;
    }

    return false;
}

/**
 * Measure entity render height by raycasting downward from above.
 * @param {import("@minecraft/server").Entity} entity
 * @param {import("@minecraft/server").Player} player
 */
function measureEntityHeight(entity, player) {
    try {
        const scanLoc = { ...entity.location };
        scanLoc.y += 15;
        const results = player.dimension.getEntitiesFromRay(
            scanLoc, { x: 0, y: -1, z: 0 },
            { ignoreBlockCollision: true, includeLiquidBlocks: false, includePassableBlocks: false, maxDistance: 15 }
        );
        const match = results.find(e => e.entity.id === entity.id);
        if (match) {
            entityHeightCache[entity.typeId] = Math.round(15 - match.distance + 0.3);
        }
    } catch { /* Ignore scan errors. */ }
}

/**
 * Get the villager profession name from entity properties.
 * @param {import("@minecraft/server").Entity} entity
 * @returns {string|undefined} Localization key for the profession.
 */
function getVillagerProfession(entity) {
    if (!VillagerEntityTypeIds.has(entity.typeId)) return undefined;

    try {
        const professionCandidates = [
            "minecraft:profession",
            "minecraft:variant",
            "variant"
        ];

        for (const propName of professionCandidates) {
            try {
                const value = entity.getProperty?.(propName);
                if (value !== undefined && value !== null) {
                    return resolveVillagerProfession(value);
                }
            } catch { /* Try next candidate. */ }
        }

        try {
            const variant = entity.getComponent?.("minecraft:variant");
            if (variant?.value !== undefined) {
                return resolveVillagerProfession(variant.value);
            }
        } catch { /* Ignore. */ }
    } catch { /* Ignore. */ }

    return undefined;
}

/**
 * Resolve a raw profession value (string or number) to a localization key.
 * @param {string|number} rawValue
 * @returns {string|undefined}
 */
function resolveVillagerProfession(rawValue) {
    if (typeof rawValue === "string") {
        const normalized = rawValue.trim().toLowerCase();
        if (!normalized || normalized === "none") return undefined;

        const base = normalized.includes(":") ? normalized.split(":").pop() : normalized;
        const candidates = [base];

        if (base.startsWith("villager_profession_")) candidates.push(base.slice("villager_profession_".length));
        if (base.startsWith("profession_")) candidates.push(base.slice("profession_".length));

        for (const candidate of candidates) {
            if (VillagerProfessionLocKeys[candidate]) return VillagerProfessionLocKeys[candidate];
        }

        return undefined;
    }

    if (Number.isFinite(rawValue)) {
        const professionByIndex = [
            "entity.villager.unskilled", "entity.villager.farmer",
            "entity.villager.fisherman", "entity.villager.shepherd",
            "entity.villager.fletcher", "entity.villager.librarian",
            "entity.villager.cartographer", "entity.villager.cleric",
            "entity.villager.armor", "entity.villager.weapon",
            "entity.villager.tool", "entity.villager.butcher",
            "entity.villager.leather", "entity.villager.mason",
            "entity.villager.unskilled"
        ];
        const index = Math.max(0, Math.floor(rawValue));
        return professionByIndex[index] || undefined;
    }

    return undefined;
}

/**
 * Build health display rawtext with heart glyph + numeric value (current/max).
 * @param {number} current - Current health.
 * @param {number} max - Maximum health.
 * @returns {Array}
 */
function buildHealthDisplay(current, max) {
    const currentRounded = Math.round(current * 10) / 10;
    const maxRounded = Math.round(max);
    return [
        { text: `\n${HEART_GLYPH} §c${currentRounded}§7/§c${maxRounded}` }
    ];
}

// ---------------------------------------------------------------------------
// Main collection + dispatch
// ---------------------------------------------------------------------------

/**
 * Collect target data from the player's view direction and send
 * it through the UI Queue as a WAILA indicator.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {Object} settings - Player display settings from config.
 */
export function collectAndSendTargetData(player, settings) {
    try {
        const playerId = player.id;
        const screenData = {
            prefix: "a",
            key: "",
            renderAux: "",
            currentHealth: 0, maxHealth: 0,
            acceptSword: 0, acceptPickaxe: 0, acceptAxe: 0,
            acceptShovel: 0, acceptHoe: 0, acceptShears: 0,
            entityHeight: 0,
            detail: { rawtext: [] }
        };

        const maxDist = settings.maxDistance || 9;
        const useIconAndIndicatorMode = String(settings?.toolTierIndicatorMode || "").trim().toLowerCase() === "icon_and_indicator";

        // --- Entity raycast ---
        let entityHit;
        const entityHits = player.getEntitiesFromViewDirection({
            maxDistance: maxDist,
            includeLiquidBlocks: false,
            includePassableBlocks: true
        });

        if (Array.isArray(entityHits) && entityHits.length > 0) {
            const allowInvisibleTargets = Boolean(settings.includeInvisibleEntities);
            entityHit = entityHits.find((hit) => {
                const entity = hit?.entity;
                if (!entity) {
                    return false;
                }

                if (isIgnoredMachineHelperEntity(entity, settings)) {
                    return false;
                }

                if (!allowInvisibleTargets && isEntityInvisible(entity)) {
                    return false;
                }

                return true;
            });
        }

        // --- Block raycast (fallback) ---
        let blockHit;
        if (!entityHit) {
            blockHit = player.getBlockFromViewDirection({
                maxDistance: maxDist,
                includeLiquidBlocks: settings.includeLiquidBlocks ?? false,
                includePassableBlocks: true
            });
        }

        const hasTarget = Boolean(entityHit?.entity || blockHit?.block);
        if (!hasTarget) {
            const clearDelay = Math.max(0, Number(settings?.clearAfterNoTargetTicks) || 0);
            if (clearDelay > 0) {
                const step = Math.max(1, Number(settings?.updateIntervalTicks) || 1);
                const nextTicks = (playerNoTargetTicks.get(playerId) ?? 0) + step;

                if (nextTicks < clearDelay) {
                    playerNoTargetTicks.set(playerId, nextTicks);
                    return;
                }
            }

            playerNoTargetTicks.set(playerId, 0);
        } else {
            playerNoTargetTicks.set(playerId, 0);
        }

        // --- Process entity target ---
        if (entityHit?.entity) {
            const entity = entityHit.entity;
            const isItem = entity.typeId === "minecraft:item";
            const isPlayer = entity.typeId === "minecraft:player";
            screenData.key = getEntityHeaderKey(entity);

            if (isPlayer) {
                screenData.prefix = "A";
            } else if (!isItem) {
                // Measure entity height for render scaling
                if (entityHeightCache[entity.typeId] === undefined
                    || entity.hasComponent("minecraft:scale")
                    || entity.hasComponent("minecraft:is_baby")) {
                    measureEntityHeight(entity, player);
                }
            }

            // --- Health (numeric: current / max) ---
            if (!isItem && entity.hasComponent("minecraft:health")) {
                try {
                    const health = entity.getComponent("minecraft:health");
                    const current = health.currentValue || 0;
                    const max = health.effectiveMax || 20;

                    screenData.currentHealth = Math.min(999, Math.round(current));
                    screenData.maxHealth = Math.min(999, Math.round(max));
                } catch { /* Ignore. */ }
            }

            // Entity render aux ID + cached height
            if (entity.hasComponent("minecraft:health")) {
                screenData.renderAux = getEntityAux(entity);
                screenData.entityHeight = entityHeightCache[entity.typeId] || 0;
            }

            // Clear height cache for scaled/baby
            if (entity.hasComponent("minecraft:is_baby") || entity.hasComponent("minecraft:scale")) {
                delete entityHeightCache[entity.typeId];
            }

            const entityDetail = composeEntityDisplayForTarget(entity, player, settings);
            if (Array.isArray(entityDetail?.rawtext) && entityDetail.rawtext.length) {
                screenData.detail.rawtext.push(...stripLeadingTitleLine(entityDetail.rawtext));
            }

        // --- Process block target ---
        } else if (blockHit?.block) {
            const block = blockHit.block;
            screenData.key = getBlockHeaderKey(block);

            // Tool detection
            if (useIconAndIndicatorMode) {
                try {
                    const equipment = player.getComponent("minecraft:equippable");
                    const mainhand = equipment?.getEquipment?.("Mainhand");
                    const tags = block.getTags();

                    for (const tag of tags) {
                        if (tag === "minecraft:is_pickaxe_item_destructible") {
                            screenData.acceptPickaxe = 1;
                            let inTier = false;
                            for (const tierTag of TIER_KEYS) {
                                if (tags.includes(tierTag)) {
                                    if (mainhand) {
                                        for (const tierLevel of TIER_LIST[tierTag]) {
                                            if (mainhand.hasTag(tierLevel)) {
                                                screenData.acceptPickaxe = 2;
                                                break;
                                            }
                                        }
                                    }
                                    inTier = true;
                                    break;
                                }
                            }

                            if (!inTier && mainhand?.hasTag("minecraft:is_pickaxe")) {
                                screenData.acceptPickaxe = 2;
                            }
                        } else if (tag === "minecraft:is_axe_item_destructible") {
                            screenData.acceptAxe = mainhand?.hasTag("minecraft:is_axe") ? 2 : 1;
                        } else if (tag === "minecraft:is_shovel_item_destructible") {
                            screenData.acceptShovel = mainhand?.hasTag("minecraft:is_shovel") ? 2 : 1;
                        } else if (tag === "minecraft:is_hoe_item_destructible") {
                            screenData.acceptHoe = mainhand?.hasTag("minecraft:is_hoe") ? 2 : 1;
                        } else if (tag === "minecraft:is_sword_item_destructible") {
                            screenData.acceptSword = mainhand?.hasTag("minecraft:is_sword") ? 2 : 1;
                        } else if (tag === "minecraft:is_shears_item_destructible") {
                            screenData.acceptShears = mainhand?.hasTag("minecraft:is_shears") ? 2 : 1;
                        }
                    }
                } catch { /* Ignore tool detection errors. */ }
            }

            const blockDetail = composeBlockDisplayForTarget(block, player, settings);
            if (Array.isArray(blockDetail?.rawtext) && blockDetail.rawtext.length) {
                screenData.detail.rawtext.push(...stripLeadingTitleLine(blockDetail.rawtext));
            }
        }

        // --- Encode title payload ---
        // data_2 format: currentHealth(3) + maxHealth(3) + "00"
        const exportUi =
            screenData.prefix +
            screenData.acceptShears.toString() +
            screenData.acceptHoe.toString() +
            screenData.acceptShovel.toString() +
            screenData.acceptAxe.toString() +
            screenData.acceptPickaxe.toString() +
            screenData.acceptSword.toString() +
            screenData.entityHeight.toString().padStart(2, "0") +
            "b" +
            screenData.currentHealth.toString().padStart(3, "0") +
            screenData.maxHealth.toString().padStart(3, "0") +
            "00" +
            screenData.key.slice(0, 48).padStart(48, "~");

        const rawMessage = {
            rawtext: [
                { text: exportUi },
                ...screenData.detail.rawtext,
                { text: CHANNEL_SUFFIX }
            ]
        };

        uiQueue.sendRaw(player, CHANNEL_TARGET, rawMessage);
        uiQueue.setSubtitle(player, screenData.renderAux || null);
        playerTargetCache.set(playerId, screenData);
    } catch {
        // Silently skip target data collection errors.
    }
}

/**
 * Cleanup cached data for a player.
 * @param {string} playerId
 */
export function cleanupPlayer(playerId) {
    playerTargetCache.delete(playerId);
    playerNoTargetTicks.delete(playerId);
}

/**
 * Get the last collected target data for a player (for debug/API).
 * @param {string} playerId
 * @returns {Object|undefined}
 */
export function getLastCollectedData(playerId) {
    return playerTargetCache.get(playerId);
}
