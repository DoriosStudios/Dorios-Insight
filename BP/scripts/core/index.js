import { initializeGlobalPlayerInterval } from "./globalPlayerInterval.js";
import { initializeCoreMenu } from "./menu.js";
import { exposeInsightApi } from "./publicApi.js";

exposeInsightApi();
initializeGlobalPlayerInterval();
initializeCoreMenu();
