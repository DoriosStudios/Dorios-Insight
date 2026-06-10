export const CHANNEL_WAILA = "insight_waila:";

export const CORE_SETTINGS_DYNAMIC_PROPERTY = "insight:core_settings";

export const DEFAULT_CORE_SETTINGS = Object.freeze({
    enabled: true,
    updateIntervalTicks: 4,
    maxDistance: 8,
    panelStyleId: 0
});

export const CORE_LIMITS = Object.freeze({
    minUpdateIntervalTicks: 1,
    maxUpdateIntervalTicks: 40,
    minMaxDistance: 1,
    maxMaxDistance: 32,
    minPanelStyleId: 0,
    maxPanelStyleId: 6
});

export const WAILA_STYLE_TEXTURE_FIELD_LENGTH = 40;

export const PANEL_STYLES = Object.freeze([
    Object.freeze({
        id: 0,
        label: "Default",
        texture: "textures/insight/style_default"
    }),
    Object.freeze({
        id: 1,
        label: "Dark",
        texture: "textures/insight/style_dark"
    }),
    Object.freeze({
        id: 2,
        label: "Copper",
        texture: "textures/insight/style_copper"
    }),
    Object.freeze({
        id: 3,
        label: "Magenta",
        texture: "textures/insight/style_magenta"
    }),
    Object.freeze({
        id: 4,
        label: "Cyan",
        texture: "textures/insight/style_cyan"
    }),
    Object.freeze({
        id: 5,
        label: "Blood",
        texture: "textures/insight/style_blood"
    }),
    Object.freeze({
        id: 6,
        label: "Ascane",
        texture: "textures/insight/style_ascane"
    })
]);

export const NAMESPACE_LABELS = Object.freeze({
    minecraft: "Minecraft",
    dorios: "Dorios",
    utilitycraft: "UtilityCraft"
});

export const EMPTY_WAILA_TEXT = CHANNEL_WAILA;
