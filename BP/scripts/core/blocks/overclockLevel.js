function getMachineEntityAtBlockLocation(block) {
  const entities = block?.dimension?.getEntitiesAtBlockLocation?.(block.location);
  if (!Array.isArray(entities)) {
    return undefined;
  }

  return entities.find((entity) => {
    try {
      return entity.getComponent("minecraft:type_family")?.hasTypeFamily("dorios:machine");
    } catch {
      return false;
    }
  });
}

export function getOverclockLine(block) {
  if (!block?.hasTag?.("dorios:machine")) {
    return undefined;
  }

  const entity = getMachineEntityAtBlockLocation(block);
  if (!entity) {
    return undefined;
  }

  const level = Number(entity.getProperty("utilitycraft:overclock") ?? 0);

  return { text: `\n§fOverclock Level: ${level}§r` };
}
