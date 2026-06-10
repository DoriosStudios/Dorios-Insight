import { system, world } from "@minecraft/server";
import { InsightConfig, getCurrentModeLabel } from "./display/config.js";
import { initializeInsightCommands } from "./display/commands.js";
import { initializeDisplayController } from "./display/controller.js";

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

world.afterEvents.playerSpawn.subscribe((event) => {
    if (!InsightConfig.system.showInitializationModeMessage || !event.initialSpawn) {
        return;
    }

    system.run(() => {
        try {
            event.player.sendMessage(`${InsightConfig.display.initializedPrefix}${getCurrentModeLabel()} Mode`);
        } catch {
            // Ignore player spawn messaging errors.
        }
    });
});
