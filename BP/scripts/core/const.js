export const CHANNEL_WAILA = "insight_waila:";
export const CHANNEL_ENTITY_WAILA = "insight_entity_waila:";
export const CHANNEL_BLOCK_WAILA = "insight_block_waila:";

export const CORE_SETTINGS_DYNAMIC_PROPERTY = "insight:core_settings";

/**
 * @typedef {object} MainSettings
 * @property {boolean} enabled
 * @property {number} updateIntervalTicks
 * @property {number} maxDistance
 * @property {number} panelStyleId
 * @property {number} fontScale
 */

/**
 * @typedef {object} BlockSettings
 * @property {boolean} energyContainers
 * @property {boolean} fluidContainers
 * @property {boolean} blockRender
 * @property {boolean} preferredTool
 * @property {boolean} toolTier
 * @property {boolean} location
 * @property {boolean} identifier
 * @property {boolean} blockTags
 * @property {boolean} states
 */

/**
 * @typedef {object} EntitySettings
 * @property {boolean} health
 * @property {boolean} hostile
 * @property {boolean} identifier
 * @property {boolean} typeFamilies
 * @property {boolean} tags
 * @property {boolean} properties
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
    fontScale: 1,
  },
  block: {
    energyContainers: false,
    fluidContainers: false,
    blockRender: true,
    preferredTool: false,
    toolTier: false,
    location: false,
    identifier: false,
    blockTags: false,
    states: false,
  },
  entity: {
    health: true,
    hostile: false,
    identifier: false,
    typeFamilies: false,
    tags: false,
    properties: false,
  },
};

export const CORE_LIMITS = {
  minUpdateIntervalTicks: 1,
  maxUpdateIntervalTicks: 40,
  minMaxDistance: 1,
  maxMaxDistance: 32,
  minPanelStyleId: 0,
  maxPanelStyleId: 6,
  minFontScale: 0.5,
  maxFontScale: 1.5,
};

export const WAILA_STYLE_TEXTURE_FIELD_LENGTH = 40;
export const WAILA_FONT_SCALE_FIELD_LENGTH = 12;

export const WAILA_FONT_SCALE_OPTIONS = [
  {
    label: "Extra Small",
    scale: 0.5,
  },
  {
    label: "Small",
    scale: 0.75,
  },
  {
    label: "Normal",
    scale: 1,
  },
  {
    label: "Large",
    scale: 1.25,
  },
  {
    label: "Extra Large",
    scale: 1.5,
  },
];

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
