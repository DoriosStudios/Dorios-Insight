/**
 * @module hudDataCollector
 * @description Collects player HUD data (health, hunger, armor, etc.) and
 * encodes it for dispatch through the UI Queue pipeline.
 *
 * Inspired by Coldbar Indicator's indicator.js data collection approach,
 * adapted for Dorios' Insight's architecture and configuration system.
 *
 * Data flow:
 *   hudDataCollector.collectAndSend(player, settings)
 *     → reads player components (health, hunger, armor, equipment, effects)
 *     → encodes via uiChannels.encodeHudData()
 *     → dispatches via uiQueue.send()
 *
 * Also supports:
 *   - Hunger item preview (held food → preview hunger restoration)
 *   - Armor toughness (from equipment component)
 *   - Overloaded armor (armor > 20)
 *   - Status effect flags (poison, wither, frozen, hunger effect)
 *   - Air supply (underwater breathing)
 *
 * @author Kauziin (Dorios Studios), Kamii
 * @version 1.0.0
 */

import { HudElement, HudVisibility } from "@minecraft/server";
import * as uiQueue from "./uiQueue.js";
import {
    CHANNEL_HUD,
    encodeHudData,
    packHudFlags
} from "./uiChannels.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Whether to hide vanilla HUD elements when UI JSON is rendering them */
let hideVanillaHud = false;

/**
 * Set whether vanilla HUD bars should be hidden.
 * When enabled, vanilla health/hunger/armor bars are hidden via
 * HudVisibility API and replaced by the UI JSON rendered bars.
 *
 * @param {boolean} hide
 */
export function setHideVanillaHud(hide) {
    hideVanillaHud = Boolean(hide);
}

/**
 * Get current hide vanilla HUD state.
 * @returns {boolean}
 */
export function getHideVanillaHud() {
    return hideVanillaHud;
}

const HudDisplayVisibilityModes = Object.freeze({
    ShowInsight: "show_insight",
    Both: "both",
    ShowVanilla: "show_vanilla",
    None: "none"
});

function normalizeHudDisplayMode(mode, fallback = HudDisplayVisibilityModes.Both) {
    const normalized = String(mode || "").trim().toLowerCase();
    if (
        normalized === HudDisplayVisibilityModes.ShowInsight
        || normalized === HudDisplayVisibilityModes.Both
        || normalized === HudDisplayVisibilityModes.ShowVanilla
        || normalized === HudDisplayVisibilityModes.None
    ) {
        return normalized;
    }

    return fallback;
}

function hudModeShowsInsight(mode) {
    const normalized = normalizeHudDisplayMode(mode);
    return normalized === HudDisplayVisibilityModes.ShowInsight
        || normalized === HudDisplayVisibilityModes.Both;
}

function hudModeShowsVanilla(mode) {
    const normalized = normalizeHudDisplayMode(mode);
    return normalized === HudDisplayVisibilityModes.ShowVanilla
        || normalized === HudDisplayVisibilityModes.Both;
}

function resolveHudMode(settings, runtimeKey, fallback = HudDisplayVisibilityModes.Both) {
    return normalizeHudDisplayMode(
        settings?.[runtimeKey] ?? settings?.runtime?.[runtimeKey],
        fallback
    );
}

// ---------------------------------------------------------------------------
// Per-player state
// ---------------------------------------------------------------------------

/**
 * @type {Map<string, Object>}
 * Cache of last collected data per player to avoid unnecessary re-encoding.
 */
const playerDataCache = new Map();

// ---------------------------------------------------------------------------
// Data Collection
// ---------------------------------------------------------------------------

/**
 * Safely read a numeric component value from a player.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {string} componentId
 * @param {string} [property="currentValue"]
 * @returns {number}
 */
function safeGetComponentValue(player, componentId, property = "currentValue") {
    try {
        const component = player.getComponent(componentId);
        if (component) {
            const val = Number(component[property]);
            return Number.isFinite(val) ? val : 0;
        }
    } catch {
        // Component not available.
    }
    return 0;
}

/**
 * Safely read the effective max of a component.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {string} componentId
 * @returns {number}
 */
