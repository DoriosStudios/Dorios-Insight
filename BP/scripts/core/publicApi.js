import {
  ACTIONBAR_QUEUE_LIFETIME_TICKS,
  clearQueuedActionbar,
  sendQueuedActionbar,
} from "./actionbarQueue.js";
import {
  getNamespaceName,
  getNamespaceNames,
  setNamespaceName,
} from "./namespaceRegistry.js";
import {
  CUSTOM_EFFECTS_MAX_VISIBLE,
  clearCustomEffects,
  removeCustomEffect,
  replaceCustomEffects,
  upsertCustomEffect,
} from "./effects/titleHandler.js";
import { getStoredInsightEntityEffects } from "./effects/store.js";
import {
  clearManaHudData,
  publishManaHudData,
} from "./hud/manaProvider.js";

export function exposeInsightApi() {
  globalThis.DoriosAPI ??= {};
  globalThis.DoriosAPI.insight ??= {};

  Object.assign(globalThis.DoriosAPI.insight, {
    actionbarQueue: {
      lifetimeTicks: ACTIONBAR_QUEUE_LIFETIME_TICKS,
      supportsSlots: true,
      send: sendQueuedActionbar,
      clear: clearQueuedActionbar,
    },
    effects: {
      version: 2,
      entityScoped: true,
      maxVisibleEffects: CUSTOM_EFFECTS_MAX_VISIBLE,
      getActive: getStoredInsightEntityEffects,
      upsert: upsertCustomEffect,
      remove: removeCustomEffect,
      replace: replaceCustomEffects,
      clear: clearCustomEffects,
    },
    manaHud: {
      version: 1,
      publish: publishManaHudData,
      clear: clearManaHudData,
    },
    setNamespaceName,
    getNamespaceName,
    getNamespaceNames,
  });

  // Keep the first draft's API name working while integrations migrate.
  globalThis.DoriosAPI.insight.customEffects =
    globalThis.DoriosAPI.insight.effects;
}
