import { system, world } from "@minecraft/server";
import { sendQueuedActionbar } from "./actionbarQueue.js";
import { setNamespaceName } from "./namespaceRegistry.js";

const QUEUE_DISCOVER_EVENT = "insight:actionbar_queue_discover_v1";
const QUEUE_READY_EVENT = "insight:actionbar_queue_ready_v1";
const QUEUE_SEND_EVENT = "insight:actionbar_queue_send_v1";
const READY_HEARTBEAT_TICKS = 20;

const READY_PAYLOAD = JSON.stringify({
  version: 1,
  supportsSlots: true,
});

let initialized = false;

function announceReady() {
  try {
    system.sendScriptEvent(QUEUE_READY_EVENT, READY_PAYLOAD);
  } catch {
    // The scripting runtime may still be entering the world.
  }
}

function getPlayerById(playerId) {
  return world.getAllPlayers().find((player) => player.id === playerId);
}

function receiveQueueMessage(message) {
  const request = JSON.parse(String(message ?? ""));
  const player = getPlayerById(String(request?.playerId ?? ""));
  if (!player) {
    return;
  }

  if (request.namespaceName) {
    setNamespaceName(request.namespace, request.namespaceName);
  }

  sendQueuedActionbar(
    player,
    request.namespace,
    request.payload,
    request.options,
  );
}

export function initializeActionbarQueueBridge() {
  if (initialized) {
    return;
  }

  initialized = true;
  system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id === QUEUE_DISCOVER_EVENT) {
      announceReady();
      return;
    }

    if (event.id !== QUEUE_SEND_EVENT) {
      return;
    }

    try {
      receiveQueueMessage(event.message);
    } catch {
      // Ignore malformed or foreign queue requests.
    }
  });

  system.run(announceReady);
  system.runInterval(announceReady, READY_HEARTBEAT_TICKS);
}
