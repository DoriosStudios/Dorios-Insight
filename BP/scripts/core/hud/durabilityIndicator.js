import { CHANNEL_HUD } from "../const.js";
import { defineSchema, encodePayload } from "../uiDataEncoder.js";
import { send } from "../uiQueue.js";

const EMPTY_DURABILITY_DATA = {
    durPercent: 0,
    durVisible: 0,
    durCurHi: 0,
    durCurLo: 0,
    durMaxHi: 0,
    durMaxLo: 0,
    durDisplayMode: 3,
    durPosition: 0,
    durIconVisible: 0,
    durReserved: 0
};

const HUD_SCHEMAS = [
    defineSchema("a", [
        { name: "health", digits: 3 },
        { name: "maxHealth", digits: 3 },
        { name: "absorption", digits: 2 },
        { name: "healthGap", digits: 2 }
    ]),
    defineSchema("b", [
        { name: "air", digits: 2 },
        { name: "airMax", digits: 2 },
        { name: "hunger", digits: 2 },
        { name: "saturation", digits: 2 }
    ]),
    defineSchema("c", [
        { name: "armor", digits: 2 },
        { name: "toughness", digits: 2 },
        { name: "xpLevel", digits: 2 },
        { name: "xpProgress", digits: 2 }
    ]),
    defineSchema("d", [
        { name: "activeEffects", digits: 2 },
        { name: "effectTimer", digits: 2 },
        { name: "biomeTemperature", digits: 2 },
        { name: "biomeHumidity", digits: 2 }
    ]),
    defineSchema("e", [
        { name: "hudHealthIndicator", digits: 2 },
        { name: "hudHungerIndicator", digits: 2 },
        { name: "durPercent", digits: 3 },
        { name: "durVisible", digits: 1 }
    ]),
    defineSchema("f", [
        { name: "durCurHi", digits: 2 },
        { name: "durCurLo", digits: 2 },
        { name: "durMaxHi", digits: 2 },
        { name: "durMaxLo", digits: 2 }
    ]),
    defineSchema("g", [
        { name: "hudInventory", digits: 2 },
        { name: "hudInventoryPosition", digits: 2 },
        { name: "hudInventoryDisplayMode", digits: 2 },
        { name: "hudInventoryOrientation", digits: 2 }
    ]),
    defineSchema("h", [
        { name: "reservedH0", digits: 2 },
        { name: "reservedH1", digits: 2 },
        { name: "reservedH2", digits: 2 },
        { name: "reservedH3", digits: 2 }
    ]),
    defineSchema("i", [
        { name: "durDisplayMode", digits: 2 },
        { name: "durPosition", digits: 2 },
        { name: "durIconVisible", digits: 2 },
        { name: "durReserved", digits: 2 }
    ])
];

function splitTwoDigitPairs(value) {
    const safeValue = Math.max(0, Math.min(9999, Math.round(Number(value) || 0)));
    return {
        hi: Math.floor(safeValue / 100),
        lo: safeValue % 100
    };
}

function getMainhandItem(player) {
    try {
        const equippable = player.getComponent?.("minecraft:equippable");
        if (equippable && typeof equippable.getEquipment === "function") {
            return equippable.getEquipment("Mainhand")
                ?? equippable.getEquipment("mainhand")
                ?? equippable.getEquipment("slot.weapon.mainhand");
        }
    } catch {
        // Fall back to the selected inventory slot.
    }

    try {
        const inventory = player.getComponent?.("minecraft:inventory")?.container;
        const selectedSlot = Number(player.selectedSlotIndex ?? player.selectedSlot ?? 0);
        if (inventory && Number.isFinite(selectedSlot)) {
            return inventory.getItem(Math.max(0, Math.min(8, Math.floor(selectedSlot))));
        }
    } catch {
        // No readable mainhand item.
    }

    return undefined;
}

function getDurabilityComponent(itemStack) {
    if (!itemStack || typeof itemStack.getComponent !== "function") {
        return undefined;
    }

    try {
        return itemStack.getComponent("minecraft:durability")
            ?? itemStack.getComponent("durability");
    } catch {
        return undefined;
    }
}

function collectDurabilityData(player) {
    const item = getMainhandItem(player);
    const durability = getDurabilityComponent(item);
    if (!durability) {
        return EMPTY_DURABILITY_DATA;
    }

    const max = Math.max(0, Math.round(Number(durability.maxDurability) || 0));
    const damage = Math.max(0, Math.round(Number(durability.damage) || 0));
    if (max <= 0) {
        return EMPTY_DURABILITY_DATA;
    }

    const current = Math.max(0, Math.min(max, max - damage));
    const percent = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
    const currentParts = splitTwoDigitPairs(current);
    const maxParts = splitTwoDigitPairs(max);

    return {
        durPercent: percent,
        durVisible: 1,
        durCurHi: currentParts.hi,
        durCurLo: currentParts.lo,
        durMaxHi: maxParts.hi,
        durMaxLo: maxParts.lo,
        durDisplayMode: 3,
        durPosition: 0,
        durIconVisible: 1,
        durReserved: 0
    };
}

function encodeDurabilityData(data) {
    const fullPayload = encodePayload(HUD_SCHEMAS, data, CHANNEL_HUD);
    return fullPayload.slice(0, -CHANNEL_HUD.length);
}

export function updateDurabilityIndicator(player) {
    send(player, CHANNEL_HUD, encodeDurabilityData(collectDurabilityData(player)));
}
