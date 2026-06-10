/**
 * @module uiQueue
 * @description Internal UI Queue system for Dorios' Insight.
 *
 * Manages per-player title text dispatching for the UI JSON binding pipeline.
 * Inspired by UI Queue v1.5 by Coldbar, re-implemented as an embedded module
 * with automatic detection of external UI Queue addons.
 *
 * Title text flow:
 *   Script → uiQueue.send(player, channel, encodedString)
 *              → per-player queue (dedup + refresh)
 *                → ONE setTitle() call per player per tick
 *                  → UI JSON reads #hud_title_text_string
 *
 * @author Kauziin (Dorios Studios), Kamii
 * @version 1.0.0
 */

import { system, world } from "@minecraft/server";

// ---------------------------------------------------------------------------
// Per-player queue state
// ---------------------------------------------------------------------------

/** @type {Map<string, Map<string, string>>} playerId → (channel → encodedPayload) */
const playerQueues = new Map();

/** @type {Map<string, Map<string, string>>} playerId → (channel → last dispatched payload) */
const playerLastSent = new Map();

/** @type {Map<string, Map<string, number>>} playerId → (channel → tick when last updated) */
const playerUpdateTick = new Map();

/** @type {Map<string, Map<string, number>>} playerId → (channel → exponential backoff counter) */
const playerRefreshLoop = new Map();

/** @type {Map<string, string>} playerId → dimension id (for forced refresh on dimension change) */
const playerDimension = new Map();

/** @type {Map<string, import("@minecraft/server").RawMessage|string|null>} playerId → current subtitle (WAILA display) */
const playerSubtitles = new Map();

/** @type {Set<string>} All registered channel names */
const registeredChannels = new Set();

/** Whether the queue has started dispatching (skip first tick) */
let started = false;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** How many ticks before a stale channel gets a refresh re-send */
const STALE_THRESHOLD_TICKS = 10;

/** Base multiplier for exponential backoff on stale refreshes (ticks) */
const BACKOFF_BASE_TICKS = 20;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function ensurePlayerState(playerId) {
    if (!playerQueues.has(playerId)) {
        playerQueues.set(playerId, new Map());
        playerLastSent.set(playerId, new Map());
        playerUpdateTick.set(playerId, new Map());
        playerRefreshLoop.set(playerId, new Map());
    }
}

