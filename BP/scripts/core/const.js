export const CHANNEL_WAILA = "insight_waila:";

export const CORE_SETTINGS_DYNAMIC_PROPERTY = "insight:core_settings";

/**
 * @typedef {object} MainSettings
 * @property {boolean} enabled
 * @property {number} updateIntervalTicks
 * @property {number} maxDistance
 * @property {number} panelStyleId
 */

/**
 * @typedef {object} BlockSettings
 * @property {boolean} energyContainers
 * @property {boolean} fluidContainers
 * @property {boolean} preferredTool
 * @property {boolean} toolTier
 * @property {boolean} location
 * @property {boolean} identifier
 * @property {boolean} blockTags
 * @property {boolean} states
 */

/**
 * @typedef {object} EntitySettings
 */

/**
 * @typedef {object} CoreSettings
 * @property {MainSettings} main
 * @property {BlockSettings} block
 * @property {EntitySettings} entity
 */

/** @type {CoreSettings} */
export const DEFAULT_CORE_SETTINGS = {
  main: {
    enabled: true,
    updateIntervalTicks: 4,
    maxDistance: 8,
    panelStyleId: 0,
  },
  block: {
    energyContainers: false,
    fluidContainers: false,
    preferredTool: false,
    toolTier: false,
    location: false,
    identifier: false,
    blockTags: false,
    states: false,
  },
  entity: {},
};

export const CORE_LIMITS = {
  minUpdateIntervalTicks: 1,
  maxUpdateIntervalTicks: 40,
  minMaxDistance: 1,
  maxMaxDistance: 32,
  minPanelStyleId: 0,
  maxPanelStyleId: 6,
};

export const WAILA_STYLE_TEXTURE_FIELD_LENGTH = 40;

export const PANEL_STYLES = [
  {
    id: 0,
    label: "Default",
    texture: "textures/insight/style_default",
  },
  {
    id: 1,
    label: "Dark",
    texture: "textures/insight/style_dark",
  },
  {
    id: 2,
    label: "Copper",
    texture: "textures/insight/style_copper",
  },
  {
    id: 3,
    label: "Magenta",
    texture: "textures/insight/style_magenta",
  },
  {
    id: 4,
    label: "Cyan",
    texture: "textures/insight/style_cyan",
  },
  {
    id: 5,
    label: "Blood",
    texture: "textures/insight/style_blood",
  },
  {
    id: 6,
    label: "Ascane",
    texture: "textures/insight/style_ascane",
  },
];

export const NAMESPACE_LABELS = {
  minecraft: "Minecraft",
};

export const HIDDEN_NAMESPACE_LINE_NAMESPACES = ["dorios", "utilitycraft", "better_smelters", "modular_energistics"];

export const EMPTY_WAILA_TEXT = CHANNEL_WAILA;
