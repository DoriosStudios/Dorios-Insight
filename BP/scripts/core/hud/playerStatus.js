const MAX_HUD_HEALTH = 999;
const MAX_HUD_ARMOR = 2000;

function clampInteger(value, min, max, fallback = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, Math.round(number)));
}

function getComponent(player, componentId) {
    try {
        return player?.getComponent?.(componentId);
    } catch {
        return undefined;
    }
}

function readCurrentValue(player, componentId, max, fallback = 0) {
    try {
        const component = getComponent(player, componentId);
        return clampInteger(component?.currentValue, 0, max, fallback);
    } catch {
        return fallback;
    }
}

function readMaxHealth(player) {
    try {
        const health = getComponent(player, "minecraft:health");
        return clampInteger(
            health?.effectiveMax ?? health?.defaultValue,
            1,
            MAX_HUD_HEALTH,
            20
        );
    } catch {
        return 20;
    }
}

function readTotalArmor(player) {
    try {
        const equippable = getComponent(player, "minecraft:equippable");
        return clampInteger(equippable?.totalArmor, 0, MAX_HUD_ARMOR);
    } catch {
        return 0;
    }
}

function calculateArmorOverflow(totalArmor) {
    const overflow = Math.max(0, totalArmor - 20);
    const extraArmor = overflow % 20;
    const extraArmorFull = Math.floor(overflow / 20);

    return {
        armor: Math.min(20, totalArmor),
        extraArmor,
        extraArmorFull,
        armorOverflowRows: extraArmorFull + (extraArmor > 0 ? 1 : 0)
    };
}

/**
 * Collects the compact player-state subset shared by the status HUD and its
 * collision reservoir. Hunger and saturation intentionally remain one 0-20
 * row; only armor and the vanilla max-health layout can add vertical rows.
 *
 * @param {import("@minecraft/server").Player} player
 */
export function collectPlayerStatusData(player) {
    const maxHealth = readMaxHealth(player);
    const totalArmor = readTotalArmor(player);

    return {
        health: readCurrentValue(player, "minecraft:health", MAX_HUD_HEALTH),
        maxHealth,
        absorption: readCurrentValue(player, "minecraft:absorption", 99),
        healthGap: Math.max(0, Math.ceil(maxHealth / 20) - 1),
        hunger: readCurrentValue(player, "minecraft:player.hunger", 20),
        saturation: readCurrentValue(
            player,
            "minecraft:player.saturation",
            20
        ),
        ...calculateArmorOverflow(totalArmor)
    };
}
