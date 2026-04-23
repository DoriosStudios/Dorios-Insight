import { system, world } from "@minecraft/server";
import { InsightConfig, getCurrentModeLabel, syncPlayerAdministrativeAccess } from "./display/config.js";
import { initializeInsightCommands } from "./display/commands.js";
import { initializeDisplayController } from "./display/controller.js";

function synchronizeAdministrativeAccess(player) {
    try {
        syncPlayerAdministrativeAccess(player);
    } catch {
        // Ignore admin synchronization edge cases during startup/spawn.
    }
}

if (InsightConfig.system.showLoadMessage) {
    system.run(() => {
        try {
            world.sendMessage(InsightConfig.system.loadMessage);
        } catch {
            // Ignore runtime restrictions in edge startup scenarios.
        }
    });
}

initializeDisplayController();
initializeInsightCommands();

system.run(() => {
    for (const player of world.getAllPlayers()) {
        synchronizeAdministrativeAccess(player);
    }
});

world.afterEvents.playerSpawn.subscribe((event) => {
    if (!event.initialSpawn) {
        return;
    }

    system.run(() => {
        synchronizeAdministrativeAccess(event.player);

        if (!InsightConfig.system.showInitializationModeMessage) {
            return;
        }

        try {
            event.player.sendMessage(`${InsightConfig.display.initializedPrefix}${getCurrentModeLabel()} Mode`);
        } catch {
            // Ignore player spawn messaging errors.
        }
    });
});
