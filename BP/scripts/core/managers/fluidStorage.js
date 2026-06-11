import { world } from "@minecraft/server";

const EMPTY_FLUID_TYPE = "empty";
const MAX_LIQUIDS_OBJECTIVE = "maxLiquids";

function getObjectiveScore(objectiveId, scoreId) {
  if (!scoreId) {
    return 0;
  }

  try {
    return world.scoreboard.getObjective(objectiveId)?.getScore(scoreId) || 0;
  } catch {
    return 0;
  }
}

export class FluidStorage {
  constructor(entity, index = 0) {
    this.entity = entity;
    this.index = index;
    this.scoreId = entity?.scoreboardIdentity;
    this.type = this.getType();
    this.cap = this.getCap();
  }

  static combineValue(value, exp) {
    return (Number(value) || 0) * 10 ** (Number(exp) || 0);
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
    if (!entity) {
      return 1;
    }

    const scoreId = entity.scoreboardIdentity;
    const score = getObjectiveScore(MAX_LIQUIDS_OBJECTIVE, scoreId);
    if (score > 0) {
      return score;
    }

    let taggedSlots = 0;
    for (const tag of entity.getTags?.() || []) {
      const match = String(tag || "").match(/^fluid(\d+)Type:/);
      if (!match) {
        continue;
      }

      const index = Number(match[1]);
      if (!Number.isNaN(index)) {
        taggedSlots = Math.max(taggedSlots, index + 1);
      }
    }

    return Math.max(1, taggedSlots);
  }

  getCap() {
    const value = getObjectiveScore(`fluidCap_${this.index}`, this.scoreId);
    const exp = getObjectiveScore(`fluidCapExp_${this.index}`, this.scoreId);

    this.cap = FluidStorage.combineValue(value, exp);
    return this.cap;
  }

  get() {
    const value = getObjectiveScore(`fluid_${this.index}`, this.scoreId);
    const exp = getObjectiveScore(`fluidExp_${this.index}`, this.scoreId);

    return FluidStorage.combineValue(value, exp);
  }

  getType() {
    const tag = this.entity?.getTags?.().find((entry) => String(entry || "").startsWith(`fluid${this.index}Type:`));
    return tag ? String(tag).slice(`fluid${this.index}Type:`.length) : EMPTY_FLUID_TYPE;
  }
}

export { EMPTY_FLUID_TYPE };
