import { system, world } from "@minecraft/server";
import {
  CHANNEL_WAILA,
  CORE_LIMITS,
  CORE_SETTINGS_DYNAMIC_PROPERTY,
  DEFAULT_CORE_SETTINGS,
  EMPTY_WAILA_TEXT,
  PANEL_STYLES,
  WAILA_FONT_SCALE_FIELD_LENGTH,
  WAILA_FONT_SCALE_OPTIONS,
  WAILA_LAYOUT_FIELD_LENGTH,
  WAILA_META_FIELD_LENGTH,
  STAT_DISPLAY_STYLES,
  WAILA_STYLE_TEXTURE_FIELD_LENGTH,
} from "./const.js";
import { resolvePlayerTarget, TargetKinds } from "./target.js";
import { buildBlockLabel } from "./blocks/general.js";
import { composeEntityTarget } from "./entities/index.js";
import { getBlockRenderAux } from "./render/blockRender.js";
import { updateDurabilityIndicator } from "./hud/durabilityIndicator.js";
import { initializeStatsCoreActivityHud } from "./hud/statsCoreActivity.js";
import {
  clearLatched,
  initializeTitleBus,
  sendLatchedPair,
} from "./titleBus.js";

let initialized = false;
let systemTick = 0;
const playerSettingsCache = new Map();

/** @typedef {import("./const.js").CoreSettings} CoreSettings */
/** @typedef {import("./const.js").MainSettings} MainSettings */

function clampNumber(value, min, max, fallback) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
}

function clampFloat(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.round(Math.min(max, Math.max(min, number)) * 100) / 100;
}

