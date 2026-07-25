import { world } from "@minecraft/server";

const EMPTY_FLUID_TYPE = "empty";
const MAX_LIQUIDS_OBJECTIVE = "maxLiquids";
let maxLiquidsData;
const objectives = new Map();

function getObjectiveScore(objective, scoreId) {
  if (!scoreId) {
    return 0;
  }

  return objective.getScore(scoreId) || 0;
}

export class FluidStorage {
  constructor(entity, index = 0) {
    FluidStorage.initializeObjectives(index);
    this.entity = entity;
    this.index = index;
    this.scoreId = entity?.scoreboardIdentity;
    this.scores = {
      fluid: objectives.get(`fluid_${index}`),
      fluidExp: objectives.get(`fluidExp_${index}`),
      fluidCap: objectives.get(`fluidCap_${index}`),
      fluidCapExp: objectives.get(`fluidCapExp_${index}`),
    };
    this.type = this.getType();
    this.cap = this.getCap();
  }

  static combineValue(value, exp) {
    return (Number(value) || 0) * 10 ** (Number(exp) || 0);
  }

  static normalizeValue(amount) {
    let exp = 0;
    let value = Math.max(0, Number(amount) || 0);

    while (value > 1e9) {
      value /= 1000;
      exp += 3;
    }

    return { value: Math.floor(value), exp };
  }

  static initializeObjectives(index = 0) {
    maxLiquidsData = world.scoreboard.getObjective(MAX_LIQUIDS_OBJECTIVE)
      ?? world.scoreboard.addObjective(MAX_LIQUIDS_OBJECTIVE, "Max Liquids");

    const definitions = [
      [`fluid_${index}`, `fluid ${index}`],
      [`fluidExp_${index}`, `fluid Exp ${index}`],
      [`fluidCap_${index}`, `fluid Cap ${index}`],
      [`fluidCapExp_${index}`, `fluid Cap Exp ${index}`],
    ];

    for (const [id, displayName] of definitions) {
      if (!objectives.has(id)) {
        objectives.set(
          id,
          world.scoreboard.getObjective(id)
            ?? world.scoreboard.addObjective(id, displayName),
        );
      }
    }
  }

  static formatFluid(value) {
    const safeValue = Math.max(0, Number(value) || 0);

    if (safeValue >= 1e21) return `${(safeValue / 1e21).toFixed(2)} EB`;
    if (safeValue >= 1e18) return `${(safeValue / 1e18).toFixed(2)} PB`;
    if (safeValue >= 1e15) return `${(safeValue / 1e15).toFixed(2)} TB`;
    if (safeValue >= 1e12) return `${(safeValue / 1e12).toFixed(2)} GB`;
    if (safeValue >= 1e9) return `${(safeValue / 1e9).toFixed(2)} MB`;
    if (safeValue >= 1e6) return `${(safeValue / 1e6).toFixed(2)} KB`;
    if (safeValue >= 1e3) return `${(safeValue / 1e3).toFixed(1)} B`;

    return `${Math.floor(safeValue)} mB`;
  }

  static getMaxLiquids(entity) {
    FluidStorage.initializeObjectives();
    if (!entity) {
      return 1;
    }

    const score = getObjectiveScore(maxLiquidsData, entity.scoreboardIdentity);
    return score > 0 ? score : 1;
  }

  getCap() {
    const value = getObjectiveScore(this.scores.fluidCap, this.scoreId);
    const exp = getObjectiveScore(this.scores.fluidCapExp, this.scoreId);

    this.cap = FluidStorage.combineValue(value, exp);
    return this.cap;
  }

  get() {
    const value = getObjectiveScore(this.scores.fluid, this.scoreId);
    const exp = getObjectiveScore(this.scores.fluidExp, this.scoreId);

    return FluidStorage.combineValue(value, exp);
  }

  getType() {
    const tag = this.entity?.getTags?.().find((entry) => String(entry || "").startsWith(`fluid${this.index}Type:`));
    return tag ? String(tag).slice(`fluid${this.index}Type:`.length) : EMPTY_FLUID_TYPE;
  }
}

export { EMPTY_FLUID_TYPE };
