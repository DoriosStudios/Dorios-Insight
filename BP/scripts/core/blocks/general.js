import {
  formatTypeIdToText,
  normalizeHeaderText,
  resolveNamespaceLabel,
  safeTranslateOrText,
  shouldShowNamespaceLine,
} from "../format.js";

export function collectBlockGeneral(block) {
  const typeId = String(block?.typeId || "").trim();
  const fallbackName = formatTypeIdToText(typeId || "minecraft:unknown");
  const localizationKey = typeof block?.localizationKey === "string"
    ? block.localizationKey.trim()
    : "";

  return {
    typeId,
    headerText: normalizeHeaderText(fallbackName, "Block"),
    name: safeTranslateOrText(localizationKey, fallbackName),
    namespaceLabel: resolveNamespaceLabel(typeId),
    showNamespaceLine: shouldShowNamespaceLine(typeId),
  };
}

export function renderBlockGeneral(data) {
  if (!data) {
    return [];
  }

  const rawtext = [
    { text: "§f" },
    data.name,
  ];

  if (data.showNamespaceLine) {
    rawtext.push({ text: `\n§o§9@${data.namespaceLabel}§r` });
  }

  return rawtext;
}
