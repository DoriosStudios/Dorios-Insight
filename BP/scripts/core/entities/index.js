import { collectEntityGeneral, renderEntityGeneral } from "./general.js";

const HIDDEN_RENDER_ENTITY_TYPE_IDS = new Set([
  "minecraft:item",
]);

function shouldRenderEntity(entity) {
  return !HIDDEN_RENDER_ENTITY_TYPE_IDS.has(
    String(entity?.typeId || "").trim(),
  );
}

function getEntityRenderHeightClass(entity) {
  if (String(entity?.typeId || "").trim() === "minecraft:player") {
    return "p2";
  }

  try {
    const aabb = entity?.getAABB?.();
    const height = Number(aabb?.extent?.y) * 2;

    if (!Number.isFinite(height) || height <= 0) {
      return "h2";
    }

    return `h${Math.min(5, Math.max(1, Math.ceil(height)))}`;
  } catch {
    return "h2";
  }
}

export function composeEntityTarget(entity, settings) {
  const general = collectEntityGeneral(entity);

  return {
    typeId: general.typeId,
    entityId: String(entity?.id || ""),
    canRender: shouldRenderEntity(entity),
    renderHeightClass: getEntityRenderHeightClass(entity),
    headerText: general.headerText,
    rawtext: renderEntityGeneral(general, settings),
    currentHealth: general.health?.current ?? 0,
    maxHealth: general.health?.max ?? 0,
  };
}
