import { NAMESPACE_LABELS } from "./const.js";

export function splitTypeId(typeId) {
    const raw = String(typeId || "").trim();
    const separatorIndex = raw.indexOf(":");

    if (separatorIndex === -1) {
        return {
            namespace: "minecraft",
            id: raw
        };
    }

    return {
        namespace: raw.slice(0, separatorIndex) || "minecraft",
        id: raw.slice(separatorIndex + 1)
    };
}

export function toTitleWords(value) {
    const source = Array.isArray(value)
        ? value.join("_")
        : String(value || "");

    return source
        .replace(/[:.]/g, "_")
        .split("_")
        .filter((part) => part.length > 0)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function formatTypeIdToText(typeId) {
    const { id } = splitTypeId(typeId);
    return toTitleWords(id || typeId || "Unknown");
}

export function resolveNamespaceLabel(typeId) {
    const { namespace } = splitTypeId(typeId);
    return NAMESPACE_LABELS[namespace] || toTitleWords(namespace);
}

export function normalizeHeaderText(value, fallback = "Unknown") {
    const normalized = String(value ?? "")
        .replace(/[\r\n\t]+/g, " ")
        .trim();

    return normalized.length ? normalized : fallback;
}

export function safeTranslateOrText(localizationKey, fallbackText) {
    const key = String(localizationKey || "").trim();
    if (key.length) {
        return { translate: key };
    }

    return { text: normalizeHeaderText(fallbackText) };
}

export function safeTextValue(value, fallback = "Unknown") {
    if (typeof value === "string") {
        return normalizeHeaderText(value, fallback);
    }

    if (value?.text) {
        return normalizeHeaderText(value.text, fallback);
    }

    return normalizeHeaderText(fallback, "Unknown");
}
