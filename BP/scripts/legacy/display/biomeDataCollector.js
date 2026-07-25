/**
 * @module biomeDataCollector
 * @description Biome-change notification system for Dorios' Insight.
 *
 * Inherits and improves upon the Coldbar Indicator's biome_indicator approach:
 *   - Detects biome changes via dimension.getBiome()
 *   - Sends a typewriter-reveal notification through the insight_biome channel
 *   - Auto-clears after a configurable duration (default 4 seconds)
 *
 * Title payload format (string, uiQueue appends suffix):
 *   dimension_name(64 padded ~) + biome_name(64 padded ~)
 *   → full payload with suffix: ...padded... + "insight_biome"
 *
 * The JSON UI extracts dimension_name from the first 64 chars and
 * biome_name from chars 64-127, stripping ~ padding.
 *
 * This module runs its own system.runInterval for smooth animation;
 * the controller only needs to call initialize() once.
 *
 * @author Kauziin (Dorios Studios), Kamii
 * @version 2.0.0
 */

import { world, system } from "@minecraft/server";
import * as uiQueue from "./uiQueue.js";
import { CHANNEL_BIOME } from "./uiChannels.js";
import { InsightConfig, getPlayerDisplaySettings } from "./config.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Map of dimension ID → display name */
const DIMENSION_NAMES = {
    "minecraft:overworld": "Overworld",
    "minecraft:nether": "Nether",
    "minecraft:the_end": "The End"
};

/** Duration of the notification in ticks (default: 4 seconds) */
const NOTIFICATION_DURATION_TICKS = 20 * 4;

// ---------------------------------------------------------------------------
// Per-player state
// ---------------------------------------------------------------------------

/**
 * @type {Map<string, {
 *   biomeId: string|undefined,
 *   biomeName: string,
 *   dimensionName: string,
 *   duration: number
 * }>}
 */
const playerBiomeState = new Map();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a biome type ID (e.g. "minecraft:dark_forest") into a
 * display name with capitalized words ("Dark Forest").
 *
 * @param {string} biomeId
 * @returns {string}
 */
function formatBiomeName(biomeId) {
    const name = biomeId.includes(":") ? biomeId.split(":")[1] : biomeId;
    return name.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ---------------------------------------------------------------------------
// Tick Loop
// ---------------------------------------------------------------------------

/**
 * Internal tick processor for a single player.
 * Checks for biome changes and manages the notification animation.
 *
 * @param {import("@minecraft/server").Player} player
 */
function tickPlayer(player) {
    const id = player.id;

    if (!playerBiomeState.has(id)) {
        playerBiomeState.set(id, {
            biomeId: undefined,
            biomeName: "",
            dimensionName: "",
            duration: 0
        });
    }

    const state = playerBiomeState.get(id);

    // --- Biome change detection (only when not already animating) ---
    if (state.duration === 0) {
        try {
            if (!player.dimension.isChunkLoaded(player.location)) return;
            const biome = player.dimension.getBiome(player.location);
            if (biome) {
                if (state.biomeId !== biome.id) {
                    state.biomeId = biome.id;
                    state.biomeName = formatBiomeName(biome.id);
                    state.dimensionName = DIMENSION_NAMES[player.dimension.id] || "Unknown";
                    state.duration = 1;
                }
            } else {
                // Biome not available — reset
                state.biomeId = undefined;
                state.biomeName = "";
                state.dimensionName = "";
            }
        } catch {
            // getBiome() may throw in unloaded chunks
        }
        return;
    }

    // --- Notification expired → clear ---
    if (state.duration > NOTIFICATION_DURATION_TICKS) {
        state.biomeName = "";
        state.dimensionName = "";
        state.duration = 0;

        // Send one clearing frame (empty padded strings)
        uiQueue.send(player, CHANNEL_BIOME, "");
        return;
    }

    // --- Build gradual-reveal text ---
    state.duration++;

    const dimRevealLen = Math.floor(state.dimensionName.length / 5 + state.duration);
    const bioRevealLen = Math.floor(state.biomeName.length / 5 + state.duration);

    const dimText = state.dimensionName.substring(0, dimRevealLen).padStart(64, "~");
    const bioText = state.biomeName.substring(0, bioRevealLen).padStart(64, "~");

    uiQueue.send(player, CHANNEL_BIOME, dimText + bioText);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let initialized = false;

/**
 * Start the biome notification loop.
 * Call once from the display controller during initialization.
 */
export function initialize() {
    if (initialized) return;
    initialized = true;

    system.runInterval(() => {
        for (const player of world.getAllPlayers()) {
            try {
                const settings = getPlayerDisplaySettings(player);
                if (settings.disabled || !settings.enableBiomeIndicator) continue;
                tickPlayer(player);
            } catch {
                // Silently skip per-player errors
            }
        }
    }, 1);
}

/**
 * Cleanup cached data for a player.
 *
 * @param {string} playerId
 */
export function cleanupPlayer(playerId) {
    playerBiomeState.delete(playerId);
}

/**
 * Get the last biome state for a player (for debug/API).
 *
 * @param {string} playerId
 * @returns {Object|undefined}
 */
export function getLastCollectedData(playerId) {
    return playerBiomeState.get(playerId);
}
