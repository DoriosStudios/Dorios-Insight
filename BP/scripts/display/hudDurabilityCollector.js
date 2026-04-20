/**
 * @module hudDurabilityCollector
 * @description Collects mainhand durability viewer data for Dorios' Insight.
 */

import {
    HudDurabilityDisplayModes,
    getHudDurabilityDisplayModeNumericId,
    getHudDurabilityPositionNumericId
} from "./config.js";

/**
 * Resolve durability information for an item stack.
 *
 * Prefers the DoriosAPI helper already loaded into the project and falls back
 * to direct component reads for compatibility with different runtime builds.
 *
 * @param {import("@minecraft/server").ItemStack|undefined} itemStack
 * @returns {{max: number, current: number, damage: number, hasDurability: boolean}}
 */
export function getItemDurabilityInfo(itemStack) {
    if (!itemStack) {
        return { max: 0, current: 0, damage: 0, hasDurability: false };
    }

    try {
        const durabilityApi = itemStack.durability;
        if (
            durabilityApi
            && typeof durabilityApi.getMax === "function"
            && typeof durabilityApi.getDamage === "function"
            && typeof durabilityApi.getRemaining === "function"
        ) {
            const max = Math.max(0, Math.round(Number(durabilityApi.getMax()) || 0));
            const damage = Math.max(0, Math.round(Number(durabilityApi.getDamage()) || 0));
            const current = Math.max(0, Math.round(Number(durabilityApi.getRemaining()) || (max - damage)));

            if (max > 0) {
                return {
                    max,
                    current: Math.min(max, current),
                    damage: Math.min(max, damage),
                    hasDurability: true
                };
            }
        }
    } catch {
        // Ignore helper lookup failures and fall back to direct component reads.
    }

    const componentIds = ["durability", "minecraft:durability"];
    for (const componentId of componentIds) {
        try {
            const durabilityComponent = itemStack.getComponent(componentId);
            if (!durabilityComponent) {
                continue;
            }

            const max = Math.max(0, Math.round(Number(durabilityComponent.maxDurability) || 0));
            const damage = Math.max(0, Math.round(Number(durabilityComponent.damage) || 0));

            if (max > 0) {
                return {
                    max,
                    current: Math.max(0, max - Math.min(max, damage)),
                    damage: Math.min(max, damage),
                    hasDurability: true
                };
            }
        } catch {
            continue;
        }
    }

    return { max: 0, current: 0, damage: 0, hasDurability: false };
}

/**
 * Collect the encoded durability viewer payload fields.
 *
 * @param {import("@minecraft/server").ItemStack|undefined} itemStack
 * @param {object} [settings]
 * @returns {{
 *   durPercent: number,
 *   durVisible: number,
 *   durCurHi: number,
 *   durCurLo: number,
 *   durMaxHi: number,
 *   durMaxLo: number,
 *   durDisplayMode: number,
 *   durPosition: number,
 *   durIconVisible: number,
 *   durReserved: number
 * }}
 */
export function collectHudDurabilityState(itemStack, settings) {
    let durPercent = 0;
    let durCurrent = 0;
    let durMax = 0;
    let durVisible = 0;
    let durIconVisible = 0;

    const displayMode = settings?.hudDurabilityDisplayMode ?? settings?.runtime?.hudDurabilityDisplayMode;
    const positionMode = settings?.hudDurabilityPosition ?? settings?.runtime?.hudDurabilityPosition;
    const showWhenFull = Boolean(
        settings?.hudDurabilityShowWhenFull
        ?? settings?.runtime?.hudDurabilityShowWhenFull
    );

    const durabilityInfo = getItemDurabilityInfo(itemStack);
    const hasVisibleDurability = durabilityInfo.hasDurability
        && (showWhenFull || durabilityInfo.damage > 0)
        && displayMode !== HudDurabilityDisplayModes.Hidden;

    if (hasVisibleDurability) {
        durMax = durabilityInfo.max;
        durCurrent = durabilityInfo.current;
        durPercent = Math.max(0, Math.min(100, Math.round((durCurrent / Math.max(1, durMax)) * 100)));
        durVisible = 1;
        durIconVisible = 1;
    }

    const clampedCurrent = Math.min(9999, durCurrent);
    const clampedMax = Math.min(9999, durMax);

    return {
        durPercent,
        durVisible,
        durCurHi: Math.floor(clampedCurrent / 100),
        durCurLo: clampedCurrent % 100,
        durMaxHi: Math.floor(clampedMax / 100),
        durMaxLo: clampedMax % 100,
        durDisplayMode: getHudDurabilityDisplayModeNumericId(displayMode),
        durPosition: getHudDurabilityPositionNumericId(positionMode),
        durIconVisible,
        durReserved: 0
    };
}