function safeGetComponentMax(player, componentId) {
    try {
        const component = player.getComponent(componentId);
        if (component) {
            const val = Number(component.effectiveMax ?? component.value ?? component.defaultValue);
            return Number.isFinite(val) ? val : 0;
        }
    } catch {
        // Component not available.
    }
    return 0;
}

/**
 * Get the player's mainhand item stack.
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {import("@minecraft/server").ItemStack|undefined}
 */
function getMainhandItem(player) {
    try {
        const equippable = player.getComponent("minecraft:equippable");
        if (equippable && typeof equippable.getEquipment === "function") {
            return equippable.getEquipment("Mainhand")
                ?? equippable.getEquipment("mainhand")
                ?? equippable.getEquipment("slot.weapon.mainhand");
        }
    } catch {
        // Ignore.
    }
    return undefined;
}

/**
 * Get total armor value from the equippable component.
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {number}
 */
function getTotalArmor(player) {
    try {
        const equippable = player.getComponent("minecraft:equippable");
        if (equippable && Number.isFinite(equippable.totalArmor)) {
            return equippable.totalArmor;
        }
    } catch {
        // Fallback.
    }

    // Fallback: try to read from armor component
    try {
        const armorComp = player.getComponent("minecraft:armor");
        if (armorComp && Number.isFinite(armorComp.value)) {
            return armorComp.value;
        }
    } catch {
        // Ignore.
    }

    return 0;
}

/**
 * Get total armor toughness from equipment slots.
 * This mirrors Coldbar's getTotalArmorToughness but simplified.
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {number}
 */
function getTotalArmorToughness(player) {
    try {
        const equippable = player.getComponent("minecraft:equippable");
        if (!equippable) return 0;

        // Try direct property first (newer API versions).
        if (Number.isFinite(equippable.totalToughness)) {
            return equippable.totalToughness;
        }

        // Manual calculation from armor slots.
        let totalToughness = 0;
        const slots = ["Head", "Chest", "Legs", "Feet"];

        for (const slot of slots) {
            try {
                const item = equippable.getEquipment(slot);
                if (!item) continue;

                // Try to read toughness from item component.
                const durability = item.getComponent("minecraft:durability");
                const enchantable = item.getComponent("minecraft:enchantable");

                // Netherite armor pieces have 3 toughness each, Diamond has 2.
                // This is a simplified lookup; for exact values use a database.
                const typeId = item.typeId?.toLowerCase() ?? "";
                if (typeId.includes("netherite")) {
                    totalToughness += 3;
                } else if (typeId.includes("diamond")) {
                    totalToughness += 2;
                }
            } catch {
                continue;
            }
        }

        return Math.min(20, totalToughness);
    } catch {
        return 0;
    }
}

/**
 * Check if a player has a specific effect type.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {string} effectTypeId - e.g. "poison", "wither", "hunger"
 * @returns {boolean}
 */
function hasEffect(player, effectTypeId) {
    try {
        const effects = player.getEffects();
        if (!Array.isArray(effects)) return false;

        for (const effect of effects) {
            const typeId = effect?.typeId ?? effect?.type?.id ?? "";
            const normalized = typeof typeId === "string"
                ? (typeId.includes(":") ? typeId.split(":").pop() : typeId).toLowerCase()
                : "";

            if (normalized === effectTypeId) return true;
        }
    } catch {
        // Ignore.
    }
    return false;
}

/**
 * Get food nutrition from a held item.
 *
 * @param {import("@minecraft/server").ItemStack} itemStack
 * @returns {number} Nutrition value or 0 if not food.
 */
function getFoodNutrition(itemStack) {
    if (!itemStack) return 0;

    try {
        if (itemStack.hasComponent("minecraft:food")) {
            const food = itemStack.getComponent("minecraft:food");
            return Number(food?.nutrition) || 0;
        }
    } catch {
        // Ignore.
    }

    return 0;
}

/**
 * Check if player is in freeze damage (powdered snow).
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {boolean}
 */
function isFrozen(player) {
    try {
        // Check freeze ticks or frozen component.
        if (typeof player.isFrozen === "boolean") return player.isFrozen;

        const freezing = player.getComponent("minecraft:freezing");
        if (freezing && Number.isFinite(freezing.value) && freezing.value > 0) return true;
    } catch {
        // Ignore.
    }
    return false;
}

