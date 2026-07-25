import { formatTypeIdToText } from "../format.js";
import { EMPTY_GAS_TYPE, GasStorage } from "../managers/gasStorage.js";

function getEntityAtBlockLocation(block, family) {
  const entities = block?.dimension?.getEntitiesAtBlockLocation?.(block.location);
  if (!Array.isArray(entities)) {
    return undefined;
  }

  return entities.find((entity) => {
    try {
      return entity.getComponent("minecraft:type_family")?.hasTypeFamily(family);
    } catch {
      return false;
    }
  });
}

export function getGasLines(block) {
  if (!block?.hasTag?.("dorios:gas")) {
    return [];
  }

  const entity = getEntityAtBlockLocation(block, "dorios:gas_container");
  if (!entity) {
    return [];
  }

  const lines = [];
  const maxGases = GasStorage.getMaxGases(entity);

  for (let index = 0; index < maxGases; index++) {
    const gas = new GasStorage(entity, index);
    const type = gas.getType();
    const amount = gas.get();
    const cap = gas.getCap();

    if (type === EMPTY_GAS_TYPE) {
      continue;
    }

    const name = formatTypeIdToText(type);
    const current = GasStorage.formatGas(amount);
    const max = GasStorage.formatGas(cap);

    lines.push({ text: `\nÂ§fGas (${name}): ${current} / ${max}Â§r` });
  }

  return lines;
}
