import { CHANNEL_HUD } from "../const.js";
import { defineSchema, encodePayload } from "../uiDataEncoder.js";
import { sendLatchedTitle } from "../titleBus.js";
import { collectPlayerStatusData } from "./playerStatus.js";

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

const EQUIPMENT_SLOT_CONFIGS = [
    {
        key: "head",
        delimiter: "j",
        slotNames: ["Head", "head", "slot.armor.head"]
    },
    {
        key: "chest",
        delimiter: "k",
        slotNames: ["Chest", "chest", "slot.armor.chest"]
    },
    {
        key: "legs",
        delimiter: "l",
        slotNames: ["Legs", "legs", "slot.armor.legs"]
    },
    {
        key: "feet",
        delimiter: "m",
        slotNames: ["Feet", "feet", "slot.armor.feet"]
    },
    {
        key: "offhand",
        delimiter: "n",
        slotNames: ["Offhand", "offhand", "slot.weapon.offhand"]
    }
];

const HIDDEN_EQUIPMENT_SLOT_DATA = {
    current: 0,
    max: 0,
    icon: 99
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
        { name: "extraArmor", digits: 2 },
        { name: "extraArmorFull", digits: 2 },
        { name: "armorOverflowRows", digits: 2 }
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

function getEquipmentSlotItem(equippable, slotNames) {
    if (!equippable || typeof equippable.getEquipment !== "function") {
        return undefined;
    }

    for (const slotName of slotNames) {
        try {
            const item = equippable.getEquipment(slotName);
            if (item) {
                return item;
            }
        } catch {
            // Try the next slot alias.
        }
    }

    return undefined;
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

function collectEquipmentSlotData(equippable, config) {
    const item = getEquipmentSlotItem(equippable, config.slotNames);
    const durability = getDurabilityComponent(item);

    if (!durability) {
        return {
            current: 0,
            max: 0,
            icon: 0
        };
    }

    const max = Math.max(0, Math.round(Number(durability.maxDurability) || 0));
    const damage = Math.max(0, Math.round(Number(durability.damage) || 0));
    if (max <= 0) {
        return {
            current: 0,
            max: 0,
            icon: 0
        };
    }

    return {
        current: Math.max(0, Math.min(max, max - damage)),
        max,
        icon: getEquipmentIconCode(item)
    };
}

function getEquipmentIconCode(itemStack) {
    const typeId = String(itemStack?.typeId || "");
    if (typeId.includes("leather_")) return 1;
    if (typeId.includes("chainmail_")) return 2;
    if (typeId.includes("iron_")) return 3;
    if (typeId.includes("golden_") || typeId.includes("gold_")) return 4;
    if (typeId.includes("diamond_")) return 5;
    if (typeId.includes("netherite_")) return 6;
    if (typeId === "minecraft:turtle_helmet") return 7;
    if (typeId === "minecraft:elytra") return 8;
    if (typeId === "minecraft:shield") return 9;
    if (typeId.includes("copper_")) return 10;
    return 0;
}

function encodeFixedNumber(value, digits) {
    const maxValue = Math.pow(10, digits) - 1;
    const safeValue = Math.max(0, Math.min(maxValue, Math.round(Number(value) || 0)));
    return String(safeValue).padStart(digits, "0");
}

function shouldShowEquipmentSlot(config, settings = {}) {
    if (config.key === "offhand") {
        return settings.offhandDurability !== false;
    }

    return settings.armorDurability !== false;
}

function encodeEquipmentData(player, settings = {}) {
    let equippable;
    try {
        equippable = player.getComponent?.("minecraft:equippable");
    } catch {
        equippable = undefined;
    }

    return EQUIPMENT_SLOT_CONFIGS.map((config) => {
        const slot = shouldShowEquipmentSlot(config, settings)
            ? collectEquipmentSlotData(equippable, config)
            : HIDDEN_EQUIPMENT_SLOT_DATA;
        return [
            config.delimiter,
            encodeFixedNumber(slot.icon, 2),
            encodeFixedNumber(slot.current, 3),
            encodeFixedNumber(slot.max, 3)
        ].join("");
    }).join("");
}

function encodeDurabilityData(data) {
    const fullPayload = encodePayload(HUD_SCHEMAS, data, CHANNEL_HUD);
    return fullPayload.slice(0, -CHANNEL_HUD.length);
}

export function updateDurabilityIndicator(player, settings = {}) {
    const mainhandData = {
        ...collectPlayerStatusData(player),
        ...(settings.mainhandDurability === false
            ? EMPTY_DURABILITY_DATA
            : collectDurabilityData(player)),
        durReserved: settings.durabilityMobileLayout ? 1 : 0
    };

    sendLatchedTitle(player, CHANNEL_HUD, `${encodeDurabilityData(mainhandData)}${encodeEquipmentData(player, settings)}`);
}
