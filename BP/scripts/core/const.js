export const CHANNEL_WAILA = "insight_waila:";

export const CORE_SETTINGS_DYNAMIC_PROPERTY = "insight:core_settings";

export const DEFAULT_CORE_SETTINGS = Object.freeze({
    enabled: true,
    updateIntervalTicks: 4,
    maxDistance: 8
});

export const CORE_LIMITS = Object.freeze({
    minUpdateIntervalTicks: 1,
    maxUpdateIntervalTicks: 40,
    minMaxDistance: 1,
    maxMaxDistance: 32
});

export const NAMESPACE_LABELS = Object.freeze({
    minecraft: "Minecraft",
    dorios: "Dorios",
    utilitycraft: "UtilityCraft"
});

export const EMPTY_WAILA_TEXT = CHANNEL_WAILA;
