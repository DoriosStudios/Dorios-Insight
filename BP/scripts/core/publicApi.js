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
    setNamespaceName,
    getNamespaceName,
    getNamespaceNames,
  });
}
