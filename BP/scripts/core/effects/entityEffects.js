import { getStoredInsightEntityEffects } from "./store.js";

/**
 * Reads the Insight-owned entity store populated by the versioned effects
 * script-event/API receiver. Dynamic properties cannot bridge behavior-pack
 * UUIDs, so the receiver store is deliberately the cross-pack authority.
 */
export function getInsightEntityEffects(entity) {
  return getStoredInsightEntityEffects(entity);
}
