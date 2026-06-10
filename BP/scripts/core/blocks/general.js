import { formatTypeIdToText, normalizeHeaderText, resolveNamespaceLabel, safeTextValue } from "../format.js";

export function collectBlockGeneral(block) {
  const typeId = String(block?.typeId || "").trim();
  const fallbackName = formatTypeIdToText(typeId || "minecraft:unknown");

  return {
    typeId,
    headerText: normalizeHeaderText(fallbackName, "Block"),
    name: safeTextValue(fallbackName, fallbackName),
    namespaceLabel: resolveNamespaceLabel(typeId),
  };
}

export function renderBlockGeneral(data) {
  if (!data) {
    return [];
  }

  return [`§f${data.name}`, `§o§9@${data.namespaceLabel}§r`];
}
