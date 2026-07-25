import { world } from "@minecraft/server";

const EMPTY_GAS_TYPE = "empty";
const MAX_GASES_OBJECTIVE = "maxGases";
let maxGasesData;
const objectives = new Map();

function getObjectiveScore(objective, scoreId) {
  if (!scoreId) {
    return 0;
  }

  return objective.getScore(scoreId) || 0;
}

export class GasStorage {
  constructor(entity, index = 0) {
    GasStorage.initializeObjectives(index);
    this.entity = entity;
    this.index = index;
    this.scoreId = entity?.scoreboardIdentity;
    this.scores = {
      gas: objectives.get(`gas_${index}`),
      gasExp: objectives.get(`gasExp_${index}`),
      gasCap: objectives.get(`gasCap_${index}`),
      gasCapExp: objectives.get(`gasCapExp_${index}`),
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
    maxGasesData = world.scoreboard.getObjective(MAX_GASES_OBJECTIVE)
      ?? world.scoreboard.addObjective(MAX_GASES_OBJECTIVE, "Max Gases");

    const definitions = [
      [`gas_${index}`, `gas ${index}`],
      [`gasExp_${index}`, `gas Exp ${index}`],
      [`gasCap_${index}`, `gas Cap ${index}`],
      [`gasCapExp_${index}`, `gas Cap Exp ${index}`],
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

  static formatGas(value) {
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

  static getMaxGases(entity) {
    GasStorage.initializeObjectives();
    if (!entity) {
      return 1;
    }

    const score = getObjectiveScore(maxGasesData, entity.scoreboardIdentity);
    return score > 0 ? score : 1;
  }

  getCap() {
    const value = getObjectiveScore(this.scores.gasCap, this.scoreId);
    const exp = getObjectiveScore(this.scores.gasCapExp, this.scoreId);

    this.cap = GasStorage.combineValue(value, exp);
    return this.cap;
  }

  get() {
    const value = getObjectiveScore(this.scores.gas, this.scoreId);
    const exp = getObjectiveScore(this.scores.gasExp, this.scoreId);

    return GasStorage.combineValue(value, exp);
  }

  getType() {
    const prefix = `gas${this.index}Type:`;
    const tag = this.entity?.getTags?.().find((entry) => String(entry || "").startsWith(prefix));
    return tag ? String(tag).slice(prefix.length) : EMPTY_GAS_TYPE;
  }
}

export { EMPTY_GAS_TYPE };
