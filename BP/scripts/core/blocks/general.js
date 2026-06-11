import {
  formatTypeIdToText,
  resolveNamespaceLabel,
  safeTranslateOrText,
  shouldShowNamespaceLine,
} from "../format.js";

function buildGeneralBlockLabel(block) {
  const typeId = String(block?.typeId || "").trim();
  const fallbackName = formatTypeIdToText(typeId || "minecraft:unknown");
  const localizationKey = typeof block?.localizationKey === "string"
    ? block.localizationKey.trim()
    : "";
  const name = safeTranslateOrText(localizationKey, fallbackName);
  const namespaceLabel = resolveNamespaceLabel(typeId);

  const rawtext = [
    { text: "§f" },
    name,
  ];

  if (shouldShowNamespaceLine(typeId)) {
    rawtext.push({ text: `\n§o§9@${namespaceLabel}§r` });
  }

  return rawtext;
}

export function buildBlockLabel(block) {
  return buildGeneralBlockLabel(block);
}
