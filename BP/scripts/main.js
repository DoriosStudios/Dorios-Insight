import * as DoriosLib from "./DoriosLib/index.js";
import {
  INSIGHT_DEPENDENCY_OPTIONS,
  INSIGHT_METADATA,
} from "./metadata.js";
import "./core/index.js";

DoriosLib.dependencies.initialize(
  INSIGHT_METADATA,
  INSIGHT_DEPENDENCY_OPTIONS,
);
DoriosLib.registry.install();
