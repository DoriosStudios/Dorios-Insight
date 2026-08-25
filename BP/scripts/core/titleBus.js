import { system, world } from "@minecraft/server";

const TITLE_OPTIONS = {
    fadeInDuration: 0,
    stayDuration: 100,
    fadeOutDuration: 0
};

const KEEPALIVE_TICKS = 40;

const pendingByPlayer = new Map();
const lastByPlayer = new Map();
let initialized = false;

function ensurePlayer(playerId) {
    if (!pendingByPlayer.has(playerId)) {
        pendingByPlayer.set(playerId, []);
    }
    if (!lastByPlayer.has(playerId)) {
        lastByPlayer.set(playerId, new Map());
    }
}

function normalizeTitle(namespace, payload) {
    if (payload && typeof payload === "object") {
        return payload;
    }

    const text = String(payload ?? "");
    return text.startsWith(namespace) ? text : `${namespace}${text}`;
}

function titleKey(title) {
    return typeof title === "string" ? title : JSON.stringify(title);
}

function subtitleKey(subtitle) {
    if (subtitle === undefined) {
        return "";
    }

    return typeof subtitle === "string" ? subtitle : JSON.stringify(subtitle);
}

function enqueue(player, namespace, title, subtitle) {
    const playerId = player.id;
    ensurePlayer(playerId);

    const queue = pendingByPlayer.get(playerId);
    const existingIndex = queue.findIndex((entry) => entry.namespace === namespace);
    const entry = { player, namespace, title, subtitle };

    if (existingIndex >= 0) {
        queue[existingIndex] = entry;
        return;
    }

    queue.push(entry);
}

export function sendLatchedTitle(player, namespace, payload, options = {}) {
    sendLatchedPair(player, namespace, normalizeTitle(namespace, payload), undefined, options);
}

export function sendLatchedPair(player, namespace, title, subtitle, options = {}) {
    if (!player?.id || !namespace) {
        return;
    }

    ensurePlayer(player.id);

    const now = system.currentTick;
    const lastForPlayer = lastByPlayer.get(player.id);
    const nextTitleKey = titleKey(title);
    const nextSubtitleKey = subtitleKey(subtitle);
    const last = lastForPlayer.get(namespace);
    const keepaliveTicks = Number(options.keepaliveTicks ?? KEEPALIVE_TICKS);

    if (
        last
        && last.titleKey === nextTitleKey
        && last.subtitleKey === nextSubtitleKey
        && now - last.tick < keepaliveTicks
    ) {
        return;
    }

    enqueue(player, namespace, title, subtitle);
}

export function clearLatched(player, namespace) {
    sendLatchedPair(player, namespace, namespace, "");
}

export function clearTitleBusPlayer(playerId) {
    pendingByPlayer.delete(playerId);
    lastByPlayer.delete(playerId);
}

export function initializeTitleBus() {
    if (initialized) {
        return;
    }

    initialized = true;

    system.runInterval(() => {
        for (const player of world.getAllPlayers()) {
            const queue = pendingByPlayer.get(player.id);
            if (!queue?.length) {
                continue;
            }

            const entry = queue.shift();
            /** @type {import("@minecraft/server").TitleDisplayOptions} */
            const options = { ...TITLE_OPTIONS };
            if (entry.subtitle !== undefined) {
                options.subtitle = entry.subtitle ?? "";
            }

            try {
                entry.player.onScreenDisplay.setTitle(entry.title, options);
                lastByPlayer.get(entry.player.id)?.set(entry.namespace, {
                    titleKey: titleKey(entry.title),
                    subtitleKey: subtitleKey(entry.subtitle),
                    tick: system.currentTick
                });
            } catch {
                // UI may not be available on this tick. Keep the frame queued;
                // it must not be treated as delivered until setTitle succeeds.
                enqueue(
                    entry.player,
                    entry.namespace,
                    entry.title,
                    entry.subtitle
                );
            }
        }
    }, 1);

    world.afterEvents.playerLeave.subscribe((event) => {
        clearTitleBusPlayer(event.playerId);
    });
}
