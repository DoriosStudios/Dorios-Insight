export const MAX_WAILA_PREVIEW_ITEMS = 14;
const TECHNICAL_ITEM_TAG = "utilitycraft:ui_element";

function getContainer(target) {
  try {
    return target?.getComponent?.("minecraft:inventory")?.container;
  } catch {
    return undefined;
  }
}

function isTechnicalItem(itemStack) {
  try {
    return itemStack?.hasTag?.(TECHNICAL_ITEM_TAG) === true;
  } catch {
    return false;
  }
}

export function collectContainerPreview(target) {
  const container = getContainer(target);
  if (!container) return [];

  const items = [];
  let size = 0;
  try {
    size = Math.max(0, Number(container.size) || 0);
  } catch {
    return [];
  }

  for (let slot = 0; slot < size && items.length < MAX_WAILA_PREVIEW_ITEMS; slot += 1) {
    try {
      const itemStack = container.getItem(slot);
      if (!itemStack?.typeId || isTechnicalItem(itemStack)) continue;
      items.push({
        typeId: String(itemStack.typeId),
        amount: Math.max(1, Math.min(999, Math.floor(Number(itemStack.amount) || 1))),
      });
    } catch {
      // Skip inaccessible or transient slots.
    }
  }

  return items;
}
