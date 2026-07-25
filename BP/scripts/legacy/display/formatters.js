export function toTitleWords(parts) {
    if (!parts || !parts.length) {
        return "Unknown";
    }

    return parts
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function splitTypeId(typeId) {
    if (!typeId || !typeId.includes(":")) {
        return {
            namespace: "minecraft",
            id: typeId || "unknown"
        };
    }

    const [namespace, id] = typeId.split(":");
    return { namespace, id };
}

export function formatNamespace(namespace, colorCode) {
    return `\n${colorCode}@${toTitleWords(namespace.split("_"))}§r`;
}

export function formatNamespaceLabel(label, colorCode) {
    if (!label) {
        return formatNamespace("unknown", colorCode);
    }

    return `\n${colorCode}@${label}§r`;
}

export function formatStateName(stateKey) {
    const pureKey = stateKey.includes(":") ? stateKey.split(":")[1] : stateKey;
    return toTitleWords(pureKey.split("_"));
}

export function toMessageText(value) {
    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }

    return `${value}`;
}

function removeRepeatedNamespacePrefix(id, namespace) {
    if (!id || !namespace) {
        return id;
    }

    const normalizedNamespace = namespace
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

    const candidates = [
        `${namespace}_`,
        `${namespace}.`,
        `${normalizedNamespace}_`,
        `${normalizedNamespace}.`
    ];

    const lowerId = id.toLowerCase();
    for (const candidate of candidates) {
        const lowerCandidate = candidate.toLowerCase();
        if (lowerId.startsWith(lowerCandidate) && id.length > candidate.length) {
            return id.slice(candidate.length);
        }
    }

    return id;
}

export function formatTypeIdToText(typeId) {
    const { namespace, id } = splitTypeId(typeId);
    const cleanedId = removeRepeatedNamespacePrefix(id, namespace);

    return toTitleWords(cleanedId.replace(/[.:]/g, "_").split("_"));
}
