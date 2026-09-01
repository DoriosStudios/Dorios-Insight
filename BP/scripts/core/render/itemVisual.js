import { getItemRenderAux } from "./blockRender.js";
import { customItemTexturePaths } from "./generated/customItemTexturePaths.js";
import { vanillaFeedTexturePaths } from "./generated/vanillaFeedTexturePaths.js";

export function resolveFeedItemVisual(typeId) {
  const normalizedTypeId = String(typeId || "").trim();
  if (!normalizedTypeId) return { mode: 0, aux: 0, texture: "" };

  const texture = customItemTexturePaths[normalizedTypeId] ??
    vanillaFeedTexturePaths[normalizedTypeId];
  return texture?.startsWith("textures/items/")
    ? { mode: 2, aux: 0, texture }
    : { mode: 0, aux: 0, texture: "" };
}

export function resolveItemVisual(typeId) {
  const normalizedTypeId = String(typeId || "").trim();
  if (!normalizedTypeId) return { mode: 0, aux: 0, texture: "" };

  const texture = customItemTexturePaths[normalizedTypeId];
  if (texture) return { mode: 2, aux: 0, texture };

  const aux = getItemRenderAux(normalizedTypeId);
  return aux ? { mode: 1, aux, texture: "" } : { mode: 0, aux: 0, texture: "" };
}
