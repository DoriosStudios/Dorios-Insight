import { world } from "@minecraft/server";

const ENERGY_OBJECTIVES = {
  energy: "energy",
  energyExp: "energyExp",
  energyCap: "energyCap",
  energyCapExp: "energyCapExp",
};

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

export class EnergyStorage {
  constructor(entity) {
    this.entity = entity;
    this.scoreId = entity?.scoreboardIdentity;
    this.cap = this.getCap();
  }

  static combineValue(value, exp) {
    return (Number(value) || 0) * 10 ** (Number(exp) || 0);
  }

  static formatEnergyToText(value) {
    const safeValue = Math.max(0, Number(value) || 0);

    if (safeValue >= 1e15) return `${(safeValue / 1e15).toFixed(2)} PDE`;
    if (safeValue >= 1e12) return `${(safeValue / 1e12).toFixed(2)} TDE`;
    if (safeValue >= 1e9) return `${(safeValue / 1e9).toFixed(2)} GDE`;
    if (safeValue >= 1e6) return `${(safeValue / 1e6).toFixed(2)} MDE`;
    if (safeValue >= 1e3) return `${(safeValue / 1e3).toFixed(1)} kDE`;

    return `${Math.floor(safeValue)} DE`;
  }

  getCap() {
    const value = getObjectiveScore(ENERGY_OBJECTIVES.energyCap, this.scoreId);
    const exp = getObjectiveScore(ENERGY_OBJECTIVES.energyCapExp, this.scoreId);

    this.cap = EnergyStorage.combineValue(value, exp);
    return this.cap;
  }

  get() {
    const value = getObjectiveScore(ENERGY_OBJECTIVES.energy, this.scoreId);
    const exp = getObjectiveScore(ENERGY_OBJECTIVES.energyExp, this.scoreId);

    return EnergyStorage.combineValue(value, exp);
  }
}
