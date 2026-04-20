/**
 * @module hudQuickCounterCollector
 * @description Collects compact under-crosshair counters for Dorios' Insight.
 */

import {
    HudQuickCounterModes,
    getHudQuickCounterModeNumericId,
    normalizeHudQuickCounterMode
} from "./config.js";
import { getItemDurabilityInfo } from "./hudDurabilityCollector.js";
import { getSelectedInventoryStackSummary } from "./hudInventoryCollector.js";

const ItemMetricModes = new Set([
    HudQuickCounterModes.HandStack,
    HudQuickCounterModes.InventoryTotal,
    HudQuickCounterModes.DurabilityCurrent,
    HudQuickCounterModes.DurabilityMax,
    HudQuickCounterModes.DurabilityPercent
]);

function clampCounterValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return 0;
    }

    return Math.max(0, Math.min(9999, Math.round(numeric)));
}

function hideMetric() {
    return {
        mode: HudQuickCounterModes.Hidden,
        value: 0,
        visible: false,
        isItemMetric: false
    };
}

function getPlayerXpLevel(player) {
    try {
        const level = Number(player.level);
        if (Number.isFinite(level)) {
            return clampCounterValue(level);
        }
    } catch {
        // Ignore XP lookup errors and fall back to zero.
    }

    return 0;
}

function getPlayerHorizontalSpeed(player) {
    try {
        const velocity = player.getVelocity?.();
        const velocityX = Number(velocity?.x) || 0;
        const velocityZ = Number(velocity?.z) || 0;
        return clampCounterValue(Math.sqrt((velocityX * velocityX) + (velocityZ * velocityZ)) * 20);
    } catch {
        return 0;
    }
}

function resolveMetric(player, mode, context) {
    const normalized = normalizeHudQuickCounterMode(mode);

    switch (normalized) {
        case HudQuickCounterModes.Hidden:
            return hideMetric();
        case HudQuickCounterModes.HandStack:
            if (!context.selectedStack.visible) {
                return hideMetric();
            }

            return {
                mode: normalized,
                value: clampCounterValue(context.selectedStack.current),
                visible: true,
                isItemMetric: true
            };
        case HudQuickCounterModes.InventoryTotal:
            if (!context.selectedStack.visible) {
                return hideMetric();
            }

            return {
                mode: normalized,
                value: clampCounterValue(context.selectedStack.total),
                visible: true,
                isItemMetric: true
            };
        case HudQuickCounterModes.DurabilityCurrent:
            if (!context.durabilityInfo.hasDurability) {
                return hideMetric();
            }

            return {
                mode: normalized,
                value: clampCounterValue(context.durabilityInfo.current),
                visible: true,
                isItemMetric: true
            };
        case HudQuickCounterModes.DurabilityMax:
            if (!context.durabilityInfo.hasDurability) {
                return hideMetric();
            }

            return {
                mode: normalized,
                value: clampCounterValue(context.durabilityInfo.max),
                visible: true,
                isItemMetric: true
            };
        case HudQuickCounterModes.DurabilityPercent:
            if (!context.durabilityInfo.hasDurability) {
                return hideMetric();
            }

            return {
                mode: normalized,
                value: clampCounterValue((context.durabilityInfo.current / Math.max(1, context.durabilityInfo.max)) * 100),
                visible: true,
                isItemMetric: true
            };
        case HudQuickCounterModes.XpLevel:
            return {
                mode: normalized,
                value: getPlayerXpLevel(player),
                visible: true,
                isItemMetric: false
            };
        case HudQuickCounterModes.Speed:
            return {
                mode: normalized,
                value: getPlayerHorizontalSpeed(player),
                visible: true,
                isItemMetric: false
            };
        default:
            return hideMetric();
    }
}

/**
 * Collect the encoded quick-counter payload fields.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {import("@minecraft/server").ItemStack|undefined} mainhand
 * @param {object} settings
 * @returns {{
 *   quickPrimaryMode: number,
 *   quickSecondaryMode: number,
 *   quickShowIcon: number,
 *   quickIconVisible: number,
 *   quickPrimaryHi: number,
 *   quickPrimaryLo: number,
 *   quickSecondaryHi: number,
 *   quickSecondaryLo: number
 * }}
 */
export function collectHudQuickCounterState(player, mainhand, settings) {
    const enabled = Boolean(settings?.hudQuickCounterEnabled ?? settings?.runtime?.hudQuickCounterEnabled);
    const showIcon = Boolean(settings?.hudQuickCounterShowIcon ?? settings?.runtime?.hudQuickCounterShowIcon);
    const requestedPrimaryMode = enabled
        ? settings?.hudQuickCounterPrimaryMode ?? settings?.runtime?.hudQuickCounterPrimaryMode
        : HudQuickCounterModes.Hidden;
    const requestedSecondaryMode = enabled
        ? settings?.hudQuickCounterSecondaryMode ?? settings?.runtime?.hudQuickCounterSecondaryMode
        : HudQuickCounterModes.Hidden;

    const selectedStack = getSelectedInventoryStackSummary(player);
    const durabilityInfo = getItemDurabilityInfo(mainhand);
    const context = {
        selectedStack,
        durabilityInfo
    };

    const primaryMetric = resolveMetric(player, requestedPrimaryMode, context);
    const secondaryMetric = resolveMetric(player, requestedSecondaryMode, context);
    const iconRelevant = primaryMetric.visible && ItemMetricModes.has(primaryMetric.mode)
        || secondaryMetric.visible && ItemMetricModes.has(secondaryMetric.mode);
    const iconVisible = showIcon && iconRelevant && (selectedStack.visible || Boolean(mainhand));
    const clampedPrimaryValue = clampCounterValue(primaryMetric.value);
    const clampedSecondaryValue = clampCounterValue(secondaryMetric.value);

    return {
        quickPrimaryMode: getHudQuickCounterModeNumericId(primaryMetric.visible ? primaryMetric.mode : HudQuickCounterModes.Hidden),
        quickSecondaryMode: getHudQuickCounterModeNumericId(secondaryMetric.visible ? secondaryMetric.mode : HudQuickCounterModes.Hidden),
        quickShowIcon: showIcon ? 1 : 0,
        quickIconVisible: iconVisible ? 1 : 0,
        quickPrimaryHi: Math.floor(clampedPrimaryValue / 100),
        quickPrimaryLo: clampedPrimaryValue % 100,
        quickSecondaryHi: Math.floor(clampedSecondaryValue / 100),
        quickSecondaryLo: clampedSecondaryValue % 100
    };
}
