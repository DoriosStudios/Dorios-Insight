import { EnergyStorage } from "../managers/energyStorage.js";

function getEntityAtBlockLocation(block, family) {
  const entities = block?.dimension?.getEntitiesAtBlockLocation?.(block.location);
  if (!Array.isArray(entities)) {
    return undefined;
  }

  return entities.find((entity) => {
    try {
      const typeFamily = entity.getComponent("minecraft:type_family");
      return typeFamily?.hasTypeFamily(family[0]) || typeFamily?.hasTypeFamily(family[1]);
    } catch {
      return false;
    }
  });
}

export function getEnergyLine(block) {
  if (!block?.hasTag?.("dorios:energy")) {
    return undefined;
  }

  const entity = getEntityAtBlockLocation(block, ["dorios:energy_container", "dorios:energy_source"]);
  if (!entity) {
    return undefined;
  }

  const energy = new EnergyStorage(entity);
  const current = EnergyStorage.formatEnergyToText(energy.get());
  const max = EnergyStorage.formatEnergyToText(energy.cap);

  return { text: `\n§fEnergy: ${current} / ${max}§r` };
}
