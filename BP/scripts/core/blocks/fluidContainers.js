import { formatTypeIdToText } from "../format.js";
import { EMPTY_FLUID_TYPE, FluidStorage } from "../managers/fluidStorage.js";

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

export function getFluidLines(block) {
  if (!block?.hasTag?.("dorios:fluid")) {
    return [];
  }

  const entity = getEntityAtBlockLocation(block, "dorios:fluid_container");
  if (!entity) {
    return [];
  }

  const lines = [];
  const maxLiquids = FluidStorage.getMaxLiquids(entity);

  for (let index = 0; index < maxLiquids; index++) {
    const fluid = new FluidStorage(entity, index);
    const type = fluid.getType();
    const amount = fluid.get();
    const cap = fluid.getCap();

    if (type === EMPTY_FLUID_TYPE) {
      continue;
    }

    const name = formatTypeIdToText(type);
    const current = FluidStorage.formatFluid(amount);
    const max = FluidStorage.formatFluid(cap);

    lines.push({ text: `\n§f${name}: ${current} / ${max}§r` });
  }

  return lines;
}
