import { system, world } from "@minecraft/server";
import { CHANNEL_STATSCORE_ACTIVITY } from "../const.js";
import { sendLatchedTitle } from "../titleBus.js";

const STATSCORE_ACTIVITY_EVENT = "insight:statscore_activity_v1";
const STATSCORE_INSIGHT_BRIDGE_PROPERTY = "utilitycraft:statscore_insight_bridge";
const PRIMARY_FIELD_LENGTH = 128;
const ATTRIBUTES_FIELD_LENGTH = 256;
const DEFAULT_DURATION_TICKS = 32;

const activeByPlayer = new Map();
const revisionsByPlayer = new Map();
let initialized = false;

function sanitizeText(value, maxLength) {
  return String(value ?? "")
    .replace(/[~\r\n]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function encodeActivity(primary, attributes, levelUps) {
  return `${sanitizeText(primary, PRIMARY_FIELD_LENGTH).padEnd(
    PRIMARY_FIELD_LENGTH,
    "~",
  )}${sanitizeText(attributes, ATTRIBUTES_FIELD_LENGTH).padEnd(
    ATTRIBUTES_FIELD_LENGTH,
    "~",
  )}${sanitizeText(levelUps, 256)}`;
}

function getPlayerById(playerId) {
  return world.getAllPlayers().find((player) => player.id === playerId);
}

function isStatsCoreInsightBridgeEnabled(player) {
  try {
    return player?.getDynamicProperty?.(STATSCORE_INSIGHT_BRIDGE_PROPERTY) === true;
  } catch {
    return false;
  }
}

function clearActivity(player) {
  activeByPlayer.delete(player.id);
  sendLatchedTitle(player, CHANNEL_STATSCORE_ACTIVITY, encodeActivity("", "", ""), {
    keepaliveTicks: 0,
  });
}

export function getStatsCoreInsightBridgeEnabled(player) {
  return isStatsCoreInsightBridgeEnabled(player);
}

export function setStatsCoreInsightBridgeEnabled(player, enabled) {
  if (!player) return false;
  try {
    player.setDynamicProperty?.(STATSCORE_INSIGHT_BRIDGE_PROPERTY, enabled === true);
    if (enabled !== true) clearActivity(player);
    return true;
  } catch {
    return false;
  }
}

function publishActivity(player, state) {
  const primary = [...state.primary].join(" §8| ");
  const attributes = [...state.attributes].join(" §8| ");
  const levelUps = [...state.levelUps].join(" §8| ");
  const payload = encodeActivity(primary, attributes, levelUps);
  const nextRevision = (revisionsByPlayer.get(player.id) ?? 0) + 1;
  revisionsByPlayer.set(player.id, nextRevision);

  sendLatchedTitle(player, CHANNEL_STATSCORE_ACTIVITY, payload, {
    keepaliveTicks: 0,
  });

  const duration = Math.max(8, Number(state.durationTicks) || DEFAULT_DURATION_TICKS);
  system.runTimeout(() => {
    if (revisionsByPlayer.get(player.id) !== nextRevision) return;
    clearActivity(player);
  }, duration);
}

function addIcons(target, values, maxLength = 96) {
  const entries = Array.isArray(values) ? values : [values];
  for (const entry of entries) {
    const text = sanitizeText(entry, maxLength);
    if (text) target.add(text);
  }
}

function queueActivity(player, activity) {
  const pending = activeByPlayer.get(player.id) ?? {
    player,
    primary: new Set(),
    attributes: new Set(),
    levelUps: new Set(),
    durationTicks: DEFAULT_DURATION_TICKS,
    scheduled: false,
  };

  pending.player = player;
  addIcons(pending.primary, activity?.primary, PRIMARY_FIELD_LENGTH);
  addIcons(pending.attributes, activity?.attributes);
  addIcons(pending.levelUps, activity?.levelUps);
  pending.durationTicks = Math.max(
    pending.durationTicks,
    Number(activity?.durationTicks) || DEFAULT_DURATION_TICKS,
  );
  activeByPlayer.set(player.id, pending);

  if (pending.scheduled) return;
  pending.scheduled = true;
  system.run(() => {
    const queued = activeByPlayer.get(player.id);
    if (!queued) return;
    queued.scheduled = false;
    publishActivity(player, queued);
  });
}

export function initializeStatsCoreActivityHud() {
  if (initialized) return;
  initialized = true;

  system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== STATSCORE_ACTIVITY_EVENT) return;

    try {
      const activity = JSON.parse(String(event.message ?? ""));
      const player = getPlayerById(String(activity?.playerId ?? ""));
      if (player && isStatsCoreInsightBridgeEnabled(player)) {
        queueActivity(player, activity);
      }
    } catch {
      // Ignore malformed or foreign activity events.
    }
  });

  world.afterEvents.playerLeave.subscribe((event) => {
    activeByPlayer.delete(event.playerId);
    revisionsByPlayer.delete(event.playerId);
  });
}
