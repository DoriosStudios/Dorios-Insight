import { NAMESPACE_LABELS } from "./const.js";

const namespaceNames = new Map(
  Object.entries(NAMESPACE_LABELS).map(([namespace, name]) => [
    namespace.toLowerCase(),
    name,
  ]),
);

function normalizeNamespace(namespace) {
  const value = String(namespace ?? "").trim().toLowerCase();
  const separatorIndex = value.indexOf(":");
  const normalized = separatorIndex >= 0
    ? value.slice(0, separatorIndex)
    : value;

  return /^[a-z0-9_.-]+$/.test(normalized) ? normalized : "";
}

function normalizeNamespaceName(name) {
  return String(name ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
}

/**
 * Assigns a user-facing name to a content namespace.
 *
 * Addons should call this once during initialization. The registration is
 * intentionally runtime-only so the addon that owns the namespace remains
 * the source of truth on every world load.
 *
 * @param {string} namespace Namespace or namespaced identifier.
 * @param {string} name User-facing addon name.
 * @returns {{ namespace: string, name: string }|undefined}
 */
export function setNamespaceName(namespace, name) {
  const normalizedNamespace = normalizeNamespace(namespace);
  const normalizedName = normalizeNamespaceName(name);

  if (!normalizedNamespace || !normalizedName) {
    return undefined;
  }

  namespaceNames.set(normalizedNamespace, normalizedName);
  return {
    namespace: normalizedNamespace,
    name: normalizedName,
  };
}

/**
 * @param {string} namespace Namespace or namespaced identifier.
 * @returns {string|undefined}
 */
export function getNamespaceName(namespace) {
  const normalizedNamespace = normalizeNamespace(namespace);
  return normalizedNamespace
    ? namespaceNames.get(normalizedNamespace)
    : undefined;
}

export function getNamespaceNames() {
  return Object.fromEntries(namespaceNames);
}

