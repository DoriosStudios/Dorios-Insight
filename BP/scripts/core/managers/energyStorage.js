import { world } from "@minecraft/server";

const ENERGY_OBJECTIVE_DEFINITIONS = [
  ["energy", "Energy"],
  ["energyExp", "EnergyExp"],
  ["energyCap", "Energy Max Capacity"],
  ["energyCapExp", "Energy Max Capacity Exp"],
];
const objectives = Object.create(null);

function getObjectiveScore(objectiveId, scoreId) {
  if (!scoreId) {
    return 0;
  }

  return objectives[objectiveId].getScore(scoreId) || 0;
}

export class EnergyStorage {
  constructor(entity) {
    EnergyStorage.initializeObjectives();
    this.entity = entity;
    this.scoreId = entity?.scoreboardIdentity;
    this.cap = this.getCap();
  }

  static combineValue(value, exp) {
    return (Number(value) || 0) * 10 ** (Number(exp) || 0);
  }

  static initializeObjectives() {
    for (const [id, displayName] of ENERGY_OBJECTIVE_DEFINITIONS) {
      objectives[id] = world.scoreboard.getObjective(id)
        ?? world.scoreboard.addObjective(id, displayName);
    }
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
    const { value, exp } = this.getCapNormalized();

    this.cap = EnergyStorage.combineValue(value, exp);
    return this.cap;
  }

  getCapNormalized() {
    return {
      value: getObjectiveScore("energyCap", this.scoreId),
      exp: getObjectiveScore("energyCapExp", this.scoreId),
    };
  }

  get() {
    const { value, exp } = this.getNormalized();

    return EnergyStorage.combineValue(value, exp);
  }

  getNormalized() {
    return {
      value: getObjectiveScore("energy", this.scoreId),
      exp: getObjectiveScore("energyExp", this.scoreId),
    };
  }
}