function getNearestFontScale(value) {
  const scale = clampFloat(
    value,
    CORE_LIMITS.minFontScale,
    CORE_LIMITS.maxFontScale,
    DEFAULT_CORE_SETTINGS.main.fontScale,
  );

  let nearest = WAILA_FONT_SCALE_OPTIONS[0].scale;
  let nearestDistance = Infinity;
  for (const option of WAILA_FONT_SCALE_OPTIONS) {
    const distance = Math.abs(option.scale - scale);
    if (distance < nearestDistance) {
      nearest = option.scale;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function isMobilePlatform(player) {
  try {
    return player?.clientSystemInfo?.platformType === "Mobile";
  } catch {
    return false;
  }
}

function getSettingsSection(settings, key) {
  const section = settings?.[key];
  return section && typeof section === "object" ? section : settings;
}

function normalizeMainSettings(settings = {}, player) {
  const main = getSettingsSection(settings, "main");
  const mobilePlatform = isMobilePlatform(player);
  const legacyMobileLayout = typeof main.mobileLayout === "boolean"
    ? main.mobileLayout
    : undefined;

  return {
    enabled: main.enabled !== false,
    updateIntervalTicks: clampNumber(
      main.updateIntervalTicks,
      CORE_LIMITS.minUpdateIntervalTicks,
      CORE_LIMITS.maxUpdateIntervalTicks,
      DEFAULT_CORE_SETTINGS.main.updateIntervalTicks,
    ),
    maxDistance: clampNumber(
      main.maxDistance,
      CORE_LIMITS.minMaxDistance,
      CORE_LIMITS.maxMaxDistance,
      DEFAULT_CORE_SETTINGS.main.maxDistance,
    ),
    panelStyleId: clampNumber(
      main.panelStyleId,
      CORE_LIMITS.minPanelStyleId,
      CORE_LIMITS.maxPanelStyleId,
      DEFAULT_CORE_SETTINGS.main.panelStyleId,
    ),
    fontScale: getNearestFontScale(main.fontScale),
    mainhandDurability: main.mainhandDurability !== false,
    offhandDurability: main.offhandDurability !== false,
    armorDurability: main.armorDurability !== false,
    wailaMobileLayout: typeof main.wailaMobileLayout === "boolean"
      ? main.wailaMobileLayout
      : legacyMobileLayout ?? mobilePlatform,
    durabilityMobileLayout: typeof main.durabilityMobileLayout === "boolean"
      ? main.durabilityMobileLayout
      : legacyMobileLayout ?? mobilePlatform,
  };
}

function normalizeBlockSettings(settings = {}) {
  const block = getSettingsSection(settings, "block");

  return {
    energyContainers: block.energyContainers === true,
    fluidContainers: block.fluidContainers === true,
    gasContainers: block.gasContainers === true,
    overclockLevel: block.overclockLevel === true,
    blockRender: block.blockRender !== false,
    preferredTool: block.preferredTool === true,
    toolTier: block.toolTier === true,
    location: block.location === true,
    identifier: block.identifier === true,
    blockTags: block.blockTags === true,
    states: block.states === true,
    separators: block.separators !== false,
  };
}

function normalizeEntitySettings(settings = {}) {
  const entity = getSettingsSection(settings, "entity");
  const displayStyleIds = new Set(STAT_DISPLAY_STYLES.map((style) => style.id));
  const normalizeDisplayStyle = (value, fallback) =>
    displayStyleIds.has(value) ? value : fallback;

  return {
    entityRender: entity?.entityRender !== false,
    health: entity?.health !== false,
    maxHeartDisplayHealth: clampNumber(
      entity?.maxHeartDisplayHealth,
      CORE_LIMITS.minHeartDisplayHealth,
      CORE_LIMITS.maxHeartDisplayHealth,
      DEFAULT_CORE_SETTINGS.entity.maxHeartDisplayHealth,
    ),
    effectHearts: entity?.effectHearts !== false,
    tamedHearts: typeof entity?.tamedHearts === "boolean"
      ? entity.tamedHearts
      : entity?.animalHearts !== false,
    absorption: entity?.absorption !== false,
    hunger: entity?.hunger !== false,
    saturation: entity?.saturation !== false,
    armor: entity?.armor !== false,
    air: entity?.air !== false,
    attackDamage: typeof entity?.attackDamage === "boolean"
      ? entity.attackDamage
      : entity?.attributes !== false,
    movementSpeed: entity?.movementSpeed === true,
    effects: entity?.effects !== false,
    maxVisibleEffects: clampNumber(
      entity?.maxVisibleEffects,
      CORE_LIMITS.minVisibleEffects,
      CORE_LIMITS.maxVisibleEffects,
      DEFAULT_CORE_SETTINGS.entity.maxVisibleEffects,
    ),
    hostile: entity?.hostile === true,
    specialInfo: entity?.specialInfo === true,
    identifier: entity?.identifier === true,
    typeFamilies: entity?.typeFamilies === true,
    tags: entity?.tags === true,
    properties: entity?.properties === true,
    separators: entity?.separators !== false,
    healthDisplayStyle: normalizeDisplayStyle(
      entity?.healthDisplayStyle,
      DEFAULT_CORE_SETTINGS.entity.healthDisplayStyle,
    ),
    hungerDisplayStyle: normalizeDisplayStyle(
      entity?.hungerDisplayStyle,
      DEFAULT_CORE_SETTINGS.entity.hungerDisplayStyle,
    ),
    armorAirDisplayStyle: normalizeDisplayStyle(
      entity?.armorAirDisplayStyle,
      DEFAULT_CORE_SETTINGS.entity.armorAirDisplayStyle,
    ),
    effectsDisplayStyle: normalizeDisplayStyle(
      entity?.effectsDisplayStyle,
      DEFAULT_CORE_SETTINGS.entity.effectsDisplayStyle,
    ),
    attributesDisplayStyle: normalizeDisplayStyle(
      entity?.attributesDisplayStyle,
      DEFAULT_CORE_SETTINGS.entity.attributesDisplayStyle,
    ),
  };
}

/**
 * @param {Partial<CoreSettings> | Record<string, unknown>} [settings]
 * @returns {CoreSettings}
 */
function normalizeSettings(settings = {}, player) {
  return {
    main: normalizeMainSettings(settings, player),
    block: normalizeBlockSettings(settings),
    entity: normalizeEntitySettings(settings),
  };
}

function getPlayerSettingsCacheKey(player) {
  if (!player) {
    return undefined;
  }

  return String(player.id || player.name || "");
}

function readStoredSettings(source, player) {
  try {
    const raw = source?.getDynamicProperty?.(CORE_SETTINGS_DYNAMIC_PROPERTY);
    if (typeof raw === "string" && raw.length) {
      return normalizeSettings(JSON.parse(raw), player);
    }
  } catch {
    // Use defaults when the property is missing or malformed.
  }

  return undefined;
}

/**
 * @param {import("@minecraft/server").Player} [player]
 * @returns {CoreSettings}
 */
function loadSettings(player) {
  return readStoredSettings(player, player) ??
    readStoredSettings(world, player) ??
    normalizeSettings({}, player);
}

/**
 * @param {import("@minecraft/server").Player | undefined} player
 * @param {Partial<CoreSettings> | Record<string, unknown>} settings
 * @returns {CoreSettings}
 */
function saveSettings(player, settings) {
  const normalized = normalizeSettings(settings, player);

  try {
    const target = player ?? world;
    target.setDynamicProperty(
      CORE_SETTINGS_DYNAMIC_PROPERTY,
      JSON.stringify(normalized),
    );
  } catch {
    // Runtime settings still work in memory if persistence is unavailable.
  }

  const cacheKey = getPlayerSettingsCacheKey(player);
  if (cacheKey) {
    playerSettingsCache.set(cacheKey, normalized);
  }

  return normalized;
}

/**
 * @param {import("@minecraft/server").Player} [player]
 * @returns {CoreSettings}
 */
export function getCoreSettings(player) {
  const cacheKey = getPlayerSettingsCacheKey(player);
  if (!cacheKey) {
    return loadSettings(player);
  }

  if (!playerSettingsCache.has(cacheKey)) {
    playerSettingsCache.set(cacheKey, loadSettings(player));
  }

  return playerSettingsCache.get(cacheKey);
}

/**
 * @param {import("@minecraft/server").Player} player
 * @param {Partial<CoreSettings> | Record<string, unknown>} settings
 * @returns {CoreSettings}
 */
export function setCoreSettings(player, settings) {
  if (!settings) {
    settings = player;
    player = undefined;
  }

  const current = getCoreSettings(player);
  const hasSections = Boolean(
    settings?.main || settings?.block || settings?.entity,
  );

  if (!hasSections) {
    return saveSettings(player, {
      main: {
        ...current.main,
        ...settings,
      },
      block: {
        ...current.block,
        ...settings,
      },
      entity: current.entity,
    });
  }

  return saveSettings(player, {
    main: {
      ...current.main,
      ...settings?.main,
    },
    block: {
      ...current.block,
      ...settings?.block,
    },
    entity: {
      ...current.entity,
      ...settings?.entity,
    },
  });
}

/** @param {MainSettings} mainSettings */
function buildStyleTextureField(mainSettings) {
  const style = PANEL_STYLES[mainSettings.panelStyleId] ?? PANEL_STYLES[0];
  return style.texture
    .slice(0, WAILA_STYLE_TEXTURE_FIELD_LENGTH)
    .padEnd(WAILA_STYLE_TEXTURE_FIELD_LENGTH, "~");
}

/** @param {MainSettings} mainSettings */
function buildFontScaleField(mainSettings) {
  const scale = getNearestFontScale(mainSettings.fontScale);
  const encodedScale = Math.round(scale * 100);
  return String(encodedScale)
    .slice(0, WAILA_FONT_SCALE_FIELD_LENGTH)
    .padEnd(WAILA_FONT_SCALE_FIELD_LENGTH, "~");
}

/** @param {MainSettings} mainSettings */
function buildLayoutField(mainSettings) {
  return (mainSettings.wailaMobileLayout ? "m" : "d")
    .slice(0, WAILA_LAYOUT_FIELD_LENGTH)
    .padEnd(WAILA_LAYOUT_FIELD_LENGTH, "d");
}

function normalizeRawtextParts(parts) {
  if (!Array.isArray(parts)) {
    return [];
  }

  return parts.filter((part) => {
    if (!part || typeof part !== "object") {
      return false;
    }

    return typeof part.text === "string" || typeof part.translate === "string";
  });
}

/**
 * @param {Array<object>} parts
 * @param {MainSettings} mainSettings
 */
function buildWailaRawMessage(parts, mainSettings, meta = "default:") {
  const rawtext = normalizeRawtextParts(parts);

  if (!rawtext.length) {
    return {
      rawtext: [{ text: CHANNEL_WAILA }],
    };
  }

  const metaField = String(meta || "default:")
    .slice(0, WAILA_META_FIELD_LENGTH)
    .padEnd(WAILA_META_FIELD_LENGTH, "~");

  return {
    rawtext: [
      {
        text: `${CHANNEL_WAILA}${buildStyleTextureField(mainSettings)}${
          buildFontScaleField(mainSettings)
        }${buildLayoutField(mainSettings)}${metaField}`,
      },
      ...rawtext,
    ],
  };
}

function buildWailaPayload(title, subtitleText = "") {
  return {
    title,
    subtitleText: String(subtitleText || ""),
  };
}

function getSafeBlockRenderAux(block, blockSettings) {
  if (!blockSettings.blockRender) {
    return 0;
  }

  try {
    return getBlockRenderAux(block) || 0;
  } catch {
    return 0;
  }
}

/** @param {CoreSettings} settings */
function composeTargetMessage(player, settings) {
  const target = resolvePlayerTarget(player, settings.main);

  if (target.kind === TargetKinds.Entity) {
    const entityTarget = composeEntityTarget(target.entity, settings.entity);
    const shouldRenderEntity = settings.entity.entityRender &&
      entityTarget.canRender;
    const renderMeta = shouldRenderEntity
      ? `entity:${entityTarget.renderHeightClass}:${entityTarget.entityId}`
      : "default:";
    return buildWailaPayload(
      buildWailaRawMessage(
        entityTarget.rawtext,
        settings.main,
        renderMeta,
      ),
      shouldRenderEntity ? entityTarget.entityId : "",
    );
  }

  if (target.kind === TargetKinds.Block) {
    const renderAux = getSafeBlockRenderAux(target.block, settings.block);
    return buildWailaPayload(
      buildWailaRawMessage(
        buildBlockLabel(target.block, settings.block),
        settings.main,
        renderAux ? `block:${renderAux}` : "default:",
      ),
    );
  }

  return buildWailaPayload({ rawtext: [{ text: EMPTY_WAILA_TEXT }] });
}

function sendWailaMessage(player, payload) {
  const title = payload?.title ?? payload;
  const subtitleText = payload?.subtitleText ?? "";

  try {
    const rawtext = normalizeRawtextParts(title?.rawtext);
    if (rawtext.length === 1 && rawtext[0]?.text === EMPTY_WAILA_TEXT) {
      clearLatched(player, CHANNEL_WAILA);
      return;
    }

    sendLatchedPair(player, CHANNEL_WAILA, title, subtitleText);
  } catch {
    // Skip players that are not ready yet.
  }
}

function tickPlayers() {
  systemTick += 1;

  for (const player of world.getAllPlayers()) {
    try {
      const settings = getCoreSettings(player);
      if (
        !settings.main.enabled ||
        systemTick % settings.main.updateIntervalTicks !== 0
      ) {
        continue;
      }

      const targetPayload = composeTargetMessage(player, settings);
      sendWailaMessage(player, targetPayload);
      updateDurabilityIndicator(player, settings.main);
    } catch {
      sendWailaMessage(player, { rawtext: [{ text: EMPTY_WAILA_TEXT }] });
    }
  }
}

export function initializeGlobalPlayerInterval() {
  if (initialized) {
    return;
  }

  initialized = true;

  initializeTitleBus();
  initializeStatsCoreActivityHud();
  world.afterEvents.playerSpawn.subscribe((event) => {
    if (!event.initialSpawn) {
      return;
    }

    system.runTimeout(() => {
      try {
        updateDurabilityIndicator(
          event.player,
          getCoreSettings(event.player).main,
        );
      } catch {
        // Player UI may not be ready on the first spawn tick.
      }
    }, 20);
  });
  system.runInterval(tickPlayers, 1);
}
