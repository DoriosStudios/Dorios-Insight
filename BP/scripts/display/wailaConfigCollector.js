/**
 * @module wailaConfigCollector
 * @description Sends layout/runtime configuration for the WAILA HUD panel.
 */

import * as uiQueue from "./uiQueue.js";
import {
    CHANNEL_WAILA_CONFIG,
    encodeWailaConfigData
} from "./uiChannels.js";

/**
 * Collect and send the WAILA configuration payload for a player.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {object} settings
 */
export function collectAndSendWailaConfig(player, settings) {
    const encoded = encodeWailaConfigData({
        wailaAnchor: settings?.wailaAnchorId ?? 0,
        wailaHorizontalOffset: settings?.wailaHorizontalOffsetId ?? 0,
        wailaVerticalOffset: settings?.wailaVerticalOffsetId ?? 0,
        wailaReserved1: 0,
        wailaReserved2: 0,
        wailaReserved3: 0,
        wailaShowEntityRender: settings?.wailaShowEntityRender ? 1 : 0,
        wailaReserved4: 0
    });

    uiQueue.send(player, CHANNEL_WAILA_CONFIG, encoded.slice(0, -CHANNEL_WAILA_CONFIG.length));
}
