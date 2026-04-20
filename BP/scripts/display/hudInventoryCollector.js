/**
 * @module hudInventoryCollector
 * @description Collects HUD inventory layout and selected stack summary data
 * for Dorios' Insight.
 */

import {
    getHudElementOrientationNumericId,
    getHudElementPositionNumericId,
    getHudInventoryDisplayNumericId
} from "./config.js";

/**
 * Resolve the player's inventory container, if available.
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {import("@minecraft/server").Container|undefined}
 */
export function getInventoryContainer(player) {
    const componentIds = ["minecraft:inventory", "inventory"];

    for (const componentId of componentIds) {
        try {
            const inventory = player.getComponent(componentId);
            if (inventory?.container) {
                return inventory.container;
            }
        } catch {
            continue;
        }
    }

    return undefined;
}

/**
 * Get the selected hotbar slot index for a player.
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {number}
 */
export function getSelectedHotbarSlotIndex(player) {
    try {
        const selectedSlotIndex = Number(player.selectedSlotIndex);
        if (Number.isFinite(selectedSlotIndex)) {
            return Math.max(0, Math.min(8, Math.floor(selectedSlotIndex)));
        }
    } catch {
        // Ignore API read errors.
    }

    return 0;
}

/**
 * Compare two item stacks conservatively for total-count aggregation.
 *
 * @param {import("@minecraft/server").ItemStack|undefined} referenceItem
 * @param {import("@minecraft/server").ItemStack|undefined} otherItem
 * @returns {boolean}
 */
export function areEquivalentInventoryItems(referenceItem, otherItem) {
    if (!referenceItem || !otherItem) {
        return false;
    }

    try {
        if (typeof referenceItem.isStackableWith === "function" && referenceItem.isStackableWith(otherItem)) {
            return true;
        }
    } catch {
        // Fall back to type identifier matching below.
    }

    return referenceItem.typeId === otherItem.typeId;
}

/**
 * Collect a safe summary for the currently selected inventory item.
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {{current: number, total: number, visible: boolean}}
 */
export function getSelectedInventoryStackSummary(player) {
    const container = getInventoryContainer(player);
    if (!container) {
        return { current: 0, total: 0, visible: false };
    }

    const selectedSlotIndex = getSelectedHotbarSlotIndex(player);
    let selectedItem;

    try {
        selectedItem = container.getItem(selectedSlotIndex);
    } catch {
        selectedItem = undefined;
    }

    if (!selectedItem) {
        return { current: 0, total: 0, visible: false };
    }

    const current = Math.max(0, Math.min(255, Math.round(Number(selectedItem.amount) || 0)));
    const containerSize = Number.isFinite(container.size) ? container.size : 0;
    let total = 0;

    for (let slotIndex = 0; slotIndex < containerSize; slotIndex++) {
        try {
            const slotItem = container.getItem(slotIndex);
            if (!areEquivalentInventoryItems(selectedItem, slotItem)) {
                continue;
            }

            total += Math.max(0, Math.round(Number(slotItem?.amount) || 0));
        } catch {
            continue;
        }
    }

    return {
        current: Math.max(1, current),
        total: Math.max(1, Math.min(9999, total || current)),
        visible: true
    };
}

/**
 * Collect the encoded HUD inventory payload fields.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {object} settings
 * @returns {{
 *   hudInventory: number,
 *   hudInventoryPosition: number,
 *   hudInventoryDisplayMode: number,
 *   hudInventoryOrientation: number,
 *   stackCurrent: number,
 *   stackVisible: number,
 *   stackTotalHi: number,
 *   stackTotalLo: number
 * }}
 */
export function collectHudInventoryState(player, settings) {
    const hudInventoryEnabled = Boolean(settings?.hudInventoryEnabled ?? settings?.runtime?.hudInventoryEnabled);
    const hudInventoryPosition = getHudElementPositionNumericId(
        settings?.hudInventoryPosition ?? settings?.runtime?.hudInventoryPosition
    );
    const hudInventoryDisplayMode = getHudInventoryDisplayNumericId(
        settings?.hudInventoryDisplayMode ?? settings?.runtime?.hudInventoryDisplayMode
    );
    const hudInventoryOrientation = getHudElementOrientationNumericId(
        settings?.hudInventoryOrientation ?? settings?.runtime?.hudInventoryOrientation
    );
    const selectedStackSummary = getSelectedInventoryStackSummary(player);
    const clampedTotal = Math.min(9999, selectedStackSummary.total);

    return {
        hudInventory: hudInventoryEnabled ? 1 : 0,
        hudInventoryPosition,
        hudInventoryDisplayMode,
        hudInventoryOrientation,
        stackCurrent: selectedStackSummary.current,
        stackVisible: hudInventoryEnabled && selectedStackSummary.visible ? 1 : 0,
        stackTotalHi: Math.floor(clampedTotal / 100),
        stackTotalLo: clampedTotal % 100
    };
}
