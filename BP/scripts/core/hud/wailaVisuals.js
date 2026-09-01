import { CHANNEL_WAILA_VISUALS } from "../const.js";
import { MAX_WAILA_PREVIEW_ITEMS } from "../containerPreview.js";
import {
  resolveFeedItemVisual,
  resolveItemVisual,
} from "../render/itemVisual.js";

export const VISUAL_HEADER_LENGTH = 8;
export const VISUAL_MODE_LENGTH = 1;
export const VISUAL_AUX_LENGTH = 10;
export const VISUAL_TEXTURE_LENGTH = 64;
export const VISUAL_AMOUNT_LENGTH = 3;
export const VISUAL_FEED_SLOT_LENGTH = VISUAL_MODE_LENGTH + VISUAL_TEXTURE_LENGTH;
export const VISUAL_INVENTORY_SLOT_LENGTH = VISUAL_MODE_LENGTH +
  VISUAL_AUX_LENGTH + VISUAL_TEXTURE_LENGTH + VISUAL_AMOUNT_LENGTH;
export const VISUAL_AUX_OFFSET = 1_000_000_000;
export const VISUAL_FEED_SLOTS = 28;
export const VISUAL_INVENTORY_SLOTS = MAX_WAILA_PREVIEW_ITEMS;

function encodeNumber(value, width, max = (10 ** width) - 1) {
  const number = Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
  return String(number).padStart(width, "0");
}

function encodeTexture(value) {
  return String(value || "").slice(0, VISUAL_TEXTURE_LENGTH).padEnd(VISUAL_TEXTURE_LENGTH, "~");
}

function encodeFeedVisual(entry) {
  return `${entry.visual.mode}${encodeTexture(entry.visual.texture)}`;
}

function encodeInventoryVisual(entry) {
  const visual = entry.visual;
  const encodedAux = encodeNumber(visual.aux + VISUAL_AUX_OFFSET, VISUAL_AUX_LENGTH);
  return `${visual.mode}${encodedAux}${encodeTexture(visual.texture)}${
    encodeNumber(entry.amount, VISUAL_AMOUNT_LENGTH)
  }`;
}

function visibleVisuals(entries, resolver) {
  return (entries ?? []).map((entry) => {
    const typeId = typeof entry === "string" ? entry : entry?.typeId;
    return {
      typeId,
      amount: typeof entry === "string" ? 1 : entry?.amount,
      visual: resolver(typeId),
    };
  }).filter((entry) => entry.visual.mode > 0);
}

function encodeSlots(entries, slotCount, slotLength, encoder) {
  const empty = "0".repeat(slotLength);
  const parts = [];
  for (let index = 0; index < slotCount; index += 1) {
    const entry = entries[index];
    parts.push(entry ? encoder(entry) : empty);
  }
  return parts.join("");
}

export function buildWailaVisualPayload(data = {}) {
  const feedItems = visibleVisuals(data.feedItems, resolveFeedItemVisual)
    .slice(0, VISUAL_FEED_SLOTS);
  const inventoryItems = visibleVisuals(data.inventoryItems, resolveItemVisual)
    .slice(0, VISUAL_INVENTORY_SLOTS);
  const feedTotal = Math.max(feedItems.length, Number(data.feedTotal) || feedItems.length);
  const inventoryTotal = Math.max(inventoryItems.length, Number(data.inventoryTotal) || inventoryItems.length);

  if (!feedItems.length && !inventoryItems.length) return CHANNEL_WAILA_VISUALS;

  const header = [
    encodeNumber(feedItems.length, 2),
    encodeNumber(inventoryItems.length, 2),
    encodeNumber(Math.max(0, feedTotal - feedItems.length), 2),
    encodeNumber(Math.max(0, inventoryTotal - inventoryItems.length), 2),
  ].join("");

  return `${CHANNEL_WAILA_VISUALS}${header}${
    encodeSlots(
      feedItems,
      VISUAL_FEED_SLOTS,
      VISUAL_FEED_SLOT_LENGTH,
      encodeFeedVisual,
    )
  }${encodeSlots(
    inventoryItems,
    VISUAL_INVENTORY_SLOTS,
    VISUAL_INVENTORY_SLOT_LENGTH,
    encodeInventoryVisual,
  )}`;
}