function cleanupPlayer(playerId) {
    playerQueues.delete(playerId);
    playerLastSent.delete(playerId);
    playerUpdateTick.delete(playerId);
    playerRefreshLoop.delete(playerId);
    playerDimension.delete(playerId);
    playerSubtitles.delete(playerId);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a channel name. Channels are the routing suffixes that UI JSON
 * panels use to identify which data belongs to them.
 *
 * @param {string} channelName - Unique channel identifier (e.g. "insight_hud")
 */
export function registerChannel(channelName) {
    registeredChannels.add(channelName);
}

/**
 * Enqueue an encoded payload for a player on a specific channel.
 * The payload will be dispatched via `setTitle()` on the next available tick.
 *
 * The final string sent to `setTitle()` is: `encodedData + channelName`
 * (the channel name is appended as a suffix so UI JSON can filter by it).
 *
 * Deduplication: if the payload for this channel hasn't changed since last
 * dispatch, it is skipped (but will be refreshed on a backoff schedule).
 *
 * @param {import("@minecraft/server").Player} player - Target player
 * @param {string} channelName - Channel to send on
 * @param {string} encodedData - Positional-encoded data string
 */
export function send(player, channelName, encodedData) {
    const id = player.id;
    ensurePlayerState(id);
    registeredChannels.add(channelName);

    const fullPayload = encodedData + channelName;

    const lastSentMap = playerLastSent.get(id);
    if (lastSentMap.get(channelName) === fullPayload) {
        // Same data — will be refreshed automatically via backoff.
        return;
    }

    // New data — enqueue and reset backoff.
    lastSentMap.set(channelName, fullPayload);
    playerQueues.get(id).set(channelName, fullPayload);
    playerUpdateTick.get(id).set(channelName, system.currentTick + BACKOFF_BASE_TICKS);
    playerRefreshLoop.get(id).set(channelName, 0);
}

/**
 * Force an immediate refresh of a channel for a player, even if the data
 * hasn't changed. Useful after dimension changes or config switches.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {string} channelName
 */
export function forceRefresh(player, channelName) {
    const id = player.id;
    ensurePlayerState(id);

    const lastPayload = playerLastSent.get(id)?.get(channelName);
    if (lastPayload) {
        playerQueues.get(id).set(channelName, lastPayload);
        playerUpdateTick.get(id).set(channelName, system.currentTick + BACKOFF_BASE_TICKS);
        playerRefreshLoop.get(id).set(channelName, 0);
    }
}

/**
 * Force refresh ALL channels for a player.
 *
 * @param {import("@minecraft/server").Player} player
 */
export function forceRefreshAll(player) {
    for (const channel of registeredChannels) {
        forceRefresh(player, channel);
    }
}

/**
 * Clear all queued and cached data for a player.
 *
 * @param {import("@minecraft/server").Player} player
 */
export function clearPlayer(player) {
    cleanupPlayer(player.id);
}

/**
 * Set the persistent subtitle (WAILA display text) for a player.
 * The subtitle is included with every setTitle() dispatch, persisting
 * across channel rotations.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {import("@minecraft/server").RawMessage|string|null} subtitle
 *   - RawMessage/string: set new subtitle
 *   - null: clear subtitle
 *   - undefined: should not be passed (no-op, caller should skip)
 */
export function setSubtitle(player, subtitle) {
    playerSubtitles.set(player.id, subtitle);
}

/**
 * Get the current subtitle for a player.
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {import("@minecraft/server").RawMessage|string|null|undefined}
 */
export function getSubtitle(player) {
    return playerSubtitles.get(player.id);
}

/**
 * Enqueue a RawMessage payload for a player on a specific channel.
 * The RawMessage is dispatched directly via setTitle() without string
 * concatenation. The channel suffix must already be included in the
 * rawtext (e.g. as the last { text: "insight_target" } element).
 *
 * Deduplication is skipped for raw payloads since they typically
 * change every update (entity health, effects, etc.).
 *
 * @param {import("@minecraft/server").Player} player
 * @param {string} channelName - Channel to send on
 * @param {import("@minecraft/server").RawMessage} rawMessage - Complete RawMessage with suffix
 */
export function sendRaw(player, channelName, rawMessage) {
    const id = player.id;
    ensurePlayerState(id);
    registeredChannels.add(channelName);

    // Store directly — no dedup for raw messages (they change frequently).
    playerLastSent.get(id).set(channelName, rawMessage);
    playerQueues.get(id).set(channelName, rawMessage);
    playerUpdateTick.get(id).set(channelName, system.currentTick + BACKOFF_BASE_TICKS);
    playerRefreshLoop.get(id).set(channelName, 0);
}

/**
 * Check if the UI Queue system is active and has dispatched at least once.
 *
 * @returns {boolean}
 */
export function isActive() {
    return started;
}

/**
 * Get the set of all registered channel names (read-only view).
 *
 * @returns {ReadonlySet<string>}
 */
export function getRegisteredChannels() {
    return registeredChannels;
}

// ---------------------------------------------------------------------------
// Dispatch loop — runs every tick
// ---------------------------------------------------------------------------

/**
 * Initialize the UI Queue dispatch loop.
 * Should be called once during addon startup.
 */
export function initializeUIQueue() {
    system.runInterval(() => {
        if (!started) {
            started = true;
            return;
        }

        for (const player of world.getAllPlayers()) {
            try {
                dispatchForPlayer(player);
            } catch {
                // Silently skip invalid player references.
            }
        }
    }, 1);

    // Cleanup on player leave.
    world.afterEvents.playerLeave.subscribe((event) => {
        cleanupPlayer(event.playerId);
    });
}

/**
 * Core per-player dispatch logic:
 * 1. If dimension changed → force refresh all channels.
 * 2. If queue has pending items → dispatch the first one.
 * 3. If queue is empty → check for stale channels that need refresh.
 *
 * @param {import("@minecraft/server").Player} player
 */
function dispatchForPlayer(player) {
    const id = player.id;
    ensurePlayerState(id);

    // Detect dimension change → force refresh.
    const currentDim = player.dimension?.id;
    if (playerDimension.get(id) !== currentDim) {
        playerDimension.set(id, currentDim);

        const updateTicks = playerUpdateTick.get(id);
        const refreshLoops = playerRefreshLoop.get(id);

        for (const channel of registeredChannels) {
            if (updateTicks.has(channel)) {
                updateTicks.set(channel, system.currentTick);
                refreshLoops.set(channel, 0);
            }
        }
    }

    const queue = playerQueues.get(id);
    if (!queue) {
        return;
    }

    // --- Dispatch first pending item ---
    if (queue.size > 0) {
        const [channelName, payload] = queue.entries().next().value;
        queue.delete(channelName);

        try {
            const options = {
                fadeInDuration: 0,
                fadeOutDuration: 0,
                stayDuration: 0
            };

            // Include persistent subtitle (WAILA display) with every dispatch.
            if (playerSubtitles.has(id)) {
                const subtitle = playerSubtitles.get(id);
                options.subtitle = subtitle ?? "";
            }

            player.onScreenDisplay.setTitle(payload, options);
        } catch {
            // Ignore title dispatch failures (e.g., player not fully loaded).
        }

        return;
    }

    // --- Stale refresh: re-enqueue channels that haven't been updated recently ---
    const updateTicks = playerUpdateTick.get(id);
    const refreshLoops = playerRefreshLoop.get(id);
    const lastSentMap = playerLastSent.get(id);

    for (const channel of registeredChannels) {
        const lastTick = updateTicks.get(channel);
        const lastPayload = lastSentMap?.get(channel);

        if (lastTick == null || lastPayload == null) {
            continue;
        }

        if (system.currentTick - lastTick > STALE_THRESHOLD_TICKS) {
            queue.set(channel, lastPayload);
            const loopCount = refreshLoops.get(channel) ?? 0;
            updateTicks.set(channel, system.currentTick + BACKOFF_BASE_TICKS * (loopCount + 1));
            refreshLoops.set(channel, loopCount + 1);
            break; // Only enqueue one stale channel per tick to avoid burst.
        }
    }
}