/**
 * Get player air supply information.
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {{current: number, max: number}}
 */
function getAirSupply(player) {
    try {
        const breathable = player.getComponent("minecraft:breathable");
        if (breathable) {
            const current = Number.isFinite(breathable.currentValue)
                ? breathable.currentValue : 15;
            const max = Number.isFinite(breathable.maxValue)
                ? breathable.maxValue : 15;
            return {
                current: Math.max(0, Math.round(current)),
                max: Math.max(1, Math.round(max))
            };
        }
    } catch {
        // Ignore.
    }

    // Fallback values
    return { current: 15, max: 15 };
}

// ---------------------------------------------------------------------------
// Main Collection + Dispatch
// ---------------------------------------------------------------------------

/**
 * Collect all HUD data for a player and send it through the UI Queue.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {Object} settings - Player display settings from config.
 */
export function collectAndSendHudData(player, settings) {
    try {
        const healthMode = resolveHudMode(settings, "hudHealthVisibilityMode");
        const hungerMode = resolveHudMode(settings, "hudHungerVisibilityMode");
        const saturationMode = resolveHudMode(settings, "hudSaturationVisibilityMode");
        const toughnessMode = resolveHudMode(settings, "hudToughnessVisibilityMode");

        const showHealthInsight = Boolean(settings?.showHudHealthInsight ?? hudModeShowsInsight(healthMode));
        const showHungerInsight = Boolean(settings?.showHudHungerInsight ?? hudModeShowsInsight(hungerMode));
        const showSaturationInsight = Boolean(settings?.showHudSaturationInsight ?? hudModeShowsInsight(saturationMode));
        const showToughnessInsight = Boolean(settings?.showHudToughnessInsight ?? hudModeShowsInsight(toughnessMode));

        const showHealthVanilla = hideVanillaHud
            ? false
            : Boolean(settings?.showHudHealthVanilla ?? hudModeShowsVanilla(healthMode));
        const showHungerVanilla = hideVanillaHud
            ? false
            : Boolean(
                settings?.showHudHungerVanilla
                ?? (hudModeShowsVanilla(hungerMode) && hudModeShowsVanilla(saturationMode))
            );
        const showArmorVanilla = hideVanillaHud
            ? false
            : Boolean(settings?.showHudArmorVanilla ?? hudModeShowsVanilla(toughnessMode));

        const hudHealthIndicatorEnabled = showHealthInsight
            && settings?.hudHealthIndicatorEnabled !== false;
        const hudHungerIndicatorEnabled = showHungerInsight
            && settings?.hudHungerIndicatorEnabled !== false;

        // -- Health --
        const health = safeGetComponentValue(player, "minecraft:health");
        const maxHealth = safeGetComponentMax(player, "minecraft:health") || 20;
        const absorption = safeGetComponentValue(player, "minecraft:absorption") || 0;
        const healthGap = Math.max(0, Math.ceil(maxHealth / 20) - 1);

        // -- Hunger --
        const hunger = safeGetComponentValue(player, "minecraft:player.hunger");
        const maxHunger = 20;
        const saturation = Math.round(safeGetComponentValue(player, "minecraft:player.saturation"));
        const rawExhaustion = safeGetComponentValue(player, "minecraft:player.exhaustion");
        const exhaustion = (hunger > 0 || saturation > 0)
            ? Math.max(0, Math.round((4 - rawExhaustion) / 4 * 20))
            : 0;

        // -- Armor --
        const totalArmor = getTotalArmor(player);
        const armor = Math.min(20, totalArmor);
        const toughness = getTotalArmorToughness(player);
        const extraArmor = Math.max(0, totalArmor - 20) % 20;
        const extraArmorFull = Math.floor(Math.max(0, totalArmor - 20) / 20);

        // -- Hunger Preview --
        let hungerPreview = 0;
        if (hunger < 20) {
            const mainhand = getMainhandItem(player);
            const nutrition = getFoodNutrition(mainhand);
            if (nutrition > 0) {
                hungerPreview = Math.min(nutrition + hunger, 20);
            }
        }

        // -- Air Supply --
        const airData = getAirSupply(player);

        // -- Effect Flags --
        const hasHungerPreview = showHungerInsight && hungerPreview > 0;
        const flags = packHudFlags({
            poisoned:      hasEffect(player, "poison"),
            withered:      hasEffect(player, "wither"),
            hasAbsorption: absorption > 0,
            frozen:        isFrozen(player),
            hungerEffect:  hasEffect(player, "hunger"),
            hungerPreview: hasHungerPreview
        });

        // -- Encode and send --
        const data = {
            health: showHealthInsight ? Math.round(health) : 0,
            maxHealth: showHealthInsight ? Math.round(maxHealth) : 0,
            absorption: showHealthInsight ? Math.min(99, Math.round(absorption)) : 0,
            healthGap: showHealthInsight ? healthGap : 0,
            hunger: showHungerInsight ? hunger : 0,
            maxHunger: showHungerInsight ? maxHunger : 0,
            saturation: (showSaturationInsight && settings?.showSaturation !== false) ? Math.min(99, saturation) : 0,
            exhaustion: (showSaturationInsight && settings?.showExhaustion !== false) ? exhaustion : 0,
            armor,
            toughness: (showToughnessInsight && settings?.showToughness !== false) ? Math.min(20, toughness) : 0,
            extraArmor: (showToughnessInsight && settings?.showExtraArmor !== false) ? extraArmor : 0,
            extraArmorFull: (showToughnessInsight && settings?.showExtraArmor !== false) ? extraArmorFull : 0,
            hungerPreview: showHungerInsight ? hungerPreview : 0,
            airSupply: Math.min(99, airData.current),
            maxAir: Math.min(99, airData.max),
            flags,
            hudHealthIndicator: hudHealthIndicatorEnabled ? 1 : 0,
            hudHungerIndicator: hudHungerIndicatorEnabled ? 1 : 0,
            hudReserved1: 0,
            hudReserved2: 0
        };

        const encoded = encodeHudData(data);
        uiQueue.send(player, CHANNEL_HUD, encoded.slice(0, -CHANNEL_HUD.length));

        // -- Vanilla HUD management --
        try {
            player.onScreenDisplay.setHudVisibility(
                showHealthVanilla ? HudVisibility.Reset : HudVisibility.Hide,
                [HudElement.Health]
            );
            player.onScreenDisplay.setHudVisibility(
                showHungerVanilla ? HudVisibility.Reset : HudVisibility.Hide,
                [HudElement.Hunger]
            );
            player.onScreenDisplay.setHudVisibility(
                showArmorVanilla ? HudVisibility.Reset : HudVisibility.Hide,
                [HudElement.Armor]
            );
        } catch {
            // HudVisibility API might not be available.
        }

        // Cache for dedup.
        playerDataCache.set(player.id, data);
    } catch {
        // Silently skip data collection errors.
    }
}

