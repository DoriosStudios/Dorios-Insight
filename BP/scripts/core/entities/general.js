import { formatTypeIdToText, normalizeHeaderText, resolveNamespaceLabel, safeTextValue } from "../format.js";

function getEntityHealth(entity) {
  try {
    const health = entity?.getComponent?.("minecraft:health");
    if (!health) {
      return undefined;
    }

    const current = Number(health.currentValue);
    const max = Number(health.effectiveMax ?? health.defaultValue ?? health.value);

    if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) {
      return undefined;
    }

    return {
      current: Math.max(0, Math.round(current * 10) / 10),
      max: Math.max(1, Math.round(max * 10) / 10),
    };
  } catch {
    return undefined;
  }
}

export function collectEntityGeneral(entity) {
  const typeId = String(entity?.typeId || "").trim();
  const fallbackName = formatTypeIdToText(typeId || "minecraft:unknown");
  const nameTag = normalizeHeaderText(entity?.nameTag, "");
  const headerText = nameTag || fallbackName;

  return {
    typeId,
    headerText: normalizeHeaderText(headerText, "Entity"),
    name: safeTextValue(nameTag || fallbackName, fallbackName),
    namespaceLabel: resolveNamespaceLabel(typeId),
    health: getEntityHealth(entity),
  };
}

export function renderEntityGeneral(data) {
  if (!data) {
    return [];
  }

  const lines = [`§f${data.name}`, `§o§9@${data.namespaceLabel}§r`];

  if (data.health) {
    lines.push(`§7Health: §c${data.health.current}§7/§c${data.health.max}§r`);
  }

  return lines;
}