/**
 * Reset vanilla HUD visibility for a player (restore all bars).
 * Falls back to /hud command if the HudVisibility API fails.
 *
 * @param {import("@minecraft/server").Player} player
 */
export function resetVanillaHud(player) {
    try {
        player.onScreenDisplay.setHudVisibility(HudVisibility.Reset, [
            HudElement.Health,
            HudElement.Hunger,
            HudElement.Armor
        ]);
    } catch {
        // Fallback: use /hud command to restore vanilla HUD.
        try {
            player.runCommand("hud @s reset");
        } catch {
            // Ignore — both methods unavailable.
        }
    }
}

/**
 * Reset vanilla HUD for all online players.
 * Useful as a manual fallback if Insight leaves HUD in a hidden state.
 *
 * @param {import("@minecraft/server").World} worldRef
 */
export function resetAllPlayersHud(worldRef) {
    try {
        for (const player of worldRef.getAllPlayers()) {
            resetVanillaHud(player);
        }
    } catch {
        // Ignore iteration errors.
    }
}

/**
 * Cleanup cached data for a player.
 *
 * @param {string} playerId
 */
export function cleanupPlayer(playerId) {
    playerDataCache.delete(playerId);
}

/**
 * Get the last collected HUD data for a player (for debug/API purposes).
 *
 * @param {string} playerId
 * @returns {Object|undefined}
 */
export function getLastCollectedData(playerId) {
    return playerDataCache.get(playerId);
}
