var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\metadata.js
var INSIGHT_METADATA = {
  name: "Dorios' Insight",
  author: "Dorios Studios",
  identifier: "dorios_insight",
  version: "1.2.0",
  dependencies: {}
};
var INSIGHT_DEPENDENCY_OPTIONS = {
  validationDelayTicks: 300,
  announceSuccess: true
};

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\dependencies\index.js
var dependencies_exports = {};
__export(dependencies_exports, {
  SCRIPT_EVENT_ID: () => SCRIPT_EVENT_ID,
  compareVersions: () => compareVersions,
  formatReport: () => formatReport,
  get: () => get,
  getAll: () => getAll,
  initialize: () => initialize,
  report: () => report,
  validate: () => validate
});
import { system, world } from "@minecraft/server";
var SCRIPT_EVENT_ID = "dorios:dependency_checker";
var registry = /* @__PURE__ */ new Map();
var localAddons = /* @__PURE__ */ new Map();
var listenersInstalled = false;
function initialize(metadata, options = {}) {
  validateMetadata(metadata);
  installListeners();
  const snapshot = cloneMetadata(metadata);
  registry.set(snapshot.identifier, snapshot);
  localAddons.set(snapshot.identifier, { metadata: snapshot, options });
  return () => {
    localAddons.delete(snapshot.identifier);
  };
}
function get(identifier) {
  const metadata = registry.get(identifier);
  return metadata ? cloneMetadata(metadata) : void 0;
}
function getAll() {
  return [...registry.values()].map(cloneMetadata);
}
function validate(metadata, available = registry) {
  const missing = [];
  const outdated = [];
  for (const [identifier, requirement] of Object.entries(metadata.dependencies ?? {})) {
    const installed = available.get(identifier);
    const baseIssue = {
      identifier,
      name: requirement.name ?? installed?.name ?? identifier,
      required: requirement.version,
      warning: requirement.warning
    };
    if (!installed) {
      missing.push({ ...baseIssue, found: void 0 });
      continue;
    }
    if (requirement.version && compareVersions(installed.version, requirement.version) < 0) {
      outdated.push({ ...baseIssue, found: installed.version });
    }
  }
  return { ok: missing.length === 0 && outdated.length === 0, missing, outdated };
}
function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  const length = Math.max(a.core.length, b.core.length);
  for (let index = 0; index < length; index++) {
    const aPart = a.core[index] ?? 0;
    const bPart = b.core[index] ?? 0;
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  if (a.prerelease.length === 0 && b.prerelease.length > 0) return 1;
  if (a.prerelease.length > 0 && b.prerelease.length === 0) return -1;
  const prereleaseLength = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < prereleaseLength; index++) {
    const aPart = a.prerelease[index];
    const bPart = b.prerelease[index];
    if (aPart === void 0) return -1;
    if (bPart === void 0) return 1;
    if (aPart === bPart) continue;
    const aNumber = /^\d+$/.test(aPart) ? Number(aPart) : void 0;
    const bNumber = /^\d+$/.test(bPart) ? Number(bPart) : void 0;
    if (aNumber !== void 0 && bNumber !== void 0) return aNumber < bNumber ? -1 : 1;
    if (aNumber !== void 0) return -1;
    if (bNumber !== void 0) return 1;
    return aPart < bPart ? -1 : 1;
  }
  return 0;
}
function formatReport(addon, result) {
  if (result.ok) return `\xA7a${addon.name} initialized correctly!\xA7r`;
  const lines = ["\xA7e[ Warning! ]", `\xA77${addon.name} has dependency problems.\xA7r`];
  if (result.missing.length > 0) {
    lines.push("\xA7cMissing:\xA7r");
    for (const issue of result.missing) appendIssue(lines, issue);
  }
  if (result.outdated.length > 0) {
    lines.push("\xA7eOutdated:\xA7r");
    for (const issue of result.outdated) appendIssue(lines, issue);
  }
  return lines.join("\n");
}
function report(addon, result, options = {}) {
  if (result.ok && !options.announceSuccess) return;
  world.sendMessage(formatReport(addon, result));
}
function installListeners() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  system.afterEvents.scriptEventReceive.subscribe(({ id, message }) => {
    if (id !== SCRIPT_EVENT_ID) return;
    try {
      const metadata = (
        /** @type {AddonMetadata} */
        JSON.parse(message)
      );
      validateMetadata(metadata);
      registry.set(metadata.identifier, cloneMetadata(metadata));
    } catch (error) {
      console.warn("[DoriosLib:dependencies] Ignored invalid dependency metadata", error);
    }
  });
  world.afterEvents.worldLoad.subscribe(() => {
    for (const { metadata, options } of localAddons.values()) {
      system.sendScriptEvent(SCRIPT_EVENT_ID, JSON.stringify(metadata));
      system.runTimeout(() => {
        const result = validate(metadata);
        if (options.onResult) options.onResult(result, cloneMetadata(metadata));
        else report(metadata, result, { announceSuccess: options.announceSuccess });
      }, options.validationDelayTicks ?? 300);
    }
  });
}
function validateMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") throw new TypeError("Addon metadata is required");
  if (!metadata.name || typeof metadata.name !== "string") throw new TypeError("Addon name is required");
  if (!metadata.identifier || typeof metadata.identifier !== "string") {
    throw new TypeError("Addon identifier is required");
  }
  if (!metadata.version || typeof metadata.version !== "string") throw new TypeError("Addon version is required");
}
function cloneMetadata(metadata) {
  return {
    ...metadata,
    dependencies: metadata.dependencies ? Object.fromEntries(Object.entries(metadata.dependencies).map(([id, value]) => [id, { ...value }])) : void 0
  };
}
function appendIssue(lines, issue) {
  lines.push(`- \xA7e${issue.name}\xA7r`);
  if (issue.required) lines.push(`  \xA77Requires: \xA7e${issue.required}\xA7r`);
  lines.push(`  \xA77Found: \xA7c${issue.found ?? "None"}\xA7r`);
  if (issue.warning) lines.push(`  \xA77${issue.warning}\xA7r`);
}
function parseVersion(value) {
  const normalized = String(value).trim().replace(/^v/i, "").split("+")[0];
  const [coreRaw, prereleaseRaw = ""] = normalized.split("-", 2);
  const core = coreRaw.split(".").map((part) => {
    if (!/^\d+$/.test(part)) throw new TypeError(`Invalid version: ${value}`);
    return Number(part);
  });
  return { core, prerelease: prereleaseRaw ? prereleaseRaw.split(".") : [] };
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\block\index.js
import { BlockTypes } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\constants\index.js
import {
  CommandPermissionLevel,
  CustomCommandParamType,
  EquipmentSlot
} from "@minecraft/server";
var PERMISSION_LEVELS = {
  any: CommandPermissionLevel.Any,
  gamedirector: CommandPermissionLevel.GameDirectors,
  gameDirectors: CommandPermissionLevel.GameDirectors,
  admin: CommandPermissionLevel.Admin,
  host: CommandPermissionLevel.Host,
  owner: CommandPermissionLevel.Owner
};
var COMMAND_PARAMETER_TYPES = {
  string: CustomCommandParamType.String,
  int: CustomCommandParamType.Integer,
  integer: CustomCommandParamType.Integer,
  float: CustomCommandParamType.Float,
  bool: CustomCommandParamType.Boolean,
  boolean: CustomCommandParamType.Boolean,
  enum: CustomCommandParamType.Enum,
  block: CustomCommandParamType.BlockType,
  item: CustomCommandParamType.ItemType,
  location: CustomCommandParamType.Location,
  entity: CustomCommandParamType.EntitySelector,
  target: CustomCommandParamType.EntitySelector,
  entityType: CustomCommandParamType.EntityType,
  player: CustomCommandParamType.PlayerSelector
};
var EQUIPMENT_SLOTS = Object.values(EquipmentSlot);

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\containers\index.js
import {
  BlockComponentTypes,
  EntityComponentTypes,
  ItemStack,
  system as system3,
  world as world3
} from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\linkNodes\io.js
import { system as system2, world as world2 } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\containers\constants.js
var SCRIPT_EVENT_NAMESPACE = "dorios_container";
var SET_CONFIG_EVENT_ID = `${SCRIPT_EVENT_NAMESPACE}:set_config`;

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\linkNodes\io.js
var LINK_NODE_IO_EVENT_NAMESPACE = "dorios_link_node";
var SET_LINK_NODE_IO_EVENT_ID = `${LINK_NODE_IO_EVENT_NAMESPACE}:set_io`;

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\entity\index.js
import { EntityComponentTypes as EntityComponentTypes2, EquipmentSlot as EquipmentSlot2, ItemStack as ItemStack3 } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\item\index.js
import { ItemStack as ItemStack2, ItemTypes } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\item\durability.js
import { ItemComponentTypes } from "@minecraft/server";
function getComponent(item) {
  return (
    /** @type {ItemDurabilityComponent|undefined} */
    item?.getComponent(ItemComponentTypes.Durability)
  );
}
function getInfo(item) {
  const durability = getComponent(item);
  if (!durability) return void 0;
  const remaining = Math.max(0, durability.maxDurability - durability.damage);
  return {
    damage: durability.damage,
    max: durability.maxDurability,
    remaining,
    percentage: durability.maxDurability <= 0 ? 0 : Math.round(remaining / durability.maxDurability * 1e4) / 100
  };
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\entity\index.js
var EQUIPMENT_SLOTS2 = new Set(Object.values(EquipmentSlot2));

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\math\index.js
function integerToRoman(value) {
  if (!Number.isInteger(value) || value <= 0 || value >= 4e3) return "";
  const numerals = [
    [1e3, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"]
  ];
  let remaining = value;
  let result = "";
  for (const [amount, numeral] of numerals) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\messages\index.js
import { system as system4, world as world4 } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\player\index.js
import { GameMode } from "@minecraft/server";
function isCreative(player) {
  return player.getGameMode() === GameMode.Creative;
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\registry\index.js
var registry_exports = {};
__export(registry_exports, {
  COMMAND_PARAMETER_TYPES: () => COMMAND_PARAMETER_TYPES,
  PARAMETER_TYPES: () => PARAMETER_TYPES,
  PERMISSION_LEVELS: () => PERMISSION_LEVELS,
  REGISTRATION_EVENT_IDS: () => REGISTRATION_EVENT_IDS,
  blockComponent: () => blockComponent,
  createRegistrar: () => createRegistrar,
  customCommand: () => customCommand,
  install: () => install,
  itemComponent: () => itemComponent,
  registerAutoFisherDrop: () => registerAutoFisherDrop,
  registerBonsai: () => registerBonsai,
  registerCoolant: () => registerCoolant,
  registerCrafterRecipe: () => registerCrafterRecipe,
  registerCrusherRecipe: () => registerCrusherRecipe,
  registerFluidHolder: () => registerFluidHolder,
  registerFluidItem: () => registerFluidItem,
  registerFuel: () => registerFuel,
  registerFurnaceRecipe: () => registerFurnaceRecipe,
  registerGasHolder: () => registerGasHolder,
  registerGasItem: () => registerGasItem,
  registerInfuserRecipe: () => registerInfuserRecipe,
  registerItemDuctChest: () => registerItemDuctChest,
  registerItemDuctCompatibility: () => registerItemDuctCompatibility,
  registerMachineUpgrade: () => registerMachineUpgrade,
  registerMelterRecipe: () => registerMelterRecipe,
  registerPlant: () => registerPlant,
  registerPressRecipe: () => registerPressRecipe,
  registerSieveDrop: () => registerSieveDrop,
  registerSpecialContainerSlots: () => registerSpecialContainerSlots,
  unregisterItemDuctCompatibility: () => unregisterItemDuctCompatibility
});
import {
  CommandPermissionLevel as CommandPermissionLevel2,
  CustomCommandParamType as CustomCommandParamType2,
  system as system5,
  world as world5
} from "@minecraft/server";
var PARAMETER_TYPES = COMMAND_PARAMETER_TYPES;
var REGISTRATION_EVENT_IDS = Object.freeze({
  AUTO_FISHER_DROP: "utilitycraft:register_autofisher_drop",
  BONSAI: "utilitycraft:register_bonsai",
  COOLANT: "utilitycraft:register_coolant",
  CRAFTER_RECIPE: "utilitycraft:register_crafter_recipe",
  CRUSHER_RECIPE: "utilitycraft:register_crusher_recipe",
  FLUID_HOLDER: "utilitycraft:register_fluid_holder",
  FLUID_ITEM: "utilitycraft:register_fluid_item",
  FUEL: "utilitycraft:register_fuel",
  FURNACE_RECIPE: "utilitycraft:register_furnace_recipe",
  GAS_HOLDER: "utilitycraft:register_gas_holder",
  GAS_ITEM: "utilitycraft:register_gas_item",
  INFUSER_RECIPE: "utilitycraft:register_infuser_recipe",
  ITEM_DUCT_REGISTER: "item_ducts:register",
  ITEM_DUCT_UNREGISTER: "item_ducts:unregister",
  MELTER_RECIPE: "utilitycraft:register_melter_recipe",
  MACHINE_UPGRADE: "utilitycraft:register_machine_upgrade",
  PLANT: "utilitycraft:register_plant",
  PRESS_RECIPE: "utilitycraft:register_press_recipe",
  SIEVE_DROP: "utilitycraft:register_sieve_drop",
  SPECIAL_CONTAINER_SLOTS: "utilitycraft:register_special_container_slots"
});
function registerAutoFisherDrop(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.AUTO_FISHER_DROP, payload);
}
function registerBonsai(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.BONSAI, payload);
}
function registerCoolant(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.COOLANT, payload);
}
function registerCrafterRecipe(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.CRAFTER_RECIPE, payload);
}
function registerCrusherRecipe(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.CRUSHER_RECIPE, payload);
}
function registerFluidHolder(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.FLUID_HOLDER, payload);
}
function registerFluidItem(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.FLUID_ITEM, payload);
}
function registerFuel(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.FUEL, payload);
}
function registerFurnaceRecipe(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.FURNACE_RECIPE, payload);
}
function registerGasHolder(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.GAS_HOLDER, payload);
}
function registerGasItem(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.GAS_ITEM, payload);
}
function registerInfuserRecipe(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.INFUSER_RECIPE, payload);
}
function registerItemDuctCompatibility(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.ITEM_DUCT_REGISTER, payload);
}
function registerItemDuctChest(typeId) {
  assertTypeId(typeId);
  enqueueRegistration(REGISTRATION_EVENT_IDS.ITEM_DUCT_REGISTER, {
    typeId,
    mode: "chest"
  });
}
function unregisterItemDuctCompatibility(typeId) {
  assertTypeId(typeId);
  enqueueRegistrationMessage(REGISTRATION_EVENT_IDS.ITEM_DUCT_UNREGISTER, typeId);
}
function registerMelterRecipe(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.MELTER_RECIPE, payload);
}
function registerMachineUpgrade(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.MACHINE_UPGRADE, payload);
}
function registerPlant(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.PLANT, payload);
}
function registerPressRecipe(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.PRESS_RECIPE, payload);
}
function registerSieveDrop(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.SIEVE_DROP, payload);
}
function registerSpecialContainerSlots(payload) {
  enqueueRegistration(REGISTRATION_EVENT_IDS.SPECIAL_CONTAINER_SLOTS, payload);
}
var registrationQueue = [];
var registrationDispatchEnabled = false;
var registrationDispatchScheduled = false;
world5.afterEvents.worldLoad.subscribe(() => {
  registrationDispatchEnabled = true;
  scheduleNextRegistration();
});
function enqueueRegistration(eventId, payload) {
  if (payload === null || typeof payload !== "object") {
    throw new TypeError(`Registration payload for ${eventId} must be an object`);
  }
  const message = JSON.stringify(payload);
  if (typeof message !== "string") {
    throw new TypeError(`Registration payload for ${eventId} must be JSON serializable`);
  }
  enqueueRegistrationMessage(eventId, message);
}
function enqueueRegistrationMessage(eventId, message) {
  registrationQueue.push({ eventId, message });
  scheduleNextRegistration();
}
function assertTypeId(typeId) {
  if (typeof typeId !== "string" || typeId.length === 0 || !typeId.includes(":")) {
    throw new TypeError(`A fully qualified block typeId is required: ${typeId}`);
  }
}
function scheduleNextRegistration() {
  if (!registrationDispatchEnabled || registrationDispatchScheduled || registrationQueue.length === 0) return;
  registrationDispatchScheduled = true;
  system5.run(() => {
    const registration = registrationQueue.shift();
    try {
      if (registration) system5.sendScriptEvent(registration.eventId, registration.message);
    } catch (error) {
      console.warn(`[DoriosLib:registry] Failed to dispatch ${registration?.eventId}:`, error);
    } finally {
      registrationDispatchScheduled = false;
      scheduleNextRegistration();
    }
  });
}
var sharedRegistrars = /* @__PURE__ */ new Map();
var sharedRegistryInstalled = false;
function createRegistrar(options) {
  const normalized = typeof options === "string" ? { namespace: options } : options;
  const namespace = validateNamespace(normalized.namespace);
  const onError = normalized.onError ?? defaultErrorHandler;
  const blocks = [];
  const items = [];
  const commands = [];
  let installed = false;
  const registrar = {
    block(id, handlers) {
      assertMutable(installed);
      blocks.push({ id: qualify(namespace, id), handlers });
      return registrar;
    },
    item(id, handlers) {
      assertMutable(installed);
      items.push({ id: qualify(namespace, id), handlers });
      return registrar;
    },
    command(definition) {
      assertMutable(installed);
      if (!definition || typeof definition.callback !== "function") {
        throw new TypeError("A command callback is required");
      }
      commands.push({ ...definition, name: qualify(namespace, definition.name) });
      return registrar;
    },
    install() {
      if (installed) return false;
      installed = true;
      system5.beforeEvents.startup.subscribe((event) => {
        for (const { id, handlers } of blocks) {
          event.blockComponentRegistry.registerCustomComponent(id, handlers);
        }
        for (const { id, handlers } of items) {
          event.itemComponentRegistry.registerCustomComponent(id, handlers);
        }
        for (const command of commands) {
          installCommand(event.customCommandRegistry, command, namespace, onError);
        }
      });
      return true;
    },
    isInstalled() {
      return installed;
    }
  };
  return registrar;
}
function blockComponent(id, handlers) {
  assertSharedMutable();
  const namespace = getIdentifierNamespace(id);
  getSharedRegistrar(namespace).block(id, handlers);
}
function itemComponent(id, handlers) {
  assertSharedMutable();
  const namespace = getIdentifierNamespace(id);
  getSharedRegistrar(namespace).item(id, handlers);
}
function customCommand(definition) {
  assertSharedMutable();
  const namespace = getIdentifierNamespace(definition?.name);
  getSharedRegistrar(namespace).command(definition);
}
function install() {
  if (sharedRegistryInstalled) return false;
  sharedRegistryInstalled = true;
  for (const registrar of sharedRegistrars.values()) registrar.install();
  return true;
}
function getSharedRegistrar(namespace) {
  let registrar = sharedRegistrars.get(namespace);
  if (!registrar) {
    registrar = createRegistrar(namespace);
    sharedRegistrars.set(namespace, registrar);
  }
  return registrar;
}
function getIdentifierNamespace(id) {
  const separator = typeof id === "string" ? id.indexOf(":") : -1;
  if (separator <= 0 || separator === id.length - 1) {
    throw new TypeError(`A fully qualified identifier is required: ${id}`);
  }
  return validateNamespace(id.slice(0, separator));
}
function assertSharedMutable() {
  if (sharedRegistryInstalled) {
    throw new Error("Cannot add definitions after DoriosLib.registry.install()");
  }
}
function installCommand(registry2, command, namespace, onError) {
  const mandatoryParameters = [];
  const optionalParameters = [];
  for (const parameter of command.parameters ?? []) {
    const target = parameter.optional ? optionalParameters : mandatoryParameters;
    if (parameter.type === "enum") {
      if (!Array.isArray(parameter.values) || parameter.values.length === 0) {
        throw new TypeError(`Enum parameter ${parameter.name} requires values`);
      }
      const enumName = `${namespace}:${localName(command.name)}_${parameter.name}`;
      registry2.registerEnum(enumName, parameter.values);
      target.push({ name: enumName, type: CustomCommandParamType2.Enum });
      continue;
    }
    const type = PARAMETER_TYPES[parameter.type];
    if (!type) throw new RangeError(`Unknown command parameter type: ${parameter.type}`);
    target.push({ name: parameter.name, type });
  }
  const permissionLevel = typeof command.permissionLevel === "number" ? command.permissionLevel : PERMISSION_LEVELS[command.permissionLevel ?? "any"];
  const definition = {
    name: command.name,
    description: command.description ?? "",
    permissionLevel,
    cheatsRequired: command.cheatsRequired ?? false,
    ...mandatoryParameters.length > 0 ? { mandatoryParameters } : {},
    ...optionalParameters.length > 0 ? { optionalParameters } : {}
  };
  registry2.registerCommand(definition, (origin, ...args) => {
    system5.run(() => {
      try {
        command.callback(origin, ...args);
      } catch (error) {
        onError(error, `command:${command.name}`);
      }
    });
  });
}
function validateNamespace(namespace) {
  if (!/^[a-z0-9_.-]+$/.test(namespace)) {
    throw new TypeError(`Invalid namespace: ${namespace}`);
  }
  return namespace;
}
function qualify(namespace, id) {
  if (!id || typeof id !== "string") throw new TypeError("A non-empty identifier is required");
  if (!id.includes(":")) return `${namespace}:${id}`;
  if (!id.startsWith(`${namespace}:`)) {
    throw new RangeError(`Identifier ${id} does not belong to namespace ${namespace}`);
  }
  return id;
}
function localName(id) {
  return id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
}
function assertMutable(installed) {
  if (installed) throw new Error("Cannot add definitions after registrar.install()");
}
function defaultErrorHandler(error, context) {
  console.warn(`[DoriosLib:${context}]`, error);
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\time\index.js
import { system as system6 } from "@minecraft/server";
var TICKS_PER_SECOND = 20;
var TICKS = {
  second: TICKS_PER_SECOND,
  minute: TICKS_PER_SECOND * 60,
  hour: TICKS_PER_SECOND * 60 * 60,
  day: TICKS_PER_SECOND * 60 * 60 * 24
};

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\DoriosLib\index.js
initialize(INSIGHT_METADATA, INSIGHT_DEPENDENCY_OPTIONS);

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display.js
import { system as system13, world as world13 } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\config.js
import { world as world6 } from "@minecraft/server";
var WORLD_MODE_DYNAMIC_PROPERTY = "insight:mode";
var WORLD_ENABLED_DYNAMIC_PROPERTY = "insight:enabled";
var WORLD_ADMIN_ONLY_DYNAMIC_PROPERTY = "insight:admin_only";
var WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY = "insight:admin_source_id";
var WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY = "insight:admin_source_name";
var PLAYER_SETTINGS_DYNAMIC_PROPERTY = "insight:player_settings";
var memoryFallback = {
  mode: "essential",
  enabled: true,
  adminOnly: false,
  adminSourceId: "",
  adminSourceName: "",
  playerSettings: /* @__PURE__ */ new Map()
};
var InsightModes = Object.freeze({
  Essential: "essential",
  Detailed: "detailed",
  Debug: "debug"
});
var VisibilityPolicies = Object.freeze({
  Show: "show",
  ShowWhenSneaking: "sneak",
  CreativeOnly: "creative",
  SneakingAndCreative: "sneak_creative",
  Hide: "hide"
});
var VisibilityPolicyLabels = Object.freeze([
  Object.freeze({ key: VisibilityPolicies.Show, label: "Show / Mostrar" }),
  Object.freeze({ key: VisibilityPolicies.ShowWhenSneaking, label: "Show When Sneaking / Mostrar Agachado" }),
  Object.freeze({ key: VisibilityPolicies.CreativeOnly, label: "Creative Only / Apenas Criativo" }),
  Object.freeze({ key: VisibilityPolicies.SneakingAndCreative, label: "Sneaking + Creative / Agachado + Criativo" }),
  Object.freeze({ key: VisibilityPolicies.Hide, label: "Hide / Ocultar" })
]);
var EffectDisplayModes = Object.freeze({
  Emoji: "emoji",
  Text: "text"
});
var EffectDisplayModeLabels = Object.freeze([
  Object.freeze({ key: EffectDisplayModes.Emoji, label: "Emoji" }),
  Object.freeze({ key: EffectDisplayModes.Text, label: "Text" })
]);
var DisplayStyles = Object.freeze({
  Icon: "icon",
  IconValue: "icon_value",
  Text: "text",
  // Legacy alias, normalized to text_full.
  TextFull: "text_full",
  TextPercent: "text_percent",
  HybridFull: "hybrid_full",
  HybridPercent: "hybrid_percent"
});
var DisplayStyleLabels = Object.freeze([
  Object.freeze({ key: DisplayStyles.Icon, label: "Icon" }),
  Object.freeze({ key: DisplayStyles.IconValue, label: "Icon + Value (\u2764\uFE0F x/y)" }),
  Object.freeze({ key: DisplayStyles.TextFull, label: "Text Type 1 (Health: x/y)" }),
  Object.freeze({ key: DisplayStyles.TextPercent, label: "Text Type 2 (Health: x%)" }),
  Object.freeze({ key: DisplayStyles.HybridFull, label: "Hybrid Type 1 (\u2764\uFE0F x/y)" }),
  Object.freeze({ key: DisplayStyles.HybridPercent, label: "Hybrid Type 2 (\u2764\uFE0F x%)" })
]);
var HudDisplayModes = Object.freeze({
  ShowInsight: "show_insight",
  Both: "both",
  ShowVanilla: "show_vanilla",
  None: "none"
});
var HudDisplayModeLabels = Object.freeze([
  Object.freeze({ key: HudDisplayModes.ShowInsight, label: "Show Insight" }),
  Object.freeze({ key: HudDisplayModes.Both, label: "Both" }),
  Object.freeze({ key: HudDisplayModes.ShowVanilla, label: "Show Vanilla" }),
  Object.freeze({ key: HudDisplayModes.None, label: "None" })
]);
var HudIndicatorModes = Object.freeze({
  Hidden: "hidden",
  IconAndIndicator: "icon_and_indicator"
});
var HudIndicatorModeLabels = Object.freeze([
  Object.freeze({ key: HudIndicatorModes.Hidden, label: "Hidden" }),
  Object.freeze({ key: HudIndicatorModes.IconAndIndicator, label: "Icon + Indicator" })
]);
var HudElementPositionModes = Object.freeze({
  Center: "center",
  TopRight: "top_right",
  MiddleRight: "middle_right",
  BottomRight: "bottom_right",
  BottomLeft: "bottom_left"
});
var HudElementPositionModeLabels = Object.freeze([
  Object.freeze({ key: HudElementPositionModes.Center, label: "Center (Default) / Centro (Padr\xE3o)" }),
  Object.freeze({ key: HudElementPositionModes.TopRight, label: "Top Right / Superior Direito" }),
  Object.freeze({ key: HudElementPositionModes.MiddleRight, label: "Middle Right / Meio Direito" }),
  Object.freeze({ key: HudElementPositionModes.BottomRight, label: "Bottom Right / Inferior Direito" }),
  Object.freeze({ key: HudElementPositionModes.BottomLeft, label: "Bottom Left / Inferior Esquerdo" })
]);
var HudInventoryDisplayModes = Object.freeze({
  Full: "full",
  HotbarOnly: "hotbar_only",
  InventoryOnly: "inventory_only"
});
var HudInventoryDisplayModeLabels = Object.freeze([
  Object.freeze({ key: HudInventoryDisplayModes.Full, label: "Full / Completo" }),
  Object.freeze({ key: HudInventoryDisplayModes.HotbarOnly, label: "Hotbar Only / Apenas Hotbar" }),
  Object.freeze({ key: HudInventoryDisplayModes.InventoryOnly, label: "Inventory Only / Apenas Invent\xE1rio" })
]);
var HudElementOrientationModes = Object.freeze({
  Horizontal: "horizontal",
  Vertical: "vertical"
});
var HudElementOrientationModeLabels = Object.freeze([
  Object.freeze({ key: HudElementOrientationModes.Horizontal, label: "Horizontal" }),
  Object.freeze({ key: HudElementOrientationModes.Vertical, label: "Vertical" })
]);
var WailaColorThemes = Object.freeze({
  Default: "default",
  Dark: "dark",
  Copper: "copper",
  Magenta: "magenta",
  Cyan: "cyan",
  Blood: "blood",
  Ascane: "ascane"
});
var WailaColorThemeLabels = Object.freeze([
  Object.freeze({ key: WailaColorThemes.Default, label: "Default (Dark Blue) / Padr\xE3o (Azul Escuro)" }),
  Object.freeze({ key: WailaColorThemes.Dark, label: "Dark / Escuro" }),
  Object.freeze({ key: WailaColorThemes.Copper, label: "Copper / Cobre" }),
  Object.freeze({ key: WailaColorThemes.Magenta, label: "Magenta" }),
  Object.freeze({ key: WailaColorThemes.Cyan, label: "Cyan / Ciano" }),
  Object.freeze({ key: WailaColorThemes.Blood, label: "Blood / Sangue" }),
  Object.freeze({ key: WailaColorThemes.Ascane, label: "Ascane" })
]);
var ModePresetSummaryModes = Object.freeze({
  Hidden: "hidden",
  Summary: "summary",
  SummaryAndChanged: "summary_and_changed",
  ChangedOnly: "changed_only"
});
var ModePresetSummaryModeLabels = Object.freeze([
  Object.freeze({ key: ModePresetSummaryModes.Hidden, label: "Hidden" }),
  Object.freeze({ key: ModePresetSummaryModes.Summary, label: "Show Enabled Summary" }),
  Object.freeze({ key: ModePresetSummaryModes.SummaryAndChanged, label: "Show Summary + Changed" }),
  Object.freeze({ key: ModePresetSummaryModes.ChangedOnly, label: "Show Changed Only" })
]);
var EntityNameDisplayModes = Object.freeze({
  NicknameFirst: "nickname_first",
  MobNameFirst: "mob_name_first",
  NicknameAfterMobName: "nickname_after_mob_name",
  MobNameAfterNickname: "mob_name_after_nickname",
  NicknameOnly: "nickname_only",
  MobNameOnly: "mob_name_only"
});
var EntityNameDisplayModeLabels = Object.freeze([
  Object.freeze({ key: EntityNameDisplayModes.NicknameFirst, label: "Nickname First" }),
  Object.freeze({ key: EntityNameDisplayModes.MobNameFirst, label: "Mob Name First" }),
  Object.freeze({ key: EntityNameDisplayModes.NicknameAfterMobName, label: "Nickname After Mob Name" }),
  Object.freeze({ key: EntityNameDisplayModes.MobNameAfterNickname, label: "Mob Name After Nickname" }),
  Object.freeze({ key: EntityNameDisplayModes.NicknameOnly, label: "Nickname Only" }),
  Object.freeze({ key: EntityNameDisplayModes.MobNameOnly, label: "Mob Name Only" })
]);
var EntityNameResolveModes = Object.freeze({
  TranslationKeys: "translation_keys",
  TypeIdToText: "typeid_text"
});
var EntityNameResolveModeLabels = Object.freeze([
  Object.freeze({ key: EntityNameResolveModes.TranslationKeys, label: "Translation Keys" }),
  Object.freeze({ key: EntityNameResolveModes.TypeIdToText, label: "Translate Id to Text" })
]);
var VillagerProfessionDisplayModes = Object.freeze({
  AfterName: "after_name",
  BelowName: "below_name",
  Hidden: "hidden"
});
var VillagerProfessionDisplayModeLabels = Object.freeze([
  Object.freeze({ key: VillagerProfessionDisplayModes.AfterName, label: "After Name" }),
  Object.freeze({ key: VillagerProfessionDisplayModes.BelowName, label: "Below Name" }),
  Object.freeze({ key: VillagerProfessionDisplayModes.Hidden, label: "Hidden" })
]);
var ToolTierIndicatorModes = Object.freeze({
  Hidden: "hidden",
  BooleanIndicator: "boolean_indicator",
  TierIndicatorColor: "tier_indicator_color",
  TierIndicatorOre: "tier_indicator_ore",
  TextIndicator: "text_indicator",
  IconAndIndicator: "icon_and_indicator"
});
var ToolTierIndicatorModeLabels = Object.freeze([
  Object.freeze({ key: ToolTierIndicatorModes.Hidden, label: "Hidden" }),
  Object.freeze({ key: ToolTierIndicatorModes.BooleanIndicator, label: "Boolean Indicator (Yes/No)" }),
  Object.freeze({ key: ToolTierIndicatorModes.TierIndicatorColor, label: "Tier Indicator (Color)" }),
  Object.freeze({ key: ToolTierIndicatorModes.TierIndicatorOre, label: "Tier Indicator (Ore)" }),
  Object.freeze({ key: ToolTierIndicatorModes.TextIndicator, label: "Text Indicator (Diamond)" }),
  Object.freeze({ key: ToolTierIndicatorModes.IconAndIndicator, label: "Tool Icons + Indicator" })
]);
var ToolIndicatorPlacementModes = Object.freeze({
  BeforeName: "before_name",
  AfterName: "after_name",
  BelowName: "below_name"
});
var ToolIndicatorPlacementModeLabels = Object.freeze([
  Object.freeze({ key: ToolIndicatorPlacementModes.BeforeName, label: "Before Name" }),
  Object.freeze({ key: ToolIndicatorPlacementModes.AfterName, label: "After Name" }),
  Object.freeze({ key: ToolIndicatorPlacementModes.BelowName, label: "Below Name" })
]);
var ToolIndicatorColorOptions = Object.freeze([
  Object.freeze({ key: "\xA77", label: "Gray (Default)" }),
  Object.freeze({ key: "\xA7f", label: "White" }),
  Object.freeze({ key: "\xA7e", label: "Yellow" }),
  Object.freeze({ key: "\xA7a", label: "Green" }),
  Object.freeze({ key: "\xA7b", label: "Aqua" }),
  Object.freeze({ key: "\xA79", label: "Blue" }),
  Object.freeze({ key: "\xA7d", label: "Light Purple" }),
  Object.freeze({ key: "\xA7c", label: "Red" })
]);
var InsightComponentDefinitions = Object.freeze([
  // All of these will eventually use localization keys, but for now the labels are hardcoded in English.
  Object.freeze({ key: "namespace", label: "Namespace Label" }),
  Object.freeze({ key: "customFields", label: "Custom Fields" }),
  Object.freeze({ key: "customEnergyInfo", label: "UtilityCraft: Energy Info" }),
  Object.freeze({ key: "customFluidInfo", label: "Custom: Fluid Info" }),
  Object.freeze({ key: "customGasInfo", label: "Custom: Gas Info" }),
  Object.freeze({ key: "customRotationInfo", label: "UtilityCraft: Rotation Info" }),
  Object.freeze({ key: "customMachineProgress", label: "UtilityCraft: Machine Progress" }),
  Object.freeze({ key: "customCobblestoneCount", label: "UtilityCraft: Cobblestone Count" }),
  Object.freeze({ key: "customVariantPreview", label: "Dorios' Atelier: Variant Preview" }),
  Object.freeze({ key: "blockStates", label: "Block States" }),
  Object.freeze({ key: "blockTags", label: "Block Tags" }),
  Object.freeze({ key: "health", label: "Entity Health" }),
  Object.freeze({ key: "absorption", label: "Absorption Hearts" }),
  Object.freeze({ key: "armor", label: "Player Armor" }),
  Object.freeze({ key: "hunger", label: "Player Hunger" }),
  Object.freeze({ key: "hungerEffect", label: "Hunger Effect Icons" }),
  Object.freeze({ key: "airBubbles", label: "Air Bubbles" }),
  Object.freeze({ key: "effects", label: "Status Effects" }),
  Object.freeze({ key: "effectHearts", label: "Status Heart Effects" }),
  Object.freeze({ key: "frozenHearts", label: "Frozen Hearts (Deprecated / Non-functional)" }),
  Object.freeze({ key: "animalHearts", label: "Rideable Hearts" }),
  Object.freeze({ key: "tameable", label: "Tameable Status" }),
  Object.freeze({ key: "tameFoods", label: "Tame Foods" }),
  Object.freeze({ key: "technical", label: "Technical Summary" }),
  Object.freeze({ key: "coordinates", label: "Coordinates" }),
  Object.freeze({ key: "typeId", label: "Type Identifier" }),
  Object.freeze({ key: "entityTags", label: "Entity Tags" }),
  Object.freeze({ key: "entityFamilies", label: "Entity Families" }),
  Object.freeze({ key: "velocity", label: "Entity Velocity" }),
  Object.freeze({ key: "namespaceResolution", label: "Namespace Resolution Debug" })
]);
var DeprecatedInsightComponents = Object.freeze(/* @__PURE__ */ new Set([
  "frozenHearts"
]));
function isInsightComponentDeprecated(componentKey) {
  return DeprecatedInsightComponents.has(String(componentKey || "").trim());
}
var InsightConfig = Object.freeze({
  system: {
    showLoadMessage: true,
    loadMessage: "\xA7a[Dorios' Insight]\xA7r loaded",
    showInitializationModeMessage: true,
    defaultMode: InsightModes.Essential,
    minMaxDistance: 3,
    maxMaxDistance: 24,
    minUpdateIntervalTicks: 1,
    maxUpdateIntervalTicks: 20,
    minUnchangedTargetRefreshTicks: 1,
    maxUnchangedTargetRefreshTicks: 40,
    minClearAfterNoTargetTicks: 0,
    maxClearAfterNoTargetTicks: 200,
    minLinkedEntityScanIntervalTicks: 1,
    maxLinkedEntityScanIntervalTicks: 200,
    minLinkedEntityScanMaxDistance: 0.5,
    maxLinkedEntityScanMaxDistance: 4,
    maxVisibleStatesCap: 20,
    maxVisibleTagsCap: 20,
    maxVisibleFamiliesCap: 20,
    maxVisibleEffectsCap: 20,
    maxLayoutColumns: 6,
    maxHeartsPerLine: 10,
    maxHeartDisplayHealth: 100,
    minMaxHeartDisplayHealth: 20,
    maxMaxHeartDisplayHealth: 500
  },
  display: {
    namespaceColor: "\xA79",
    technicalColor: "\xA77",
    tagsColor: "\xA78",
    separator: "\n----------",
    moreRowsLabel: "more rows...",
    moreTagsLabel: "more tags...",
    moreFamiliesLabel: "more families...",
    initializedPrefix: "\xA7aDorios' Insight Initialized on "
  },
  compatibility: {
    deduplicateActionbar: true,
    unchangedTargetRefreshTicks: 8,
    useEntityHitFallback: true
  },
  commands: {
    prefix: "!insight"
  },
  playerTags: {
    disabled: "insight:disable",
    sneakOnly: "insight:sneak_only",
    hideNamespace: "insight:hide_namespace",
    hideHealth: "insight:hide_health",
    technicalView: "insight:technical",
    blockTags: "insight:block_tags",
    hideBlockTags: "insight:hide_block_tags",
    namespaceDebug: "insight:namespace_debug"
  }
});
var InsightModePresets = Object.freeze({
  [InsightModes.Essential]: Object.freeze({
    label: "Essential",
    runtime: Object.freeze({
      maxDistance: 7,
      updateIntervalTicks: 3,
      unchangedTargetRefreshTicks: 8,
      includeLiquidBlocks: false,
      includeInvisibleEntities: true,
      clearAfterNoTargetTicks: 20,
      linkedEntityScanIntervalTicks: 20,
      linkedEntityScanMaxDistance: 1.35,
      ignoreMachineHelperEntities: true,
      maxVisibleStates: 3,
      maxVisibleBlockTags: 3,
      maxVisibleEntityTags: 0,
      maxVisibleEntityFamilies: 0,
      maxVisibleEffects: 3,
      maxHeartDisplayHealth: 100,
      effectDisplayMode: EffectDisplayModes.Emoji,
      displayStyle: DisplayStyles.Icon,
      healthDisplayStyle: DisplayStyles.Icon,
      hungerDisplayStyle: DisplayStyles.Icon,
      armorDisplayStyle: DisplayStyles.Icon,
      absorptionDisplayStyle: DisplayStyles.Icon,
      airDisplayStyle: DisplayStyles.Icon,
      nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
      nameResolveMode: EntityNameResolveModes.TranslationKeys,
      villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
      toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
      toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
      toolIndicatorColor: "\xA77",
      modePresetSummaryMode: ModePresetSummaryModes.SummaryAndChanged,
      hudHealthVisibilityMode: HudDisplayModes.ShowVanilla,
      hudHungerVisibilityMode: HudDisplayModes.ShowVanilla,
      hudSaturationVisibilityMode: HudDisplayModes.ShowVanilla,
      hudToughnessVisibilityMode: HudDisplayModes.ShowVanilla,
      hudHealthIndicatorMode: HudIndicatorModes.IconAndIndicator,
      hudHungerIndicatorMode: HudIndicatorModes.IconAndIndicator,
      hudInventoryEnabled: false,
      hudInventoryPosition: HudElementPositionModes.Center,
      hudInventoryDisplayMode: HudInventoryDisplayModes.Full,
      hudInventoryOrientation: HudElementOrientationModes.Horizontal,
      wailaColorTheme: WailaColorThemes.Default,
      stateColumns: 1,
      tagColumns: 1,
      familyColumns: 1
    }),
    components: Object.freeze({
      namespace: VisibilityPolicies.Show,
      customFields: VisibilityPolicies.Show,
      customEnergyInfo: VisibilityPolicies.Show,
      customFluidInfo: VisibilityPolicies.Show,
      customGasInfo: VisibilityPolicies.Show,
      customRotationInfo: VisibilityPolicies.ShowWhenSneaking,
      customMachineProgress: VisibilityPolicies.ShowWhenSneaking,
      customCobblestoneCount: VisibilityPolicies.Show,
      customVariantPreview: VisibilityPolicies.ShowWhenSneaking,
      blockStates: VisibilityPolicies.Show,
      blockTags: VisibilityPolicies.ShowWhenSneaking,
      health: VisibilityPolicies.Show,
      absorption: VisibilityPolicies.Show,
      armor: VisibilityPolicies.Show,
      hunger: VisibilityPolicies.Show,
      hungerEffect: VisibilityPolicies.Show,
      airBubbles: VisibilityPolicies.Show,
      effects: VisibilityPolicies.Show,
      effectHearts: VisibilityPolicies.Show,
      frozenHearts: VisibilityPolicies.Show,
      animalHearts: VisibilityPolicies.Show,
      tameable: VisibilityPolicies.Show,
      tameFoods: VisibilityPolicies.ShowWhenSneaking,
      technical: VisibilityPolicies.Hide,
      coordinates: VisibilityPolicies.Hide,
      typeId: VisibilityPolicies.Hide,
      entityTags: VisibilityPolicies.Hide,
      entityFamilies: VisibilityPolicies.Hide,
      velocity: VisibilityPolicies.Hide,
      namespaceResolution: VisibilityPolicies.Hide
    })
  }),
  [InsightModes.Detailed]: Object.freeze({
    label: "Detailed",
    runtime: Object.freeze({
      maxDistance: 9,
      updateIntervalTicks: 2,
      unchangedTargetRefreshTicks: 8,
      includeLiquidBlocks: false,
      includeInvisibleEntities: true,
      clearAfterNoTargetTicks: 30,
      linkedEntityScanIntervalTicks: 20,
      linkedEntityScanMaxDistance: 1.35,
      ignoreMachineHelperEntities: true,
      maxVisibleStates: 6,
      maxVisibleBlockTags: 6,
      maxVisibleEntityTags: 4,
      maxVisibleEntityFamilies: 4,
      maxVisibleEffects: 5,
      maxHeartDisplayHealth: 100,
      effectDisplayMode: EffectDisplayModes.Emoji,
      displayStyle: DisplayStyles.Icon,
      healthDisplayStyle: DisplayStyles.Icon,
      hungerDisplayStyle: DisplayStyles.Icon,
      armorDisplayStyle: DisplayStyles.Icon,
      absorptionDisplayStyle: DisplayStyles.Icon,
      airDisplayStyle: DisplayStyles.Icon,
      nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
      nameResolveMode: EntityNameResolveModes.TranslationKeys,
      villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
      toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
      toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
      toolIndicatorColor: "\xA77",
      modePresetSummaryMode: ModePresetSummaryModes.SummaryAndChanged,
      hudHealthVisibilityMode: HudDisplayModes.ShowVanilla,
      hudHungerVisibilityMode: HudDisplayModes.ShowVanilla,
      hudSaturationVisibilityMode: HudDisplayModes.Both,
      hudToughnessVisibilityMode: HudDisplayModes.Both,
      hudHealthIndicatorMode: HudIndicatorModes.IconAndIndicator,
      hudHungerIndicatorMode: HudIndicatorModes.IconAndIndicator,
      hudInventoryEnabled: false,
      hudInventoryPosition: HudElementPositionModes.Center,
      hudInventoryDisplayMode: HudInventoryDisplayModes.Full,
      hudInventoryOrientation: HudElementOrientationModes.Horizontal,
      wailaColorTheme: WailaColorThemes.Default,
      stateColumns: 1,
      tagColumns: 1,
      familyColumns: 1
    }),
    components: Object.freeze({
      namespace: VisibilityPolicies.Show,
      customFields: VisibilityPolicies.Show,
      customEnergyInfo: VisibilityPolicies.Show,
      customFluidInfo: VisibilityPolicies.Show,
      customGasInfo: VisibilityPolicies.Show,
      customRotationInfo: VisibilityPolicies.Show,
      customMachineProgress: VisibilityPolicies.Show,
      customCobblestoneCount: VisibilityPolicies.Show,
      customVariantPreview: VisibilityPolicies.Show,
      blockStates: VisibilityPolicies.Show,
      blockTags: VisibilityPolicies.ShowWhenSneaking,
      health: VisibilityPolicies.Show,
      absorption: VisibilityPolicies.Show,
      armor: VisibilityPolicies.Show,
      hunger: VisibilityPolicies.Show,
      hungerEffect: VisibilityPolicies.Show,
      airBubbles: VisibilityPolicies.Show,
      effects: VisibilityPolicies.Show,
      effectHearts: VisibilityPolicies.Show,
      frozenHearts: VisibilityPolicies.Show,
      animalHearts: VisibilityPolicies.Show,
      tameable: VisibilityPolicies.Show,
      tameFoods: VisibilityPolicies.Show,
      technical: VisibilityPolicies.ShowWhenSneaking,
      coordinates: VisibilityPolicies.ShowWhenSneaking,
      typeId: VisibilityPolicies.ShowWhenSneaking,
      entityTags: VisibilityPolicies.ShowWhenSneaking,
      entityFamilies: VisibilityPolicies.ShowWhenSneaking,
      velocity: VisibilityPolicies.ShowWhenSneaking,
      namespaceResolution: VisibilityPolicies.Hide
    })
  }),
  [InsightModes.Debug]: Object.freeze({
    label: "Debug",
    runtime: Object.freeze({
      maxDistance: 12,
      updateIntervalTicks: 1,
      unchangedTargetRefreshTicks: 6,
      includeLiquidBlocks: true,
      includeInvisibleEntities: true,
      clearAfterNoTargetTicks: 40,
      linkedEntityScanIntervalTicks: 20,
      linkedEntityScanMaxDistance: 1.35,
      ignoreMachineHelperEntities: true,
      maxVisibleStates: 12,
      maxVisibleBlockTags: 12,
      maxVisibleEntityTags: 12,
      maxVisibleEntityFamilies: 12,
      maxVisibleEffects: 8,
      maxHeartDisplayHealth: 100,
      effectDisplayMode: EffectDisplayModes.Emoji,
      displayStyle: DisplayStyles.Icon,
      healthDisplayStyle: DisplayStyles.Icon,
      hungerDisplayStyle: DisplayStyles.Icon,
      armorDisplayStyle: DisplayStyles.Icon,
      absorptionDisplayStyle: DisplayStyles.Icon,
      airDisplayStyle: DisplayStyles.Icon,
      nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
      nameResolveMode: EntityNameResolveModes.TranslationKeys,
      villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
      toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
      toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
      toolIndicatorColor: "\xA77",
      modePresetSummaryMode: ModePresetSummaryModes.SummaryAndChanged,
      hudHealthVisibilityMode: HudDisplayModes.Both,
      hudHungerVisibilityMode: HudDisplayModes.Both,
      hudSaturationVisibilityMode: HudDisplayModes.Both,
      hudToughnessVisibilityMode: HudDisplayModes.Both,
      hudHealthIndicatorMode: HudIndicatorModes.IconAndIndicator,
      hudHungerIndicatorMode: HudIndicatorModes.IconAndIndicator,
      hudInventoryEnabled: false,
      hudInventoryPosition: HudElementPositionModes.Center,
      hudInventoryDisplayMode: HudInventoryDisplayModes.Full,
      hudInventoryOrientation: HudElementOrientationModes.Horizontal,
      wailaColorTheme: WailaColorThemes.Default,
      stateColumns: 2,
      tagColumns: 2,
      familyColumns: 2
    }),
    components: Object.freeze({
      namespace: VisibilityPolicies.Show,
      customFields: VisibilityPolicies.Show,
      customEnergyInfo: VisibilityPolicies.Show,
      customFluidInfo: VisibilityPolicies.Show,
      customGasInfo: VisibilityPolicies.Show,
      customRotationInfo: VisibilityPolicies.Show,
      customMachineProgress: VisibilityPolicies.Show,
      customCobblestoneCount: VisibilityPolicies.Show,
      customVariantPreview: VisibilityPolicies.Show,
      blockStates: VisibilityPolicies.Show,
      blockTags: VisibilityPolicies.Show,
      health: VisibilityPolicies.Show,
      absorption: VisibilityPolicies.Show,
      armor: VisibilityPolicies.Show,
      hunger: VisibilityPolicies.Show,
      hungerEffect: VisibilityPolicies.Show,
      airBubbles: VisibilityPolicies.Show,
      effects: VisibilityPolicies.Show,
      effectHearts: VisibilityPolicies.Show,
      frozenHearts: VisibilityPolicies.Show,
      animalHearts: VisibilityPolicies.Show,
      tameable: VisibilityPolicies.Show,
      tameFoods: VisibilityPolicies.Show,
      technical: VisibilityPolicies.Show,
      coordinates: VisibilityPolicies.Show,
      typeId: VisibilityPolicies.Show,
      entityTags: VisibilityPolicies.Show,
      entityFamilies: VisibilityPolicies.Show,
      velocity: VisibilityPolicies.Show,
      namespaceResolution: VisibilityPolicies.Show
    })
  })
});
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function normalizeMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  return InsightModePresets[normalized] ? normalized : InsightConfig.system.defaultMode;
}
function normalizeEffectDisplayMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of EffectDisplayModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return EffectDisplayModes.Emoji;
}
function getEffectDisplayModeIndex(mode) {
  const normalized = normalizeEffectDisplayMode(mode);
  const index = EffectDisplayModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeDisplayStyle(style) {
  const normalized = String(style || "").trim().toLowerCase();
  if (normalized === DisplayStyles.Text) {
    return DisplayStyles.TextFull;
  }
  for (const option of DisplayStyleLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return DisplayStyles.Icon;
}
function getDisplayStyleIndex(style) {
  const normalized = normalizeDisplayStyle(style);
  const index = DisplayStyleLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeHudDisplayMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of HudDisplayModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return HudDisplayModes.Both;
}
function getHudDisplayModeIndex(mode) {
  const normalized = normalizeHudDisplayMode(mode);
  const index = HudDisplayModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeHudIndicatorMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of HudIndicatorModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return HudIndicatorModes.IconAndIndicator;
}
function getHudIndicatorModeIndex(mode) {
  const normalized = normalizeHudIndicatorMode(mode);
  const index = HudIndicatorModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeHudElementPositionMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of HudElementPositionModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return HudElementPositionModes.Center;
}
function getHudElementPositionModeIndex(mode) {
  const normalized = normalizeHudElementPositionMode(mode);
  const index = HudElementPositionModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function getHudElementPositionNumericId(mode) {
  return getHudElementPositionModeIndex(mode);
}
function normalizeHudInventoryDisplayMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of HudInventoryDisplayModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return HudInventoryDisplayModes.Full;
}
function getHudInventoryDisplayModeIndex(mode) {
  const normalized = normalizeHudInventoryDisplayMode(mode);
  const index = HudInventoryDisplayModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function getHudInventoryDisplayNumericId(mode) {
  return getHudInventoryDisplayModeIndex(mode);
}
function normalizeHudElementOrientationMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of HudElementOrientationModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return HudElementOrientationModes.Horizontal;
}
function getHudElementOrientationModeIndex(mode) {
  const normalized = normalizeHudElementOrientationMode(mode);
  const index = HudElementOrientationModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function getHudElementOrientationNumericId(mode) {
  return getHudElementOrientationModeIndex(mode);
}
function normalizeWailaColorTheme(theme) {
  const normalized = String(theme || "").trim().toLowerCase();
  for (const option of WailaColorThemeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return WailaColorThemes.Default;
}
function getWailaColorThemeIndex(theme) {
  const normalized = normalizeWailaColorTheme(theme);
  const index = WailaColorThemeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function getWailaColorThemeNumericId(theme) {
  return getWailaColorThemeIndex(theme);
}
function normalizeModePresetSummaryMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of ModePresetSummaryModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return ModePresetSummaryModes.SummaryAndChanged;
}
function getModePresetSummaryModeIndex(mode) {
  const normalized = normalizeModePresetSummaryMode(mode);
  const index = ModePresetSummaryModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeEntityNameDisplayMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of EntityNameDisplayModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return EntityNameDisplayModes.NicknameFirst;
}
function getEntityNameDisplayModeIndex(mode) {
  const normalized = normalizeEntityNameDisplayMode(mode);
  const index = EntityNameDisplayModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeEntityNameResolveMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of EntityNameResolveModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return EntityNameResolveModes.TranslationKeys;
}
function getEntityNameResolveModeIndex(mode) {
  const normalized = normalizeEntityNameResolveMode(mode);
  const index = EntityNameResolveModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeVillagerProfessionDisplayMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of VillagerProfessionDisplayModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return VillagerProfessionDisplayModes.BelowName;
}
function getVillagerProfessionDisplayModeIndex(mode) {
  const normalized = normalizeVillagerProfessionDisplayMode(mode);
  const index = VillagerProfessionDisplayModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeToolTierIndicatorMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of ToolTierIndicatorModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return ToolTierIndicatorModes.BooleanIndicator;
}
function getToolTierIndicatorModeIndex(mode) {
  const normalized = normalizeToolTierIndicatorMode(mode);
  const index = ToolTierIndicatorModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeToolIndicatorPlacementMode(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  for (const option of ToolIndicatorPlacementModeLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return ToolIndicatorPlacementModes.BeforeName;
}
function getToolIndicatorPlacementModeIndex(mode) {
  const normalized = normalizeToolIndicatorPlacementMode(mode);
  const index = ToolIndicatorPlacementModeLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeToolIndicatorColor(colorCode) {
  const normalized = String(colorCode || "").trim().toLowerCase();
  for (const option of ToolIndicatorColorOptions) {
    if (option.key.toLowerCase() === normalized) {
      return option.key;
    }
  }
  return "\xA77";
}
function getToolIndicatorColorIndex(colorCode) {
  const normalized = normalizeToolIndicatorColor(colorCode);
  const index = ToolIndicatorColorOptions.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function normalizeVisibilityPolicy(policy) {
  const normalized = String(policy || "").trim().toLowerCase();
  if (normalized === "sneaking_creative" || normalized === "creative_sneak" || normalized === "creative_sneaking" || normalized === "sneak+creative") {
    return VisibilityPolicies.SneakingAndCreative;
  }
  for (const option of VisibilityPolicyLabels) {
    if (option.key === normalized) {
      return normalized;
    }
  }
  return VisibilityPolicies.Show;
}
function getVisibilityPolicyIndex(policy) {
  const normalized = normalizeVisibilityPolicy(policy);
  const index = VisibilityPolicyLabels.findIndex((option) => option.key === normalized);
  return index === -1 ? 0 : index;
}
function safeReadWorldDynamicProperty(key) {
  try {
    return world6.getDynamicProperty(key);
  } catch {
    return void 0;
  }
}
function safeWriteWorldDynamicProperty(key, value) {
  try {
    world6.setDynamicProperty(key, value);
    return true;
  } catch {
    return false;
  }
}
function safeReadPlayerDynamicProperty(player, key) {
  try {
    return player.getDynamicProperty(key);
  } catch {
    return void 0;
  }
}
function safeWritePlayerDynamicProperty(player, key, value) {
  try {
    player.setDynamicProperty(key, value);
    return true;
  } catch {
    return false;
  }
}
function normalizeRuntime(runtimeCandidate, presetRuntime) {
  const runtime = runtimeCandidate && typeof runtimeCandidate === "object" ? runtimeCandidate : {};
  return {
    maxDistance: clamp(
      Number.isFinite(runtime.maxDistance) ? runtime.maxDistance : presetRuntime.maxDistance,
      InsightConfig.system.minMaxDistance,
      InsightConfig.system.maxMaxDistance
    ),
    updateIntervalTicks: clamp(
      Number.isFinite(runtime.updateIntervalTicks) ? runtime.updateIntervalTicks : presetRuntime.updateIntervalTicks,
      InsightConfig.system.minUpdateIntervalTicks,
      InsightConfig.system.maxUpdateIntervalTicks
    ),
    unchangedTargetRefreshTicks: clamp(
      Number.isFinite(runtime.unchangedTargetRefreshTicks) ? runtime.unchangedTargetRefreshTicks : presetRuntime.unchangedTargetRefreshTicks,
      InsightConfig.system.minUnchangedTargetRefreshTicks,
      InsightConfig.system.maxUnchangedTargetRefreshTicks
    ),
    includeLiquidBlocks: typeof runtime.includeLiquidBlocks === "boolean" ? runtime.includeLiquidBlocks : presetRuntime.includeLiquidBlocks,
    includeInvisibleEntities: typeof runtime.includeInvisibleEntities === "boolean" ? runtime.includeInvisibleEntities : presetRuntime.includeInvisibleEntities,
    clearAfterNoTargetTicks: clamp(
      Number.isFinite(runtime.clearAfterNoTargetTicks) ? runtime.clearAfterNoTargetTicks : presetRuntime.clearAfterNoTargetTicks,
      InsightConfig.system.minClearAfterNoTargetTicks,
      InsightConfig.system.maxClearAfterNoTargetTicks
    ),
    linkedEntityScanIntervalTicks: clamp(
      Number.isFinite(runtime.linkedEntityScanIntervalTicks) ? runtime.linkedEntityScanIntervalTicks : presetRuntime.linkedEntityScanIntervalTicks,
      InsightConfig.system.minLinkedEntityScanIntervalTicks,
      InsightConfig.system.maxLinkedEntityScanIntervalTicks
    ),
    linkedEntityScanMaxDistance: clamp(
      Number.isFinite(runtime.linkedEntityScanMaxDistance) ? runtime.linkedEntityScanMaxDistance : presetRuntime.linkedEntityScanMaxDistance,
      InsightConfig.system.minLinkedEntityScanMaxDistance,
      InsightConfig.system.maxLinkedEntityScanMaxDistance
    ),
    ignoreMachineHelperEntities: typeof runtime.ignoreMachineHelperEntities === "boolean" ? runtime.ignoreMachineHelperEntities : presetRuntime.ignoreMachineHelperEntities,
    maxVisibleStates: clamp(
      Number.isFinite(runtime.maxVisibleStates) ? runtime.maxVisibleStates : presetRuntime.maxVisibleStates,
      0,
      InsightConfig.system.maxVisibleStatesCap
    ),
    maxVisibleBlockTags: clamp(
      Number.isFinite(runtime.maxVisibleBlockTags) ? runtime.maxVisibleBlockTags : presetRuntime.maxVisibleBlockTags,
      0,
      InsightConfig.system.maxVisibleTagsCap
    ),
    maxVisibleEntityTags: clamp(
      Number.isFinite(runtime.maxVisibleEntityTags) ? runtime.maxVisibleEntityTags : presetRuntime.maxVisibleEntityTags,
      0,
      InsightConfig.system.maxVisibleTagsCap
    ),
    maxVisibleEntityFamilies: clamp(
      Number.isFinite(runtime.maxVisibleEntityFamilies) ? runtime.maxVisibleEntityFamilies : presetRuntime.maxVisibleEntityFamilies,
      0,
      InsightConfig.system.maxVisibleFamiliesCap
    ),
    maxVisibleEffects: clamp(
      Number.isFinite(runtime.maxVisibleEffects) ? runtime.maxVisibleEffects : presetRuntime.maxVisibleEffects,
      0,
      InsightConfig.system.maxVisibleEffectsCap
    ),
    maxHeartDisplayHealth: clamp(
      Number.isFinite(runtime.maxHeartDisplayHealth) ? runtime.maxHeartDisplayHealth : presetRuntime.maxHeartDisplayHealth,
      InsightConfig.system.minMaxHeartDisplayHealth,
      InsightConfig.system.maxMaxHeartDisplayHealth
    ),
    effectDisplayMode: normalizeEffectDisplayMode(runtime.effectDisplayMode ?? presetRuntime.effectDisplayMode),
    displayStyle: normalizeDisplayStyle(runtime.displayStyle ?? presetRuntime.displayStyle),
    healthDisplayStyle: normalizeDisplayStyle(runtime.healthDisplayStyle ?? presetRuntime.healthDisplayStyle),
    hungerDisplayStyle: normalizeDisplayStyle(runtime.hungerDisplayStyle ?? presetRuntime.hungerDisplayStyle),
    armorDisplayStyle: normalizeDisplayStyle(runtime.armorDisplayStyle ?? presetRuntime.armorDisplayStyle),
    absorptionDisplayStyle: normalizeDisplayStyle(runtime.absorptionDisplayStyle ?? presetRuntime.absorptionDisplayStyle),
    airDisplayStyle: normalizeDisplayStyle(runtime.airDisplayStyle ?? presetRuntime.airDisplayStyle),
    nameDisplayMode: normalizeEntityNameDisplayMode(runtime.nameDisplayMode ?? presetRuntime.nameDisplayMode),
    nameResolveMode: normalizeEntityNameResolveMode(runtime.nameResolveMode ?? presetRuntime.nameResolveMode),
    villagerProfessionDisplay: normalizeVillagerProfessionDisplayMode(
      runtime.villagerProfessionDisplay ?? presetRuntime.villagerProfessionDisplay
    ),
    toolTierIndicatorMode: normalizeToolTierIndicatorMode(runtime.toolTierIndicatorMode ?? presetRuntime.toolTierIndicatorMode),
    toolIndicatorPlacement: normalizeToolIndicatorPlacementMode(
      runtime.toolIndicatorPlacement ?? presetRuntime.toolIndicatorPlacement
    ),
    toolIndicatorColor: normalizeToolIndicatorColor(
      runtime.toolIndicatorColor ?? presetRuntime.toolIndicatorColor
    ),
    modePresetSummaryMode: normalizeModePresetSummaryMode(
      runtime.modePresetSummaryMode ?? presetRuntime.modePresetSummaryMode
    ),
    hudHealthVisibilityMode: normalizeHudDisplayMode(
      runtime.hudHealthVisibilityMode ?? presetRuntime.hudHealthVisibilityMode
    ),
    hudHungerVisibilityMode: normalizeHudDisplayMode(
      runtime.hudHungerVisibilityMode ?? presetRuntime.hudHungerVisibilityMode
    ),
    hudSaturationVisibilityMode: normalizeHudDisplayMode(
      runtime.hudSaturationVisibilityMode ?? presetRuntime.hudSaturationVisibilityMode
    ),
    hudToughnessVisibilityMode: normalizeHudDisplayMode(
      runtime.hudToughnessVisibilityMode ?? presetRuntime.hudToughnessVisibilityMode
    ),
    hudHealthIndicatorMode: normalizeHudIndicatorMode(
      runtime.hudHealthIndicatorMode ?? presetRuntime.hudHealthIndicatorMode
    ),
    hudHungerIndicatorMode: normalizeHudIndicatorMode(
      runtime.hudHungerIndicatorMode ?? presetRuntime.hudHungerIndicatorMode
    ),
    hudInventoryEnabled: typeof runtime.hudInventoryEnabled === "boolean" ? runtime.hudInventoryEnabled : presetRuntime.hudInventoryEnabled,
    hudInventoryPosition: normalizeHudElementPositionMode(
      runtime.hudInventoryPosition ?? presetRuntime.hudInventoryPosition
    ),
    hudInventoryDisplayMode: normalizeHudInventoryDisplayMode(
      runtime.hudInventoryDisplayMode ?? presetRuntime.hudInventoryDisplayMode
    ),
    hudInventoryOrientation: normalizeHudElementOrientationMode(
      runtime.hudInventoryOrientation ?? presetRuntime.hudInventoryOrientation
    ),
    wailaColorTheme: normalizeWailaColorTheme(
      runtime.wailaColorTheme ?? presetRuntime.wailaColorTheme
    ),
    stateColumns: clamp(
      Number.isFinite(runtime.stateColumns) ? runtime.stateColumns : presetRuntime.stateColumns,
      1,
      InsightConfig.system.maxLayoutColumns
    ),
    tagColumns: clamp(
      Number.isFinite(runtime.tagColumns) ? runtime.tagColumns : presetRuntime.tagColumns,
      1,
      InsightConfig.system.maxLayoutColumns
    ),
    familyColumns: clamp(
      Number.isFinite(runtime.familyColumns) ? runtime.familyColumns : presetRuntime.familyColumns,
      1,
      InsightConfig.system.maxLayoutColumns
    )
  };
}
function normalizeComponents(componentCandidate, presetComponents) {
  const components = componentCandidate && typeof componentCandidate === "object" ? componentCandidate : {};
  const normalized = {};
  for (const definition of InsightComponentDefinitions) {
    const rawValue = components[definition.key];
    const resolvedPolicy = rawValue ? normalizeVisibilityPolicy(rawValue) : presetComponents[definition.key];
    normalized[definition.key] = isInsightComponentDeprecated(definition.key) ? VisibilityPolicies.Hide : resolvedPolicy;
  }
  return normalized;
}
function normalizePlayerOverrides(rawCandidate, preset) {
  const raw = rawCandidate && typeof rawCandidate === "object" ? rawCandidate : {};
  const modeOverride = raw.modeOverride ? normalizeMode(raw.modeOverride) : void 0;
  const disabled = typeof raw.disabled === "boolean" ? raw.disabled : false;
  return {
    modeOverride,
    disabled,
    runtime: normalizeRuntime(raw.runtime, preset.runtime),
    components: normalizeComponents(raw.components, preset.components)
  };
}
function getMemoryPlayerOverrides(player) {
  const key = player.id || player.name;
  if (!memoryFallback.playerSettings.has(key)) {
    memoryFallback.playerSettings.set(key, void 0);
  }
  return memoryFallback.playerSettings.get(key);
}
function setMemoryPlayerOverrides(player, overrides) {
  const key = player.id || player.name;
  memoryFallback.playerSettings.set(key, overrides);
}
function getCurrentMode() {
  const storedValue = safeReadWorldDynamicProperty(WORLD_MODE_DYNAMIC_PROPERTY);
  if (typeof storedValue === "string") {
    const normalized = normalizeMode(storedValue);
    memoryFallback.mode = normalized;
    return normalized;
  }
  return memoryFallback.mode;
}
function setCurrentMode(mode) {
  const normalized = normalizeMode(mode);
  memoryFallback.mode = normalized;
  safeWriteWorldDynamicProperty(WORLD_MODE_DYNAMIC_PROPERTY, normalized);
  return normalized;
}
function isInsightGloballyEnabled() {
  const storedValue = safeReadWorldDynamicProperty(WORLD_ENABLED_DYNAMIC_PROPERTY);
  if (typeof storedValue === "boolean") {
    memoryFallback.enabled = storedValue;
    return storedValue;
  }
  return memoryFallback.enabled;
}
function setInsightGlobalEnabled(isEnabled) {
  const normalized = Boolean(isEnabled);
  memoryFallback.enabled = normalized;
  safeWriteWorldDynamicProperty(WORLD_ENABLED_DYNAMIC_PROPERTY, normalized);
  return normalized;
}
function isAdminPlayer(player) {
  if (!player) {
    return false;
  }
  try {
    if (typeof player.isOp === "function") {
      return Boolean(player.isOp());
    }
  } catch {
  }
  try {
    if (typeof player.isOp === "boolean") {
      return player.isOp;
    }
  } catch {
  }
  try {
    if (typeof player.hasTag === "function" && player.hasTag("insight:admin")) {
      return true;
    }
  } catch {
  }
  return false;
}
function isAdminOnlyGlobalProfileEnabled() {
  const storedValue = safeReadWorldDynamicProperty(WORLD_ADMIN_ONLY_DYNAMIC_PROPERTY);
  if (typeof storedValue === "boolean") {
    memoryFallback.adminOnly = storedValue;
    return storedValue;
  }
  return memoryFallback.adminOnly;
}
function getAdminGlobalProfileSourceId() {
  const storedValue = safeReadWorldDynamicProperty(WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY);
  if (typeof storedValue === "string") {
    memoryFallback.adminSourceId = storedValue;
    return storedValue;
  }
  return memoryFallback.adminSourceId;
}
function getAdminGlobalProfileSourceName() {
  const storedValue = safeReadWorldDynamicProperty(WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY);
  if (typeof storedValue === "string") {
    memoryFallback.adminSourceName = storedValue;
    return storedValue;
  }
  return memoryFallback.adminSourceName;
}
function findPlayerByIdOrName(playerId, playerName) {
  const expectedId = String(playerId || "").trim();
  const expectedName = String(playerName || "").trim().toLowerCase();
  for (const onlinePlayer of world6.getAllPlayers()) {
    if (expectedId.length && onlinePlayer.id === expectedId) {
      return onlinePlayer;
    }
    if (expectedName.length && String(onlinePlayer.name || "").toLowerCase() === expectedName) {
      return onlinePlayer;
    }
  }
  return void 0;
}
function findFirstOnlineAdmin() {
  for (const onlinePlayer of world6.getAllPlayers()) {
    if (isAdminPlayer(onlinePlayer)) {
      return onlinePlayer;
    }
  }
  return void 0;
}
function resolveAdminGlobalProfileSourcePlayer() {
  const sourceId = getAdminGlobalProfileSourceId();
  const sourceName = getAdminGlobalProfileSourceName();
  const explicitSource = findPlayerByIdOrName(sourceId, sourceName);
  if (explicitSource) {
    return explicitSource;
  }
  return findFirstOnlineAdmin();
}
function setAdminOnlyGlobalProfileEnabled(isEnabled, sourcePlayer) {
  const normalized = Boolean(isEnabled);
  memoryFallback.adminOnly = normalized;
  safeWriteWorldDynamicProperty(WORLD_ADMIN_ONLY_DYNAMIC_PROPERTY, normalized);
  if (!normalized) {
    memoryFallback.adminSourceId = "";
    memoryFallback.adminSourceName = "";
    safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY, "");
    safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY, "");
    return normalized;
  }
  const source = sourcePlayer || resolveAdminGlobalProfileSourcePlayer();
  const sourceId = String(source?.id || "").trim();
  const sourceName = String(source?.name || "").trim();
  memoryFallback.adminSourceId = sourceId;
  memoryFallback.adminSourceName = sourceName;
  safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY, sourceId);
  safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY, sourceName);
  return normalized;
}
function getModePreset(mode) {
  const normalized = normalizeMode(mode);
  return InsightModePresets[normalized];
}
function getCurrentModeLabel() {
  const mode = getCurrentMode();
  return getModePreset(mode).label;
}
function getPlayerOverrides(player, mode) {
  const activeMode = normalizeMode(mode || getCurrentMode());
  const preset = getModePreset(activeMode);
  const memoryValue = getMemoryPlayerOverrides(player);
  const stored = safeReadPlayerDynamicProperty(player, PLAYER_SETTINGS_DYNAMIC_PROPERTY);
  if (typeof stored === "string") {
    try {
      const parsed = JSON.parse(stored);
      const normalized = normalizePlayerOverrides(parsed, preset);
      setMemoryPlayerOverrides(player, normalized);
      return normalized;
    } catch {
    }
  }
  if (memoryValue) {
    return normalizePlayerOverrides(memoryValue, preset);
  }
  const defaults = normalizePlayerOverrides({}, preset);
  setMemoryPlayerOverrides(player, defaults);
  return defaults;
}
function persistPlayerOverrides(player, overrides) {
  setMemoryPlayerOverrides(player, overrides);
  const serialized = JSON.stringify(overrides);
  safeWritePlayerDynamicProperty(player, PLAYER_SETTINGS_DYNAMIC_PROPERTY, serialized);
}
function updatePlayerOverrides(player, patch) {
  const mode = getCurrentMode();
  const preset = getModePreset(mode);
  const current = getPlayerOverrides(player, mode);
  const merged = {
    modeOverride: patch?.modeOverride !== void 0 ? patch.modeOverride ? normalizeMode(patch.modeOverride) : void 0 : current.modeOverride,
    disabled: patch?.disabled !== void 0 ? Boolean(patch.disabled) : current.disabled,
    runtime: {
      ...current.runtime,
      ...patch?.runtime || {}
    },
    components: {
      ...current.components,
      ...patch?.components || {}
    }
  };
  const normalized = normalizePlayerOverrides(merged, preset);
  persistPlayerOverrides(player, normalized);
  return normalized;
}
function resetPlayerOverrides(player) {
  const mode = getCurrentMode();
  const preset = getModePreset(mode);
  const defaults = normalizePlayerOverrides({}, preset);
  persistPlayerOverrides(player, defaults);
  return defaults;
}
function setPlayerActivation(player, isActive) {
  return updatePlayerOverrides(player, { disabled: !isActive });
}
function isCreativePlayer(player) {
  try {
    return isCreative(player);
  } catch {
  }
  try {
    if (typeof player.getGameMode === "function") {
      const rawMode = player.getGameMode();
      if (typeof rawMode === "string") {
        return rawMode.toLowerCase() === "creative";
      }
      if (rawMode && typeof rawMode === "object") {
        const modeId = rawMode.id ?? rawMode.value;
        if (typeof modeId === "string") {
          return modeId.toLowerCase() === "creative";
        }
      }
      return String(rawMode).toLowerCase() === "creative";
    }
  } catch {
  }
  return false;
}
function isPlayerSneaking(player) {
  try {
    if (typeof player.isSneaking === "function") {
      return Boolean(player.isSneaking());
    }
    if (typeof player.isSneaking === "boolean") {
      return player.isSneaking;
    }
  } catch {
  }
  return false;
}
function evaluateVisibilityPolicy(policy, context) {
  const normalized = normalizeVisibilityPolicy(policy);
  switch (normalized) {
    case VisibilityPolicies.Show:
      return true;
    case VisibilityPolicies.ShowWhenSneaking:
      return context.isSneaking;
    case VisibilityPolicies.CreativeOnly:
      return context.isCreative;
    case VisibilityPolicies.SneakingAndCreative:
      return context.isSneaking && context.isCreative;
    case VisibilityPolicies.Hide:
    default:
      return false;
  }
}
function isHudInsightVisible(mode) {
  const normalized = normalizeHudDisplayMode(mode);
  return normalized === HudDisplayModes.ShowInsight || normalized === HudDisplayModes.Both;
}
function isHudVanillaVisible(mode) {
  const normalized = normalizeHudDisplayMode(mode);
  return normalized === HudDisplayModes.ShowVanilla || normalized === HudDisplayModes.Both;
}
function getPlayerDisplaySettings(player) {
  const tags = new Set(player.getTags ? player.getTags() : []);
  const isSneaking = isPlayerSneaking(player);
  const isCreative2 = isCreativePlayer(player);
  const globalEnabled = isInsightGloballyEnabled();
  const adminOnlyGlobalProfile = isAdminOnlyGlobalProfileEnabled();
  const adminSourcePlayer = adminOnlyGlobalProfile ? resolveAdminGlobalProfileSourcePlayer() : void 0;
  const adminSourceName = adminSourcePlayer?.name || getAdminGlobalProfileSourceName();
  const globalMode = getCurrentMode();
  const localOverrides = getPlayerOverrides(player, globalMode);
  const activeOverrides = adminOnlyGlobalProfile && adminSourcePlayer ? getPlayerOverrides(adminSourcePlayer, globalMode) : localOverrides;
  const activeMode = normalizeMode(activeOverrides.modeOverride || globalMode);
  const preset = getModePreset(activeMode);
  const runtime = normalizeRuntime(activeOverrides.runtime, preset.runtime);
  const components = normalizeComponents(activeOverrides.components, preset.components);
  const showHudHealthInsight = isHudInsightVisible(runtime.hudHealthVisibilityMode);
  const showHudHungerInsight = isHudInsightVisible(runtime.hudHungerVisibilityMode);
  const showHudSaturationInsight = isHudInsightVisible(runtime.hudSaturationVisibilityMode);
  const showHudToughnessInsight = isHudInsightVisible(runtime.hudToughnessVisibilityMode);
  const showHudHealthVanilla = isHudVanillaVisible(runtime.hudHealthVisibilityMode);
  const showHudHungerVanilla = isHudVanillaVisible(runtime.hudHungerVisibilityMode) && isHudVanillaVisible(runtime.hudSaturationVisibilityMode);
  const showHudArmorVanilla = isHudVanillaVisible(runtime.hudToughnessVisibilityMode);
  const hudHealthIndicatorEnabled = showHudHealthInsight && runtime.hudHealthIndicatorMode === HudIndicatorModes.IconAndIndicator;
  const hudHungerIndicatorEnabled = showHudHungerInsight && runtime.hudHungerIndicatorMode === HudIndicatorModes.IconAndIndicator;
  const hudInventoryEnabled = Boolean(runtime.hudInventoryEnabled);
  if (tags.has(InsightConfig.playerTags.hideNamespace)) {
    components.namespace = VisibilityPolicies.Hide;
  }
  if (tags.has(InsightConfig.playerTags.hideHealth)) {
    components.health = VisibilityPolicies.Hide;
  }
  if (tags.has(InsightConfig.playerTags.technicalView)) {
    components.technical = VisibilityPolicies.Show;
  }
  if (tags.has(InsightConfig.playerTags.blockTags)) {
    components.blockTags = VisibilityPolicies.Show;
  }
  if (tags.has(InsightConfig.playerTags.hideBlockTags)) {
    components.blockTags = VisibilityPolicies.Hide;
  }
  if (tags.has(InsightConfig.playerTags.namespaceDebug)) {
    components.namespaceResolution = VisibilityPolicies.Show;
  }
  const visibilityContext = { isSneaking, isCreative: isCreative2 };
  return {
    mode: activeMode,
    modeLabel: preset.label,
    globalEnabled,
    adminOnlyGlobalProfile,
    adminGlobalProfileSourceName: adminSourceName,
    disabled: !globalEnabled || (adminOnlyGlobalProfile && adminSourcePlayer ? false : localOverrides.disabled) || tags.has(InsightConfig.playerTags.disabled),
    requireSneak: tags.has(InsightConfig.playerTags.sneakOnly),
    isSneaking,
    isCreative: isCreative2,
    runtime,
    components,
    maxDistance: runtime.maxDistance,
    updateIntervalTicks: runtime.updateIntervalTicks,
    unchangedTargetRefreshTicks: runtime.unchangedTargetRefreshTicks,
    includeLiquidBlocks: runtime.includeLiquidBlocks,
    includeInvisibleEntities: runtime.includeInvisibleEntities,
    clearAfterNoTargetTicks: runtime.clearAfterNoTargetTicks,
    linkedEntityScanIntervalTicks: runtime.linkedEntityScanIntervalTicks,
    linkedEntityScanMaxDistance: runtime.linkedEntityScanMaxDistance,
    ignoreMachineHelperEntities: runtime.ignoreMachineHelperEntities,
    maxVisibleStates: runtime.maxVisibleStates,
    maxVisibleBlockTags: runtime.maxVisibleBlockTags,
    maxVisibleEntityTags: runtime.maxVisibleEntityTags,
    maxVisibleEntityFamilies: runtime.maxVisibleEntityFamilies,
    maxVisibleEffects: runtime.maxVisibleEffects,
    maxHeartDisplayHealth: runtime.maxHeartDisplayHealth,
    effectDisplayMode: runtime.effectDisplayMode,
    displayStyle: runtime.displayStyle,
    healthDisplayStyle: runtime.healthDisplayStyle,
    hungerDisplayStyle: runtime.hungerDisplayStyle,
    armorDisplayStyle: runtime.armorDisplayStyle,
    absorptionDisplayStyle: runtime.absorptionDisplayStyle,
    airDisplayStyle: runtime.airDisplayStyle,
    nameDisplayMode: runtime.nameDisplayMode,
    nameResolveMode: runtime.nameResolveMode,
    villagerProfessionDisplay: runtime.villagerProfessionDisplay,
    toolTierIndicatorMode: runtime.toolTierIndicatorMode,
    toolIndicatorPlacement: runtime.toolIndicatorPlacement,
    toolIndicatorColor: runtime.toolIndicatorColor,
    modePresetSummaryMode: runtime.modePresetSummaryMode,
    hudHealthVisibilityMode: runtime.hudHealthVisibilityMode,
    hudHungerVisibilityMode: runtime.hudHungerVisibilityMode,
    hudSaturationVisibilityMode: runtime.hudSaturationVisibilityMode,
    hudToughnessVisibilityMode: runtime.hudToughnessVisibilityMode,
    hudHealthIndicatorMode: runtime.hudHealthIndicatorMode,
    hudHungerIndicatorMode: runtime.hudHungerIndicatorMode,
    hudInventoryEnabled,
    hudInventoryPosition: runtime.hudInventoryPosition,
    hudInventoryDisplayMode: runtime.hudInventoryDisplayMode,
    hudInventoryOrientation: runtime.hudInventoryOrientation,
    wailaColorTheme: runtime.wailaColorTheme,
    wailaColorThemeId: getWailaColorThemeNumericId(runtime.wailaColorTheme),
    showHudHealthInsight,
    showHudHungerInsight,
    showHudSaturationInsight,
    showHudToughnessInsight,
    showHudHealthVanilla,
    showHudHungerVanilla,
    showHudArmorVanilla,
    hudHealthIndicatorEnabled,
    hudHungerIndicatorEnabled,
    showSaturation: showHudSaturationInsight,
    showExhaustion: showHudSaturationInsight,
    showToughness: showHudToughnessInsight,
    showExtraArmor: showHudToughnessInsight,
    stateColumns: runtime.stateColumns,
    tagColumns: runtime.tagColumns,
    familyColumns: runtime.familyColumns,
    showNamespace: evaluateVisibilityPolicy(components.namespace, visibilityContext),
    showCustomFields: evaluateVisibilityPolicy(components.customFields, visibilityContext),
    showCustomEnergyInfo: evaluateVisibilityPolicy(components.customEnergyInfo, visibilityContext),
    showCustomFluidInfo: evaluateVisibilityPolicy(components.customFluidInfo, visibilityContext),
    showCustomGasInfo: evaluateVisibilityPolicy(components.customGasInfo, visibilityContext),
    showCustomRotationInfo: evaluateVisibilityPolicy(components.customRotationInfo, visibilityContext),
    showCustomMachineProgress: evaluateVisibilityPolicy(components.customMachineProgress, visibilityContext),
    showCustomCobblestoneCount: evaluateVisibilityPolicy(components.customCobblestoneCount, visibilityContext),
    showCustomVariantPreview: evaluateVisibilityPolicy(components.customVariantPreview, visibilityContext),
    showBlockStates: evaluateVisibilityPolicy(components.blockStates, visibilityContext),
    showBlockTags: evaluateVisibilityPolicy(components.blockTags, visibilityContext),
    showHealth: evaluateVisibilityPolicy(components.health, visibilityContext),
    showAbsorption: evaluateVisibilityPolicy(components.absorption, visibilityContext),
    showArmor: evaluateVisibilityPolicy(components.armor, visibilityContext),
    showHunger: evaluateVisibilityPolicy(components.hunger, visibilityContext),
    showHungerEffect: evaluateVisibilityPolicy(components.hungerEffect, visibilityContext),
    showAirBubbles: evaluateVisibilityPolicy(components.airBubbles, visibilityContext),
    showEffects: evaluateVisibilityPolicy(components.effects, visibilityContext),
    showEffectHearts: evaluateVisibilityPolicy(components.effectHearts, visibilityContext),
    showFrozenHearts: false,
    showAnimalHearts: evaluateVisibilityPolicy(components.animalHearts, visibilityContext),
    showTameable: evaluateVisibilityPolicy(components.tameable, visibilityContext),
    showTameFoods: evaluateVisibilityPolicy(components.tameFoods, visibilityContext),
    showTechnicalData: evaluateVisibilityPolicy(components.technical, visibilityContext),
    showCoordinates: evaluateVisibilityPolicy(components.coordinates, visibilityContext),
    showTypeId: evaluateVisibilityPolicy(components.typeId, visibilityContext),
    showEntityTags: evaluateVisibilityPolicy(components.entityTags, visibilityContext),
    showEntityFamilies: evaluateVisibilityPolicy(components.entityFamilies, visibilityContext),
    showVelocity: evaluateVisibilityPolicy(components.velocity, visibilityContext),
    showNamespaceResolutionDebug: evaluateVisibilityPolicy(components.namespaceResolution, visibilityContext)
  };
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\commands.js
import { system as system9, world as world9 } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\namespaceInjection.js
import { system as system7, world as world7 } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\formatters.js
function toTitleWords(parts) {
  if (!parts || !parts.length) {
    return "Unknown";
  }
  return parts.filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
function splitTypeId(typeId) {
  if (!typeId || !typeId.includes(":")) {
    return {
      namespace: "minecraft",
      id: typeId || "unknown"
    };
  }
  const [namespace, id] = typeId.split(":");
  return { namespace, id };
}
function formatNamespace(namespace, colorCode) {
  return `
${colorCode}@${toTitleWords(namespace.split("_"))}\xA7r`;
}
function formatNamespaceLabel(label, colorCode) {
  if (!label) {
    return formatNamespace("unknown", colorCode);
  }
  return `
${colorCode}@${label}\xA7r`;
}
function formatStateName(stateKey) {
  const pureKey = stateKey.includes(":") ? stateKey.split(":")[1] : stateKey;
  return toTitleWords(pureKey.split("_"));
}
function toMessageText(value) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return `${value}`;
}
function removeRepeatedNamespacePrefix(id, namespace) {
  if (!id || !namespace) {
    return id;
  }
  const normalizedNamespace = namespace.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  const candidates = [
    `${namespace}_`,
    `${namespace}.`,
    `${normalizedNamespace}_`,
    `${normalizedNamespace}.`
  ];
  const lowerId = id.toLowerCase();
  for (const candidate of candidates) {
    const lowerCandidate = candidate.toLowerCase();
    if (lowerId.startsWith(lowerCandidate) && id.length > candidate.length) {
      return id.slice(candidate.length);
    }
  }
  return id;
}
function formatTypeIdToText(typeId) {
  const { namespace, id } = splitTypeId(typeId);
  const cleanedId = removeRepeatedNamespacePrefix(id, namespace);
  return toTitleWords(cleanedId.replace(/[.:]/g, "_").split("_"));
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\workspaceRegistry.js
var WorkspaceAddonContentRegistry = Object.freeze([
  {
    "key": "utilitycraft_ascendant_technology",
    "name": "UtilityCraft: Ascendant Technology",
    "type": "expansion",
    "namespace": "utilitycraft",
    "content": [
      "utilitycraft:absolute_battery",
      "utilitycraft:absolute_container",
      "utilitycraft:absolute_furnator",
      "utilitycraft:absolute_magmator",
      "utilitycraft:absolute_solar_panel",
      "utilitycraft:absolute_thermo_generator",
      "utilitycraft:absolute_wind_turbine",
      "utilitycraft:aetherium",
      "utilitycraft:aetherium_aiot",
      "utilitycraft:aetherium_axe",
      "utilitycraft:aetherium_block",
      "utilitycraft:aetherium_boots",
      "utilitycraft:aetherium_chestplate",
      "utilitycraft:aetherium_conveyor_bridge_path",
      "utilitycraft:aetherium_conveyor_bridge_receiver",
      "utilitycraft:aetherium_conveyor_bridge_transmitter",
      "utilitycraft:aetherium_conveyor_declined",
      "utilitycraft:aetherium_conveyor_horizontal",
      "utilitycraft:aetherium_conveyor_inclined",
      "utilitycraft:aetherium_conveyor_vertical",
      "utilitycraft:aetherium_fishing_net",
      "utilitycraft:aetherium_hammer",
      "utilitycraft:aetherium_helmet",
      "utilitycraft:aetherium_hoe",
      "utilitycraft:aetherium_leggings",
      "utilitycraft:aetherium_liquid_capsule_1",
      "utilitycraft:aetherium_liquid_capsule_2",
      "utilitycraft:aetherium_liquid_capsule_3",
      "utilitycraft:aetherium_liquid_capsule_4",
      "utilitycraft:aetherium_liquid_capsule_5",
      "utilitycraft:aetherium_liquid_capsule_6",
      "utilitycraft:aetherium_liquid_capsule_7",
      "utilitycraft:aetherium_liquid_capsule_8",
      "utilitycraft:aetherium_liquid_capsule_infinite",
      "utilitycraft:aetherium_mesh",
      "utilitycraft:aetherium_paxel",
      "utilitycraft:aetherium_pickaxe",
      "utilitycraft:aetherium_shard",
      "utilitycraft:aetherium_shovel",
      "utilitycraft:aetherium_sword",
      "utilitycraft:arcane_00",
      "utilitycraft:arcane_01",
      "utilitycraft:arcane_02",
      "utilitycraft:arcane_03",
      "utilitycraft:arcane_04",
      "utilitycraft:arcane_05",
      "utilitycraft:arcane_06",
      "utilitycraft:arcane_07",
      "utilitycraft:arcane_08",
      "utilitycraft:arcane_09",
      "utilitycraft:arcane_10",
      "utilitycraft:arcane_11",
      "utilitycraft:arcane_12",
      "utilitycraft:arcane_13",
      "utilitycraft:arcane_14",
      "utilitycraft:arcane_15",
      "utilitycraft:arcane_16",
      "utilitycraft:ascane_module_base",
      "utilitycraft:blastling",
      "utilitycraft:blastling_ammo",
      "utilitycraft:catalyst_weaver",
      "utilitycraft:conveyor_bridge_path",
      "utilitycraft:conveyor_junction",
      "utilitycraft:conveyor_network_updater",
      "utilitycraft:conveyor_overflow",
      "utilitycraft:conveyor_router",
      "utilitycraft:conveyor_smart_router",
      "utilitycraft:conveyor_underflow",
      "utilitycraft:copper_conveyor_bridge_path",
      "utilitycraft:copper_conveyor_bridge_receiver",
      "utilitycraft:copper_conveyor_bridge_transmitter",
      "utilitycraft:copper_conveyor_declined",
      "utilitycraft:copper_conveyor_horizontal",
      "utilitycraft:copper_conveyor_inclined",
      "utilitycraft:copper_conveyor_vertical",
      "utilitycraft:cryo_chamber",
      "utilitycraft:cryofluid_00",
      "utilitycraft:cryofluid_01",
      "utilitycraft:cryofluid_02",
      "utilitycraft:cryofluid_03",
      "utilitycraft:cryofluid_04",
      "utilitycraft:cryofluid_05",
      "utilitycraft:cryofluid_06",
      "utilitycraft:cryofluid_07",
      "utilitycraft:cryofluid_08",
      "utilitycraft:cryofluid_09",
      "utilitycraft:cryofluid_10",
      "utilitycraft:cryofluid_11",
      "utilitycraft:cryofluid_12",
      "utilitycraft:cryofluid_13",
      "utilitycraft:cryofluid_14",
      "utilitycraft:cryofluid_15",
      "utilitycraft:cryofluid_16",
      "utilitycraft:cryofluid_17",
      "utilitycraft:cryofluid_18",
      "utilitycraft:cryofluid_19",
      "utilitycraft:cryofluid_20",
      "utilitycraft:cryofluid_21",
      "utilitycraft:cryofluid_22",
      "utilitycraft:cryofluid_23",
      "utilitycraft:cryofluid_24",
      "utilitycraft:cryofluid_25",
      "utilitycraft:cryofluid_26",
      "utilitycraft:cryofluid_27",
      "utilitycraft:cryofluid_28",
      "utilitycraft:cryofluid_29",
      "utilitycraft:cryofluid_30",
      "utilitycraft:cryofluid_31",
      "utilitycraft:cryofluid_32",
      "utilitycraft:cryofluid_33",
      "utilitycraft:cryofluid_34",
      "utilitycraft:cryofluid_35",
      "utilitycraft:cryofluid_36",
      "utilitycraft:cryofluid_37",
      "utilitycraft:cryofluid_38",
      "utilitycraft:cryofluid_39",
      "utilitycraft:cryofluid_40",
      "utilitycraft:cryofluid_41",
      "utilitycraft:cryofluid_42",
      "utilitycraft:cryofluid_43",
      "utilitycraft:cryofluid_44",
      "utilitycraft:cryofluid_45",
      "utilitycraft:cryofluid_46",
      "utilitycraft:cryofluid_47",
      "utilitycraft:cryofluid_48",
      "utilitycraft:cryofluid_capsule_1",
      "utilitycraft:cryofluid_capsule_2",
      "utilitycraft:cryofluid_capsule_3",
      "utilitycraft:cryofluid_capsule_4",
      "utilitycraft:cryofluid_capsule_5",
      "utilitycraft:cryofluid_capsule_6",
      "utilitycraft:cryofluid_capsule_7",
      "utilitycraft:cryofluid_capsule_8",
      "utilitycraft:cryofluid_capsule_infinite",
      "utilitycraft:curse_protection_module",
      "utilitycraft:dark_matter_00",
      "utilitycraft:dark_matter_01",
      "utilitycraft:dark_matter_02",
      "utilitycraft:dark_matter_03",
      "utilitycraft:dark_matter_04",
      "utilitycraft:dark_matter_05",
      "utilitycraft:dark_matter_06",
      "utilitycraft:dark_matter_07",
      "utilitycraft:dark_matter_08",
      "utilitycraft:dark_matter_09",
      "utilitycraft:dark_matter_10",
      "utilitycraft:dark_matter_11",
      "utilitycraft:dark_matter_12",
      "utilitycraft:dark_matter_13",
      "utilitycraft:dark_matter_14",
      "utilitycraft:dark_matter_15",
      "utilitycraft:dark_matter_16",
      "utilitycraft:dark_matter_17",
      "utilitycraft:dark_matter_18",
      "utilitycraft:dark_matter_19",
      "utilitycraft:dark_matter_20",
      "utilitycraft:dark_matter_21",
      "utilitycraft:dark_matter_22",
      "utilitycraft:dark_matter_23",
      "utilitycraft:dark_matter_24",
      "utilitycraft:dark_matter_25",
      "utilitycraft:dark_matter_26",
      "utilitycraft:dark_matter_27",
      "utilitycraft:dark_matter_28",
      "utilitycraft:dark_matter_29",
      "utilitycraft:dark_matter_30",
      "utilitycraft:dark_matter_31",
      "utilitycraft:dark_matter_32",
      "utilitycraft:dark_matter_33",
      "utilitycraft:dark_matter_34",
      "utilitycraft:dark_matter_35",
      "utilitycraft:dark_matter_36",
      "utilitycraft:dark_matter_37",
      "utilitycraft:dark_matter_38",
      "utilitycraft:dark_matter_39",
      "utilitycraft:dark_matter_40",
      "utilitycraft:dark_matter_41",
      "utilitycraft:dark_matter_42",
      "utilitycraft:dark_matter_43",
      "utilitycraft:dark_matter_44",
      "utilitycraft:dark_matter_45",
      "utilitycraft:dark_matter_46",
      "utilitycraft:dark_matter_47",
      "utilitycraft:dark_matter_48",
      "utilitycraft:dark_matter_liquid_capsule_1",
      "utilitycraft:dark_matter_liquid_capsule_2",
      "utilitycraft:dark_matter_liquid_capsule_3",
      "utilitycraft:dark_matter_liquid_capsule_4",
      "utilitycraft:dark_matter_liquid_capsule_5",
      "utilitycraft:dark_matter_liquid_capsule_6",
      "utilitycraft:dark_matter_liquid_capsule_7",
      "utilitycraft:dark_matter_liquid_capsule_8",
      "utilitycraft:dark_matter_liquid_capsule_infinite",
      "utilitycraft:deepslate_aetherium_ore",
      "utilitycraft:deepslate_titanium_ore",
      "utilitycraft:duplicator",
      "utilitycraft:empty_liquid_capsule",
      "utilitycraft:enchantability_module",
      "utilitycraft:enchantability_module_2",
      "utilitycraft:enchantability_module_3",
      "utilitycraft:enchantability_module_4",
      "utilitycraft:enchantability_module_5",
      "utilitycraft:enchantment_station",
      "utilitycraft:end_aetherium_ore",
      "utilitycraft:enderling_tear",
      "utilitycraft:endersent",
      "utilitycraft:energizer",
      "utilitycraft:fluid_tank_cryofluid",
      "utilitycraft:fluid_tank_dark_matter",
      "utilitycraft:fluid_tank_liquified_aetherium",
      "utilitycraft:gas_tube",
      "utilitycraft:hyper_processing_upgrade",
      "utilitycraft:laser_barrier",
      "utilitycraft:laser_barrier_field",
      "utilitycraft:lava_capsule_infinite",
      "utilitycraft:liquid_void",
      "utilitycraft:liquified_aetherium_00",
      "utilitycraft:liquified_aetherium_01",
      "utilitycraft:liquified_aetherium_02",
      "utilitycraft:liquified_aetherium_03",
      "utilitycraft:liquified_aetherium_04",
      "utilitycraft:liquified_aetherium_05",
      "utilitycraft:liquified_aetherium_06",
      "utilitycraft:liquified_aetherium_07",
      "utilitycraft:liquified_aetherium_08",
      "utilitycraft:liquified_aetherium_09",
      "utilitycraft:liquified_aetherium_10",
      "utilitycraft:liquified_aetherium_11",
      "utilitycraft:liquified_aetherium_12",
      "utilitycraft:liquified_aetherium_13",
      "utilitycraft:liquified_aetherium_14",
      "utilitycraft:liquified_aetherium_15",
      "utilitycraft:liquified_aetherium_16",
      "utilitycraft:liquified_aetherium_17",
      "utilitycraft:liquified_aetherium_18",
      "utilitycraft:liquified_aetherium_19",
      "utilitycraft:liquified_aetherium_20",
      "utilitycraft:liquified_aetherium_21",
      "utilitycraft:liquified_aetherium_22",
      "utilitycraft:liquified_aetherium_23",
      "utilitycraft:liquified_aetherium_24",
      "utilitycraft:liquified_aetherium_25",
      "utilitycraft:liquified_aetherium_26",
      "utilitycraft:liquified_aetherium_27",
      "utilitycraft:liquified_aetherium_28",
      "utilitycraft:liquified_aetherium_29",
      "utilitycraft:liquified_aetherium_30",
      "utilitycraft:liquified_aetherium_31",
      "utilitycraft:liquified_aetherium_32",
      "utilitycraft:liquified_aetherium_33",
      "utilitycraft:liquified_aetherium_34",
      "utilitycraft:liquified_aetherium_35",
      "utilitycraft:liquified_aetherium_36",
      "utilitycraft:liquified_aetherium_37",
      "utilitycraft:liquified_aetherium_38",
      "utilitycraft:liquified_aetherium_39",
      "utilitycraft:liquified_aetherium_40",
      "utilitycraft:liquified_aetherium_41",
      "utilitycraft:liquified_aetherium_42",
      "utilitycraft:liquified_aetherium_43",
      "utilitycraft:liquified_aetherium_44",
      "utilitycraft:liquified_aetherium_45",
      "utilitycraft:liquified_aetherium_46",
      "utilitycraft:liquified_aetherium_47",
      "utilitycraft:liquified_aetherium_48",
      "utilitycraft:liquifier",
      "utilitycraft:lucky_aiot",
      "utilitycraft:lucky_aiot_item",
      "utilitycraft:lucky_fishing_net",
      "utilitycraft:lucky_mesh",
      "utilitycraft:machine",
      "utilitycraft:milk_capsule_infinite",
      "utilitycraft:mob_magnet",
      "utilitycraft:network_center",
      "utilitycraft:overclock_00",
      "utilitycraft:overclock_01",
      "utilitycraft:overclock_02",
      "utilitycraft:overclock_03",
      "utilitycraft:overclock_04",
      "utilitycraft:overclock_05",
      "utilitycraft:overclock_06",
      "utilitycraft:overclock_07",
      "utilitycraft:overclock_08",
      "utilitycraft:overclock_09",
      "utilitycraft:overclock_10",
      "utilitycraft:overclock_11",
      "utilitycraft:overclock_12",
      "utilitycraft:overclock_13",
      "utilitycraft:overclock_14",
      "utilitycraft:overclock_15",
      "utilitycraft:overclock_16",
      "utilitycraft:overclock_17",
      "utilitycraft:overclock_18",
      "utilitycraft:overclock_19",
      "utilitycraft:overclock_20",
      "utilitycraft:overclock_21",
      "utilitycraft:overclock_22",
      "utilitycraft:overclock_23",
      "utilitycraft:overclock_24",
      "utilitycraft:overclock_25",
      "utilitycraft:overclock_26",
      "utilitycraft:overclock_27",
      "utilitycraft:overclock_28",
      "utilitycraft:overclock_29",
      "utilitycraft:overclock_30",
      "utilitycraft:overclock_31",
      "utilitycraft:overclock_32",
      "utilitycraft:overclock_33",
      "utilitycraft:overclock_34",
      "utilitycraft:overclock_35",
      "utilitycraft:overclock_36",
      "utilitycraft:overclock_37",
      "utilitycraft:overclock_38",
      "utilitycraft:overclock_39",
      "utilitycraft:overclock_40",
      "utilitycraft:overclock_41",
      "utilitycraft:overclock_42",
      "utilitycraft:overclock_43",
      "utilitycraft:overclock_44",
      "utilitycraft:overclock_45",
      "utilitycraft:overclock_46",
      "utilitycraft:overclock_47",
      "utilitycraft:overclock_48",
      "utilitycraft:overclock_relay",
      "utilitycraft:overclock_tower",
      "utilitycraft:pure_enderling_tear",
      "utilitycraft:raw_titanium",
      "utilitycraft:raw_titanium_block",
      "utilitycraft:refined_aetherium_shard",
      "utilitycraft:reinforced_cable",
      "utilitycraft:reinforced_extractor",
      "utilitycraft:reinforcement_module",
      "utilitycraft:reinforcement_module_2",
      "utilitycraft:reinforcement_module_3",
      "utilitycraft:residue_processor",
      "utilitycraft:singularity_fabricator",
      "utilitycraft:size_upgrade",
      "utilitycraft:snareling",
      "utilitycraft:snareling_web",
      "utilitycraft:steam_00",
      "utilitycraft:steam_01",
      "utilitycraft:steam_02",
      "utilitycraft:steam_03",
      "utilitycraft:steam_04",
      "utilitycraft:steam_05",
      "utilitycraft:steam_06",
      "utilitycraft:steam_07",
      "utilitycraft:steam_08",
      "utilitycraft:steam_09",
      "utilitycraft:steam_10",
      "utilitycraft:steam_11",
      "utilitycraft:steam_12",
      "utilitycraft:steam_13",
      "utilitycraft:steam_14",
      "utilitycraft:steam_15",
      "utilitycraft:steam_16",
      "utilitycraft:steam_17",
      "utilitycraft:steam_18",
      "utilitycraft:steam_19",
      "utilitycraft:steam_20",
      "utilitycraft:steam_21",
      "utilitycraft:steam_22",
      "utilitycraft:steam_23",
      "utilitycraft:steam_24",
      "utilitycraft:steam_25",
      "utilitycraft:steam_26",
      "utilitycraft:steam_27",
      "utilitycraft:steam_28",
      "utilitycraft:steam_29",
      "utilitycraft:steam_30",
      "utilitycraft:steam_31",
      "utilitycraft:steam_32",
      "utilitycraft:steam_33",
      "utilitycraft:steam_34",
      "utilitycraft:steam_35",
      "utilitycraft:steam_36",
      "utilitycraft:steam_37",
      "utilitycraft:steam_38",
      "utilitycraft:steam_39",
      "utilitycraft:steam_40",
      "utilitycraft:steam_41",
      "utilitycraft:steam_42",
      "utilitycraft:steam_43",
      "utilitycraft:steam_44",
      "utilitycraft:steam_45",
      "utilitycraft:steam_46",
      "utilitycraft:steam_47",
      "utilitycraft:steam_48",
      "utilitycraft:steam_capsule_1",
      "utilitycraft:steam_capsule_2",
      "utilitycraft:steam_capsule_3",
      "utilitycraft:steam_capsule_4",
      "utilitycraft:steam_capsule_5",
      "utilitycraft:steam_capsule_6",
      "utilitycraft:steam_capsule_7",
      "utilitycraft:steam_capsule_8",
      "utilitycraft:storage_container",
      "utilitycraft:tabs_test_machine",
      "utilitycraft:titanium",
      "utilitycraft:titanium_aiot",
      "utilitycraft:titanium_axe",
      "utilitycraft:titanium_block",
      "utilitycraft:titanium_boots",
      "utilitycraft:titanium_chestplate",
      "utilitycraft:titanium_chunk",
      "utilitycraft:titanium_conveyor_bridge_path",
      "utilitycraft:titanium_conveyor_bridge_receiver",
      "utilitycraft:titanium_conveyor_bridge_transmitter",
      "utilitycraft:titanium_conveyor_declined",
      "utilitycraft:titanium_conveyor_horizontal",
      "utilitycraft:titanium_conveyor_inclined",
      "utilitycraft:titanium_conveyor_vertical",
      "utilitycraft:titanium_fishing_net",
      "utilitycraft:titanium_hammer",
      "utilitycraft:titanium_helmet",
      "utilitycraft:titanium_hoe",
      "utilitycraft:titanium_leggings",
      "utilitycraft:titanium_mesh",
      "utilitycraft:titanium_nugget",
      "utilitycraft:titanium_paxel",
      "utilitycraft:titanium_pickaxe",
      "utilitycraft:titanium_shovel",
      "utilitycraft:titanium_sword",
      "utilitycraft:upgrade_package",
      "utilitycraft:vaporworks_processor",
      "utilitycraft:void_essence",
      "utilitycraft:watchling",
      "utilitycraft:water_capsule_infinite",
      "utilitycraft:xp_capsule_infinite"
    ]
  },
  {
    "key": "dorios_atelier",
    "name": "Dorios' Atelier",
    "type": "addon",
    "namespace": "dorios",
    "content": [
      "utilitycraft:andesite_bricks",
      "utilitycraft:andesite_bricks_slab",
      "utilitycraft:andesite_bricks_stairs",
      "utilitycraft:andesite_bricks_three_steps_stairs",
      "utilitycraft:andesite_bricks_vertical_slab",
      "utilitycraft:andesite_slab",
      "utilitycraft:andesite_stairs",
      "utilitycraft:andesite_three_steps_stairs",
      "utilitycraft:andesite_tiles",
      "utilitycraft:andesite_tiles_slab",
      "utilitycraft:andesite_tiles_stairs",
      "utilitycraft:andesite_tiles_three_steps_stairs",
      "utilitycraft:andesite_tiles_vertical_slab",
      "utilitycraft:andesite_vertical_slab",
      "utilitycraft:basalt_bricks",
      "utilitycraft:basalt_bricks_slab",
      "utilitycraft:basalt_bricks_stairs",
      "utilitycraft:basalt_bricks_three_steps_stairs",
      "utilitycraft:basalt_bricks_vertical_slab",
      "utilitycraft:basalt_tiles",
      "utilitycraft:basalt_tiles_slab",
      "utilitycraft:basalt_tiles_stairs",
      "utilitycraft:basalt_tiles_three_steps_stairs",
      "utilitycraft:basalt_tiles_vertical_slab",
      "utilitycraft:blackstone_tiles",
      "utilitycraft:blackstone_tiles_slab",
      "utilitycraft:blackstone_tiles_stairs",
      "utilitycraft:blackstone_tiles_three_steps_stairs",
      "utilitycraft:blackstone_tiles_vertical_slab",
      "utilitycraft:calcite_bricks",
      "utilitycraft:calcite_bricks_slab",
      "utilitycraft:calcite_bricks_stairs",
      "utilitycraft:calcite_bricks_three_steps_stairs",
      "utilitycraft:calcite_bricks_vertical_slab",
      "utilitycraft:calcite_slab",
      "utilitycraft:calcite_stairs",
      "utilitycraft:calcite_three_steps_stairs",
      "utilitycraft:calcite_tiles",
      "utilitycraft:calcite_tiles_slab",
      "utilitycraft:calcite_tiles_stairs",
      "utilitycraft:calcite_tiles_three_steps_stairs",
      "utilitycraft:calcite_tiles_vertical_slab",
      "utilitycraft:calcite_vertical_slab",
      "utilitycraft:carved_basalt",
      "utilitycraft:chiseled_andesite",
      "utilitycraft:chiseled_andesite_bricks",
      "utilitycraft:chiseled_basalt",
      "utilitycraft:chiseled_blackstone",
      "utilitycraft:chiseled_calcite",
      "utilitycraft:chiseled_calcite_bricks",
      "utilitycraft:chiseled_deepslate_slab",
      "utilitycraft:chiseled_deepslate_stairs",
      "utilitycraft:chiseled_deepslate_three_steps_stairs",
      "utilitycraft:chiseled_deepslate_vertical_slab",
      "utilitycraft:chiseled_diorite",
      "utilitycraft:chiseled_diorite_bricks",
      "utilitycraft:chiseled_dripstone",
      "utilitycraft:chiseled_dripstone_bricks",
      "utilitycraft:chiseled_granite",
      "utilitycraft:chiseled_granite_bricks",
      "utilitycraft:chiseled_nether_bricks_slab",
      "utilitycraft:chiseled_nether_bricks_stairs",
      "utilitycraft:chiseled_nether_bricks_three_steps_stairs",
      "utilitycraft:chiseled_nether_bricks_vertical_slab",
      "utilitycraft:chiseled_obsidian",
      "utilitycraft:chiseled_polished_blackstone_slab",
      "utilitycraft:chiseled_polished_blackstone_stairs",
      "utilitycraft:chiseled_polished_blackstone_three_steps_stairs",
      "utilitycraft:chiseled_polished_blackstone_vertical_slab",
      "utilitycraft:chiseled_stone_bricks_slab",
      "utilitycraft:chiseled_stone_bricks_stairs",
      "utilitycraft:chiseled_stone_bricks_three_steps_stairs",
      "utilitycraft:chiseled_stone_bricks_vertical_slab",
      "utilitycraft:cobbled_deepslate_slab",
      "utilitycraft:cobbled_deepslate_stairs",
      "utilitycraft:cobbled_deepslate_three_steps_stairs",
      "utilitycraft:cobbled_deepslate_vertical_slab",
      "utilitycraft:cobblestone_slab",
      "utilitycraft:cobblestone_stairs",
      "utilitycraft:cobblestone_three_steps_stairs",
      "utilitycraft:cobblestone_vertical_slab",
      "utilitycraft:copper_chisel",
      "utilitycraft:copper_glove",
      "utilitycraft:cracked_andesite_bricks",
      "utilitycraft:cracked_andesite_bricks_slab",
      "utilitycraft:cracked_andesite_bricks_stairs",
      "utilitycraft:cracked_andesite_bricks_three_steps_stairs",
      "utilitycraft:cracked_andesite_bricks_vertical_slab",
      "utilitycraft:cracked_andesite_tiles",
      "utilitycraft:cracked_andesite_tiles_slab",
      "utilitycraft:cracked_andesite_tiles_stairs",
      "utilitycraft:cracked_andesite_tiles_three_steps_stairs",
      "utilitycraft:cracked_andesite_tiles_vertical_slab",
      "utilitycraft:cracked_basalt_bricks",
      "utilitycraft:cracked_basalt_bricks_slab",
      "utilitycraft:cracked_basalt_bricks_stairs",
      "utilitycraft:cracked_basalt_bricks_three_steps_stairs",
      "utilitycraft:cracked_basalt_bricks_vertical_slab",
      "utilitycraft:cracked_basalt_tiles",
      "utilitycraft:cracked_basalt_tiles_slab",
      "utilitycraft:cracked_basalt_tiles_stairs",
      "utilitycraft:cracked_basalt_tiles_three_steps_stairs",
      "utilitycraft:cracked_basalt_tiles_vertical_slab",
      "utilitycraft:cracked_blackstone_tiles",
      "utilitycraft:cracked_blackstone_tiles_slab",
      "utilitycraft:cracked_blackstone_tiles_stairs",
      "utilitycraft:cracked_blackstone_tiles_three_steps_stairs",
      "utilitycraft:cracked_blackstone_tiles_vertical_slab",
      "utilitycraft:cracked_calcite_bricks",
      "utilitycraft:cracked_calcite_bricks_slab",
      "utilitycraft:cracked_calcite_bricks_stairs",
      "utilitycraft:cracked_calcite_bricks_three_steps_stairs",
      "utilitycraft:cracked_calcite_bricks_vertical_slab",
      "utilitycraft:cracked_calcite_tiles",
      "utilitycraft:cracked_calcite_tiles_slab",
      "utilitycraft:cracked_calcite_tiles_stairs",
      "utilitycraft:cracked_calcite_tiles_three_steps_stairs",
      "utilitycraft:cracked_calcite_tiles_vertical_slab",
      "utilitycraft:cracked_deepslate_bricks_slab",
      "utilitycraft:cracked_deepslate_bricks_stairs",
      "utilitycraft:cracked_deepslate_bricks_three_steps_stairs",
      "utilitycraft:cracked_deepslate_bricks_vertical_slab",
      "utilitycraft:cracked_deepslate_tiles_slab",
      "utilitycraft:cracked_deepslate_tiles_stairs",
      "utilitycraft:cracked_deepslate_tiles_three_steps_stairs",
      "utilitycraft:cracked_deepslate_tiles_vertical_slab",
      "utilitycraft:cracked_diorite_bricks",
      "utilitycraft:cracked_diorite_bricks_slab",
      "utilitycraft:cracked_diorite_bricks_stairs",
      "utilitycraft:cracked_diorite_bricks_three_steps_stairs",
      "utilitycraft:cracked_diorite_bricks_vertical_slab",
      "utilitycraft:cracked_diorite_tiles",
      "utilitycraft:cracked_diorite_tiles_slab",
      "utilitycraft:cracked_diorite_tiles_stairs",
      "utilitycraft:cracked_diorite_tiles_three_steps_stairs",
      "utilitycraft:cracked_diorite_tiles_vertical_slab",
      "utilitycraft:cracked_dripstone_bricks",
      "utilitycraft:cracked_dripstone_bricks_slab",
      "utilitycraft:cracked_dripstone_bricks_stairs",
      "utilitycraft:cracked_dripstone_bricks_three_steps_stairs",
      "utilitycraft:cracked_dripstone_bricks_vertical_slab",
      "utilitycraft:cracked_dripstone_tiles",
      "utilitycraft:cracked_dripstone_tiles_slab",
      "utilitycraft:cracked_dripstone_tiles_stairs",
      "utilitycraft:cracked_dripstone_tiles_three_steps_stairs",
      "utilitycraft:cracked_dripstone_tiles_vertical_slab",
      "utilitycraft:cracked_granite_bricks",
      "utilitycraft:cracked_granite_bricks_slab",
      "utilitycraft:cracked_granite_bricks_stairs",
      "utilitycraft:cracked_granite_bricks_three_steps_stairs",
      "utilitycraft:cracked_granite_bricks_vertical_slab",
      "utilitycraft:cracked_granite_tiles",
      "utilitycraft:cracked_granite_tiles_slab",
      "utilitycraft:cracked_granite_tiles_stairs",
      "utilitycraft:cracked_granite_tiles_three_steps_stairs",
      "utilitycraft:cracked_granite_tiles_vertical_slab",
      "utilitycraft:cracked_nether_bricks_slab",
      "utilitycraft:cracked_nether_bricks_stairs",
      "utilitycraft:cracked_nether_bricks_three_steps_stairs",
      "utilitycraft:cracked_nether_bricks_vertical_slab",
      "utilitycraft:cracked_polished_blackstone_bricks_slab",
      "utilitycraft:cracked_polished_blackstone_bricks_stairs",
      "utilitycraft:cracked_polished_blackstone_bricks_three_steps_stairs",
      "utilitycraft:cracked_polished_blackstone_bricks_vertical_slab",
      "utilitycraft:cracked_stone_bricks_slab",
      "utilitycraft:cracked_stone_bricks_stairs",
      "utilitycraft:cracked_stone_bricks_three_steps_stairs",
      "utilitycraft:cracked_stone_bricks_vertical_slab",
      "utilitycraft:cracked_tuff_bricks",
      "utilitycraft:cracked_tuff_bricks_slab",
      "utilitycraft:cracked_tuff_bricks_stairs",
      "utilitycraft:cracked_tuff_bricks_three_steps_stairs",
      "utilitycraft:cracked_tuff_bricks_vertical_slab",
      "utilitycraft:cracked_tuff_tiles",
      "utilitycraft:cracked_tuff_tiles_slab",
      "utilitycraft:cracked_tuff_tiles_stairs",
      "utilitycraft:cracked_tuff_tiles_three_steps_stairs",
      "utilitycraft:cracked_tuff_tiles_vertical_slab",
      "utilitycraft:dark_prismarine_slab",
      "utilitycraft:dark_prismarine_stairs",
      "utilitycraft:dark_prismarine_three_steps_stairs",
      "utilitycraft:dark_prismarine_vertical_slab",
      "utilitycraft:deepslate_bricks_slab",
      "utilitycraft:deepslate_bricks_stairs",
      "utilitycraft:deepslate_bricks_three_steps_stairs",
      "utilitycraft:deepslate_bricks_vertical_slab",
      "utilitycraft:deepslate_tiles_slab",
      "utilitycraft:deepslate_tiles_stairs",
      "utilitycraft:deepslate_tiles_three_steps_stairs",
      "utilitycraft:deepslate_tiles_vertical_slab",
      "utilitycraft:diamond_chisel",
      "utilitycraft:diamond_glove",
      "utilitycraft:diorite_bricks",
      "utilitycraft:diorite_bricks_slab",
      "utilitycraft:diorite_bricks_stairs",
      "utilitycraft:diorite_bricks_three_steps_stairs",
      "utilitycraft:diorite_bricks_vertical_slab",
      "utilitycraft:diorite_slab",
      "utilitycraft:diorite_stairs",
      "utilitycraft:diorite_three_steps_stairs",
      "utilitycraft:diorite_tiles",
      "utilitycraft:diorite_tiles_slab",
      "utilitycraft:diorite_tiles_stairs",
      "utilitycraft:diorite_tiles_three_steps_stairs",
      "utilitycraft:diorite_tiles_vertical_slab",
      "utilitycraft:diorite_vertical_slab",
      "utilitycraft:dripstone_bricks",
      "utilitycraft:dripstone_bricks_slab",
      "utilitycraft:dripstone_bricks_stairs",
      "utilitycraft:dripstone_bricks_three_steps_stairs",
      "utilitycraft:dripstone_bricks_vertical_slab",
      "utilitycraft:dripstone_tiles",
      "utilitycraft:dripstone_tiles_slab",
      "utilitycraft:dripstone_tiles_stairs",
      "utilitycraft:dripstone_tiles_three_steps_stairs",
      "utilitycraft:dripstone_tiles_vertical_slab",
      "utilitycraft:gilded_blackstone_slab",
      "utilitycraft:gilded_blackstone_stairs",
      "utilitycraft:gilded_blackstone_three_steps_stairs",
      "utilitycraft:gilded_blackstone_vertical_slab",
      "utilitycraft:glowing_obsidian",
      "utilitycraft:glowing_obsidian_slab",
      "utilitycraft:glowing_obsidian_stairs",
      "utilitycraft:glowing_obsidian_three_steps_stairs",
      "utilitycraft:glowing_obsidian_vertical_slab",
      "utilitycraft:golden_chisel",
      "utilitycraft:golden_glove",
      "utilitycraft:granite_bricks",
      "utilitycraft:granite_bricks_slab",
      "utilitycraft:granite_bricks_stairs",
      "utilitycraft:granite_bricks_three_steps_stairs",
      "utilitycraft:granite_bricks_vertical_slab",
      "utilitycraft:granite_slab",
      "utilitycraft:granite_stairs",
      "utilitycraft:granite_three_steps_stairs",
      "utilitycraft:granite_tiles",
      "utilitycraft:granite_tiles_slab",
      "utilitycraft:granite_tiles_stairs",
      "utilitycraft:granite_tiles_three_steps_stairs",
      "utilitycraft:granite_tiles_vertical_slab",
      "utilitycraft:granite_vertical_slab",
      "utilitycraft:iron_chisel",
      "utilitycraft:iron_glove",
      "utilitycraft:mossy_cobblestone_slab",
      "utilitycraft:mossy_cobblestone_stairs",
      "utilitycraft:mossy_cobblestone_three_steps_stairs",
      "utilitycraft:mossy_cobblestone_vertical_slab",
      "utilitycraft:mossy_stone_bricks_slab",
      "utilitycraft:mossy_stone_bricks_stairs",
      "utilitycraft:mossy_stone_bricks_three_steps_stairs",
      "utilitycraft:mossy_stone_bricks_vertical_slab",
      "utilitycraft:mud_bricks_slab",
      "utilitycraft:mud_bricks_stairs",
      "utilitycraft:mud_bricks_three_steps_stairs",
      "utilitycraft:mud_bricks_vertical_slab",
      "utilitycraft:netherite_chisel",
      "utilitycraft:netherite_glove",
      "utilitycraft:netherrack_slab",
      "utilitycraft:netherrack_stairs",
      "utilitycraft:netherrack_three_steps_stairs",
      "utilitycraft:netherrack_vertical_slab",
      "utilitycraft:obsidian_bricks",
      "utilitycraft:obsidian_bricks_slab",
      "utilitycraft:obsidian_bricks_stairs",
      "utilitycraft:obsidian_bricks_three_steps_stairs",
      "utilitycraft:obsidian_bricks_vertical_slab",
      "utilitycraft:obsidian_pillar",
      "utilitycraft:obsidian_tiles",
      "utilitycraft:obsidian_tiles_slab",
      "utilitycraft:obsidian_tiles_stairs",
      "utilitycraft:obsidian_tiles_three_steps_stairs",
      "utilitycraft:obsidian_tiles_vertical_slab",
      "utilitycraft:packed_mud_slab",
      "utilitycraft:packed_mud_stairs",
      "utilitycraft:packed_mud_three_steps_stairs",
      "utilitycraft:packed_mud_vertical_slab",
      "utilitycraft:polished_andesite_slab",
      "utilitycraft:polished_andesite_stairs",
      "utilitycraft:polished_andesite_three_steps_stairs",
      "utilitycraft:polished_andesite_vertical_slab",
      "utilitycraft:polished_blackstone_bricks_slab",
      "utilitycraft:polished_blackstone_bricks_stairs",
      "utilitycraft:polished_blackstone_bricks_three_steps_stairs",
      "utilitycraft:polished_blackstone_bricks_vertical_slab",
      "utilitycraft:polished_blackstone_slab",
      "utilitycraft:polished_blackstone_stairs",
      "utilitycraft:polished_blackstone_three_steps_stairs",
      "utilitycraft:polished_blackstone_vertical_slab",
      "utilitycraft:polished_calcite",
      "utilitycraft:polished_calcite_slab",
      "utilitycraft:polished_calcite_stairs",
      "utilitycraft:polished_calcite_three_steps_stairs",
      "utilitycraft:polished_calcite_vertical_slab",
      "utilitycraft:polished_deepslate_slab",
      "utilitycraft:polished_deepslate_stairs",
      "utilitycraft:polished_deepslate_three_steps_stairs",
      "utilitycraft:polished_deepslate_vertical_slab",
      "utilitycraft:polished_diorite_slab",
      "utilitycraft:polished_diorite_stairs",
      "utilitycraft:polished_diorite_three_steps_stairs",
      "utilitycraft:polished_diorite_vertical_slab",
      "utilitycraft:polished_dripstone",
      "utilitycraft:polished_dripstone_slab",
      "utilitycraft:polished_dripstone_stairs",
      "utilitycraft:polished_dripstone_three_steps_stairs",
      "utilitycraft:polished_dripstone_vertical_slab",
      "utilitycraft:polished_granite_slab",
      "utilitycraft:polished_granite_stairs",
      "utilitycraft:polished_granite_three_steps_stairs",
      "utilitycraft:polished_granite_vertical_slab",
      "utilitycraft:polished_obsidian",
      "utilitycraft:polished_obsidian_slab",
      "utilitycraft:polished_obsidian_stairs",
      "utilitycraft:polished_obsidian_three_steps_stairs",
      "utilitycraft:polished_obsidian_vertical_slab",
      "utilitycraft:polished_tuff_slab",
      "utilitycraft:polished_tuff_stairs",
      "utilitycraft:polished_tuff_three_steps_stairs",
      "utilitycraft:polished_tuff_vertical_slab",
      "utilitycraft:prismarine_bricks_slab",
      "utilitycraft:prismarine_bricks_stairs",
      "utilitycraft:prismarine_bricks_three_steps_stairs",
      "utilitycraft:prismarine_bricks_vertical_slab",
      "utilitycraft:prismarine_slab",
      "utilitycraft:prismarine_stairs",
      "utilitycraft:prismarine_three_steps_stairs",
      "utilitycraft:prismarine_vertical_slab",
      "utilitycraft:purpur_block_slab",
      "utilitycraft:purpur_block_stairs",
      "utilitycraft:purpur_block_three_steps_stairs",
      "utilitycraft:purpur_block_vertical_slab",
      "utilitycraft:quartz_bricks_slab",
      "utilitycraft:quartz_bricks_stairs",
      "utilitycraft:quartz_bricks_three_steps_stairs",
      "utilitycraft:quartz_bricks_vertical_slab",
      "utilitycraft:sanded_acacia_wood",
      "utilitycraft:sanded_bamboo_wood",
      "utilitycraft:sanded_birch_wood",
      "utilitycraft:sanded_cherry_wood",
      "utilitycraft:sanded_crimson_wood",
      "utilitycraft:sanded_dark_oak_wood",
      "utilitycraft:sanded_jungle_wood",
      "utilitycraft:sanded_mangrove_wood",
      "utilitycraft:sanded_oak_wood",
      "utilitycraft:sanded_pale_oak_wood",
      "utilitycraft:sanded_spruce_wood",
      "utilitycraft:sanded_warped_wood",
      "utilitycraft:smooth_andesite",
      "utilitycraft:smooth_andesite_slab",
      "utilitycraft:smooth_andesite_stairs",
      "utilitycraft:smooth_andesite_three_steps_stairs",
      "utilitycraft:smooth_andesite_vertical_slab",
      "utilitycraft:smooth_basalt_slab",
      "utilitycraft:smooth_basalt_stairs",
      "utilitycraft:smooth_basalt_three_steps_stairs",
      "utilitycraft:smooth_basalt_vertical_slab",
      "utilitycraft:smooth_blackstone",
      "utilitycraft:smooth_blackstone_slab",
      "utilitycraft:smooth_blackstone_stairs",
      "utilitycraft:smooth_blackstone_three_steps_stairs",
      "utilitycraft:smooth_blackstone_vertical_slab",
      "utilitycraft:smooth_calcite",
      "utilitycraft:smooth_calcite_slab",
      "utilitycraft:smooth_calcite_stairs",
      "utilitycraft:smooth_calcite_three_steps_stairs",
      "utilitycraft:smooth_calcite_vertical_slab",
      "utilitycraft:smooth_diorite",
      "utilitycraft:smooth_diorite_slab",
      "utilitycraft:smooth_diorite_stairs",
      "utilitycraft:smooth_diorite_three_steps_stairs",
      "utilitycraft:smooth_diorite_vertical_slab",
      "utilitycraft:smooth_dripstone",
      "utilitycraft:smooth_dripstone_slab",
      "utilitycraft:smooth_dripstone_stairs",
      "utilitycraft:smooth_dripstone_three_steps_stairs",
      "utilitycraft:smooth_dripstone_vertical_slab",
      "utilitycraft:smooth_granite",
      "utilitycraft:smooth_granite_slab",
      "utilitycraft:smooth_granite_stairs",
      "utilitycraft:smooth_granite_three_steps_stairs",
      "utilitycraft:smooth_granite_vertical_slab",
      "utilitycraft:smooth_quartz_slab",
      "utilitycraft:smooth_quartz_stairs",
      "utilitycraft:smooth_quartz_three_steps_stairs",
      "utilitycraft:smooth_quartz_vertical_slab",
      "utilitycraft:smooth_stone_slab",
      "utilitycraft:smooth_stone_stairs",
      "utilitycraft:smooth_stone_three_steps_stairs",
      "utilitycraft:smooth_stone_vertical_slab",
      "utilitycraft:smooth_tuff",
      "utilitycraft:smooth_tuff_slab",
      "utilitycraft:smooth_tuff_stairs",
      "utilitycraft:smooth_tuff_three_steps_stairs",
      "utilitycraft:smooth_tuff_vertical_slab",
      "utilitycraft:snowy_grass_block",
      "utilitycraft:stone_bricks_slab",
      "utilitycraft:stone_bricks_stairs",
      "utilitycraft:stone_bricks_three_steps_stairs",
      "utilitycraft:stone_bricks_vertical_slab",
      "utilitycraft:stone_chisel",
      "utilitycraft:stone_glove",
      "utilitycraft:stone_slab",
      "utilitycraft:stone_stairs",
      "utilitycraft:stone_three_steps_stairs",
      "utilitycraft:stone_vertical_slab",
      "utilitycraft:tuff_bricks_slab",
      "utilitycraft:tuff_bricks_stairs",
      "utilitycraft:tuff_bricks_three_steps_stairs",
      "utilitycraft:tuff_bricks_vertical_slab",
      "utilitycraft:tuff_slab",
      "utilitycraft:tuff_stairs",
      "utilitycraft:tuff_three_steps_stairs",
      "utilitycraft:tuff_tiles",
      "utilitycraft:tuff_tiles_slab",
      "utilitycraft:tuff_tiles_stairs",
      "utilitycraft:tuff_tiles_three_steps_stairs",
      "utilitycraft:tuff_tiles_vertical_slab",
      "utilitycraft:tuff_vertical_slab",
      "utilitycraft:wooden_chisel",
      "utilitycraft:wooden_glove"
    ]
  },
  {
    "key": "dorios_excavate",
    "name": "Dorios Excavate",
    "type": "addon",
    "namespace": "dorios",
    "content": [
      "dorios:settings_item"
    ]
  },
  {
    "key": "dorios_rpg_core",
    "name": "Dorios RPG Core",
    "type": "core",
    "namespace": "dorios",
    "content": [
      "dorios:recover_scroll",
      "dorios:scroll",
      "dorios:stats_scroll",
      "dorios:trinkets_inv"
    ]
  },
  {
    "key": "dorios_trinkets",
    "name": "Dorios Trinkets",
    "type": "addon",
    "namespace": "dorios",
    "content": [
      "dorios:abyssal_clam_shell",
      "dorios:abyssal_diver_helmet",
      "dorios:abyssal_essence",
      "dorios:abyssal_orb",
      "dorios:abyssal_sun_amulet",
      "dorios:black_heart",
      "dorios:blazed_heart_necklace",
      "dorios:blazing_amulet",
      "dorios:blood_boots",
      "dorios:blood_chestplate",
      "dorios:blood_helmet",
      "dorios:blood_leggings",
      "dorios:blood_pact",
      "dorios:blood_pendant",
      "dorios:bloodbound_amulet",
      "dorios:bloodbound_emblem",
      "dorios:bloodgem",
      "dorios:bloodstained_heart",
      "dorios:bloodtide_chalice",
      "dorios:broken_paladin_helmet",
      "dorios:candy_heart",
      "dorios:cloud_steps_boots",
      "dorios:dead_abyssal_orb",
      "dorios:dragon_heart",
      "dorios:empty_ring",
      "dorios:eternal_heart",
      "dorios:fire_claw",
      "dorios:fire_gauntlet",
      "dorios:frost_quiver",
      "dorios:guardian_ring",
      "dorios:healer_ring",
      "dorios:heavy_empty_ring",
      "dorios:heavy_guardian_ring",
      "dorios:heavy_healer_ring",
      "dorios:heavy_miner_ring",
      "dorios:heavy_runner_ring",
      "dorios:heavy_warrior_ring",
      "dorios:holy_cross",
      "dorios:ice_claw",
      "dorios:ice_gauntlet",
      "dorios:idle_bloom",
      "dorios:immaculate_heart",
      "dorios:lava_flow_0",
      "dorios:lava_flow_1",
      "dorios:lava_flow_2",
      "dorios:lava_solid_0",
      "dorios:lava_solid_1",
      "dorios:lava_solid_2",
      "dorios:lava_waders",
      "dorios:mender_pendant",
      "dorios:miner_ring",
      "dorios:molten_quiver",
      "dorios:night_vision_goggles",
      "dorios:night_vision_mask",
      "dorios:obsidian_skull",
      "dorios:paladin_boots",
      "dorios:paladin_chestplate",
      "dorios:paladin_helmet",
      "dorios:paladin_leggings",
      "dorios:purity_blossom",
      "dorios:rabbit_rush",
      "dorios:recover_scroll",
      "dorios:repair_talis",
      "dorios:restored_paladin_helmet",
      "dorios:rotten_heart",
      "dorios:runner_ring",
      "dorios:rush_of_fear",
      "dorios:sacred_heart",
      "dorios:scroll",
      "dorios:soul_heart",
      "dorios:stats_scroll",
      "dorios:strong_abyssal_ring",
      "dorios:strong_ancient_ring",
      "dorios:strong_blood_ring",
      "dorios:strong_breeze_ring",
      "dorios:strong_brute_ring",
      "dorios:strong_celestial_ring",
      "dorios:strong_echo_ring",
      "dorios:strong_ender_ring",
      "dorios:strong_fortress_ring",
      "dorios:strong_inferno_ring",
      "dorios:strong_jade_ring",
      "dorios:strong_shulker_ring",
      "dorios:strong_trader_ring",
      "dorios:tideforged_carapace",
      "dorios:tideforged_eye",
      "dorios:tideforged_heart",
      "dorios:tideforged_knuckles",
      "dorios:tideforged_pendant",
      "dorios:tideforged_ring",
      "dorios:tideforged_stars",
      "dorios:trinkets_inv",
      "dorios:venom_claw",
      "dorios:venom_gauntlet",
      "dorios:venom_quiver",
      "dorios:voodoo",
      "dorios:warden_heart",
      "dorios:warrior_ring",
      "dorios:wither_heart"
    ]
  },
  {
    "key": "utilitycraft_core",
    "name": "UtilityCraft",
    "type": "core",
    "namespace": "utilitycraft",
    "content": [
      "utilitycraft:acacia_tree",
      "utilitycraft:accelerator_clock",
      "utilitycraft:advanced_battery",
      "utilitycraft:advanced_chip",
      "utilitycraft:advanced_energy_receiver",
      "utilitycraft:advanced_energy_transmitter",
      "utilitycraft:advanced_fluid_tank",
      "utilitycraft:advanced_furnator",
      "utilitycraft:advanced_magmator",
      "utilitycraft:advanced_solar_panel",
      "utilitycraft:advanced_thermo_generator",
      "utilitycraft:advanced_wind_turbine",
      "utilitycraft:amethyst_crop",
      "utilitycraft:amethyst_dust",
      "utilitycraft:amethyst_seeds",
      "utilitycraft:amogus",
      "utilitycraft:ancient_debris_chunk",
      "utilitycraft:andesite_pebble",
      "utilitycraft:antidote_potion",
      "utilitycraft:apple_sapling",
      "utilitycraft:apple_tree",
      "utilitycraft:arrow_down_0",
      "utilitycraft:arrow_down_1",
      "utilitycraft:arrow_down_10",
      "utilitycraft:arrow_down_11",
      "utilitycraft:arrow_down_12",
      "utilitycraft:arrow_down_13",
      "utilitycraft:arrow_down_14",
      "utilitycraft:arrow_down_15",
      "utilitycraft:arrow_down_16",
      "utilitycraft:arrow_down_2",
      "utilitycraft:arrow_down_3",
      "utilitycraft:arrow_down_4",
      "utilitycraft:arrow_down_5",
      "utilitycraft:arrow_down_6",
      "utilitycraft:arrow_down_7",
      "utilitycraft:arrow_down_8",
      "utilitycraft:arrow_down_9",
      "utilitycraft:arrow_indicator",
      "utilitycraft:arrow_indicator_90",
      "utilitycraft:arrow_right_0",
      "utilitycraft:arrow_right_1",
      "utilitycraft:arrow_right_10",
      "utilitycraft:arrow_right_11",
      "utilitycraft:arrow_right_12",
      "utilitycraft:arrow_right_13",
      "utilitycraft:arrow_right_14",
      "utilitycraft:arrow_right_15",
      "utilitycraft:arrow_right_16",
      "utilitycraft:arrow_right_2",
      "utilitycraft:arrow_right_3",
      "utilitycraft:arrow_right_4",
      "utilitycraft:arrow_right_5",
      "utilitycraft:arrow_right_6",
      "utilitycraft:arrow_right_7",
      "utilitycraft:arrow_right_8",
      "utilitycraft:arrow_right_9",
      "utilitycraft:asphalt",
      "utilitycraft:assembler",
      "utilitycraft:autofisher",
      "utilitycraft:autosieve",
      "utilitycraft:bag_of_beetroot_seeds",
      "utilitycraft:bag_of_black_dye",
      "utilitycraft:bag_of_blaze_powder",
      "utilitycraft:bag_of_blue_dye",
      "utilitycraft:bag_of_brown_dye",
      "utilitycraft:bag_of_cocoa_beans",
      "utilitycraft:bag_of_cyan_dye",
      "utilitycraft:bag_of_feathers",
      "utilitycraft:bag_of_glowstone_dust",
      "utilitycraft:bag_of_gray_dye",
      "utilitycraft:bag_of_green_dye",
      "utilitycraft:bag_of_gunpowder",
      "utilitycraft:bag_of_light_blue_dye",
      "utilitycraft:bag_of_light_gray_dye",
      "utilitycraft:bag_of_lime_dye",
      "utilitycraft:bag_of_magenta_dye",
      "utilitycraft:bag_of_melon_seeds",
      "utilitycraft:bag_of_orange_dye",
      "utilitycraft:bag_of_pink_dye",
      "utilitycraft:bag_of_pitcher_pod",
      "utilitycraft:bag_of_pumpkin_seeds",
      "utilitycraft:bag_of_purple_dye",
      "utilitycraft:bag_of_red_dye",
      "utilitycraft:bag_of_sugar",
      "utilitycraft:bag_of_torchflower_seeds",
      "utilitycraft:bag_of_wheat_seeds",
      "utilitycraft:bag_of_white_dye",
      "utilitycraft:bag_of_yellow_dye",
      "utilitycraft:bamboo",
      "utilitycraft:basalt_pebble",
      "utilitycraft:base_seeds",
      "utilitycraft:base_upgrade",
      "utilitycraft:basic_battery",
      "utilitycraft:basic_chip",
      "utilitycraft:basic_energy_receiver",
      "utilitycraft:basic_energy_transmitter",
      "utilitycraft:basic_fluid_tank",
      "utilitycraft:basic_furnator",
      "utilitycraft:basic_magmator",
      "utilitycraft:basic_solar_panel",
      "utilitycraft:basic_thermo_generator",
      "utilitycraft:basic_trash_can",
      "utilitycraft:basic_wind_turbine",
      "utilitycraft:beetroot",
      "utilitycraft:big_torch",
      "utilitycraft:bionic_arm",
      "utilitycraft:birch_tree",
      "utilitycraft:black_amogus",
      "utilitycraft:black_soil",
      "utilitycraft:blackstone_pebble",
      "utilitycraft:blaze_block",
      "utilitycraft:blaze_crop",
      "utilitycraft:blaze_essence",
      "utilitycraft:blaze_seeds",
      "utilitycraft:block_breaker",
      "utilitycraft:block_placer",
      "utilitycraft:blue_soil",
      "utilitycraft:blueprint",
      "utilitycraft:blueprint_paper",
      "utilitycraft:bomb",
      "utilitycraft:bonsai",
      "utilitycraft:bundle_of_blaze_rods",
      "utilitycraft:bundle_of_breeze_rods",
      "utilitycraft:bundle_of_sticks",
      "utilitycraft:cactus",
      "utilitycraft:calcite_pebble",
      "utilitycraft:carrot",
      "utilitycraft:charcoal_block",
      "utilitycraft:charcoal_dust",
      "utilitycraft:cherry_tree",
      "utilitycraft:chicken_essence",
      "utilitycraft:chip",
      "utilitycraft:chorus_fruit",
      "utilitycraft:coal_chunk",
      "utilitycraft:coal_crop",
      "utilitycraft:coal_dust",
      "utilitycraft:coal_seeds",
      "utilitycraft:cobble_gen_0",
      "utilitycraft:cobble_gen_1",
      "utilitycraft:cobble_gen_2",
      "utilitycraft:cobble_gen_3",
      "utilitycraft:cobble_gen_4",
      "utilitycraft:cobble_gen_5",
      "utilitycraft:compressed_amethyst_block",
      "utilitycraft:compressed_amethyst_block_2",
      "utilitycraft:compressed_amethyst_block_3",
      "utilitycraft:compressed_amethyst_block_4",
      "utilitycraft:compressed_blackstone",
      "utilitycraft:compressed_blackstone_2",
      "utilitycraft:compressed_blackstone_3",
      "utilitycraft:compressed_blackstone_4",
      "utilitycraft:compressed_block",
      "utilitycraft:compressed_brute_steel_block",
      "utilitycraft:compressed_brute_steel_block_2",
      "utilitycraft:compressed_brute_steel_block_3",
      "utilitycraft:compressed_brute_steel_block_4",
      "utilitycraft:compressed_charcoal_block",
      "utilitycraft:compressed_charcoal_block_2",
      "utilitycraft:compressed_charcoal_block_3",
      "utilitycraft:compressed_charcoal_block_4",
      "utilitycraft:compressed_coal_block",
      "utilitycraft:compressed_coal_block_2",
      "utilitycraft:compressed_coal_block_3",
      "utilitycraft:compressed_coal_block_4",
      "utilitycraft:compressed_cobbled_deepslate",
      "utilitycraft:compressed_cobbled_deepslate_2",
      "utilitycraft:compressed_cobbled_deepslate_3",
      "utilitycraft:compressed_cobbled_deepslate_4",
      "utilitycraft:compressed_cobblestone",
      "utilitycraft:compressed_copper_block",
      "utilitycraft:compressed_copper_block_2",
      "utilitycraft:compressed_copper_block_3",
      "utilitycraft:compressed_copper_block_4",
      "utilitycraft:compressed_crushed_cobbled_deepslate",
      "utilitycraft:compressed_crushed_cobbled_deepslate_2",
      "utilitycraft:compressed_crushed_cobbled_deepslate_3",
      "utilitycraft:compressed_crushed_cobbled_deepslate_4",
      "utilitycraft:compressed_crushed_endstone",
      "utilitycraft:compressed_crushed_endstone_2",
      "utilitycraft:compressed_crushed_endstone_3",
      "utilitycraft:compressed_crushed_endstone_4",
      "utilitycraft:compressed_crushed_netherrack",
      "utilitycraft:compressed_crushed_netherrack_2",
      "utilitycraft:compressed_crushed_netherrack_3",
      "utilitycraft:compressed_crushed_netherrack_4",
      "utilitycraft:compressed_cry_obsidian",
      "utilitycraft:compressed_cry_obsidian_2",
      "utilitycraft:compressed_cry_obsidian_3",
      "utilitycraft:compressed_cry_obsidian_4",
      "utilitycraft:compressed_deepslate",
      "utilitycraft:compressed_deepslate_2",
      "utilitycraft:compressed_deepslate_3",
      "utilitycraft:compressed_deepslate_4",
      "utilitycraft:compressed_diamond_block",
      "utilitycraft:compressed_diamond_block_2",
      "utilitycraft:compressed_diamond_block_3",
      "utilitycraft:compressed_diamond_block_4",
      "utilitycraft:compressed_dirt",
      "utilitycraft:compressed_dirt_2",
      "utilitycraft:compressed_dirt_3",
      "utilitycraft:compressed_dirt_4",
      "utilitycraft:compressed_emerald_block",
      "utilitycraft:compressed_emerald_block_2",
      "utilitycraft:compressed_emerald_block_3",
      "utilitycraft:compressed_emerald_block_4",
      "utilitycraft:compressed_endstone",
      "utilitycraft:compressed_endstone_2",
      "utilitycraft:compressed_endstone_3",
      "utilitycraft:compressed_endstone_4",
      "utilitycraft:compressed_energized_iron_block",
      "utilitycraft:compressed_energized_iron_block_2",
      "utilitycraft:compressed_energized_iron_block_3",
      "utilitycraft:compressed_energized_iron_block_4",
      "utilitycraft:compressed_exposed_copper_block",
      "utilitycraft:compressed_exposed_copper_block_2",
      "utilitycraft:compressed_exposed_copper_block_3",
      "utilitycraft:compressed_exposed_copper_block_4",
      "utilitycraft:compressed_flint_block",
      "utilitycraft:compressed_flint_block_2",
      "utilitycraft:compressed_flint_block_3",
      "utilitycraft:compressed_flint_block_4",
      "utilitycraft:compressed_glass",
      "utilitycraft:compressed_glass_2",
      "utilitycraft:compressed_glass_3",
      "utilitycraft:compressed_glass_4",
      "utilitycraft:compressed_gold_block",
      "utilitycraft:compressed_gold_block_2",
      "utilitycraft:compressed_gold_block_3",
      "utilitycraft:compressed_gold_block_4",
      "utilitycraft:compressed_gravel",
      "utilitycraft:compressed_gravel_2",
      "utilitycraft:compressed_gravel_3",
      "utilitycraft:compressed_gravel_4",
      "utilitycraft:compressed_iron_block",
      "utilitycraft:compressed_iron_block_2",
      "utilitycraft:compressed_iron_block_3",
      "utilitycraft:compressed_iron_block_4",
      "utilitycraft:compressed_lapislazuli_block",
      "utilitycraft:compressed_lapislazuli_block_2",
      "utilitycraft:compressed_lapislazuli_block_3",
      "utilitycraft:compressed_lapislazuli_block_4",
      "utilitycraft:compressed_netherite_block",
      "utilitycraft:compressed_netherite_block_2",
      "utilitycraft:compressed_netherite_block_3",
      "utilitycraft:compressed_netherite_block_4",
      "utilitycraft:compressed_netherrack",
      "utilitycraft:compressed_netherrack_2",
      "utilitycraft:compressed_netherrack_3",
      "utilitycraft:compressed_netherrack_4",
      "utilitycraft:compressed_obsidian",
      "utilitycraft:compressed_obsidian_2",
      "utilitycraft:compressed_obsidian_3",
      "utilitycraft:compressed_obsidian_4",
      "utilitycraft:compressed_oxidized_copper_block",
      "utilitycraft:compressed_oxidized_copper_block_2",
      "utilitycraft:compressed_oxidized_copper_block_3",
      "utilitycraft:compressed_oxidized_copper_block_4",
      "utilitycraft:compressed_quartz_block",
      "utilitycraft:compressed_quartz_block_2",
      "utilitycraft:compressed_quartz_block_3",
      "utilitycraft:compressed_quartz_block_4",
      "utilitycraft:compressed_raw_copper_block",
      "utilitycraft:compressed_raw_copper_block_2",
      "utilitycraft:compressed_raw_copper_block_3",
      "utilitycraft:compressed_raw_copper_block_4",
      "utilitycraft:compressed_raw_gold_block",
      "utilitycraft:compressed_raw_gold_block_2",
      "utilitycraft:compressed_raw_gold_block_3",
      "utilitycraft:compressed_raw_gold_block_4",
      "utilitycraft:compressed_raw_iron_block",
      "utilitycraft:compressed_raw_iron_block_2",
      "utilitycraft:compressed_raw_iron_block_3",
      "utilitycraft:compressed_raw_iron_block_4",
      "utilitycraft:compressed_redstone_block",
      "utilitycraft:compressed_redstone_block_2",
      "utilitycraft:compressed_redstone_block_3",
      "utilitycraft:compressed_redstone_block_4",
      "utilitycraft:compressed_sand",
      "utilitycraft:compressed_sand_2",
      "utilitycraft:compressed_sand_3",
      "utilitycraft:compressed_sand_4",
      "utilitycraft:compressed_steel_block",
      "utilitycraft:compressed_steel_block_2",
      "utilitycraft:compressed_steel_block_3",
      "utilitycraft:compressed_steel_block_4",
      "utilitycraft:compressed_stone",
      "utilitycraft:compressed_stone_2",
      "utilitycraft:compressed_stone_3",
      "utilitycraft:compressed_stone_4",
      "utilitycraft:compressed_weathered_copper_block",
      "utilitycraft:compressed_weathered_copper_block_2",
      "utilitycraft:compressed_weathered_copper_block_3",
      "utilitycraft:compressed_weathered_copper_block_4",
      "utilitycraft:container_filler",
      "utilitycraft:conveyor_declined",
      "utilitycraft:conveyor_horizontal",
      "utilitycraft:conveyor_inclined",
      "utilitycraft:copper_aiot",
      "utilitycraft:copper_chunk",
      "utilitycraft:copper_crop",
      "utilitycraft:copper_dust",
      "utilitycraft:copper_fishing_net",
      "utilitycraft:copper_hammer",
      "utilitycraft:copper_mesh",
      "utilitycraft:copper_paxel",
      "utilitycraft:copper_plate",
      "utilitycraft:copper_seeds",
      "utilitycraft:cow_essence",
      "utilitycraft:creeper_essence",
      "utilitycraft:crimson_tree",
      "utilitycraft:crucible",
      "utilitycraft:crushed_cobbled_deepslate",
      "utilitycraft:crushed_deepslate_handful",
      "utilitycraft:crushed_endstone",
      "utilitycraft:crushed_endstone_handful",
      "utilitycraft:crushed_kelp",
      "utilitycraft:crushed_netherrack",
      "utilitycraft:crushed_netherrack_handful",
      "utilitycraft:crusher",
      "utilitycraft:crying_obsidian_dust",
      "utilitycraft:damage_upgrade",
      "utilitycraft:darkoak_tree",
      "utilitycraft:deepslate_coal_chunk",
      "utilitycraft:deepslate_diamond_chunk",
      "utilitycraft:deepslate_emerald_chunk",
      "utilitycraft:deepslate_gold_chunk",
      "utilitycraft:deepslate_iron_chunk",
      "utilitycraft:deepslate_lapislazuli_chunk",
      "utilitycraft:deepslate_pebble",
      "utilitycraft:deepslate_redstone_chunk",
      "utilitycraft:diamond_aiot",
      "utilitycraft:diamond_chunk",
      "utilitycraft:diamond_crop",
      "utilitycraft:diamond_dust",
      "utilitycraft:diamond_fishing_net",
      "utilitycraft:diamond_hammer",
      "utilitycraft:diamond_mesh",
      "utilitycraft:diamond_paxel",
      "utilitycraft:diamond_seeds",
      "utilitycraft:diamond_shard",
      "utilitycraft:digitizer",
      "utilitycraft:diorite_pebble",
      "utilitycraft:dirt_handful",
      "utilitycraft:double_compressed_cobblestone",
      "utilitycraft:drill",
      "utilitycraft:drill_placer",
      "utilitycraft:dripstone_pebble",
      "utilitycraft:dyes_crop",
      "utilitycraft:dyes_seeds",
      "utilitycraft:dynamite",
      "utilitycraft:electro_press",
      "utilitycraft:elevator",
      "utilitycraft:emerald_chunk",
      "utilitycraft:emerald_crop",
      "utilitycraft:emerald_dust",
      "utilitycraft:emerald_fishing_net",
      "utilitycraft:emerald_mesh",
      "utilitycraft:emerald_seeds",
      "utilitycraft:emerald_shard",
      "utilitycraft:empty_fluid_bar",
      "utilitycraft:ender_hopper",
      "utilitycraft:ender_pearl_dust",
      "utilitycraft:enderman_essence",
      "utilitycraft:enderpearl_crop",
      "utilitycraft:enderpearl_seeds",
      "utilitycraft:endstone_pebble",
      "utilitycraft:energized_iron_block",
      "utilitycraft:energized_iron_dust",
      "utilitycraft:energized_iron_ingot",
      "utilitycraft:energized_iron_nugget",
      "utilitycraft:energized_iron_plate",
      "utilitycraft:energy_00",
      "utilitycraft:energy_01",
      "utilitycraft:energy_02",
      "utilitycraft:energy_03",
      "utilitycraft:energy_04",
      "utilitycraft:energy_05",
      "utilitycraft:energy_06",
      "utilitycraft:energy_07",
      "utilitycraft:energy_08",
      "utilitycraft:energy_09",
      "utilitycraft:energy_10",
      "utilitycraft:energy_11",
      "utilitycraft:energy_12",
      "utilitycraft:energy_13",
      "utilitycraft:energy_14",
      "utilitycraft:energy_15",
      "utilitycraft:energy_16",
      "utilitycraft:energy_17",
      "utilitycraft:energy_18",
      "utilitycraft:energy_19",
      "utilitycraft:energy_20",
      "utilitycraft:energy_21",
      "utilitycraft:energy_22",
      "utilitycraft:energy_23",
      "utilitycraft:energy_24",
      "utilitycraft:energy_25",
      "utilitycraft:energy_26",
      "utilitycraft:energy_27",
      "utilitycraft:energy_28",
      "utilitycraft:energy_29",
      "utilitycraft:energy_30",
      "utilitycraft:energy_31",
      "utilitycraft:energy_32",
      "utilitycraft:energy_33",
      "utilitycraft:energy_34",
      "utilitycraft:energy_35",
      "utilitycraft:energy_36",
      "utilitycraft:energy_37",
      "utilitycraft:energy_38",
      "utilitycraft:energy_39",
      "utilitycraft:energy_40",
      "utilitycraft:energy_41",
      "utilitycraft:energy_42",
      "utilitycraft:energy_43",
      "utilitycraft:energy_44",
      "utilitycraft:energy_45",
      "utilitycraft:energy_46",
      "utilitycraft:energy_47",
      "utilitycraft:energy_48",
      "utilitycraft:energy_cable",
      "utilitycraft:energy_upgrade",
      "utilitycraft:essence_vessel",
      "utilitycraft:expert_battery",
      "utilitycraft:expert_chip",
      "utilitycraft:expert_energy_receiver",
      "utilitycraft:expert_energy_transmitter",
      "utilitycraft:expert_fluid_tank",
      "utilitycraft:expert_furnator",
      "utilitycraft:expert_magmator",
      "utilitycraft:expert_solar_panel",
      "utilitycraft:expert_thermo_generator",
      "utilitycraft:expert_wind_turbine",
      "utilitycraft:fan",
      "utilitycraft:fiber",
      "utilitycraft:filter_upgrade",
      "utilitycraft:flint_block",
      "utilitycraft:flint_knife",
      "utilitycraft:flint_mesh",
      "utilitycraft:fluid_extractor",
      "utilitycraft:fluid_extractor_blue",
      "utilitycraft:fluid_extractor_green",
      "utilitycraft:fluid_extractor_purple",
      "utilitycraft:fluid_extractor_red",
      "utilitycraft:fluid_pipe",
      "utilitycraft:fluid_pipe_blue",
      "utilitycraft:fluid_pipe_green",
      "utilitycraft:fluid_pipe_purple",
      "utilitycraft:fluid_pipe_red",
      "utilitycraft:fluid_pump",
      "utilitycraft:fluid_tank_lava",
      "utilitycraft:fluid_tank_milk",
      "utilitycraft:fluid_tank_water",
      "utilitycraft:fluid_tank_xp",
      "utilitycraft:fuel_bar_0",
      "utilitycraft:fuel_bar_1",
      "utilitycraft:fuel_bar_10",
      "utilitycraft:fuel_bar_11",
      "utilitycraft:fuel_bar_12",
      "utilitycraft:fuel_bar_13",
      "utilitycraft:fuel_bar_14",
      "utilitycraft:fuel_bar_15",
      "utilitycraft:fuel_bar_16",
      "utilitycraft:fuel_bar_2",
      "utilitycraft:fuel_bar_3",
      "utilitycraft:fuel_bar_4",
      "utilitycraft:fuel_bar_5",
      "utilitycraft:fuel_bar_6",
      "utilitycraft:fuel_bar_7",
      "utilitycraft:fuel_bar_8",
      "utilitycraft:fuel_bar_9",
      "utilitycraft:geode",
      "utilitycraft:ghast_crop",
      "utilitycraft:ghast_seeds",
      "utilitycraft:gilded_blackstone_pebble",
      "utilitycraft:glass_crop",
      "utilitycraft:glass_seeds",
      "utilitycraft:glowstone_crop",
      "utilitycraft:glowstone_seeds",
      "utilitycraft:gold_chunk",
      "utilitycraft:gold_crop",
      "utilitycraft:gold_dust",
      "utilitycraft:gold_plate",
      "utilitycraft:gold_seeds",
      "utilitycraft:golden_aiot",
      "utilitycraft:golden_fishing_net",
      "utilitycraft:golden_hammer",
      "utilitycraft:golden_mesh",
      "utilitycraft:golden_paxel",
      "utilitycraft:granite_pebble",
      "utilitycraft:gravel_fragments",
      "utilitycraft:grenade",
      "utilitycraft:gunpowder_crop",
      "utilitycraft:gunpowder_seeds",
      "utilitycraft:harvester",
      "utilitycraft:heavy_drill",
      "utilitycraft:hoglin_essence",
      "utilitycraft:honey_ball",
      "utilitycraft:honey_crop",
      "utilitycraft:honey_seeds",
      "utilitycraft:hopper",
      "utilitycraft:incinerator",
      "utilitycraft:induction_anvil",
      "utilitycraft:infuser",
      "utilitycraft:iron_aiot",
      "utilitycraft:iron_chunk",
      "utilitycraft:iron_crop",
      "utilitycraft:iron_dust",
      "utilitycraft:iron_fishing_net",
      "utilitycraft:iron_hammer",
      "utilitycraft:iron_mesh",
      "utilitycraft:iron_paxel",
      "utilitycraft:iron_plate",
      "utilitycraft:iron_seeds",
      "utilitycraft:item_conduit",
      "utilitycraft:item_conduit_blue",
      "utilitycraft:item_conduit_purple",
      "utilitycraft:item_conduit_red",
      "utilitycraft:item_conduit_yellow",
      "utilitycraft:item_exporter",
      "utilitycraft:item_exporter_blue",
      "utilitycraft:item_exporter_purple",
      "utilitycraft:item_exporter_red",
      "utilitycraft:item_exporter_yellow",
      "utilitycraft:item_importer",
      "utilitycraft:item_importer_blue",
      "utilitycraft:item_importer_purple",
      "utilitycraft:item_importer_red",
      "utilitycraft:item_importer_yellow",
      "utilitycraft:jar_of_cookies",
      "utilitycraft:jar_of_ghast_tears",
      "utilitycraft:jar_of_glow_ink",
      "utilitycraft:jar_of_ink",
      "utilitycraft:jungle_tree",
      "utilitycraft:kelp",
      "utilitycraft:lantern",
      "utilitycraft:lapis_crop",
      "utilitycraft:lapis_seeds",
      "utilitycraft:lapislazuli_chunk",
      "utilitycraft:lava_00",
      "utilitycraft:lava_01",
      "utilitycraft:lava_02",
      "utilitycraft:lava_03",
      "utilitycraft:lava_04",
      "utilitycraft:lava_05",
      "utilitycraft:lava_06",
      "utilitycraft:lava_07",
      "utilitycraft:lava_08",
      "utilitycraft:lava_09",
      "utilitycraft:lava_10",
      "utilitycraft:lava_11",
      "utilitycraft:lava_12",
      "utilitycraft:lava_13",
      "utilitycraft:lava_14",
      "utilitycraft:lava_15",
      "utilitycraft:lava_16",
      "utilitycraft:lava_17",
      "utilitycraft:lava_18",
      "utilitycraft:lava_19",
      "utilitycraft:lava_20",
      "utilitycraft:lava_21",
      "utilitycraft:lava_22",
      "utilitycraft:lava_23",
      "utilitycraft:lava_24",
      "utilitycraft:lava_25",
      "utilitycraft:lava_26",
      "utilitycraft:lava_27",
      "utilitycraft:lava_28",
      "utilitycraft:lava_29",
      "utilitycraft:lava_30",
      "utilitycraft:lava_31",
      "utilitycraft:lava_32",
      "utilitycraft:lava_33",
      "utilitycraft:lava_34",
      "utilitycraft:lava_35",
      "utilitycraft:lava_36",
      "utilitycraft:lava_37",
      "utilitycraft:lava_38",
      "utilitycraft:lava_39",
      "utilitycraft:lava_40",
      "utilitycraft:lava_41",
      "utilitycraft:lava_42",
      "utilitycraft:lava_43",
      "utilitycraft:lava_44",
      "utilitycraft:lava_45",
      "utilitycraft:lava_46",
      "utilitycraft:lava_47",
      "utilitycraft:lava_48",
      "utilitycraft:lava_ball",
      "utilitycraft:lava_crop",
      "utilitycraft:lava_seeds",
      "utilitycraft:leather_crop",
      "utilitycraft:leather_seeds",
      "utilitycraft:lucky_fishing_rod_item",
      "utilitycraft:lucky_pickaxe",
      "utilitycraft:lucky_pickaxe_item",
      "utilitycraft:lucky_sword",
      "utilitycraft:lucky_sword_item",
      "utilitycraft:machine",
      "utilitycraft:machine_case",
      "utilitycraft:magma_cube_essence",
      "utilitycraft:magmatic_chamber",
      "utilitycraft:mangrove_tree",
      "utilitycraft:mechanic_dropper",
      "utilitycraft:mechanic_hopper",
      "utilitycraft:mechanic_upper",
      "utilitycraft:mechanical_spawner",
      "utilitycraft:mechanical_spawner_blaze",
      "utilitycraft:mechanical_spawner_chicken",
      "utilitycraft:mechanical_spawner_cow",
      "utilitycraft:mechanical_spawner_creeper",
      "utilitycraft:mechanical_spawner_enderman",
      "utilitycraft:mechanical_spawner_hoglin",
      "utilitycraft:mechanical_spawner_magma_cube",
      "utilitycraft:mechanical_spawner_mooshroom",
      "utilitycraft:mechanical_spawner_pig",
      "utilitycraft:mechanical_spawner_sheep",
      "utilitycraft:mechanical_spawner_skeleton",
      "utilitycraft:mechanical_spawner_slime",
      "utilitycraft:mechanical_spawner_spider",
      "utilitycraft:mechanical_spawner_wither_skeleton",
      "utilitycraft:mechanical_spawner_zombie",
      "utilitycraft:melon",
      "utilitycraft:milk_00",
      "utilitycraft:milk_01",
      "utilitycraft:milk_02",
      "utilitycraft:milk_03",
      "utilitycraft:milk_04",
      "utilitycraft:milk_05",
      "utilitycraft:milk_06",
      "utilitycraft:milk_07",
      "utilitycraft:milk_08",
      "utilitycraft:milk_09",
      "utilitycraft:milk_10",
      "utilitycraft:milk_11",
      "utilitycraft:milk_12",
      "utilitycraft:milk_13",
      "utilitycraft:milk_14",
      "utilitycraft:milk_15",
      "utilitycraft:milk_16",
      "utilitycraft:milk_17",
      "utilitycraft:milk_18",
      "utilitycraft:milk_19",
      "utilitycraft:milk_20",
      "utilitycraft:milk_21",
      "utilitycraft:milk_22",
      "utilitycraft:milk_23",
      "utilitycraft:milk_24",
      "utilitycraft:milk_25",
      "utilitycraft:milk_26",
      "utilitycraft:milk_27",
      "utilitycraft:milk_28",
      "utilitycraft:milk_29",
      "utilitycraft:milk_30",
      "utilitycraft:milk_31",
      "utilitycraft:milk_32",
      "utilitycraft:milk_33",
      "utilitycraft:milk_34",
      "utilitycraft:milk_35",
      "utilitycraft:milk_36",
      "utilitycraft:milk_37",
      "utilitycraft:milk_38",
      "utilitycraft:milk_39",
      "utilitycraft:milk_40",
      "utilitycraft:milk_41",
      "utilitycraft:milk_42",
      "utilitycraft:milk_43",
      "utilitycraft:milk_44",
      "utilitycraft:milk_45",
      "utilitycraft:milk_46",
      "utilitycraft:milk_47",
      "utilitycraft:milk_48",
      "utilitycraft:mob_grinder",
      "utilitycraft:mooshroom_essence",
      "utilitycraft:mortar",
      "utilitycraft:mud_ball",
      "utilitycraft:mushroom",
      "utilitycraft:nether_gold_chunk",
      "utilitycraft:nether_quartz_chunk",
      "utilitycraft:nether_star_fragment",
      "utilitycraft:nether_star_seeds",
      "utilitycraft:nether_wart",
      "utilitycraft:netherite_aiot",
      "utilitycraft:netherite_crop",
      "utilitycraft:netherite_dust",
      "utilitycraft:netherite_fishing_net",
      "utilitycraft:netherite_hammer",
      "utilitycraft:netherite_mesh",
      "utilitycraft:netherite_nugget",
      "utilitycraft:netherite_paxel",
      "utilitycraft:netherite_plate",
      "utilitycraft:netherite_scrap_dust",
      "utilitycraft:netherite_seeds",
      "utilitycraft:netherrack_pebble",
      "utilitycraft:netherstar_crop",
      "utilitycraft:nonuple_compressed_cobblestone",
      "utilitycraft:oak_tree",
      "utilitycraft:obsidian_crop",
      "utilitycraft:obsidian_dust",
      "utilitycraft:obsidian_seeds",
      "utilitycraft:octuple_compressed_cobblestone",
      "utilitycraft:pale_oak_tree",
      "utilitycraft:pedestal",
      "utilitycraft:pig_essence",
      "utilitycraft:pipe",
      "utilitycraft:potato",
      "utilitycraft:prismarine_crystal_crop",
      "utilitycraft:prismarine_crystals_seeds",
      "utilitycraft:prismarine_shards_crop",
      "utilitycraft:prismarine_shards_seeds",
      "utilitycraft:pumpkin",
      "utilitycraft:quadruple_compressed_cobblestone",
      "utilitycraft:quantity_upgrade",
      "utilitycraft:quartz_crop",
      "utilitycraft:quartz_dust",
      "utilitycraft:quartz_seeds",
      "utilitycraft:quintuple_compressed_cobblestone",
      "utilitycraft:range_upgrade",
      "utilitycraft:raw_energized_iron",
      "utilitycraft:raw_energized_iron_block",
      "utilitycraft:raw_leather",
      "utilitycraft:raw_steel",
      "utilitycraft:raw_steel_block",
      "utilitycraft:ream_of_paper",
      "utilitycraft:red_sand_handful",
      "utilitycraft:red_soil",
      "utilitycraft:redstone_chunk",
      "utilitycraft:redstone_crop",
      "utilitycraft:redstone_seeds",
      "utilitycraft:sand_handful",
      "utilitycraft:seed_synthesizer",
      "utilitycraft:septuple_compressed_cobblestone",
      "utilitycraft:settings",
      "utilitycraft:sextuple_compressed_cobblestone",
      "utilitycraft:sheep_essence",
      "utilitycraft:shulker_crop",
      "utilitycraft:shulker_seeds",
      "utilitycraft:shulker_shell_shard",
      "utilitycraft:sieve",
      "utilitycraft:sink",
      "utilitycraft:skeleton_essence",
      "utilitycraft:slime_crop",
      "utilitycraft:slime_essence",
      "utilitycraft:slime_seeds",
      "utilitycraft:smart_filter_upgrade",
      "utilitycraft:smeltflare",
      "utilitycraft:smelting_pickaxe",
      "utilitycraft:souls_handful",
      "utilitycraft:spawner_core",
      "utilitycraft:speed_upgrade",
      "utilitycraft:spider_essence",
      "utilitycraft:spool_of_strings",
      "utilitycraft:spruce_tree",
      "utilitycraft:stabilized_obsidian_dust",
      "utilitycraft:steel_aiot",
      "utilitycraft:steel_axe",
      "utilitycraft:steel_block",
      "utilitycraft:steel_dust",
      "utilitycraft:steel_hammer",
      "utilitycraft:steel_hoe",
      "utilitycraft:steel_ingot",
      "utilitycraft:steel_nugget",
      "utilitycraft:steel_paxel",
      "utilitycraft:steel_pickaxe",
      "utilitycraft:steel_plate",
      "utilitycraft:steel_shovel",
      "utilitycraft:steel_sword",
      "utilitycraft:stone_aiot",
      "utilitycraft:stone_hammer",
      "utilitycraft:stone_paxel",
      "utilitycraft:stone_pebble",
      "utilitycraft:string_fishing_net",
      "utilitycraft:string_mesh",
      "utilitycraft:sugarcane",
      "utilitycraft:sweet_berries",
      "utilitycraft:totem_crop",
      "utilitycraft:totem_seeds",
      "utilitycraft:totem_shard",
      "utilitycraft:tractor",
      "utilitycraft:tractor_placer",
      "utilitycraft:triple_compressed_cobblestone",
      "utilitycraft:tuff_pebble",
      "utilitycraft:ultimate_battery",
      "utilitycraft:ultimate_chip",
      "utilitycraft:ultimate_energy_receiver",
      "utilitycraft:ultimate_energy_transmitter",
      "utilitycraft:ultimate_fluid_tank",
      "utilitycraft:ultimate_furnator",
      "utilitycraft:ultimate_magmator",
      "utilitycraft:ultimate_solar_panel",
      "utilitycraft:ultimate_thermo_generator",
      "utilitycraft:ultimate_upgrade",
      "utilitycraft:ultimate_wind_turbine",
      "utilitycraft:utility_table",
      "utilitycraft:vase_of_fermented_spider_eyes",
      "utilitycraft:vase_of_spider_eye",
      "utilitycraft:warped_tree",
      "utilitycraft:water_00",
      "utilitycraft:water_01",
      "utilitycraft:water_02",
      "utilitycraft:water_03",
      "utilitycraft:water_04",
      "utilitycraft:water_05",
      "utilitycraft:water_06",
      "utilitycraft:water_07",
      "utilitycraft:water_08",
      "utilitycraft:water_09",
      "utilitycraft:water_10",
      "utilitycraft:water_11",
      "utilitycraft:water_12",
      "utilitycraft:water_13",
      "utilitycraft:water_14",
      "utilitycraft:water_15",
      "utilitycraft:water_16",
      "utilitycraft:water_17",
      "utilitycraft:water_18",
      "utilitycraft:water_19",
      "utilitycraft:water_20",
      "utilitycraft:water_21",
      "utilitycraft:water_22",
      "utilitycraft:water_23",
      "utilitycraft:water_24",
      "utilitycraft:water_25",
      "utilitycraft:water_26",
      "utilitycraft:water_27",
      "utilitycraft:water_28",
      "utilitycraft:water_29",
      "utilitycraft:water_30",
      "utilitycraft:water_31",
      "utilitycraft:water_32",
      "utilitycraft:water_33",
      "utilitycraft:water_34",
      "utilitycraft:water_35",
      "utilitycraft:water_36",
      "utilitycraft:water_37",
      "utilitycraft:water_38",
      "utilitycraft:water_39",
      "utilitycraft:water_40",
      "utilitycraft:water_41",
      "utilitycraft:water_42",
      "utilitycraft:water_43",
      "utilitycraft:water_44",
      "utilitycraft:water_45",
      "utilitycraft:water_46",
      "utilitycraft:water_47",
      "utilitycraft:water_48",
      "utilitycraft:water_ball",
      "utilitycraft:water_crop",
      "utilitycraft:water_seeds",
      "utilitycraft:way_chip",
      "utilitycraft:waycarpet",
      "utilitycraft:waycenter",
      "utilitycraft:wheat",
      "utilitycraft:wither_crop",
      "utilitycraft:wither_seeds",
      "utilitycraft:wither_skeleton_essence",
      "utilitycraft:wither_skull_shard",
      "utilitycraft:wooden_aiot",
      "utilitycraft:wooden_hammer",
      "utilitycraft:wooden_paxel",
      "utilitycraft:wool_crop",
      "utilitycraft:wool_seeds",
      "utilitycraft:workbench",
      "utilitycraft:wrench",
      "utilitycraft:xp_00",
      "utilitycraft:xp_01",
      "utilitycraft:xp_02",
      "utilitycraft:xp_03",
      "utilitycraft:xp_04",
      "utilitycraft:xp_05",
      "utilitycraft:xp_06",
      "utilitycraft:xp_07",
      "utilitycraft:xp_08",
      "utilitycraft:xp_09",
      "utilitycraft:xp_10",
      "utilitycraft:xp_11",
      "utilitycraft:xp_12",
      "utilitycraft:xp_13",
      "utilitycraft:xp_14",
      "utilitycraft:xp_15",
      "utilitycraft:xp_16",
      "utilitycraft:xp_17",
      "utilitycraft:xp_18",
      "utilitycraft:xp_19",
      "utilitycraft:xp_20",
      "utilitycraft:xp_21",
      "utilitycraft:xp_22",
      "utilitycraft:xp_23",
      "utilitycraft:xp_24",
      "utilitycraft:xp_25",
      "utilitycraft:xp_26",
      "utilitycraft:xp_27",
      "utilitycraft:xp_28",
      "utilitycraft:xp_29",
      "utilitycraft:xp_30",
      "utilitycraft:xp_31",
      "utilitycraft:xp_32",
      "utilitycraft:xp_33",
      "utilitycraft:xp_34",
      "utilitycraft:xp_35",
      "utilitycraft:xp_36",
      "utilitycraft:xp_37",
      "utilitycraft:xp_38",
      "utilitycraft:xp_39",
      "utilitycraft:xp_40",
      "utilitycraft:xp_41",
      "utilitycraft:xp_42",
      "utilitycraft:xp_43",
      "utilitycraft:xp_44",
      "utilitycraft:xp_45",
      "utilitycraft:xp_46",
      "utilitycraft:xp_47",
      "utilitycraft:xp_48",
      "utilitycraft:xp_condenser",
      "utilitycraft:xp_drain",
      "utilitycraft:xp_magnet",
      "utilitycraft:xp_spout",
      "utilitycraft:yellow_soil",
      "utilitycraft:zombie_essence"
    ]
  },
  {
    "key": "utilitycraft_energy_amplified",
    "name": "UtilityCraft: Energy Amplified",
    "type": "expansion",
    "namespace": "utilitycraft",
    "content": [
      "utilitycraft:advanced_advanced_solar_panel",
      "utilitycraft:advanced_bio_generator",
      "utilitycraft:advanced_biowaste_generator",
      "utilitycraft:advanced_lunar_panel",
      "utilitycraft:basic_advanced_solar_panel",
      "utilitycraft:basic_bio_generator",
      "utilitycraft:basic_biowaste_generator",
      "utilitycraft:basic_lunar_panel",
      "utilitycraft:bio_macerator",
      "utilitycraft:biomass",
      "utilitycraft:biomass_block",
      "utilitycraft:biowaste",
      "utilitycraft:compost",
      "utilitycraft:compressed_biomass_block",
      "utilitycraft:compressed_biomass_block2",
      "utilitycraft:compressed_biomass_block3",
      "utilitycraft:compressed_biomass_block4",
      "utilitycraft:expert_advanced_solar_panel",
      "utilitycraft:expert_bio_generator",
      "utilitycraft:expert_biowaste_generator",
      "utilitycraft:expert_lunar_panel",
      "utilitycraft:flux",
      "utilitycraft:flux_block",
      "utilitycraft:flux_core",
      "utilitycraft:flux_crystal",
      "utilitycraft:fluxinator",
      "utilitycraft:null_crystal",
      "utilitycraft:ore_processor",
      "utilitycraft:ultimate_advanced_solar_panel",
      "utilitycraft:ultimate_bio_generator",
      "utilitycraft:ultimate_biowaste_generator",
      "utilitycraft:ultimate_lunar_panel"
    ]
  },
  {
    "key": "utilitycraft_heavy_machinery",
    "name": "UtilityCraft: Heavy Machinery",
    "type": "expansion",
    "namespace": "utilitycraft",
    "content": [
      "utilitycraft:advanced_power_condenser_unit",
      "utilitycraft:autosieve_controller",
      "utilitycraft:basic_power_condenser_unit",
      "utilitycraft:bronze_block",
      "utilitycraft:bronze_bricks",
      "utilitycraft:bronze_case",
      "utilitycraft:bronze_controller_case",
      "utilitycraft:bronze_dust",
      "utilitycraft:bronze_energy_port",
      "utilitycraft:bronze_fluid_port",
      "utilitycraft:bronze_hazard_block",
      "utilitycraft:bronze_ingot",
      "utilitycraft:bronze_item_port",
      "utilitycraft:bronze_nugget",
      "utilitycraft:bronze_plate",
      "utilitycraft:bronze_plated_block",
      "utilitycraft:bronze_vent_panel",
      "utilitycraft:brute_bronze",
      "utilitycraft:brute_bronze_block",
      "utilitycraft:charged_darloonite_crystal",
      "utilitycraft:control_panel",
      "utilitycraft:controller_case",
      "utilitycraft:crusher_controller",
      "utilitycraft:darloonite_crystal",
      "utilitycraft:deepslate_tin_chunk",
      "utilitycraft:efficiency_module",
      "utilitycraft:electro_press_controller",
      "utilitycraft:energy_cell",
      "utilitycraft:expert_power_condenser_unit",
      "utilitycraft:fluid_cell",
      "utilitycraft:fluid_tank_saline_coolant",
      "utilitycraft:heat_conductor",
      "utilitycraft:incinerator_controller",
      "utilitycraft:infuser_controller",
      "utilitycraft:multiblock_machine",
      "utilitycraft:netherite_bricks",
      "utilitycraft:netherite_case",
      "utilitycraft:netherite_energy_port",
      "utilitycraft:netherite_fluid_port",
      "utilitycraft:netherite_hazard_block",
      "utilitycraft:netherite_item_port",
      "utilitycraft:netherite_plated_block",
      "utilitycraft:netherite_vent_panel",
      "utilitycraft:power_condenser",
      "utilitycraft:power_condenser_controller",
      "utilitycraft:processing_module",
      "utilitycraft:raw_tin",
      "utilitycraft:raw_tin_block",
      "utilitycraft:reaction_chamber_controller",
      "utilitycraft:reinforced_bronze_glass",
      "utilitycraft:reinforced_netherite_glass",
      "utilitycraft:reinforced_steel_glass",
      "utilitycraft:saline_coolant_00",
      "utilitycraft:saline_coolant_01",
      "utilitycraft:saline_coolant_02",
      "utilitycraft:saline_coolant_03",
      "utilitycraft:saline_coolant_04",
      "utilitycraft:saline_coolant_05",
      "utilitycraft:saline_coolant_06",
      "utilitycraft:saline_coolant_07",
      "utilitycraft:saline_coolant_08",
      "utilitycraft:saline_coolant_09",
      "utilitycraft:saline_coolant_10",
      "utilitycraft:saline_coolant_11",
      "utilitycraft:saline_coolant_12",
      "utilitycraft:saline_coolant_13",
      "utilitycraft:saline_coolant_14",
      "utilitycraft:saline_coolant_15",
      "utilitycraft:saline_coolant_16",
      "utilitycraft:saline_coolant_17",
      "utilitycraft:saline_coolant_18",
      "utilitycraft:saline_coolant_19",
      "utilitycraft:saline_coolant_20",
      "utilitycraft:saline_coolant_21",
      "utilitycraft:saline_coolant_22",
      "utilitycraft:saline_coolant_23",
      "utilitycraft:saline_coolant_24",
      "utilitycraft:saline_coolant_25",
      "utilitycraft:saline_coolant_26",
      "utilitycraft:saline_coolant_27",
      "utilitycraft:saline_coolant_28",
      "utilitycraft:saline_coolant_29",
      "utilitycraft:saline_coolant_30",
      "utilitycraft:saline_coolant_31",
      "utilitycraft:saline_coolant_32",
      "utilitycraft:saline_coolant_33",
      "utilitycraft:saline_coolant_34",
      "utilitycraft:saline_coolant_35",
      "utilitycraft:saline_coolant_36",
      "utilitycraft:saline_coolant_37",
      "utilitycraft:saline_coolant_38",
      "utilitycraft:saline_coolant_39",
      "utilitycraft:saline_coolant_40",
      "utilitycraft:saline_coolant_41",
      "utilitycraft:saline_coolant_42",
      "utilitycraft:saline_coolant_43",
      "utilitycraft:saline_coolant_44",
      "utilitycraft:saline_coolant_45",
      "utilitycraft:saline_coolant_46",
      "utilitycraft:saline_coolant_47",
      "utilitycraft:saline_coolant_48",
      "utilitycraft:saline_coolant_bucket",
      "utilitycraft:speed_module",
      "utilitycraft:steel_bricks",
      "utilitycraft:steel_case",
      "utilitycraft:steel_energy_port",
      "utilitycraft:steel_fluid_port",
      "utilitycraft:steel_hazard_block",
      "utilitycraft:steel_item_port",
      "utilitycraft:steel_plated_block",
      "utilitycraft:steel_vent_panel",
      "utilitycraft:temperature_00",
      "utilitycraft:temperature_01",
      "utilitycraft:temperature_02",
      "utilitycraft:temperature_03",
      "utilitycraft:temperature_04",
      "utilitycraft:temperature_05",
      "utilitycraft:temperature_06",
      "utilitycraft:temperature_07",
      "utilitycraft:temperature_08",
      "utilitycraft:temperature_09",
      "utilitycraft:temperature_10",
      "utilitycraft:temperature_11",
      "utilitycraft:temperature_12",
      "utilitycraft:temperature_13",
      "utilitycraft:temperature_14",
      "utilitycraft:temperature_15",
      "utilitycraft:temperature_16",
      "utilitycraft:temperature_17",
      "utilitycraft:temperature_18",
      "utilitycraft:temperature_19",
      "utilitycraft:temperature_20",
      "utilitycraft:temperature_21",
      "utilitycraft:temperature_22",
      "utilitycraft:temperature_23",
      "utilitycraft:temperature_24",
      "utilitycraft:temperature_25",
      "utilitycraft:temperature_26",
      "utilitycraft:temperature_27",
      "utilitycraft:temperature_28",
      "utilitycraft:temperature_29",
      "utilitycraft:temperature_30",
      "utilitycraft:temperature_31",
      "utilitycraft:tempered_bronze_glass",
      "utilitycraft:tempered_netherite_glass",
      "utilitycraft:tempered_steel_glass",
      "utilitycraft:thermo_core",
      "utilitycraft:thermo_reactor",
      "utilitycraft:thermo_reactor_controller",
      "utilitycraft:tin_block",
      "utilitycraft:tin_chunk",
      "utilitycraft:tin_dust",
      "utilitycraft:tin_ingot",
      "utilitycraft:tin_nugget",
      "utilitycraft:tin_plate",
      "utilitycraft:tin_plated_block",
      "utilitycraft:ultimate_power_condenser_unit",
      "utilitycraft:utility_exo_boots",
      "utilitycraft:utility_exo_chestplate",
      "utilitycraft:utility_exo_helmet",
      "utilitycraft:utility_exo_leggings"
    ]
  }
]);

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\namespaceInjection.js
var REGISTRY_DYNAMIC_PROPERTY = "insight:namespace_registry";
var DEFAULT_ADDON_LIBRARY = Object.freeze(
  WorkspaceAddonContentRegistry.map((entry) => normalizeAddonDefinition(entry)).filter(Boolean)
);
var DEFAULT_NAMESPACE_LABELS = Object.freeze({
  minecraft: "Minecraft",
  dorios: "Dorios",
  utilitycraft: "UtilityCraft"
});
var TAG_PREFIXES = Object.freeze({
  addonKey: "insight:addon.",
  namespaceOverride: "insight:namespace.",
  aliasOverride: "insight:alias."
});
var PRIORITIZED_TAG_PREFIXES = Object.freeze([
  "insight:",
  "dorios:",
  "utilitycraft:",
  "minecraft:"
]);
var RegistryState = {
  initialized: false,
  mergedByKey: /* @__PURE__ */ new Map(),
  dynamicByKey: /* @__PURE__ */ new Map(),
  contentToAddonKeys: /* @__PURE__ */ new Map(),
  namespaceToAddonKeys: /* @__PURE__ */ new Map()
};
var AddonTypePriority = Object.freeze({
  namespace: 0,
  expansion: 1,
  addon: 2,
  core: 3
});
function normalizeAddonKey(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_.-]/g, "");
}
function normalizeNamespaceInput(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return void 0;
  }
  const namespaceCandidate = trimmed.includes(":") ? trimmed.split(":")[0] : trimmed;
  const normalized = namespaceCandidate.trim().toLowerCase();
  if (!normalized) {
    return void 0;
  }
  if (!/^[a-z0-9_.-]+$/.test(normalized)) {
    return void 0;
  }
  return normalized;
}
function decodeTagPayload(value) {
  return value.trim().replace(/__/g, ":").replace(/_/g, " ");
}
function decodeNamespacePayload(value) {
  return value.trim().toLowerCase().replace(/__/g, ":").replace(/\./g, ":").replace(/\s+/g, "");
}
function normalizeContentList(content) {
  if (!Array.isArray(content)) {
    return [];
  }
  const normalized = [];
  for (const value of content) {
    if (typeof value !== "string") {
      continue;
    }
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || !trimmed.includes(":")) {
      continue;
    }
    normalized.push(trimmed);
  }
  return [...new Set(normalized)];
}
function normalizeAddonDefinition(addonContent) {
  if (!addonContent || typeof addonContent !== "object") {
    return void 0;
  }
  const keySource = addonContent.key || addonContent.name;
  if (typeof keySource !== "string" || !keySource.trim()) {
    return void 0;
  }
  const key = normalizeAddonKey(keySource);
  const name = typeof addonContent.name === "string" && addonContent.name.trim() ? addonContent.name.trim() : toTitleWords(key.split("_"));
  const type = typeof addonContent.type === "string" && addonContent.type.trim() ? addonContent.type.trim().toLowerCase() : "addon";
  const namespace = typeof addonContent.namespace === "string" && addonContent.namespace.trim() ? addonContent.namespace.trim().toLowerCase() : void 0;
  const content = normalizeContentList(addonContent.content);
  return {
    key,
    name,
    type,
    namespace,
    content
  };
}
function mergeAddonDefinitions(baseAddon, overrideAddon) {
  if (!baseAddon) {
    return overrideAddon;
  }
  return {
    key: baseAddon.key,
    name: overrideAddon.name || baseAddon.name,
    type: overrideAddon.type || baseAddon.type,
    namespace: overrideAddon.namespace || baseAddon.namespace,
    content: [.../* @__PURE__ */ new Set([...baseAddon.content || [], ...overrideAddon.content || []])]
  };
}
function rebuildMergedRegistry() {
  RegistryState.mergedByKey = /* @__PURE__ */ new Map();
  RegistryState.contentToAddonKeys = /* @__PURE__ */ new Map();
  RegistryState.namespaceToAddonKeys = /* @__PURE__ */ new Map();
  for (const addon of DEFAULT_ADDON_LIBRARY) {
    RegistryState.mergedByKey.set(addon.key, {
      key: addon.key,
      name: addon.name,
      type: addon.type,
      namespace: addon.namespace,
      content: [...addon.content]
    });
  }
  for (const addon of RegistryState.dynamicByKey.values()) {
    const existing = RegistryState.mergedByKey.get(addon.key);
    RegistryState.mergedByKey.set(addon.key, mergeAddonDefinitions(existing, addon));
  }
  for (const addon of RegistryState.mergedByKey.values()) {
    const namespaceKey = normalizeNamespaceInput(addon.namespace);
    if (namespaceKey) {
      if (!RegistryState.namespaceToAddonKeys.has(namespaceKey)) {
        RegistryState.namespaceToAddonKeys.set(namespaceKey, []);
      }
      const namespaceOwners = RegistryState.namespaceToAddonKeys.get(namespaceKey);
      if (!namespaceOwners.includes(addon.key)) {
        namespaceOwners.push(addon.key);
      }
    }
    for (const typeId of addon.content) {
      if (!RegistryState.contentToAddonKeys.has(typeId)) {
        RegistryState.contentToAddonKeys.set(typeId, []);
      }
      const contentOwners = RegistryState.contentToAddonKeys.get(typeId);
      if (!contentOwners.includes(addon.key)) {
        contentOwners.push(addon.key);
      }
    }
  }
}
function getAddonTypeRank(addonType) {
  if (typeof addonType !== "string") {
    return Number.MAX_SAFE_INTEGER;
  }
  return AddonTypePriority[addonType] ?? Number.MAX_SAFE_INTEGER;
}
function selectBestAddonForTypeId(addonCandidates) {
  if (!Array.isArray(addonCandidates) || !addonCandidates.length) {
    return void 0;
  }
  const sortedCandidates = [...addonCandidates].sort((left, right) => {
    const leftRank = getAddonTypeRank(left.type);
    const rightRank = getAddonTypeRank(right.type);
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return String(left.key || "").localeCompare(String(right.key || ""));
  });
  return sortedCandidates[0];
}
function selectBestAddonForNamespace(addonCandidates) {
  if (!Array.isArray(addonCandidates) || !addonCandidates.length) {
    return void 0;
  }
  const explicitAlias = addonCandidates.find((addon) => addon.type === "namespace");
  if (explicitAlias) {
    return explicitAlias;
  }
  if (addonCandidates.length > 1) {
    return void 0;
  }
  return addonCandidates[0];
}
function extractTagPayload(tags, prefix) {
  for (const tag of tags) {
    if (typeof tag !== "string") {
      continue;
    }
    if (tag.startsWith(prefix) && tag.length > prefix.length) {
      return tag.slice(prefix.length);
    }
  }
  return void 0;
}
function getTagPriority(tag) {
  for (let index = 0; index < PRIORITIZED_TAG_PREFIXES.length; index++) {
    const prefix = PRIORITIZED_TAG_PREFIXES[index];
    if (tag.startsWith(prefix)) {
      return index;
    }
  }
  return PRIORITIZED_TAG_PREFIXES.length;
}
function loadDynamicRegistryFromWorld() {
  RegistryState.dynamicByKey = /* @__PURE__ */ new Map();
  let rawData;
  try {
    rawData = world7.getDynamicProperty(REGISTRY_DYNAMIC_PROPERTY);
  } catch {
    rawData = void 0;
  }
  if (typeof rawData !== "string" || !rawData.trim()) {
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(rawData);
  } catch {
    return;
  }
  if (!Array.isArray(parsed)) {
    return;
  }
  for (const addon of parsed) {
    const normalized = normalizeAddonDefinition(addon);
    if (!normalized) {
      continue;
    }
    const current = RegistryState.dynamicByKey.get(normalized.key);
    RegistryState.dynamicByKey.set(normalized.key, mergeAddonDefinitions(current, normalized));
  }
}
function persistDynamicRegistryToWorld() {
  const dynamicAddons = [...RegistryState.dynamicByKey.values()].map((addon) => ({
    key: addon.key,
    name: addon.name,
    type: addon.type,
    namespace: addon.namespace,
    content: addon.content
  }));
  const serialized = JSON.stringify(dynamicAddons);
  system7.run(() => {
    try {
      world7.setDynamicProperty(REGISTRY_DYNAMIC_PROPERTY, serialized);
    } catch {
    }
  });
}
function ensureRegistryInitialized() {
  if (RegistryState.initialized) {
    return;
  }
  loadDynamicRegistryFromWorld();
  rebuildMergedRegistry();
  exposeNamespaceRegistryApi();
  RegistryState.initialized = true;
}
function getAddonByKey(addonKey) {
  ensureRegistryInitialized();
  return RegistryState.mergedByKey.get(addonKey);
}
function getAddonByTypeId(typeId) {
  ensureRegistryInitialized();
  const normalizedTypeId = String(typeId || "").trim().toLowerCase();
  if (!normalizedTypeId) {
    return void 0;
  }
  const addonKeys = RegistryState.contentToAddonKeys.get(normalizedTypeId);
  if (!Array.isArray(addonKeys) || !addonKeys.length) {
    return void 0;
  }
  const addonCandidates = addonKeys.map((addonKey) => RegistryState.mergedByKey.get(addonKey)).filter(Boolean);
  return selectBestAddonForTypeId(addonCandidates);
}
function getAddonByNamespace(namespace) {
  ensureRegistryInitialized();
  const normalizedNamespace = normalizeNamespaceInput(namespace);
  if (!normalizedNamespace) {
    return void 0;
  }
  const addonKeys = RegistryState.namespaceToAddonKeys.get(normalizedNamespace);
  if (!Array.isArray(addonKeys) || !addonKeys.length) {
    return void 0;
  }
  const addonCandidates = addonKeys.map((addonKey) => RegistryState.mergedByKey.get(addonKey)).filter(Boolean);
  return selectBestAddonForNamespace(addonCandidates);
}
function registerAddonContentInternal(addonContent, persist = true) {
  ensureRegistryInitialized();
  const normalized = normalizeAddonDefinition(addonContent);
  if (!normalized) {
    return false;
  }
  const existingDynamic = RegistryState.dynamicByKey.get(normalized.key);
  RegistryState.dynamicByKey.set(normalized.key, mergeAddonDefinitions(existingDynamic, normalized));
  rebuildMergedRegistry();
  if (persist) {
    persistDynamicRegistryToWorld();
  }
  return true;
}
function registerNamespaceAliasInternal(namespaceInput, displayName, persist = true) {
  const namespace = normalizeNamespaceInput(namespaceInput);
  const name = typeof displayName === "string" ? displayName.trim() : "";
  if (!namespace || !name) {
    return {
      ok: false,
      reason: "invalid_input"
    };
  }
  const key = normalizeAddonKey(`namespace_${namespace}`);
  const didRegister = registerAddonContentInternal({
    key,
    name,
    type: "namespace",
    namespace,
    content: []
  }, persist);
  return {
    ok: didRegister,
    key,
    namespace,
    name
  };
}
function exposeNamespaceRegistryApi() {
  if (globalThis.InsightNamespaceRegistry) {
    return;
  }
  globalThis.InsightNamespaceRegistry = {
    registerAddonContent(addonContent, persist = true) {
      return registerAddonContentInternal(addonContent, persist);
    },
    registerNamespaceAlias(namespaceInput, displayName, persist = true) {
      return registerNamespaceAliasInternal(namespaceInput, displayName, persist);
    },
    registerAddonContents(addons, persist = true) {
      if (!Array.isArray(addons)) {
        return false;
      }
      let changed = false;
      for (const addon of addons) {
        const didRegister = registerAddonContentInternal(addon, false);
        changed = changed || didRegister;
      }
      if (changed && persist) {
        persistDynamicRegistryToWorld();
      }
      return changed;
    },
    getRegistrySnapshot() {
      ensureRegistryInitialized();
      return [...RegistryState.mergedByKey.values()].map((addon) => ({
        key: addon.key,
        name: addon.name,
        type: addon.type,
        namespace: addon.namespace,
        content: [...addon.content]
      }));
    },
    getNamespaceAliases() {
      ensureRegistryInitialized();
      const aliases = [];
      for (const [namespace, addonKeys] of RegistryState.namespaceToAddonKeys.entries()) {
        const addonCandidates = (addonKeys || []).map((addonKey) => RegistryState.mergedByKey.get(addonKey)).filter(Boolean);
        const resolved = selectBestAddonForNamespace(addonCandidates);
        if (!resolved) {
          continue;
        }
        aliases.push({
          namespace,
          name: resolved.name ?? toTitleWords(namespace.split("_")),
          key: resolved.key
        });
      }
      return aliases;
    },
    refreshFromDynamicProperties() {
      RegistryState.initialized = false;
      ensureRegistryInitialized();
    }
  };
}
function getBlockTagsSafe(block) {
  try {
    if (typeof block.getTags === "function") {
      return block.getTags() ?? [];
    }
  } catch {
  }
  try {
    if (block.permutation && typeof block.permutation.getTags === "function") {
      return block.permutation.getTags() ?? [];
    }
  } catch {
  }
  return [];
}
function sortBlockTagsForDisplay(tags) {
  const deduplicated = [...new Set(tags.filter((tag) => typeof tag === "string" && tag.length > 0))];
  deduplicated.sort((left, right) => {
    const leftPriority = getTagPriority(left);
    const rightPriority = getTagPriority(right);
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
    return left.localeCompare(right);
  });
  return deduplicated;
}
function resolveInjectedNamespace(typeId, blockTags = []) {
  const { namespace } = splitTypeId(typeId);
  const addonTagPayload = extractTagPayload(blockTags, TAG_PREFIXES.addonKey);
  const namespaceTagPayload = extractTagPayload(blockTags, TAG_PREFIXES.namespaceOverride);
  const aliasTagPayload = extractTagPayload(blockTags, TAG_PREFIXES.aliasOverride);
  const addonKeyFromTag = addonTagPayload ? normalizeAddonKey(addonTagPayload) : void 0;
  const namespaceOverride = namespaceTagPayload ? decodeNamespacePayload(namespaceTagPayload) : void 0;
  const aliasOverride = aliasTagPayload ? decodeTagPayload(aliasTagPayload) : void 0;
  const addonFromTag = addonKeyFromTag ? getAddonByKey(addonKeyFromTag) : void 0;
  const addonFromTypeId = getAddonByTypeId(typeId);
  const addonFromNamespace = getAddonByNamespace(namespaceOverride || namespace);
  const mappedAddon = addonFromTag || addonFromTypeId || addonFromNamespace;
  let source = "default";
  let resolvedNamespace = namespace;
  let displayNamespace = DEFAULT_NAMESPACE_LABELS[namespace] ?? toTitleWords(namespace.split("_"));
  let addonKey;
  let addonName;
  let addonType;
  if (namespaceOverride) {
    resolvedNamespace = namespaceOverride;
    displayNamespace = toTitleWords(namespaceOverride.replace(/[:.]/g, "_").split("_"));
    source = "tag:namespace";
  }
  if (mappedAddon) {
    addonKey = mappedAddon.key;
    addonName = mappedAddon.name;
    addonType = mappedAddon.type;
    resolvedNamespace = mappedAddon.namespace || resolvedNamespace;
    displayNamespace = mappedAddon.name;
    source = addonFromTag ? "tag:addon" : addonFromTypeId ? "registry:content" : "registry:namespace";
  }
  if (aliasOverride) {
    displayNamespace = aliasOverride;
    source = "tag:alias";
  }
  return {
    addonKey,
    addonName,
    addonType,
    source,
    injected: source !== "default",
    originalNamespace: namespace,
    resolvedNamespace,
    displayNamespace
  };
}
function registerNamespaceAlias(namespaceInput, displayName, persist = true) {
  ensureRegistryInitialized();
  return registerNamespaceAliasInternal(namespaceInput, displayName, persist);
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\menu.js
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
var modeSequence = [InsightModes.Essential, InsightModes.Detailed, InsightModes.Debug];
var customComponentKeySet = /* @__PURE__ */ new Set([
  "customFields",
  "customEnergyInfo",
  "customRotationInfo",
  "customMachineProgress",
  "customVariantPreview"
]);
var normalizeRawMessageArg = (value) => {
  if (value === void 0 || value === null) {
    return "";
  }
  if (typeof value === "object") {
    return value;
  }
  return String(value);
};
var normalizeRawtextArray = (value) => {
  if (value === void 0 || value === null) {
    return [];
  }
  if (typeof value === "object") {
    if (Array.isArray(value.rawtext)) {
      return value.rawtext;
    }
    return [value];
  }
  return [{ text: String(value) }];
};
var tr = (key, withArgs = []) => ({
  translate: key,
  with: withArgs.map(normalizeRawMessageArg)
});
function getModeLabel(mode) {
  return getModePreset(mode)?.label || String(mode || "");
}
function getPolicyLabel(policy) {
  const normalized = normalizeVisibilityPolicy(policy);
  const option = VisibilityPolicyLabels.find((entry) => entry.key === normalized);
  return option?.label || VisibilityPolicyLabels[0].label;
}
function getDisplayStyleLabel(style) {
  const normalized = String(style || "").toLowerCase();
  const option = DisplayStyleLabels.find((entry) => entry.key === normalized);
  return option?.label || DisplayStyleLabels[0].label;
}
function getEffectModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = EffectDisplayModeLabels.find((entry) => entry.key === normalized);
  return option?.label || EffectDisplayModeLabels[0].label;
}
function getEntityNameDisplayModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = EntityNameDisplayModeLabels.find((entry) => entry.key === normalized);
  return option?.label || EntityNameDisplayModeLabels[0].label;
}
function getEntityNameResolveModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = EntityNameResolveModeLabels.find((entry) => entry.key === normalized);
  return option?.label || EntityNameResolveModeLabels[0].label;
}
function getVillagerProfessionDisplayModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = VillagerProfessionDisplayModeLabels.find((entry) => entry.key === normalized);
  return option?.label || VillagerProfessionDisplayModeLabels[0].label;
}
function getToolTierIndicatorModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = ToolTierIndicatorModeLabels.find((entry) => entry.key === normalized);
  return option?.label || ToolTierIndicatorModeLabels[0].label;
}
function getToolIndicatorPlacementModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = ToolIndicatorPlacementModeLabels.find((entry) => entry.key === normalized);
  return option?.label || ToolIndicatorPlacementModeLabels[0].label;
}
function getToolIndicatorColorLabel(colorCode) {
  const normalized = String(colorCode || "").toLowerCase();
  const option = ToolIndicatorColorOptions.find((entry) => entry.key.toLowerCase() === normalized);
  return option?.label || ToolIndicatorColorOptions[0].label;
}
function getModePresetSummaryModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = ModePresetSummaryModeLabels.find((entry) => entry.key === normalized);
  return option?.label || ModePresetSummaryModeLabels[0].label;
}
function getHudDisplayModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = HudDisplayModeLabels.find((entry) => entry.key === normalized);
  return option?.label || HudDisplayModeLabels[0].label;
}
function getHudIndicatorModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = HudIndicatorModeLabels.find((entry) => entry.key === normalized);
  return option?.label || HudIndicatorModeLabels[0].label;
}
function getHudElementPositionModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = HudElementPositionModeLabels.find((entry) => entry.key === normalized);
  return option?.label || HudElementPositionModeLabels[0].label;
}
function getHudInventoryDisplayModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = HudInventoryDisplayModeLabels.find((entry) => entry.key === normalized);
  return option?.label || HudInventoryDisplayModeLabels[0].label;
}
function getHudElementOrientationModeLabel(mode) {
  const normalized = String(mode || "").toLowerCase();
  const option = HudElementOrientationModeLabels.find((entry) => entry.key === normalized);
  return option?.label || HudElementOrientationModeLabels[0].label;
}
function getWailaColorThemeLabel(theme) {
  const normalized = String(theme || "").toLowerCase();
  const option = WailaColorThemeLabels.find((entry) => entry.key === normalized);
  return option?.label || WailaColorThemeLabels[0].label;
}
function getStateLabel(isEnabled, enabledLabel = "Enabled", disabledLabel = "Disabled") {
  return isEnabled ? enabledLabel : disabledLabel;
}
function resolveCustomNumberInput(rawValue, fallback, min, max) {
  const text = String(rawValue ?? "").trim();
  if (!text.length) {
    return fallback;
  }
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, numeric));
}
function getProviderNamesForComponent(componentKey) {
  try {
    const api = globalThis.InsightCustomFields;
    if (!api || typeof api.getProvidersByComponent !== "function") {
      return [];
    }
    const providerNames = api.getProvidersByComponent(componentKey);
    if (!Array.isArray(providerNames)) {
      return [];
    }
    return providerNames.filter((name) => typeof name === "string").map((name) => name.trim()).filter((name) => name.length > 0);
  } catch {
    return [];
  }
}
function toSnakeCase(value) {
  return String(value || "").replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
function getComponentLocalizationKey(componentKey, suffix) {
  const keySegment = toSnakeCase(componentKey);
  return `ui.dorios.insight.component.${keySegment}.${suffix}`;
}
function buildComponentLabelRawtext(component, providerNames, isDeprecated) {
  const baseLabel = {
    translate: getComponentLocalizationKey(component.key, "label")
  };
  const parts = [baseLabel];
  if (isDeprecated) {
    parts.push({
      translate: "ui.dorios.insight.component.deprecated_suffix"
    });
  }
  if (providerNames.length) {
    parts.push({
      text: ` (${providerNames.join(", ")})`
    });
  }
  return parts.length > 1 ? { rawtext: parts } : baseLabel;
}
function buildComponentDescriptionRawtext(component) {
  return {
    translate: getComponentLocalizationKey(component.key, "description")
  };
}
function buildComponentDropdownLabel(componentTitle, componentDescription, currentPolicyLabel) {
  const titleParts = normalizeRawtextArray(componentTitle);
  const descriptionParts = normalizeRawtextArray(componentDescription);
  return {
    rawtext: [
      ...titleParts,
      { text: "\n\xA7j" },
      ...descriptionParts,
      { text: "\n" },
      {
        translate: "ui.dorios.insight.components.current",
        with: [currentPolicyLabel]
      }
    ]
  };
}
function getComponentOptionTitle(component) {
  const providerNames = getProviderNamesForComponent(component.key);
  const isDeprecated = isInsightComponentDeprecated(component.key);
  return buildComponentLabelRawtext(component, providerNames, isDeprecated);
}
function sendPlayerMessage(player, message) {
  try {
    player.sendMessage(message);
  } catch {
  }
}
function appendLimitedRows(target, rows, limit = 10) {
  const cappedRows = rows.slice(0, limit);
  target.push(...cappedRows);
  const remaining = rows.length - cappedRows.length;
  if (remaining > 0) {
    target.push(`- ... +${remaining} more`);
  }
}
function getModeRank(mode) {
  if (mode === InsightModes.Debug) {
    return 2;
  }
  if (mode === InsightModes.Detailed) {
    return 1;
  }
  return 0;
}
function countEnabledComponents(components) {
  let count = 0;
  for (const definition of InsightComponentDefinitions) {
    const policy = normalizeVisibilityPolicy(components?.[definition.key]);
    if (policy !== "hide") {
      count += 1;
    }
  }
  return count;
}
function buildModeSummaryMessage(previousMode, nextMode, modeSummarySetting) {
  const summaryMode = String(modeSummarySetting || "").toLowerCase();
  if (summaryMode === "hidden") {
    return "";
  }
  const previousPreset = getModePreset(previousMode);
  const nextPreset = getModePreset(nextMode);
  if (!previousPreset || !nextPreset) {
    return "";
  }
  const isDowngrade = getModeRank(nextMode) < getModeRank(previousMode);
  const enableRows = [];
  const changedRows = [];
  const removedRows = [];
  const runtimeFields = [
    { key: "maxDistance", label: "Range" },
    { key: "updateIntervalTicks", label: "Update Interval" },
    { key: "linkedEntityScanIntervalTicks", label: "Linked Entity Scan Interval" },
    { key: "linkedEntityScanMaxDistance", label: "Linked Entity Scan Distance" },
    { key: "maxVisibleStates", label: "Block States Limit" },
    { key: "maxVisibleBlockTags", label: "Block Tags Limit" },
    { key: "maxVisibleEntityTags", label: "Entity Tags Limit" },
    { key: "maxVisibleEntityFamilies", label: "Entity Families Limit" },
    { key: "maxVisibleEffects", label: "Effects Limit" },
    { key: "displayStyle", label: "Display Style" },
    { key: "toolTierIndicatorMode", label: "Tool Indicator" },
    { key: "includeLiquidBlocks", label: "Include Liquid Blocks" },
    { key: "includeInvisibleEntities", label: "Include Invisible Entities" },
    { key: "ignoreMachineHelperEntities", label: "Ignore Machine Helper Entities" }
  ];
  for (const definition of InsightComponentDefinitions) {
    const componentLabel = definition.label || definition.key;
    const previousPolicy = normalizeVisibilityPolicy(previousPreset.components?.[definition.key]);
    const nextPolicy = normalizeVisibilityPolicy(nextPreset.components?.[definition.key]);
    if (nextPolicy !== "hide") {
      enableRows.push(`- ${componentLabel}`);
    }
    if (previousPolicy === nextPolicy) {
      continue;
    }
    if (previousPolicy !== "hide" && nextPolicy === "hide") {
      removedRows.push(`- ${componentLabel}`);
      continue;
    }
    changedRows.push(`- ${componentLabel}: ${getPolicyLabel(previousPolicy)} > ${getPolicyLabel(nextPolicy)}`);
  }
  for (const runtimeField of runtimeFields) {
    const previousValue = previousPreset.runtime?.[runtimeField.key];
    const nextValue = nextPreset.runtime?.[runtimeField.key];
    if (previousValue === nextValue) {
      continue;
    }
    const formatValue = (value) => {
      if (runtimeField.key === "displayStyle") {
        return getDisplayStyleLabel(value);
      }
      if (runtimeField.key === "toolTierIndicatorMode") {
        return getToolTierIndicatorModeLabel(value);
      }
      if (typeof value === "boolean") {
        return value ? "Enabled" : "Disabled";
      }
      return String(value);
    };
    changedRows.push(`- ${runtimeField.label}: ${formatValue(previousValue)} > ${formatValue(nextValue)}`);
  }
  const lines = [`\xA7a${getModeLabel(nextMode)} Mode Selected!`];
  const includeEnableSummary = !isDowngrade && (summaryMode === "summary" || summaryMode === "summary_and_changed");
  const includeChanged = isDowngrade || summaryMode === "changed_only" || summaryMode === "summary_and_changed";
  if (includeEnableSummary) {
    lines.push("\xA77Enable:");
    if (enableRows.length) {
      appendLimitedRows(lines, enableRows);
    } else {
      lines.push("- None");
    }
  }
  if (includeChanged) {
    lines.push("\xA73Changed:");
    if (changedRows.length) {
      appendLimitedRows(lines, changedRows);
    } else {
      lines.push("- None");
    }
    if (removedRows.length) {
      lines.push("\xA7cRemoved:");
      appendLimitedRows(lines, removedRows);
    }
  }
  return lines.join("\n");
}
async function showModeMenu(player) {
  const currentMode = getCurrentMode();
  const form = new ActionFormData().title(tr("ui.dorios.insight.mode_menu.title")).body(tr("ui.dorios.insight.mode_menu.body", [getModeLabel(currentMode)]));
  for (const mode of modeSequence) {
    const preset = getModePreset(mode);
    const runtime = preset.runtime;
    const enabledComponentCount = countEnabledComponents(preset.components);
    form.button(
      tr("ui.dorios.insight.mode_menu.option", [
        getModeLabel(mode),
        runtime.maxDistance,
        runtime.updateIntervalTicks,
        enabledComponentCount,
        runtime.maxVisibleStates,
        runtime.maxVisibleBlockTags
      ])
    );
  }
  const result = await form.show(player);
  if (result.canceled) {
    return;
  }
  const selectedMode = modeSequence[result.selection ?? 0] || currentMode;
  const previousMode = currentMode;
  const appliedMode = setCurrentMode(selectedMode);
  sendPlayerMessage(
    player,
    tr("ui.dorios.insight.feedback.mode_set", [getModeLabel(appliedMode)])
  );
  const nextSettings = getPlayerDisplaySettings(player);
  const summaryMessage = buildModeSummaryMessage(
    previousMode,
    appliedMode,
    nextSettings.modePresetSummaryMode
  );
  if (summaryMessage.length) {
    sendPlayerMessage(player, summaryMessage);
  }
}
async function showComponentGroupMenu(player, componentGroup) {
  const settings = getPlayerDisplaySettings(player);
  const visibilityLabels = VisibilityPolicyLabels.map((option) => option.label);
  const form = new ModalFormData().title(tr(componentGroup.titleKey));
  for (const component of componentGroup.components) {
    const currentPolicy = settings.components[component.key];
    const componentTitle = getComponentOptionTitle(component);
    const componentDescription = buildComponentDescriptionRawtext(component);
    const currentPolicyLabel = getPolicyLabel(currentPolicy);
    const dropdownLabel = buildComponentDropdownLabel(
      componentTitle,
      componentDescription,
      currentPolicyLabel
    );
    form.dropdown(
      dropdownLabel,
      visibilityLabels,
      {
        defaultValueIndex: getVisibilityPolicyIndex(currentPolicy)
      }
    );
  }
  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    return;
  }
  const nextPolicies = {};
  const ignoredDeprecated = [];
  for (let index = 0; index < componentGroup.components.length; index++) {
    const component = componentGroup.components[index];
    if (isInsightComponentDeprecated(component.key)) {
      ignoredDeprecated.push(component.label);
      continue;
    }
    const selectedIndex = Number(result.formValues[index] ?? 0);
    const selectedOption = VisibilityPolicyLabels[selectedIndex] || VisibilityPolicyLabels[0];
    nextPolicies[component.key] = normalizeVisibilityPolicy(selectedOption.key);
  }
  updatePlayerOverrides(player, {
    components: nextPolicies
  });
  sendPlayerMessage(player, tr("ui.dorios.insight.feedback.components_updated"));
  if (ignoredDeprecated.length) {
    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.deprecated_ignored", [ignoredDeprecated.join(", ")]));
  }
}
async function showComponentGroupWithRuntimeMenu(player, componentGroup) {
  const settings = getPlayerDisplaySettings(player);
  const visibilityLabels = VisibilityPolicyLabels.map((option) => option.label);
  const runtimeFieldKeys = Array.isArray(componentGroup.runtimeFields) ? componentGroup.runtimeFields : [];
  const runtimeFieldMap = {
    maxVisibleStates: {
      min: 0,
      max: InsightConfig.system.maxVisibleStatesCap,
      labelKey: "ui.dorios.insight.runtime.visible_block_states"
    },
    maxVisibleBlockTags: {
      min: 0,
      max: InsightConfig.system.maxVisibleTagsCap,
      labelKey: "ui.dorios.insight.runtime.visible_block_tags"
    },
    maxVisibleEntityTags: {
      min: 0,
      max: InsightConfig.system.maxVisibleTagsCap,
      labelKey: "ui.dorios.insight.runtime.visible_entity_tags"
    },
    maxVisibleEntityFamilies: {
      min: 0,
      max: InsightConfig.system.maxVisibleFamiliesCap,
      labelKey: "ui.dorios.insight.runtime.visible_entity_families"
    },
    stateColumns: {
      min: 1,
      max: InsightConfig.system.maxLayoutColumns,
      labelKey: "ui.dorios.insight.system_menu.state_columns"
    },
    tagColumns: {
      min: 1,
      max: InsightConfig.system.maxLayoutColumns,
      labelKey: "ui.dorios.insight.system_menu.tag_columns"
    },
    familyColumns: {
      min: 1,
      max: InsightConfig.system.maxLayoutColumns,
      labelKey: "ui.dorios.insight.system_menu.family_columns"
    }
  };
  const runtimeFields = runtimeFieldKeys.map((key) => ({ key, ...runtimeFieldMap[key] || {} })).filter((field) => field.labelKey);
  const form = new ModalFormData().title(tr(componentGroup.titleKey));
  for (const component of componentGroup.components) {
    const currentPolicy = settings.components[component.key];
    const componentTitle = getComponentOptionTitle(component);
    const componentDescription = buildComponentDescriptionRawtext(component);
    const currentPolicyLabel = getPolicyLabel(currentPolicy);
    const dropdownLabel = buildComponentDropdownLabel(
      componentTitle,
      componentDescription,
      currentPolicyLabel
    );
    form.dropdown(
      dropdownLabel,
      visibilityLabels,
      {
        defaultValueIndex: getVisibilityPolicyIndex(currentPolicy)
      }
    );
  }
  for (const field of runtimeFields) {
    const currentValue = Number(settings.runtime?.[field.key] ?? field.min);
    form.slider(
      tr(field.labelKey, [currentValue]),
      field.min,
      field.max,
      { defaultValue: currentValue }
    );
  }
  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    return;
  }
  const nextPolicies = {};
  const ignoredDeprecated = [];
  for (let index = 0; index < componentGroup.components.length; index++) {
    const component = componentGroup.components[index];
    if (isInsightComponentDeprecated(component.key)) {
      ignoredDeprecated.push(component.label);
      continue;
    }
    const selectedIndex = Number(result.formValues[index] ?? 0);
    const selectedOption = VisibilityPolicyLabels[selectedIndex] || VisibilityPolicyLabels[0];
    nextPolicies[component.key] = normalizeVisibilityPolicy(selectedOption.key);
  }
  const nextRuntime = {};
  for (let fieldIndex = 0; fieldIndex < runtimeFields.length; fieldIndex++) {
    const field = runtimeFields[fieldIndex];
    const formIndex = componentGroup.components.length + fieldIndex;
    nextRuntime[field.key] = resolveCustomNumberInput(
      result.formValues[formIndex],
      settings.runtime?.[field.key] ?? field.min,
      field.min,
      field.max
    );
  }
  updatePlayerOverrides(player, {
    components: nextPolicies,
    runtime: nextRuntime
  });
  sendPlayerMessage(player, tr("ui.dorios.insight.feedback.components_updated"));
  if (ignoredDeprecated.length) {
    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.deprecated_ignored", [ignoredDeprecated.join(", ")]));
  }
}
async function showStyleMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const runtime = settings.runtime;
  const styleOptions = DisplayStyleLabels.map((option) => option.label);
  const effectModeOptions = EffectDisplayModeLabels.map((option) => option.label);
  const form = new ModalFormData().title(tr("ui.dorios.insight.style_menu.title")).dropdown(
    tr("ui.dorios.insight.style_menu.display_style", [getDisplayStyleLabel(runtime.displayStyle)]),
    styleOptions,
    {
      defaultValueIndex: getDisplayStyleIndex(runtime.displayStyle)
    }
  ).dropdown(
    tr("ui.dorios.insight.style_menu.effect_mode", [getEffectModeLabel(runtime.effectDisplayMode)]),
    effectModeOptions,
    {
      defaultValueIndex: getEffectDisplayModeIndex(runtime.effectDisplayMode)
    }
  ).dropdown(
    tr("ui.dorios.insight.style_menu.health_style", [getDisplayStyleLabel(runtime.healthDisplayStyle)]),
    styleOptions,
    {
      defaultValueIndex: getDisplayStyleIndex(runtime.healthDisplayStyle)
    }
  ).dropdown(
    tr("ui.dorios.insight.style_menu.hunger_style", [getDisplayStyleLabel(runtime.hungerDisplayStyle)]),
    styleOptions,
    {
      defaultValueIndex: getDisplayStyleIndex(runtime.hungerDisplayStyle)
    }
  ).dropdown(
    tr("ui.dorios.insight.style_menu.armor_style", [getDisplayStyleLabel(runtime.armorDisplayStyle)]),
    styleOptions,
    {
      defaultValueIndex: getDisplayStyleIndex(runtime.armorDisplayStyle)
    }
  ).dropdown(
    tr("ui.dorios.insight.style_menu.absorption_style", [getDisplayStyleLabel(runtime.absorptionDisplayStyle)]),
    styleOptions,
    {
      defaultValueIndex: getDisplayStyleIndex(runtime.absorptionDisplayStyle)
    }
  ).dropdown(
    tr("ui.dorios.insight.style_menu.air_style", [getDisplayStyleLabel(runtime.airDisplayStyle)]),
    styleOptions,
    {
      defaultValueIndex: getDisplayStyleIndex(runtime.airDisplayStyle)
    }
  );
  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    return;
  }
  const formValues = result.formValues;
  updatePlayerOverrides(player, {
    runtime: {
      displayStyle: DisplayStyleLabels[Number(formValues[0] ?? 0)]?.key ?? runtime.displayStyle,
      effectDisplayMode: EffectDisplayModeLabels[Number(formValues[1] ?? 0)]?.key ?? runtime.effectDisplayMode,
      healthDisplayStyle: DisplayStyleLabels[Number(formValues[2] ?? 0)]?.key ?? runtime.healthDisplayStyle,
      hungerDisplayStyle: DisplayStyleLabels[Number(formValues[3] ?? 0)]?.key ?? runtime.hungerDisplayStyle,
      armorDisplayStyle: DisplayStyleLabels[Number(formValues[4] ?? 0)]?.key ?? runtime.armorDisplayStyle,
      absorptionDisplayStyle: DisplayStyleLabels[Number(formValues[5] ?? 0)]?.key ?? runtime.absorptionDisplayStyle,
      airDisplayStyle: DisplayStyleLabels[Number(formValues[6] ?? 0)]?.key ?? runtime.airDisplayStyle
    }
  });
  sendPlayerMessage(player, tr("ui.dorios.insight.feedback.style_updated"));
}
async function showHudBarsMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const runtime = settings.runtime;
  const hudDisplayOptions = HudDisplayModeLabels.map((option) => option.label);
  const hudIndicatorOptions = HudIndicatorModeLabels.map((option) => option.label);
  const form = new ModalFormData().title(tr("ui.dorios.insight.hud_menu.title")).dropdown(
    tr("ui.dorios.insight.hud_menu.health_visibility", [getHudDisplayModeLabel(runtime.hudHealthVisibilityMode)]),
    hudDisplayOptions,
    {
      defaultValueIndex: getHudDisplayModeIndex(runtime.hudHealthVisibilityMode)
    }
  ).dropdown(
    tr("ui.dorios.insight.hud_menu.health_indicator", [getHudIndicatorModeLabel(runtime.hudHealthIndicatorMode)]),
    hudIndicatorOptions,
    {
      defaultValueIndex: getHudIndicatorModeIndex(runtime.hudHealthIndicatorMode)
    }
  ).dropdown(
    tr("ui.dorios.insight.hud_menu.hunger_visibility", [getHudDisplayModeLabel(runtime.hudHungerVisibilityMode)]),
    hudDisplayOptions,
    {
      defaultValueIndex: getHudDisplayModeIndex(runtime.hudHungerVisibilityMode)
    }
  ).dropdown(
    tr("ui.dorios.insight.hud_menu.hunger_indicator", [getHudIndicatorModeLabel(runtime.hudHungerIndicatorMode)]),
    hudIndicatorOptions,
    {
      defaultValueIndex: getHudIndicatorModeIndex(runtime.hudHungerIndicatorMode)
    }
  ).dropdown(
    tr("ui.dorios.insight.hud_menu.saturation_visibility", [getHudDisplayModeLabel(runtime.hudSaturationVisibilityMode)]),
    hudDisplayOptions,
    {
      defaultValueIndex: getHudDisplayModeIndex(runtime.hudSaturationVisibilityMode)
    }
  ).dropdown(
    tr("ui.dorios.insight.hud_menu.toughness_visibility", [getHudDisplayModeLabel(runtime.hudToughnessVisibilityMode)]),
    hudDisplayOptions,
    {
      defaultValueIndex: getHudDisplayModeIndex(runtime.hudToughnessVisibilityMode)
    }
  );
  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    return;
  }
  const formValues = result.formValues;
  updatePlayerOverrides(player, {
    runtime: {
      hudHealthVisibilityMode: HudDisplayModeLabels[Number(formValues[0] ?? 0)]?.key ?? runtime.hudHealthVisibilityMode,
      hudHealthIndicatorMode: HudIndicatorModeLabels[Number(formValues[1] ?? 0)]?.key ?? runtime.hudHealthIndicatorMode,
      hudHungerVisibilityMode: HudDisplayModeLabels[Number(formValues[2] ?? 0)]?.key ?? runtime.hudHungerVisibilityMode,
      hudHungerIndicatorMode: HudIndicatorModeLabels[Number(formValues[3] ?? 0)]?.key ?? runtime.hudHungerIndicatorMode,
      hudSaturationVisibilityMode: HudDisplayModeLabels[Number(formValues[4] ?? 0)]?.key ?? runtime.hudSaturationVisibilityMode,
      hudToughnessVisibilityMode: HudDisplayModeLabels[Number(formValues[5] ?? 0)]?.key ?? runtime.hudToughnessVisibilityMode
    }
  });
  sendPlayerMessage(player, tr("ui.dorios.insight.feedback.hud_updated"));
}
async function showHudElementsMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const runtime = settings.runtime;
  const hudElementPositionOptions = HudElementPositionModeLabels.map((option) => option.label);
  const hudInventoryDisplayOptions = HudInventoryDisplayModeLabels.map((option) => option.label);
  const hudElementOrientationOptions = HudElementOrientationModeLabels.map((option) => option.label);
  const tierIndicatorOptions = ToolTierIndicatorModeLabels.map((option) => option.label);
  const toolIndicatorPlacementOptions = ToolIndicatorPlacementModeLabels.map((option) => option.label);
  const toolIndicatorColorOptions = ToolIndicatorColorOptions.map((option) => option.label);
  const form = new ModalFormData().title(tr("ui.dorios.insight.hud_elements_menu.title")).toggle(
    tr("ui.dorios.insight.hud_menu.inventory_hud", [getStateLabel(runtime.hudInventoryEnabled, "Enabled", "Disabled")]),
    { defaultValue: Boolean(runtime.hudInventoryEnabled) }
  ).dropdown(
    tr("ui.dorios.insight.hud_elements_menu.inventory_position", [getHudElementPositionModeLabel(runtime.hudInventoryPosition)]),
    hudElementPositionOptions,
    {
      defaultValueIndex: getHudElementPositionModeIndex(runtime.hudInventoryPosition)
    }
  ).dropdown(
    tr("ui.dorios.insight.hud_elements_menu.inventory_display_mode", [getHudInventoryDisplayModeLabel(runtime.hudInventoryDisplayMode)]),
    hudInventoryDisplayOptions,
    {
      defaultValueIndex: getHudInventoryDisplayModeIndex(runtime.hudInventoryDisplayMode)
    }
  ).dropdown(
    tr("ui.dorios.insight.hud_elements_menu.inventory_orientation", [getHudElementOrientationModeLabel(runtime.hudInventoryOrientation)]),
    hudElementOrientationOptions,
    {
      defaultValueIndex: getHudElementOrientationModeIndex(runtime.hudInventoryOrientation)
    }
  ).dropdown(
    tr("ui.dorios.insight.system_menu.tier_indicator", [getToolTierIndicatorModeLabel(runtime.toolTierIndicatorMode)]),
    tierIndicatorOptions,
    {
      defaultValueIndex: getToolTierIndicatorModeIndex(runtime.toolTierIndicatorMode)
    }
  ).dropdown(
    tr("ui.dorios.insight.system_menu.tool_position", [getToolIndicatorPlacementModeLabel(runtime.toolIndicatorPlacement)]),
    toolIndicatorPlacementOptions,
    {
      defaultValueIndex: getToolIndicatorPlacementModeIndex(runtime.toolIndicatorPlacement)
    }
  ).dropdown(
    tr("ui.dorios.insight.system_menu.tool_color", [getToolIndicatorColorLabel(runtime.toolIndicatorColor)]),
    toolIndicatorColorOptions,
    {
      defaultValueIndex: getToolIndicatorColorIndex(runtime.toolIndicatorColor)
    }
  );
  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    return;
  }
  updatePlayerOverrides(player, {
    runtime: {
      hudInventoryEnabled: Boolean(result.formValues[0] ?? runtime.hudInventoryEnabled),
      hudInventoryPosition: HudElementPositionModeLabels[Number(result.formValues[1] ?? 0)]?.key ?? runtime.hudInventoryPosition,
      hudInventoryDisplayMode: HudInventoryDisplayModeLabels[Number(result.formValues[2] ?? 0)]?.key ?? runtime.hudInventoryDisplayMode,
      hudInventoryOrientation: HudElementOrientationModeLabels[Number(result.formValues[3] ?? 0)]?.key ?? runtime.hudInventoryOrientation,
      toolTierIndicatorMode: ToolTierIndicatorModeLabels[Number(result.formValues[4] ?? 0)]?.key ?? runtime.toolTierIndicatorMode,
      toolIndicatorPlacement: ToolIndicatorPlacementModeLabels[Number(result.formValues[5] ?? 0)]?.key ?? runtime.toolIndicatorPlacement,
      toolIndicatorColor: ToolIndicatorColorOptions[Number(result.formValues[6] ?? 0)]?.key ?? runtime.toolIndicatorColor
    }
  });
  sendPlayerMessage(player, tr("ui.dorios.insight.feedback.hud_elements_updated"));
}
async function showWailaMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const runtime = settings.runtime;
  const wailaColorOptions = WailaColorThemeLabels.map((option) => option.label);
  const form = new ModalFormData().title(tr("ui.dorios.insight.waila_menu.title")).dropdown(
    tr("ui.dorios.insight.waila_menu.color_theme", [getWailaColorThemeLabel(runtime.wailaColorTheme)]),
    wailaColorOptions,
    {
      defaultValueIndex: getWailaColorThemeIndex(runtime.wailaColorTheme)
    }
  );
  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    return;
  }
  updatePlayerOverrides(player, {
    runtime: {
      wailaColorTheme: WailaColorThemeLabels[Number(result.formValues[0] ?? 0)]?.key ?? runtime.wailaColorTheme
    }
  });
  sendPlayerMessage(player, tr("ui.dorios.insight.feedback.waila_updated"));
}
async function showConditionsMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const runtime = settings.runtime;
  const displayModeOptions = EntityNameDisplayModeLabels.map((option) => option.label);
  const resolveModeOptions = EntityNameResolveModeLabels.map((option) => option.label);
  const villagerProfessionOptions = VillagerProfessionDisplayModeLabels.map((option) => option.label);
  const form = new ModalFormData().title(tr("ui.dorios.insight.conditions_menu.title")).dropdown(
    tr("ui.dorios.insight.conditions_menu.name_order", [getEntityNameDisplayModeLabel(runtime.nameDisplayMode)]),
    displayModeOptions,
    {
      defaultValueIndex: getEntityNameDisplayModeIndex(runtime.nameDisplayMode)
    }
  ).dropdown(
    tr("ui.dorios.insight.conditions_menu.name_method", [getEntityNameResolveModeLabel(runtime.nameResolveMode)]),
    resolveModeOptions,
    {
      defaultValueIndex: getEntityNameResolveModeIndex(runtime.nameResolveMode)
    }
  ).dropdown(
    tr("ui.dorios.insight.conditions_menu.villager_profession", [getVillagerProfessionDisplayModeLabel(runtime.villagerProfessionDisplay)]),
    villagerProfessionOptions,
    {
      defaultValueIndex: getVillagerProfessionDisplayModeIndex(runtime.villagerProfessionDisplay)
    }
  );
  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    return;
  }
  updatePlayerOverrides(player, {
    runtime: {
      nameDisplayMode: EntityNameDisplayModeLabels[Number(result.formValues[0] ?? 0)]?.key ?? runtime.nameDisplayMode,
      nameResolveMode: EntityNameResolveModeLabels[Number(result.formValues[1] ?? 0)]?.key ?? runtime.nameResolveMode,
      villagerProfessionDisplay: VillagerProfessionDisplayModeLabels[Number(result.formValues[2] ?? 0)]?.key ?? runtime.villagerProfessionDisplay
    }
  });
  sendPlayerMessage(player, tr("ui.dorios.insight.feedback.conditions_updated"));
}
async function showSystemSettingsMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const runtime = settings.runtime;
  const modeSummaryOptions = ModePresetSummaryModeLabels.map((option) => option.label);
  const form = new ModalFormData().title(tr("ui.dorios.insight.system_menu.title")).dropdown(
    tr("ui.dorios.insight.system_menu.mode_summary", [getModePresetSummaryModeLabel(runtime.modePresetSummaryMode)]),
    modeSummaryOptions,
    {
      defaultValueIndex: getModePresetSummaryModeIndex(runtime.modePresetSummaryMode)
    }
  ).slider(
    tr("ui.dorios.insight.system_menu.state_columns", [runtime.stateColumns]),
    1,
    InsightConfig.system.maxLayoutColumns,
    { defaultValue: runtime.stateColumns }
  ).slider(
    tr("ui.dorios.insight.system_menu.tag_columns", [runtime.tagColumns]),
    1,
    InsightConfig.system.maxLayoutColumns,
    { defaultValue: runtime.tagColumns }
  ).slider(
    tr("ui.dorios.insight.system_menu.family_columns", [runtime.familyColumns]),
    1,
    InsightConfig.system.maxLayoutColumns,
    { defaultValue: runtime.familyColumns }
  );
  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    return;
  }
  updatePlayerOverrides(player, {
    runtime: {
      modePresetSummaryMode: ModePresetSummaryModeLabels[Number(result.formValues[0] ?? 0)]?.key ?? runtime.modePresetSummaryMode,
      stateColumns: resolveCustomNumberInput(
        result.formValues[1],
        runtime.stateColumns,
        1,
        InsightConfig.system.maxLayoutColumns
      ),
      tagColumns: resolveCustomNumberInput(
        result.formValues[2],
        runtime.tagColumns,
        1,
        InsightConfig.system.maxLayoutColumns
      ),
      familyColumns: resolveCustomNumberInput(
        result.formValues[3],
        runtime.familyColumns,
        1,
        InsightConfig.system.maxLayoutColumns
      )
    }
  });
  sendPlayerMessage(player, tr("ui.dorios.insight.feedback.system_updated"));
}
async function showRuntimeMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const runtime = settings.runtime;
  const customValueHint = tr("ui.dorios.insight.runtime.custom_hint");
  const customValueLabel = "";
  const form = new ModalFormData().title(tr("ui.dorios.insight.runtime_menu.title")).slider(
    tr("ui.dorios.insight.runtime.range", [runtime.maxDistance]),
    InsightConfig.system.minMaxDistance,
    InsightConfig.system.maxMaxDistance,
    { defaultValue: runtime.maxDistance }
  ).textField(customValueLabel, customValueHint).slider(
    tr("ui.dorios.insight.runtime.update_interval", [runtime.updateIntervalTicks]),
    InsightConfig.system.minUpdateIntervalTicks,
    InsightConfig.system.maxUpdateIntervalTicks,
    { defaultValue: runtime.updateIntervalTicks }
  ).textField(customValueLabel, customValueHint).slider(
    tr("ui.dorios.insight.runtime.target_hold_ticks", [runtime.unchangedTargetRefreshTicks]),
    InsightConfig.system.minUnchangedTargetRefreshTicks,
    InsightConfig.system.maxUnchangedTargetRefreshTicks,
    { defaultValue: runtime.unchangedTargetRefreshTicks }
  ).textField(customValueLabel, customValueHint).slider(
    tr("ui.dorios.insight.runtime.clear_no_target", [runtime.clearAfterNoTargetTicks]),
    InsightConfig.system.minClearAfterNoTargetTicks,
    InsightConfig.system.maxClearAfterNoTargetTicks,
    { defaultValue: runtime.clearAfterNoTargetTicks }
  ).textField(customValueLabel, customValueHint).slider(
    tr("ui.dorios.insight.runtime.visible_block_states", [runtime.maxVisibleStates]),
    0,
    InsightConfig.system.maxVisibleStatesCap,
    { defaultValue: runtime.maxVisibleStates }
  ).textField(customValueLabel, customValueHint).slider(
    tr("ui.dorios.insight.runtime.visible_block_tags", [runtime.maxVisibleBlockTags]),
    0,
    InsightConfig.system.maxVisibleTagsCap,
    { defaultValue: runtime.maxVisibleBlockTags }
  ).textField(customValueLabel, customValueHint).slider(
    tr("ui.dorios.insight.runtime.visible_entity_tags", [runtime.maxVisibleEntityTags]),
    0,
    InsightConfig.system.maxVisibleTagsCap,
    { defaultValue: runtime.maxVisibleEntityTags }
  ).textField(customValueLabel, customValueHint).slider(
    tr("ui.dorios.insight.runtime.visible_entity_families", [runtime.maxVisibleEntityFamilies]),
    0,
    InsightConfig.system.maxVisibleFamiliesCap,
    { defaultValue: runtime.maxVisibleEntityFamilies }
  ).textField(customValueLabel, customValueHint).slider(
    tr("ui.dorios.insight.runtime.visible_effects", [runtime.maxVisibleEffects]),
    0,
    InsightConfig.system.maxVisibleEffectsCap,
    { defaultValue: runtime.maxVisibleEffects }
  ).textField(customValueLabel, customValueHint).slider(
    tr("ui.dorios.insight.runtime.health_threshold", [runtime.maxHeartDisplayHealth]),
    InsightConfig.system.minMaxHeartDisplayHealth,
    InsightConfig.system.maxMaxHeartDisplayHealth,
    { defaultValue: runtime.maxHeartDisplayHealth }
  ).textField(customValueLabel, customValueHint).toggle(
    tr("ui.dorios.insight.runtime.include_invisible", [
      getStateLabel(runtime.includeInvisibleEntities)
    ]),
    { defaultValue: runtime.includeInvisibleEntities }
  ).toggle(
    tr("ui.dorios.insight.runtime.include_liquids", [
      getStateLabel(runtime.includeLiquidBlocks)
    ]),
    { defaultValue: runtime.includeLiquidBlocks }
  ).slider(
    `Linked Entity Scan Interval (ticks): ${runtime.linkedEntityScanIntervalTicks}`,
    InsightConfig.system.minLinkedEntityScanIntervalTicks,
    InsightConfig.system.maxLinkedEntityScanIntervalTicks,
    { defaultValue: runtime.linkedEntityScanIntervalTicks }
  ).textField(customValueLabel, customValueHint).slider(
    `Linked Entity Scan Distance: ${runtime.linkedEntityScanMaxDistance}`,
    InsightConfig.system.minLinkedEntityScanMaxDistance,
    InsightConfig.system.maxLinkedEntityScanMaxDistance,
    { defaultValue: runtime.linkedEntityScanMaxDistance }
  ).textField(customValueLabel, customValueHint).toggle(
    `Ignore Machine Helper Entities: ${getStateLabel(runtime.ignoreMachineHelperEntities)}`,
    { defaultValue: runtime.ignoreMachineHelperEntities }
  );
  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    return;
  }
  updatePlayerOverrides(player, {
    runtime: {
      maxDistance: resolveCustomNumberInput(
        result.formValues[1],
        Number(result.formValues[0] ?? runtime.maxDistance),
        InsightConfig.system.minMaxDistance,
        InsightConfig.system.maxMaxDistance
      ),
      updateIntervalTicks: resolveCustomNumberInput(
        result.formValues[3],
        Number(result.formValues[2] ?? runtime.updateIntervalTicks),
        InsightConfig.system.minUpdateIntervalTicks,
        InsightConfig.system.maxUpdateIntervalTicks
      ),
      unchangedTargetRefreshTicks: resolveCustomNumberInput(
        result.formValues[5],
        Number(result.formValues[4] ?? runtime.unchangedTargetRefreshTicks),
        InsightConfig.system.minUnchangedTargetRefreshTicks,
        InsightConfig.system.maxUnchangedTargetRefreshTicks
      ),
      clearAfterNoTargetTicks: resolveCustomNumberInput(
        result.formValues[7],
        Number(result.formValues[6] ?? runtime.clearAfterNoTargetTicks),
        InsightConfig.system.minClearAfterNoTargetTicks,
        InsightConfig.system.maxClearAfterNoTargetTicks
      ),
      maxVisibleStates: resolveCustomNumberInput(
        result.formValues[9],
        Number(result.formValues[8] ?? runtime.maxVisibleStates),
        0,
        InsightConfig.system.maxVisibleStatesCap
      ),
      maxVisibleBlockTags: resolveCustomNumberInput(
        result.formValues[11],
        Number(result.formValues[10] ?? runtime.maxVisibleBlockTags),
        0,
        InsightConfig.system.maxVisibleTagsCap
      ),
      maxVisibleEntityTags: resolveCustomNumberInput(
        result.formValues[13],
        Number(result.formValues[12] ?? runtime.maxVisibleEntityTags),
        0,
        InsightConfig.system.maxVisibleTagsCap
      ),
      maxVisibleEntityFamilies: resolveCustomNumberInput(
        result.formValues[15],
        Number(result.formValues[14] ?? runtime.maxVisibleEntityFamilies),
        0,
        InsightConfig.system.maxVisibleFamiliesCap
      ),
      maxVisibleEffects: resolveCustomNumberInput(
        result.formValues[17],
        Number(result.formValues[16] ?? runtime.maxVisibleEffects),
        0,
        InsightConfig.system.maxVisibleEffectsCap
      ),
      maxHeartDisplayHealth: resolveCustomNumberInput(
        result.formValues[19],
        Number(result.formValues[18] ?? runtime.maxHeartDisplayHealth),
        InsightConfig.system.minMaxHeartDisplayHealth,
        InsightConfig.system.maxMaxHeartDisplayHealth
      ),
      includeInvisibleEntities: Boolean(result.formValues[20] ?? runtime.includeInvisibleEntities),
      includeLiquidBlocks: Boolean(result.formValues[21] ?? runtime.includeLiquidBlocks),
      linkedEntityScanIntervalTicks: resolveCustomNumberInput(
        result.formValues[23],
        Number(result.formValues[22] ?? runtime.linkedEntityScanIntervalTicks),
        InsightConfig.system.minLinkedEntityScanIntervalTicks,
        InsightConfig.system.maxLinkedEntityScanIntervalTicks
      ),
      linkedEntityScanMaxDistance: resolveCustomNumberInput(
        result.formValues[25],
        Number(result.formValues[24] ?? runtime.linkedEntityScanMaxDistance),
        InsightConfig.system.minLinkedEntityScanMaxDistance,
        InsightConfig.system.maxLinkedEntityScanMaxDistance
      ),
      ignoreMachineHelperEntities: Boolean(result.formValues[26] ?? runtime.ignoreMachineHelperEntities)
    }
  });
  sendPlayerMessage(player, tr("ui.dorios.insight.feedback.runtime_updated"));
}
async function showNamespaceMenu(player) {
  const form = new ModalFormData().title(tr("ui.dorios.insight.namespace_menu.title")).textField(
    tr("ui.dorios.insight.namespace_menu.namespace_label"),
    tr("ui.dorios.insight.namespace_menu.namespace_hint")
  ).textField(
    tr("ui.dorios.insight.namespace_menu.display_label"),
    tr("ui.dorios.insight.namespace_menu.display_hint")
  );
  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    return;
  }
  const namespaceInput = String(result.formValues[0] ?? "").trim();
  const displayName = String(result.formValues[1] ?? "").trim();
  if (!namespaceInput || !displayName) {
    sendPlayerMessage(player, tr("ui.dorios.insight.namespace_menu.error_required"));
    return;
  }
  const registration = registerNamespaceAlias(namespaceInput, displayName, true);
  if (!registration?.ok) {
    sendPlayerMessage(player, tr("ui.dorios.insight.namespace_menu.error_invalid"));
    return;
  }
  sendPlayerMessage(
    player,
    tr("ui.dorios.insight.namespace_menu.success", [registration.namespace, registration.name])
  );
}
function getComponentGroups() {
  const byKey = (keys) => InsightComponentDefinitions.filter((component) => keys.includes(component.key));
  return {
    entity: {
      titleKey: "ui.dorios.insight.components.entity.title",
      components: byKey([
        "health",
        "absorption",
        "armor",
        "hunger",
        "hungerEffect",
        "airBubbles",
        "effects",
        "effectHearts",
        "animalHearts",
        "tameable",
        "tameFoods",
        "technical",
        "coordinates",
        "typeId",
        "velocity"
      ])
    },
    block: {
      titleKey: "ui.dorios.insight.components.block.title",
      components: byKey([
        "namespace",
        "technical",
        "coordinates",
        "typeId",
        "namespaceResolution"
      ])
    },
    custom: {
      titleKey: "ui.dorios.insight.components.custom.title",
      components: InsightComponentDefinitions.filter((component) => customComponentKeySet.has(component.key))
    },
    blockStates: {
      titleKey: "ui.dorios.insight.components.block_states.title",
      components: byKey(["blockStates"]),
      runtimeFields: ["maxVisibleStates", "stateColumns"]
    },
    blockTags: {
      titleKey: "ui.dorios.insight.components.block_tags.title",
      components: byKey(["blockTags"]),
      runtimeFields: ["maxVisibleBlockTags", "tagColumns"]
    },
    entityTags: {
      titleKey: "ui.dorios.insight.components.entity_tags.title",
      components: byKey(["entityTags"]),
      runtimeFields: ["maxVisibleEntityTags", "tagColumns"]
    },
    entityFamilies: {
      titleKey: "ui.dorios.insight.components.entity_families.title",
      components: byKey(["entityFamilies"]),
      runtimeFields: ["maxVisibleEntityFamilies", "familyColumns"]
    }
  };
}
function toggleLocalActivation(player, settings) {
  const shouldActivate = settings.disabled;
  setPlayerActivation(player, shouldActivate);
  sendPlayerMessage(
    player,
    shouldActivate ? tr("ui.dorios.insight.feedback.local_enabled") : tr("ui.dorios.insight.feedback.local_disabled")
  );
}
function toggleGlobalActivation(player, settings) {
  const nextGlobal = setInsightGlobalEnabled(!settings.globalEnabled);
  sendPlayerMessage(
    player,
    nextGlobal ? tr("ui.dorios.insight.feedback.global_enabled") : tr("ui.dorios.insight.feedback.global_disabled")
  );
}
function toggleAdminOnlyGlobalProfile(player, settings) {
  if (!isAdminPlayer(player)) {
    sendPlayerMessage(player, tr("ui.dorios.insight.feedback.admin_only_denied"));
    return;
  }
  const nextValue = setAdminOnlyGlobalProfileEnabled(!settings.adminOnlyGlobalProfile, player);
  sendPlayerMessage(
    player,
    nextValue ? tr("ui.dorios.insight.feedback.admin_only_enabled", [player.name]) : tr("ui.dorios.insight.feedback.admin_only_disabled")
  );
}
async function showActivationMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const localStateLabel = getStateLabel(!settings.disabled, "Active", "Disabled");
  const globalStateLabel = getStateLabel(settings.globalEnabled, "Enabled", "Disabled");
  const adminOnlyStateLabel = getStateLabel(settings.adminOnlyGlobalProfile, "Enabled", "Disabled");
  const adminSourceLabel = settings.adminGlobalProfileSourceName || "-";
  const form = new ActionFormData().title(tr("ui.dorios.insight.activation_menu.title")).button(tr("ui.dorios.insight.menu.local_toggle_button", [localStateLabel])).button(tr("ui.dorios.insight.menu.global_toggle_button", [globalStateLabel])).button(tr("ui.dorios.insight.menu.admin_only_button", [adminOnlyStateLabel, adminSourceLabel]));
  const result = await form.show(player);
  if (result.canceled) {
    return;
  }
  switch (result.selection) {
    case 0:
      toggleLocalActivation(player, settings);
      break;
    case 1:
      toggleGlobalActivation(player, settings);
      break;
    case 2:
      toggleAdminOnlyGlobalProfile(player, settings);
      break;
  }
}
async function showDisplayMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const form = new ActionFormData().title(tr("ui.dorios.insight.display_root.title")).body(tr("ui.dorios.insight.display_root.body", [
    getDisplayStyleLabel(settings.displayStyle),
    getToolTierIndicatorModeLabel(settings.toolTierIndicatorMode)
  ])).button(tr("ui.dorios.insight.menu.style_button", [getDisplayStyleLabel(settings.displayStyle)])).button(tr("ui.dorios.insight.display_root.hud_button")).button(tr("ui.dorios.insight.display_root.hud_elements_button")).button(tr("ui.dorios.insight.display_root.waila_button")).button(tr("ui.dorios.insight.display_root.conditions_button")).button(tr("ui.dorios.insight.display_root.system_button")).button(tr("ui.dorios.insight.display_root.runtime_button"));
  const result = await form.show(player);
  if (result.canceled) {
    return;
  }
  switch (result.selection) {
    case 0:
      await showStyleMenu(player);
      break;
    case 1:
      await showHudBarsMenu(player);
      break;
    case 2:
      await showHudElementsMenu(player);
      break;
    case 3:
      await showWailaMenu(player);
      break;
    case 4:
      await showConditionsMenu(player);
      break;
    case 5:
      await showSystemSettingsMenu(player);
      break;
    case 6:
      await showRuntimeMenu(player);
      break;
  }
}
async function showComponentsMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const componentGroups = getComponentGroups();
  const form = new ActionFormData().title(tr("ui.dorios.insight.target_menu.title")).body(tr("ui.dorios.insight.target_menu.body", [
    countEnabledComponents(settings.components),
    settings.maxVisibleStates,
    settings.maxVisibleBlockTags,
    settings.maxVisibleEntityTags,
    settings.maxVisibleEntityFamilies
  ])).button(tr("ui.dorios.insight.target_menu.entity_button")).button(tr("ui.dorios.insight.target_menu.block_button")).button(tr("ui.dorios.insight.target_menu.custom_button")).button(tr("ui.dorios.insight.target_menu.block_states_button")).button(tr("ui.dorios.insight.target_menu.block_tags_button")).button(tr("ui.dorios.insight.target_menu.entity_tags_button")).button(tr("ui.dorios.insight.target_menu.entity_families_button"));
  const result = await form.show(player);
  if (result.canceled) {
    return;
  }
  switch (result.selection) {
    case 0:
      await showComponentGroupMenu(player, componentGroups.entity);
      break;
    case 1:
      await showComponentGroupMenu(player, componentGroups.block);
      break;
    case 2:
      await showComponentGroupMenu(player, componentGroups.custom);
      break;
    case 3:
      await showComponentGroupWithRuntimeMenu(player, componentGroups.blockStates);
      break;
    case 4:
      await showComponentGroupWithRuntimeMenu(player, componentGroups.blockTags);
      break;
    case 5:
      await showComponentGroupWithRuntimeMenu(player, componentGroups.entityTags);
      break;
    case 6:
      await showComponentGroupWithRuntimeMenu(player, componentGroups.entityFamilies);
      break;
  }
}
async function openInsightMenu(player) {
  const settings = getPlayerDisplaySettings(player);
  const modeLabel = getModeLabel(settings.mode);
  const localStateLabel = getStateLabel(!settings.disabled, "Active", "Disabled");
  const globalStateLabel = getStateLabel(settings.globalEnabled, "Enabled", "Disabled");
  const form = new ActionFormData().title(tr("ui.dorios.insight.menu.title")).body(tr("ui.dorios.insight.menu.body", [
    modeLabel,
    settings.maxDistance,
    settings.updateIntervalTicks,
    settings.unchangedTargetRefreshTicks,
    globalStateLabel,
    localStateLabel
  ])).button(tr("ui.dorios.insight.menu.mode_button", [modeLabel])).button(tr("ui.dorios.insight.menu.activation_button")).button(tr("ui.dorios.insight.menu.target_insight_button")).button(tr("ui.dorios.insight.menu.display_root_button")).button(tr("ui.dorios.insight.menu.namespace_button")).button(tr("ui.dorios.insight.menu.reset_button")).button(tr("ui.dorios.insight.menu.close_button"));
  const result = await form.show(player);
  if (result.canceled) {
    return;
  }
  switch (result.selection) {
    case 0:
      await showModeMenu(player);
      break;
    case 1:
      await showActivationMenu(player);
      break;
    case 2:
      await showComponentsMenu(player);
      break;
    case 3:
      await showDisplayMenu(player);
      break;
    case 4:
      await showNamespaceMenu(player);
      break;
    case 5:
      resetPlayerOverrides(player);
      sendPlayerMessage(player, tr("ui.dorios.insight.feedback.reset_done"));
      break;
    default:
      return;
  }
  await openInsightMenu(player);
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\hudDataCollector.js
import { HudElement, HudVisibility } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\uiQueue.js
import { system as system8, world as world8 } from "@minecraft/server";
var playerQueues = /* @__PURE__ */ new Map();
var playerLastSent = /* @__PURE__ */ new Map();
var playerUpdateTick = /* @__PURE__ */ new Map();
var playerRefreshLoop = /* @__PURE__ */ new Map();
var playerDimension = /* @__PURE__ */ new Map();
var playerSubtitles = /* @__PURE__ */ new Map();
var registeredChannels = /* @__PURE__ */ new Set();
var started = false;
var STALE_THRESHOLD_TICKS = 10;
var BACKOFF_BASE_TICKS = 20;
function ensurePlayerState(playerId) {
  if (!playerQueues.has(playerId)) {
    playerQueues.set(playerId, /* @__PURE__ */ new Map());
    playerLastSent.set(playerId, /* @__PURE__ */ new Map());
    playerUpdateTick.set(playerId, /* @__PURE__ */ new Map());
    playerRefreshLoop.set(playerId, /* @__PURE__ */ new Map());
  }
}
function cleanupPlayer(playerId) {
  playerQueues.delete(playerId);
  playerLastSent.delete(playerId);
  playerUpdateTick.delete(playerId);
  playerRefreshLoop.delete(playerId);
  playerDimension.delete(playerId);
  playerSubtitles.delete(playerId);
}
function send(player, channelName, encodedData) {
  const id = player.id;
  ensurePlayerState(id);
  registeredChannels.add(channelName);
  const fullPayload = encodedData + channelName;
  const lastSentMap = playerLastSent.get(id);
  if (lastSentMap.get(channelName) === fullPayload) {
    return;
  }
  lastSentMap.set(channelName, fullPayload);
  playerQueues.get(id).set(channelName, fullPayload);
  playerUpdateTick.get(id).set(channelName, system8.currentTick + BACKOFF_BASE_TICKS);
  playerRefreshLoop.get(id).set(channelName, 0);
}
function clearPlayer(player) {
  cleanupPlayer(player.id);
}
function setSubtitle(player, subtitle) {
  playerSubtitles.set(player.id, subtitle);
}
function sendRaw(player, channelName, rawMessage) {
  const id = player.id;
  ensurePlayerState(id);
  registeredChannels.add(channelName);
  playerLastSent.get(id).set(channelName, rawMessage);
  playerQueues.get(id).set(channelName, rawMessage);
  playerUpdateTick.get(id).set(channelName, system8.currentTick + BACKOFF_BASE_TICKS);
  playerRefreshLoop.get(id).set(channelName, 0);
}
function initializeUIQueue() {
  system8.runInterval(() => {
    if (!started) {
      started = true;
      return;
    }
    for (const player of world8.getAllPlayers()) {
      try {
        dispatchForPlayer(player);
      } catch {
      }
    }
  }, 1);
  world8.afterEvents.playerLeave.subscribe((event) => {
    cleanupPlayer(event.playerId);
  });
}
function dispatchForPlayer(player) {
  const id = player.id;
  ensurePlayerState(id);
  const currentDim = player.dimension?.id;
  if (playerDimension.get(id) !== currentDim) {
    playerDimension.set(id, currentDim);
    const updateTicks2 = playerUpdateTick.get(id);
    const refreshLoops2 = playerRefreshLoop.get(id);
    for (const channel of registeredChannels) {
      if (updateTicks2.has(channel)) {
        updateTicks2.set(channel, system8.currentTick);
        refreshLoops2.set(channel, 0);
      }
    }
  }
  const queue = playerQueues.get(id);
  if (!queue) {
    return;
  }
  if (queue.size > 0) {
    const [channelName, payload] = queue.entries().next().value;
    queue.delete(channelName);
    try {
      const options = {
        fadeInDuration: 0,
        fadeOutDuration: 0,
        stayDuration: 0
      };
      if (playerSubtitles.has(id)) {
        const subtitle = playerSubtitles.get(id);
        options.subtitle = subtitle ?? "";
      }
      player.onScreenDisplay.setTitle(payload, options);
    } catch {
    }
    return;
  }
  const updateTicks = playerUpdateTick.get(id);
  const refreshLoops = playerRefreshLoop.get(id);
  const lastSentMap = playerLastSent.get(id);
  for (const channel of registeredChannels) {
    const lastTick = updateTicks.get(channel);
    const lastPayload = lastSentMap?.get(channel);
    if (lastTick == null || lastPayload == null) {
      continue;
    }
    if (system8.currentTick - lastTick > STALE_THRESHOLD_TICKS) {
      queue.set(channel, lastPayload);
      const loopCount = refreshLoops.get(channel) ?? 0;
      updateTicks.set(channel, system8.currentTick + BACKOFF_BASE_TICKS * (loopCount + 1));
      refreshLoops.set(channel, loopCount + 1);
      break;
    }
  }
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\uiDataEncoder.js
function defineSchema(delimiter, fields) {
  let totalDigits = 0;
  const normalizedFields = [];
  for (const field of fields) {
    const digits = Math.max(1, Math.min(8, Number(field.digits) || 2));
    normalizedFields.push({
      name: field.name,
      digits,
      defaultValue: Number(field.defaultValue) || 0,
      maxValue: Math.pow(10, digits) - 1
    });
    totalDigits += digits;
  }
  return Object.freeze({
    delimiter: String(delimiter).charAt(0),
    fields: Object.freeze(normalizedFields),
    totalDigits
  });
}
function encodeSection(schema, data) {
  let result = schema.delimiter;
  for (const field of schema.fields) {
    const rawValue = data?.[field.name];
    const value = Number.isFinite(rawValue) ? rawValue : field.defaultValue;
    const clamped = Math.max(0, Math.min(field.maxValue, Math.round(value)));
    result += String(clamped).padStart(field.digits, "0");
  }
  return result;
}
function encodePayload(schemas, data, channelSuffix) {
  let result = "";
  for (const schema of schemas) {
    result += encodeSection(schema, data);
  }
  result += channelSuffix;
  return result;
}
function computePayloadLength(schemas) {
  let total = 0;
  for (const schema of schemas) {
    total += 1 + schema.totalDigits;
  }
  return total;
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\uiChannels.js
var HUD_SECTION_A = defineSchema("a", [
  { name: "health", digits: 3 },
  { name: "maxHealth", digits: 3 },
  { name: "absorption", digits: 2 },
  { name: "healthGap", digits: 2 }
]);
var HUD_SECTION_B = defineSchema("b", [
  { name: "hunger", digits: 2 },
  { name: "maxHunger", digits: 2, defaultValue: 20 },
  { name: "saturation", digits: 2 },
  { name: "exhaustion", digits: 2 }
]);
var HUD_SECTION_C = defineSchema("c", [
  { name: "armor", digits: 2 },
  { name: "toughness", digits: 2 },
  { name: "extraArmor", digits: 2 },
  { name: "extraArmorFull", digits: 2 }
]);
var HUD_SECTION_D = defineSchema("d", [
  { name: "hungerPreview", digits: 2 },
  { name: "airSupply", digits: 2 },
  { name: "maxAir", digits: 2, defaultValue: 15 },
  { name: "flags", digits: 2 }
]);
var HUD_SECTION_E = defineSchema("e", [
  { name: "hudHealthIndicator", digits: 2 },
  { name: "hudHungerIndicator", digits: 2 },
  { name: "durPercent", digits: 2 },
  { name: "durVisible", digits: 2 }
]);
var HUD_SECTION_F = defineSchema("f", [
  { name: "durCurHi", digits: 2 },
  { name: "durCurLo", digits: 2 },
  { name: "durMaxHi", digits: 2 },
  { name: "durMaxLo", digits: 2 }
]);
var HUD_SECTION_G = defineSchema("g", [
  { name: "hudInventory", digits: 2 },
  { name: "hudInventoryPosition", digits: 2 },
  { name: "hudInventoryDisplayMode", digits: 2 },
  { name: "hudInventoryOrientation", digits: 2 }
]);
var HUD_SECTION_H = defineSchema("h", [
  { name: "stackCurrent", digits: 3 },
  { name: "stackVisible", digits: 1 },
  { name: "stackTotalHi", digits: 2 },
  { name: "stackTotalLo", digits: 2 }
]);
var HUD_SCHEMAS = [HUD_SECTION_A, HUD_SECTION_B, HUD_SECTION_C, HUD_SECTION_D, HUD_SECTION_E, HUD_SECTION_F, HUD_SECTION_G, HUD_SECTION_H];
var CHANNEL_HUD = "insight_hud";
var HUD_PAYLOAD_LENGTH = computePayloadLength(HUD_SCHEMAS);
function encodeHudData(data) {
  return encodePayload(HUD_SCHEMAS, data, CHANNEL_HUD);
}
var TARGET_SECTION_A = defineSchema("a", [
  { name: "targetType", digits: 2 },
  { name: "targetHealth", digits: 2 },
  { name: "targetMaxHealth", digits: 2 },
  { name: "targetArmor", digits: 2 }
]);
var TARGET_SECTION_B = defineSchema("b", [
  { name: "targetIsBaby", digits: 2 },
  { name: "targetVariant", digits: 2 },
  { name: "targetMarkColor", digits: 2 },
  { name: "targetReserved", digits: 2 }
]);
var TARGET_SCHEMAS = [TARGET_SECTION_A, TARGET_SECTION_B];
var CHANNEL_TARGET = "insight_target";
var TARGET_PAYLOAD_LENGTH = computePayloadLength(TARGET_SCHEMAS);
var BIOME_SECTION_A = defineSchema("a", [
  { name: "dimension", digits: 2 },
  { name: "biomeId", digits: 2 },
  { name: "coordX_hi", digits: 2 },
  { name: "coordX_lo", digits: 2 }
]);
var BIOME_SECTION_B = defineSchema("b", [
  { name: "coordY", digits: 2 },
  { name: "coordZ_hi", digits: 2 },
  { name: "coordZ_lo", digits: 2 },
  { name: "reserved", digits: 2 }
]);
var BIOME_SCHEMAS = [BIOME_SECTION_A, BIOME_SECTION_B];
var CHANNEL_BIOME = "insight_biome";
var BIOME_PAYLOAD_LENGTH = computePayloadLength(BIOME_SCHEMAS);
var HudFlags = Object.freeze({
  /** Player is poisoned (wither/poison heart icons) */
  POISONED: 1,
  /** Player is withered */
  WITHERED: 2,
  /** Player has absorption effect */
  HAS_ABSORPTION: 4,
  /** Player is frozen (powdered snow) */
  FROZEN: 8,
  /** Player has hunger effect */
  HUNGER_EFFECT: 16,
  /** Hunger preview is active (holding food item) */
  HUNGER_PREVIEW: 32
});
function packHudFlags(flagValues) {
  let packed = 0;
  if (flagValues.poisoned) packed |= HudFlags.POISONED;
  if (flagValues.withered) packed |= HudFlags.WITHERED;
  if (flagValues.hasAbsorption) packed |= HudFlags.HAS_ABSORPTION;
  if (flagValues.frozen) packed |= HudFlags.FROZEN;
  if (flagValues.hungerEffect) packed |= HudFlags.HUNGER_EFFECT;
  if (flagValues.hungerPreview) packed |= HudFlags.HUNGER_PREVIEW;
  return Math.min(99, packed);
}
var TargetTypes = Object.freeze({
  NONE: 0,
  BLOCK: 1,
  ENTITY: 2,
  ITEM: 3,
  PLAYER: 4
});
var DimensionIds = Object.freeze({
  "minecraft:overworld": 1,
  "minecraft:nether": 2,
  "minecraft:the_end": 3
});

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\hudDataCollector.js
var hideVanillaHud = false;
var HudDisplayVisibilityModes = Object.freeze({
  ShowInsight: "show_insight",
  Both: "both",
  ShowVanilla: "show_vanilla",
  None: "none"
});
function normalizeHudDisplayMode2(mode, fallback = HudDisplayVisibilityModes.Both) {
  const normalized = String(mode || "").trim().toLowerCase();
  if (normalized === HudDisplayVisibilityModes.ShowInsight || normalized === HudDisplayVisibilityModes.Both || normalized === HudDisplayVisibilityModes.ShowVanilla || normalized === HudDisplayVisibilityModes.None) {
    return normalized;
  }
  return fallback;
}
function hudModeShowsInsight(mode) {
  const normalized = normalizeHudDisplayMode2(mode);
  return normalized === HudDisplayVisibilityModes.ShowInsight || normalized === HudDisplayVisibilityModes.Both;
}
function hudModeShowsVanilla(mode) {
  const normalized = normalizeHudDisplayMode2(mode);
  return normalized === HudDisplayVisibilityModes.ShowVanilla || normalized === HudDisplayVisibilityModes.Both;
}
function resolveHudMode(settings, runtimeKey, fallback = HudDisplayVisibilityModes.Both) {
  return normalizeHudDisplayMode2(
    settings?.[runtimeKey] ?? settings?.runtime?.[runtimeKey],
    fallback
  );
}
var playerDataCache = /* @__PURE__ */ new Map();
function safeGetComponentValue(player, componentId, property = "currentValue") {
  try {
    const component = player.getComponent(componentId);
    if (component) {
      const val = Number(component[property]);
      return Number.isFinite(val) ? val : 0;
    }
  } catch {
  }
  return 0;
}
function safeGetComponentMax(player, componentId) {
  try {
    const component = player.getComponent(componentId);
    if (component) {
      const val = Number(component.effectiveMax ?? component.value ?? component.defaultValue);
      return Number.isFinite(val) ? val : 0;
    }
  } catch {
  }
  return 0;
}
function getMainhandItem(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable");
    if (equippable && typeof equippable.getEquipment === "function") {
      return equippable.getEquipment("Mainhand") ?? equippable.getEquipment("mainhand") ?? equippable.getEquipment("slot.weapon.mainhand");
    }
  } catch {
  }
  return void 0;
}
function getInventoryContainer(player) {
  const componentIds = ["minecraft:inventory", "inventory"];
  for (const componentId of componentIds) {
    try {
      const inventory = player.getComponent(componentId);
      if (inventory?.container) {
        return inventory.container;
      }
    } catch {
      continue;
    }
  }
  return void 0;
}
function getSelectedHotbarSlotIndex(player) {
  try {
    const selectedSlotIndex = Number(player.selectedSlotIndex);
    if (Number.isFinite(selectedSlotIndex)) {
      return Math.max(0, Math.min(8, Math.floor(selectedSlotIndex)));
    }
  } catch {
  }
  return 0;
}
function areEquivalentInventoryItems(referenceItem, otherItem) {
  if (!referenceItem || !otherItem) {
    return false;
  }
  try {
    if (typeof referenceItem.isStackableWith === "function" && referenceItem.isStackableWith(otherItem)) {
      return true;
    }
  } catch {
  }
  return referenceItem.typeId === otherItem.typeId;
}
function getSelectedInventoryStackSummary(player) {
  const container = getInventoryContainer(player);
  if (!container) {
    return { current: 0, total: 0, visible: false };
  }
  const selectedSlotIndex = getSelectedHotbarSlotIndex(player);
  let selectedItem;
  try {
    selectedItem = container.getItem(selectedSlotIndex);
  } catch {
    selectedItem = void 0;
  }
  if (!selectedItem) {
    return { current: 0, total: 0, visible: false };
  }
  const current = Math.max(0, Math.min(255, Math.round(Number(selectedItem.amount) || 0)));
  const containerSize = Number.isFinite(container.size) ? container.size : 0;
  let total = 0;
  for (let slotIndex = 0; slotIndex < containerSize; slotIndex++) {
    try {
      const slotItem = container.getItem(slotIndex);
      if (!areEquivalentInventoryItems(selectedItem, slotItem)) {
        continue;
      }
      total += Math.max(0, Math.round(Number(slotItem?.amount) || 0));
    } catch {
      continue;
    }
  }
  return {
    current: Math.max(1, current),
    total: Math.max(1, Math.min(9999, total || current)),
    visible: true
  };
}
function getItemDurabilityInfo(itemStack) {
  if (!itemStack) {
    return { max: 0, current: 0, damage: 0, hasDurability: false };
  }
  try {
    const durabilityInfo = getInfo(itemStack);
    if (durabilityInfo) {
      const max = Math.max(0, Math.round(Number(durabilityInfo.max) || 0));
      const damage = Math.max(0, Math.round(Number(durabilityInfo.damage) || 0));
      const current = Math.max(0, Math.round(Number(durabilityInfo.remaining) || max - damage));
      if (max > 0) {
        return {
          max,
          current: Math.min(max, current),
          damage: Math.min(max, damage),
          hasDurability: true
        };
      }
    }
  } catch {
  }
  const componentIds = ["durability", "minecraft:durability"];
  for (const componentId of componentIds) {
    try {
      const durabilityComponent = itemStack.getComponent(componentId);
      if (!durabilityComponent) {
        continue;
      }
      const max = Math.max(0, Math.round(Number(durabilityComponent.maxDurability) || 0));
      const damage = Math.max(0, Math.round(Number(durabilityComponent.damage) || 0));
      if (max > 0) {
        return {
          max,
          current: Math.max(0, max - Math.min(max, damage)),
          damage: Math.min(max, damage),
          hasDurability: true
        };
      }
    } catch {
      continue;
    }
  }
  return { max: 0, current: 0, damage: 0, hasDurability: false };
}
function getTotalArmor(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable");
    if (equippable && Number.isFinite(equippable.totalArmor)) {
      return equippable.totalArmor;
    }
  } catch {
  }
  try {
    const armorComp = player.getComponent("minecraft:armor");
    if (armorComp && Number.isFinite(armorComp.value)) {
      return armorComp.value;
    }
  } catch {
  }
  return 0;
}
function getTotalArmorToughness(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable");
    if (!equippable) return 0;
    if (Number.isFinite(equippable.totalToughness)) {
      return equippable.totalToughness;
    }
    let totalToughness = 0;
    const slots = ["Head", "Chest", "Legs", "Feet"];
    for (const slot of slots) {
      try {
        const item = equippable.getEquipment(slot);
        if (!item) continue;
        const durability = item.getComponent("minecraft:durability");
        const enchantable = item.getComponent("minecraft:enchantable");
        const typeId = item.typeId?.toLowerCase() ?? "";
        if (typeId.includes("netherite")) {
          totalToughness += 3;
        } else if (typeId.includes("diamond")) {
          totalToughness += 2;
        }
      } catch {
        continue;
      }
    }
    return Math.min(20, totalToughness);
  } catch {
    return 0;
  }
}
function hasEffect(player, effectTypeId) {
  try {
    const effects = player.getEffects();
    if (!Array.isArray(effects)) return false;
    for (const effect of effects) {
      const typeId = effect?.typeId ?? effect?.type?.id ?? "";
      const normalized = typeof typeId === "string" ? (typeId.includes(":") ? typeId.split(":").pop() : typeId).toLowerCase() : "";
      if (normalized === effectTypeId) return true;
    }
  } catch {
  }
  return false;
}
function getFoodNutrition(itemStack) {
  if (!itemStack) return 0;
  try {
    if (itemStack.hasComponent("minecraft:food")) {
      const food = itemStack.getComponent("minecraft:food");
      return Number(food?.nutrition) || 0;
    }
  } catch {
  }
  return 0;
}
function isFrozen(player) {
  try {
    if (typeof player.isFrozen === "boolean") return player.isFrozen;
    const freezing = player.getComponent("minecraft:freezing");
    if (freezing && Number.isFinite(freezing.value) && freezing.value > 0) return true;
  } catch {
  }
  return false;
}
function getAirSupply(player) {
  try {
    const breathable = player.getComponent("minecraft:breathable");
    if (breathable) {
      const current = Number.isFinite(breathable.currentValue) ? breathable.currentValue : 15;
      const max = Number.isFinite(breathable.maxValue) ? breathable.maxValue : 15;
      return {
        current: Math.max(0, Math.round(current)),
        max: Math.max(1, Math.round(max))
      };
    }
  } catch {
  }
  return { current: 15, max: 15 };
}
function collectAndSendHudData(player, settings) {
  try {
    const healthMode = resolveHudMode(settings, "hudHealthVisibilityMode");
    const hungerMode = resolveHudMode(settings, "hudHungerVisibilityMode");
    const saturationMode = resolveHudMode(settings, "hudSaturationVisibilityMode");
    const toughnessMode = resolveHudMode(settings, "hudToughnessVisibilityMode");
    const showHealthInsight = Boolean(settings?.showHudHealthInsight ?? hudModeShowsInsight(healthMode));
    const showHungerInsight = Boolean(settings?.showHudHungerInsight ?? hudModeShowsInsight(hungerMode));
    const showSaturationInsight = Boolean(settings?.showHudSaturationInsight ?? hudModeShowsInsight(saturationMode));
    const showToughnessInsight = Boolean(settings?.showHudToughnessInsight ?? hudModeShowsInsight(toughnessMode));
    const showHealthVanilla = hideVanillaHud ? false : Boolean(settings?.showHudHealthVanilla ?? hudModeShowsVanilla(healthMode));
    const showHungerVanilla = hideVanillaHud ? false : Boolean(
      settings?.showHudHungerVanilla ?? (hudModeShowsVanilla(hungerMode) && hudModeShowsVanilla(saturationMode))
    );
    const showArmorVanilla = hideVanillaHud ? false : Boolean(settings?.showHudArmorVanilla ?? hudModeShowsVanilla(toughnessMode));
    const hudHealthIndicatorEnabled = showHealthInsight && settings?.hudHealthIndicatorEnabled !== false;
    const hudHungerIndicatorEnabled = showHungerInsight && settings?.hudHungerIndicatorEnabled !== false;
    const health = safeGetComponentValue(player, "minecraft:health");
    const maxHealth = safeGetComponentMax(player, "minecraft:health") || 20;
    const absorption = safeGetComponentValue(player, "minecraft:absorption") || 0;
    const healthGap = Math.max(0, Math.ceil(maxHealth / 20) - 1);
    const hunger = safeGetComponentValue(player, "minecraft:player.hunger");
    const maxHunger = 20;
    const saturation = Math.round(safeGetComponentValue(player, "minecraft:player.saturation"));
    const rawExhaustion = safeGetComponentValue(player, "minecraft:player.exhaustion");
    const exhaustion = hunger > 0 || saturation > 0 ? Math.max(0, Math.round((4 - rawExhaustion) / 4 * 20)) : 0;
    const totalArmor = getTotalArmor(player);
    const armor = Math.min(20, totalArmor);
    const toughness = getTotalArmorToughness(player);
    const extraArmor = Math.max(0, totalArmor - 20) % 20;
    const extraArmorFull = Math.floor(Math.max(0, totalArmor - 20) / 20);
    const mainhand = getMainhandItem(player);
    let hungerPreview = 0;
    if (hunger < 20) {
      const nutrition = getFoodNutrition(mainhand);
      if (nutrition > 0) {
        hungerPreview = Math.min(nutrition + hunger, 20);
      }
    }
    let durPercent = 0;
    let durCurrent = 0;
    let durMax = 0;
    let durVisible = 0;
    const durabilityInfo = getItemDurabilityInfo(mainhand);
    if (durabilityInfo.hasDurability && durabilityInfo.damage > 0) {
      durMax = durabilityInfo.max;
      durCurrent = durabilityInfo.current;
      durPercent = Math.max(0, Math.min(99, Math.floor(durCurrent / Math.max(1, durMax) * 100)));
      durVisible = 1;
    }
    const airData = getAirSupply(player);
    const hasHungerPreview = showHungerInsight && hungerPreview > 0;
    const flags = packHudFlags({
      poisoned: hasEffect(player, "poison"),
      withered: hasEffect(player, "wither"),
      hasAbsorption: absorption > 0,
      frozen: isFrozen(player),
      hungerEffect: hasEffect(player, "hunger"),
      hungerPreview: hasHungerPreview
    });
    const hudInventoryEnabled = Boolean(settings?.hudInventoryEnabled ?? settings?.runtime?.hudInventoryEnabled);
    const hudInventoryPosition = getHudElementPositionNumericId(
      settings?.hudInventoryPosition ?? settings?.runtime?.hudInventoryPosition
    );
    const hudInventoryDisplayMode = getHudInventoryDisplayNumericId(
      settings?.hudInventoryDisplayMode ?? settings?.runtime?.hudInventoryDisplayMode
    );
    const hudInventoryOrientation = getHudElementOrientationNumericId(
      settings?.hudInventoryOrientation ?? settings?.runtime?.hudInventoryOrientation
    );
    const selectedStackSummary = getSelectedInventoryStackSummary(player);
    const data = {
      health: showHealthInsight ? Math.round(health) : 0,
      maxHealth: showHealthInsight ? Math.round(maxHealth) : 0,
      absorption: showHealthInsight ? Math.min(99, Math.round(absorption)) : 0,
      healthGap: showHealthInsight ? healthGap : 0,
      hunger: showHungerInsight ? hunger : 0,
      maxHunger: showHungerInsight ? maxHunger : 0,
      saturation: showSaturationInsight && settings?.showSaturation !== false ? Math.min(99, saturation) : 0,
      exhaustion: showSaturationInsight && settings?.showExhaustion !== false ? exhaustion : 0,
      armor,
      toughness: showToughnessInsight && settings?.showToughness !== false ? Math.min(20, toughness) : 0,
      extraArmor: showToughnessInsight && settings?.showExtraArmor !== false ? extraArmor : 0,
      extraArmorFull: showToughnessInsight && settings?.showExtraArmor !== false ? extraArmorFull : 0,
      hungerPreview: showHungerInsight ? hungerPreview : 0,
      airSupply: Math.min(99, airData.current),
      maxAir: Math.min(99, airData.max),
      flags,
      hudHealthIndicator: hudHealthIndicatorEnabled ? 1 : 0,
      hudHungerIndicator: hudHungerIndicatorEnabled ? 1 : 0,
      hudInventory: hudInventoryEnabled ? 1 : 0,
      hudInventoryPosition,
      hudInventoryDisplayMode,
      hudInventoryOrientation,
      stackCurrent: selectedStackSummary.current,
      stackVisible: hudInventoryEnabled && selectedStackSummary.visible ? 1 : 0,
      stackTotalHi: Math.floor(Math.min(9999, selectedStackSummary.total) / 100),
      stackTotalLo: Math.min(9999, selectedStackSummary.total) % 100,
      durPercent,
      durVisible,
      durCurHi: Math.floor(Math.min(9999, durCurrent) / 100),
      durCurLo: Math.min(9999, durCurrent) % 100,
      durMaxHi: Math.floor(Math.min(9999, durMax) / 100),
      durMaxLo: Math.min(9999, durMax) % 100
    };
    const encoded = encodeHudData(data);
    send(player, CHANNEL_HUD, encoded.slice(0, -CHANNEL_HUD.length));
    try {
      player.onScreenDisplay.setHudVisibility(
        showHealthVanilla ? HudVisibility.Reset : HudVisibility.Hide,
        [HudElement.Health]
      );
      player.onScreenDisplay.setHudVisibility(
        showHungerVanilla ? HudVisibility.Reset : HudVisibility.Hide,
        [HudElement.Hunger]
      );
      player.onScreenDisplay.setHudVisibility(
        showArmorVanilla ? HudVisibility.Reset : HudVisibility.Hide,
        [HudElement.Armor]
      );
    } catch {
    }
    playerDataCache.set(player.id, data);
  } catch {
  }
}
function resetVanillaHud(player) {
  try {
    player.onScreenDisplay.setHudVisibility(HudVisibility.Reset, [
      HudElement.Health,
      HudElement.Hunger,
      HudElement.Armor
    ]);
  } catch {
    try {
      player.runCommand("hud @s reset");
    } catch {
    }
  }
}
function resetAllPlayersHud(worldRef) {
  try {
    for (const player of worldRef.getAllPlayers()) {
      resetVanillaHud(player);
    }
  } catch {
  }
}
function cleanupPlayer2(playerId) {
  playerDataCache.delete(playerId);
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\commands.js
var modeSet = /* @__PURE__ */ new Set([InsightModes.Essential, InsightModes.Detailed, InsightModes.Debug]);
var commandActionSet = /* @__PURE__ */ new Set(["menu", "mode", "activate", "global", "namespace", "reset"]);
var commandsRegistered = false;
var componentAliases = Object.freeze({
  namespace: "namespace",
  states: "blockStates",
  blockstates: "blockStates",
  tags: "blockTags",
  blocktags: "blockTags",
  health: "health",
  armor: "armor",
  air: "airBubbles",
  bubbles: "airBubbles",
  airbubbles: "airBubbles",
  technical: "technical",
  coordinates: "coordinates",
  position: "coordinates",
  id: "typeId",
  typeid: "typeId",
  effecthearts: "effectHearts",
  frozenhearts: "frozenHearts",
  hunger: "hunger",
  hungereffect: "hungerEffect",
  animalhearts: "animalHearts",
  entitytags: "entityTags",
  families: "entityFamilies",
  entityfamilies: "entityFamilies",
  velocity: "velocity",
  namespacedebug: "namespaceResolution",
  namespaceresolution: "namespaceResolution"
});
function sendMessage(player, message) {
  try {
    player.sendMessage(message);
  } catch {
  }
}
function getVisibilityPolicyValues() {
  return VisibilityPolicyLabels.map((option) => option.key);
}
function resolveComponentKey(rawValue) {
  const normalized = String(rawValue || "").trim().toLowerCase();
  if (!normalized) {
    return void 0;
  }
  if (componentAliases[normalized]) {
    return componentAliases[normalized];
  }
  const direct = InsightComponentDefinitions.find((component) => component.key.toLowerCase() === normalized);
  return direct?.key;
}
function getUsage() {
  return [
    "\xA76Dorios' Insight Commands",
    "\xA7e/utilitycraft:insight menu \xA77- Open the configuration menu",
    "\xA7e/utilitycraft:insightmenu \xA77- Open the configuration menu",
    "\xA7e/utilitycraft:insight mode <essential|detailed|debug> \xA77- Set global mode",
    "\xA7e/utilitycraft:insightmode <essential|detailed|debug> \xA77- Set global mode",
    "\xA7e/utilitycraft:insight activate <on|off|toggle> \xA77- Toggle your local activation",
    "\xA7e/utilitycraft:insightactivate <on|off|toggle> \xA77- Toggle your local activation",
    "\xA7e/utilitycraft:insight activate <component> <show|sneak|creative|sneak_creative|hide> \xA77- Set component visibility",
    "\xA7e/utilitycraft:insight global <on|off|toggle|status> \xA77- Toggle Insight globally",
    "\xA7e/utilitycraft:insightglobal <on|off|toggle|status> \xA77- Toggle Insight globally",
    "\xA7e/utilitycraft:insight namespace add <namespace> <displayName> \xA77- Map a namespace to an addon name",
    "\xA7e/utilitycraft:insight reset \xA77- Reset vanilla HUD for yourself",
    "\xA7e/utilitycraft:insight reset all \xA77- Reset vanilla HUD for all players",
    "\xA7e/utilitycraft:insightreset \xA77- Reset vanilla HUD for all players"
  ].join("\n");
}
function getPlayerFromOrigin(origin) {
  const player = origin?.sourceEntity;
  if (player?.typeId !== "minecraft:player") {
    console.warn("[Dorios' Insight] utilitycraft:insight command can only be used by players.");
    return void 0;
  }
  return player;
}
function registerInsightCommand(definition) {
  try {
    registry_exports.customCommand(definition);
  } catch (error) {
    console.warn(`[Dorios' Insight] Failed to register command ${definition?.name}: ${error}`);
  }
}
function handleModeCommand(player, modeValue) {
  const modeArg = String(modeValue || "").trim().toLowerCase();
  if (!modeArg) {
    sendMessage(player, `\xA7aCurrent mode: ${getCurrentModeLabel()}`);
    return;
  }
  if (!modeSet.has(modeArg)) {
    sendMessage(player, "\xA7cInvalid mode. Use: essential, detailed, debug.");
    return;
  }
  const applied = setCurrentMode(modeArg);
  sendMessage(player, `\xA7aDorios' Insight global mode set to ${InsightModePresets[applied].label}.`);
}
function handleActivateCommand(player, primaryValue, secondaryValue) {
  const firstArg = String(primaryValue || "").trim().toLowerCase();
  if (!firstArg) {
    sendMessage(player, "\xA7cUsage: /utilitycraft:insight activate <on|off|toggle|component policy>");
    return;
  }
  if (firstArg === "on") {
    setPlayerActivation(player, true);
    sendMessage(player, "\xA7aDorios' Insight activated for your player.");
    return;
  }
  if (firstArg === "off") {
    setPlayerActivation(player, false);
    sendMessage(player, "\xA7eDorios' Insight deactivated for your player.");
    return;
  }
  if (firstArg === "toggle") {
    const current = updatePlayerOverrides(player, {});
    const nextActive = current.disabled;
    setPlayerActivation(player, nextActive);
    sendMessage(player, `\xA7aDorios' Insight is now ${nextActive ? "active" : "disabled"} for your player.`);
    return;
  }
  const componentKey = resolveComponentKey(firstArg);
  if (!componentKey) {
    sendMessage(player, "\xA7cUnknown component key.");
    return;
  }
  if (isInsightComponentDeprecated(componentKey)) {
    sendMessage(player, `\xA78Component ${componentKey} is deprecated/non-functional for now.\xA7r`);
    return;
  }
  const policyArg = String(secondaryValue || "").trim().toLowerCase();
  if (!policyArg) {
    sendMessage(player, "\xA7cUsage: /utilitycraft:insight activate <component> <show|sneak|creative|sneak_creative|hide>");
    return;
  }
  const policy = normalizeVisibilityPolicy(policyArg);
  if (!getVisibilityPolicyValues().includes(policy)) {
    sendMessage(player, "\xA7cInvalid policy. Use: show, sneak, creative, sneak_creative, hide.");
    return;
  }
  updatePlayerOverrides(player, {
    components: {
      [componentKey]: policy
    }
  });
  sendMessage(player, `\xA7aComponent ${componentKey} set to ${policy}.`);
}
function handleGlobalCommand(player, primaryValue) {
  const action = String(primaryValue || "status").trim().toLowerCase();
  const current = isInsightGloballyEnabled();
  if (action === "status") {
    sendMessage(player, `\xA7aGlobal Insight status: ${current ? "enabled" : "disabled"}.`);
    return;
  }
  if (action === "toggle") {
    const next = setInsightGlobalEnabled(!current);
    sendMessage(player, `\xA7aDorios' Insight is now ${next ? "enabled" : "disabled"} globally.`);
    return;
  }
  if (action === "on") {
    setInsightGlobalEnabled(true);
    sendMessage(player, "\xA7aDorios' Insight enabled globally.");
    return;
  }
  if (action === "off") {
    setInsightGlobalEnabled(false);
    sendMessage(player, "\xA7eDorios' Insight disabled globally.");
    return;
  }
  sendMessage(player, "\xA7cUsage: /utilitycraft:insight global <on|off|toggle|status>");
}
function handleNamespaceCommand(player, primaryValue, secondaryValue, tertiaryValue) {
  const action = String(primaryValue || "").trim().toLowerCase();
  if (!action) {
    sendMessage(player, "\xA7cUsage: /utilitycraft:insight namespace add <namespace> <displayName>");
    return;
  }
  let namespaceArg;
  let displayNameArg;
  if (action === "add" || action === "set") {
    namespaceArg = secondaryValue;
    displayNameArg = tertiaryValue;
  } else {
    namespaceArg = primaryValue;
    displayNameArg = secondaryValue;
  }
  const namespaceValue = typeof namespaceArg === "string" ? namespaceArg.trim() : "";
  const displayNameValue = typeof displayNameArg === "string" ? displayNameArg.trim() : "";
  if (!namespaceValue || !displayNameValue) {
    sendMessage(player, "\xA7cUsage: /utilitycraft:insight namespace add <namespace> <displayName>");
    return;
  }
  const result = registerNamespaceAlias(namespaceValue, displayNameValue, true);
  if (!result?.ok) {
    sendMessage(player, "\xA7cInvalid namespace or display name.");
    return;
  }
  sendMessage(player, `\xA7aNamespace ${result.namespace} mapped to ${result.name}.`);
}
function handleResetCommand(player, primaryValue) {
  const scope = String(primaryValue || "").trim().toLowerCase();
  if (scope === "all") {
    resetAllPlayersHud(world9);
    sendMessage(player, "\xA7aVanilla HUD reset for all players.");
    return;
  }
  resetVanillaHud(player);
  sendMessage(player, "\xA7aVanilla HUD reset for your player.");
}
function handleRootInsightCommand(player, action, value, value2, value3) {
  const normalizedAction = String(action || "").trim().toLowerCase();
  if (!commandActionSet.has(normalizedAction)) {
    sendMessage(player, getUsage());
    return;
  }
  if (normalizedAction === "menu") {
    system9.run(async () => {
      await openInsightMenu(player);
    });
    return;
  }
  if (normalizedAction === "mode") {
    handleModeCommand(player, value);
    return;
  }
  if (normalizedAction === "activate") {
    handleActivateCommand(player, value, value2);
    return;
  }
  if (normalizedAction === "global") {
    handleGlobalCommand(player, value);
    return;
  }
  if (normalizedAction === "namespace") {
    handleNamespaceCommand(player, value, value2, value3);
    return;
  }
  if (normalizedAction === "reset") {
    handleResetCommand(player, value);
    return;
  }
  sendMessage(player, getUsage());
}
function initializeInsightCommands() {
  if (commandsRegistered) {
    return;
  }
  commandsRegistered = true;
  registerInsightCommand({
    name: "utilitycraft:insight",
    description: "Dorios Insight runtime controls",
    permissionLevel: "any",
    parameters: [
      {
        name: "action",
        type: "enum",
        values: ["menu", "mode", "activate", "global", "namespace", "reset"]
      },
      {
        name: "value",
        type: "string",
        optional: true
      },
      {
        name: "value2",
        type: "string",
        optional: true
      },
      {
        name: "value3",
        type: "string",
        optional: true
      }
    ],
    callback(origin, action, value, value2, value3) {
      const player = getPlayerFromOrigin(origin);
      if (!player) {
        return;
      }
      handleRootInsightCommand(player, action, value, value2, value3);
    }
  });
  registerInsightCommand({
    name: "utilitycraft:insightmenu",
    description: "Open Dorios Insight menu",
    permissionLevel: "any",
    parameters: [],
    callback(origin) {
      const player = getPlayerFromOrigin(origin);
      if (!player) {
        return;
      }
      handleRootInsightCommand(player, "menu");
    }
  });
  registerInsightCommand({
    name: "utilitycraft:insightmode",
    description: "Set Dorios Insight mode",
    permissionLevel: "any",
    parameters: [
      {
        name: "mode",
        type: "string",
        optional: true
      }
    ],
    callback(origin, mode) {
      const player = getPlayerFromOrigin(origin);
      if (!player) {
        return;
      }
      handleRootInsightCommand(player, "mode", mode);
    }
  });
  registerInsightCommand({
    name: "utilitycraft:insightactivate",
    description: "Activate Dorios Insight or set component policy",
    permissionLevel: "any",
    parameters: [
      {
        name: "value",
        type: "string",
        optional: true
      },
      {
        name: "value2",
        type: "string",
        optional: true
      }
    ],
    callback(origin, value, value2) {
      const player = getPlayerFromOrigin(origin);
      if (!player) {
        return;
      }
      handleRootInsightCommand(player, "activate", value, value2);
    }
  });
  registerInsightCommand({
    name: "utilitycraft:insightglobal",
    description: "Set Dorios Insight global status",
    permissionLevel: "any",
    parameters: [
      {
        name: "value",
        type: "string",
        optional: true
      }
    ],
    callback(origin, value) {
      const player = getPlayerFromOrigin(origin);
      if (!player) {
        return;
      }
      handleRootInsightCommand(player, "global", value);
    }
  });
  registerInsightCommand({
    name: "utilitycraft:insightnamespace",
    description: "Register namespace alias for Dorios Insight",
    permissionLevel: "any",
    parameters: [
      {
        name: "action",
        type: "string",
        optional: true
      },
      {
        name: "namespace",
        type: "string",
        optional: true
      },
      {
        name: "displayName",
        type: "string",
        optional: true
      }
    ],
    callback(origin, action, namespaceValue, displayNameValue) {
      const player = getPlayerFromOrigin(origin);
      if (!player) {
        return;
      }
      handleRootInsightCommand(player, "namespace", action, namespaceValue, displayNameValue);
    }
  });
  registerInsightCommand({
    name: "utilitycraft:insightreset",
    description: "Reset vanilla HUD for all players (fallback)",
    permissionLevel: "any",
    parameters: [],
    callback(origin) {
      const player = getPlayerFromOrigin(origin);
      if (!player) {
        return;
      }
      handleResetCommand(player, "all");
    }
  });
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\controller.js
import { system as system12, world as world12 } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\Deprecated\messages.js
import { EntityHealthComponent, EntityIsBabyComponent, world as world10 } from "@minecraft/server";

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\const.js
var BlockNames = {
  /* GRASS */
  "grass_block": "grass",
  "tall_grass": "tallgrass",
  "short_grass": "tallgrass.grass",
  /* FLOWERS */
  "poppy": "red_flower.poppy",
  "dandelion": "yellow_flower.dandelion",
  "cornflower": "red_flower.cornflower",
  "lily_of_the_valley": "red_flower.lilyOfTheValley",
  "oxeye_daisy": "red_flower.oxeyeDaisy",
  "white_tulip": "red_flower.tulipWhite",
  "red_tulip": "red_flower.tulipRed",
  "orange_tulip": "red_flower.tulipOrange",
  "pink_tulip": "red_flower.tulipPink",
  "azure_bluet": "red_flower.houstonia",
  "blue_orchid": "red_flower.blueOrchid",
  "allium": "red_flower.allium",
  "crimson_roots": "crimson_roots.crimsonRoots",
  "warped_roots": "warped_roots.warpedRoots",
  /* DOUBLE PLANT */
  "peony": "double_plant.paeonia",
  "rose_bush": "double_plant.rose",
  "lilac": "double_plant.syringa",
  "sunflower": "double_plant.sunflower",
  "large_fern": "double_plant.fern",
  "fern": "tallgrass.fern",
  /* LEAVES */
  "oak_leaves": "leaves.oak",
  "birch_leaves": "leaves.birch",
  "spruce_leaves": "leaves.spruce",
  "acacia_leaves": "leaves.acacia",
  "jungle_leaves": "leaves.jungle",
  "dark_oak_leaves": "leaves.big_oak",
  /* LOGS */
  "oak_log": "log.oak",
  "spruce_log": "log.spruce",
  "birch_log": "log.birch",
  "jungle_log": "log.jungle",
  "acacia_log": "log.acacia",
  "dark_oak_log": "log.big_oak",
  /* WOOD */
  "oak_wood": "wood.oak",
  "spruce_wood": "wood.spruce",
  "birch_wood": "wood.birch",
  "jungle_wood": "wood.jungle",
  "acacia_wood": "wood.acacia",
  "dark_oak_wood": "wood.dark_oak",
  "stripped_oak_wood": "wood.stripped.oak",
  "stripped_spruce_wood": "wood.stripped.spruce",
  "stripped_birch_wood": "wood.stripped.birch",
  "stripped_jungle_wood": "wood.stripped.jungle",
  "stripped_acacia_wood": "wood.stripped.acacia",
  "stripped_dark_oak_wood": "wood.stripped.dark_oak",
  /* PLANKS */
  "oak_planks": "planks.oak",
  "spruce_planks": "planks.spruce",
  "birch_planks": "planks.birch",
  "jungle_planks": "planks.jungle",
  "acacia_planks": "planks.acacia",
  "dark_oak_planks": "planks.big_oak",
  /* WOODEN SLABS */
  "oak_slab": "wooden_slab.oak",
  "spruce_slab": "wooden_slab.spruce",
  "birch_slab": "wooden_slab.birch",
  "jungle_slab": "wooden_slab.jungle",
  "acacia_slab": "wooden_slab.acacia",
  "dark_oak_slab": "wooden_slab.big_oak",
  /* FENCES */
  "oak_fence": "fence",
  "spruce_fence": "spruceFence",
  "birch_fence": "birchFence",
  "acacia_fence": "acaciaFence",
  "jungle_fence": "jungleFence",
  "dark_oak_fence": "darkOakFence",
  /* WALLS */
  "cobblestone_wall": "cobblestone_wall.normal",
  "mossy_cobblestone_wall": "cobblestone_wall.mossy",
  "end_stone_brick_wall": "cobblestone_wall.end_brick",
  "granite_wall": "cobblestone_wall.granite",
  "andesite_wall": "cobblestone_wall.andesite",
  "diorite_wall": "cobblestone_wall.diorite",
  "prismarine_wall": "cobblestone_wall.prismarine",
  "sandstone_wall": "cobblestone_wall.sandstone",
  "red_sandstone_wall": "cobblestone_wall.red_sandstone",
  "stone_brick_wall": "cobblestone_wall.stone_brick",
  "mossy_stone_brick_wall": "cobblestone_wall.mossy_stone_brick",
  "brick_wall": "cobblestone_wall.brick",
  "nether_brick_wall": "cobblestone_wall.nether_brick",
  "red_nether_brick_wall": "cobblestone_wall.red_nether_brick",
  /* CROPS */
  "pitcher_crop": "pitcher_pod",
  "torchflower_crop": "torchflower",
  "melon_stem": "melon_seeds",
  /* SAPLINGS */
  "oak_sapling": "sapling.oak",
  "acacia_sapling": "sapling.acacia",
  "birch_sapling": "sapling.birch",
  "spruce_sapling": "sapling.spruce",
  "jungle_sapling": "sapling.jungle",
  "dark_oak_sapling": "sapling.big_oak",
  /* STONE */
  "granite": "stone.granite",
  "andesite": "stone.andesite",
  "diorite": "stone.diorite",
  "stone": "stone.stone",
  "polished_granite": "stone.graniteSmooth",
  "polished_andesite": "stone.andesiteSmooth",
  "polished_diorite": "stone.dioriteSmooth",
  /* SANDSTONE */
  "chiseled_sandstone": "sandstone.chiseled",
  "cut_sandstone": "sandstone.cut",
  "smooth_sandstone": "sandstone.smooth",
  "chiseled_red_sandstone": "red_sandstone.chiseled",
  "cut_red_sandstone": "red_sandstone.cut",
  "smooth_red_sandstone": "red_sandstone.smooth",
  /* STONE BRICKS */
  "stone_bricks": "stonebrick.default",
  "cracked_stone_bricks": "stonebrick.cracked",
  "mossy_stone_bricks": "stonebrick.mossy",
  "chiseled_stone_bricks": "stonebrick.chiseled",
  /* STONE SLABS */
  "cobblestone_slab": "stone_slab.cobble",
  "normal_stone_slab": "stone_slab",
  "smooth_stone_slab": "stone_slab.stone",
  "mossy_cobblestone_slab": "stone_slab2.mossy_cobblestone",
  "sandstone_slab": "stone_slab.sand",
  "red_sandstone_slab": "stone_slab2.red_sandstone",
  "cut_sandstone_slab": "stone_slab4.cut_sandstone",
  "cut_red_sandstone_slab": "stone_slab4.cut_red_sandstone",
  "smooth_sandstone_slab": "stone_slab2.sandstone.smooth",
  "smooth_red_sandstone_slab": "stone_slab3.red_sandstone.smooth",
  "purpur_slab": "stone_slab2.purpur",
  "granite_slab": "stone_slab3.granite",
  "polished_granite_slab": "stone_slab3.granite.smooth",
  "andesite_slab": "stone_slab3.andesite",
  "polished_andesite_slab": "stone_slab3.andesite.smooth",
  "diorite_slab": "stone_slab3.diorite",
  "polished_diorite_slab": "stone_slab3.diorite.smooth",
  "stone_brick_slab": "stone_slab.smoothStoneBrick",
  "mossy_stone_brick_slab": "stone_slab4.mossy_stone_brick",
  "end_stone_brick_slab": "stone_slab3.end_brick",
  "quartz_slab": "stone_slab.quartz",
  "smooth_quartz_slab": "stone_slab4.smooth_quartz",
  "brick_slab": "stone_slab.brick",
  "nether_brick_slab": "stone_slab.nether_brick",
  "red_nether_brick_slab": "stone_slab2.red_nether_brick",
  "prismarine_slab": "stone_slab2.prismarine.rough",
  "prismarine_brick_slab": "stone_slab2.prismarine.bricks",
  "dark_prismarine_slab": "stone_slab2.prismarine.dark",
  /* INFESTED STONE */
  "infested_stone_bricks": "monster_egg.brick",
  "infested_cobblestone": "monster_egg.cobble",
  "infested_stone": "monster_egg.stone",
  "infested_mossy_stone_bricks": "monster_egg.mossybrick",
  "infested_cracked_stone_bricks": "monster_egg.crackedbrick",
  "infested_chiseled_stone_bricks": "monster_egg.chiseledbrick",
  /* ORES */
  "lit_redstone_ore": "redstone_ore",
  "lit_deepslate_redstone_ore": "deepslate_redstone_ore",
  /* SIGNS */
  "wall_sign": "standing_sign",
  "spruce_wall_sign": "spruce_standing_sign",
  "acacia_wall_sign": "acacia_standing_sign",
  "darkoak_wall_sign": "darkoak_standing_sign",
  "birch_wall_sign": "birch_standing_sign",
  "jungle_wall_sign": "jungle_standing_sign",
  "cherry_standing_sign": "cherry_sign",
  "bamboo_standing_sign": "bamboo_sign",
  "mangrove_standing_sign": "mangrove_sign",
  "cherry_wall_sign": "cherry_sign",
  "bamboo_wall_sign": "bamboo_sign",
  "mangrove_wall_sign": "mangrove_sign",
  /* CORAL */
  "tube_coral_block": "coral_block.blue",
  "dead_tube_coral_block": "coral_block.blue_dead",
  "brain_coral_block": "coral_block.pink",
  "dead_brain_coral_block": "coral_block.pink_dead",
  "bubble_coral_block": "coral_block.purple",
  "dead_bubble_coral_block": "coral_block.purple_dead",
  "fire_coral_block": "coral_block.red",
  "dead_fire_coral_block": "coral_block.red_dead",
  "horn_coral_block": "coral_block.yellow",
  "dead_horn_coral_block": "coral_block.yellow_dead",
  "tube_coral": "coral.blue",
  "dead_tube_coral": "coral.blue_dead",
  "brain_coral": "coral.pink",
  "dead_brain_coral": "coral.pink_dead",
  "bubble_coral": "coral.purple",
  "dead_bubble_coral": "coral.purple_dead",
  "fire_coral": "coral.red",
  "dead_fire_coral": "coral.red_dead",
  "horn_coral": "coral.yellow",
  "dead_horn_coral": "coral.yellow_dead",
  "tube_coral_fan": "coral.blue",
  "dead_tube_coral_fan": "coral.blue_dead",
  "brain_coral_fan": "coral.pink",
  "dead_brain_coral_fan": "coral.pink_dead",
  "bubble_coral_fan": "coral.purple",
  "dead_bubble_coral_fan": "coral.purple_dead",
  "fire_coral_fan": "coral.red",
  "dead_fire_coral_fan": "coral.red_dead",
  "horn_coral_fan": "coral.yellow",
  "dead_horn_coral_fan": "coral.yellow_dead",
  "tube_coral_wall_fan": "coral.blue",
  "dead_tube_coral_wall_fan": "coral.blue_dead",
  "brain_coral_wall_fan": "coral.pink",
  "dead_brain_coral_wall_fan": "coral.pink_dead",
  "bubble_coral_wall_fan": "coral.purple",
  "dead_bubble_coral_wall_fan": "coral.purple_dead",
  "fire_coral_wall_fan": "coral.red",
  "dead_fire_coral_wall_fan": "coral.red_dead",
  "horn_coral_wall_fan": "coral.yellow",
  "dead_horn_coral_wall_fan": "coral.yellow_dead",
  /* SHULKER BOXES */
  "undyed_shulker_box": "shulkerbox",
  "white_shulker_box": "shulkerBoxWhite",
  "light_gray_shulker_box": "shulkerBoxSilver",
  "gray_shulker_box": "shulkerBoxGray",
  "black_shulker_box": "shulkerBoxBlack",
  "brown_shulker_box": "shulkerBoxBrown",
  "red_shulker_box": "shulkerBoxRed",
  "orange_shulker_box": "shulkerBoxOrange",
  "yellow_shulker_box": "shulkerBoxYellow",
  "lime_shulker_box": "shulkerBoxLime",
  "green_shulker_box": "shulkerBoxGreen",
  "cyan_shulker_box": "shulkerBoxCyan",
  "light_blue_shulker_box": "shulkerBoxLightBlue",
  "blue_shulker_box": "shulkerBoxBlue",
  "purple_shulker_box": "shulkerBoxPurple",
  "magenta_shulker_box": "shulkerBoxMagenta",
  "pink_shulker_box": "shulkerBoxPink",
  /* PURPUR */
  "purpur_block": "purpur_block.default",
  "purpur_pillar": "purpur_block.lines",
  /* PRISMARINE */
  "dark_prismarine": "prismarine.dark",
  "prismarine": "prismarine.rough",
  "prismarine_bricks": "prismarine.bricks",
  /* QUARTZ */
  "quartz_pillar": "quartz_block.lines",
  "chiseled_quartz_block": "quartz_block.chiseled",
  "smooth_quartz": "quartz_block.smooth",
  /* TERRACOTTA */
  "white_terracotta": "stained_hardened_clay.white",
  "green_terracotta": "stained_hardened_clay.green",
  "lime_terracotta": "stained_hardened_clay.lime",
  "yellow_terracotta": "stained_hardened_clay.yellow",
  "orange_terracotta": "stained_hardened_clay.orange",
  "red_terracotta": "stained_hardened_clay.red",
  "brown_terracotta": "stained_hardened_clay.brown",
  "black_terracotta": "stained_hardened_clay.black",
  "gray_terracotta": "stained_hardened_clay.gray",
  "light_gray_terracotta": "stained_hardened_clay.silver",
  "cyan_terracotta": "stained_hardened_clay.cyan",
  "light_blue_terracotta": "stained_hardened_clay.lightBlue",
  "blue_terracotta": "stained_hardened_clay.blue",
  "purple_terracotta": "stained_hardened_clay.purple",
  "magenta_terracotta": "stained_hardened_clay.magenta",
  "pink_terracotta": "stained_hardened_clay.pink",
  /* GLAZED TERRACOTTA */
  "white_glazed_terracotta": "glazedTerracotta.white",
  "green_glazed_terracotta": "glazedTerracotta.green",
  "lime_glazed_terracotta": "glazedTerracotta.lime",
  "yellow_glazed_terracotta": "glazedTerracotta.yellow",
  "orange_glazed_terracotta": "glazedTerracotta.orange",
  "red_glazed_terracotta": "glazedTerracotta.red",
  "brown_glazed_terracotta": "glazedTerracotta.brown",
  "black_glazed_terracotta": "glazedTerracotta.black",
  "gray_glazed_terracotta": "glazedTerracotta.gray",
  "silver_glazed_terracotta": "glazedTerracotta.silver",
  "cyan_glazed_terracotta": "glazedTerracotta.cyan",
  "light_blue_glazed_terracotta": "glazedTerracotta.light_blue",
  "blue_glazed_terracotta": "glazedTerracotta.blue",
  "purple_glazed_terracotta": "glazedTerracotta.purple",
  "magenta_glazed_terracotta": "glazedTerracotta.magenta",
  "pink_glazed_terracotta": "glazedTerracotta.pink",
  /* CONCRETE */
  "white_concrete": "concrete.white",
  "light_gray_concrete": "concrete.silver",
  "gray_concrete": "concrete.gray",
  "brown_concrete": "concrete.brown",
  "black_concrete": "concrete.black",
  "red_concrete": "concrete.red",
  "orange_concrete": "concrete.orange",
  "yellow_concrete": "concrete.yellow",
  "lime_concrete": "concrete.lime",
  "green_concrete": "concrete.green",
  "cyan_concrete": "concrete.cyan",
  "light_blue_concrete": "concrete.lightBlue",
  "blue_concrete": "concrete.blue",
  "purple_concrete": "concrete.purple",
  "magenta_concrete": "concrete.magenta",
  "pink_concrete": "concrete.pink",
  /* CONCRETE POWDER */
  "white_concrete_powder": "concretePowder.white",
  "light_gray_concrete_powder": "concretePowder.silver",
  "gray_concrete_powder": "concretePowder.gray",
  "brown_concrete_powder": "concretePowder.brown",
  "black_concrete_powder": "concretePowder.black",
  "red_concrete_powder": "concretePowder.red",
  "orange_concrete_powder": "concretePowder.orange",
  "yellow_concrete_powder": "concretePowder.yellow",
  "lime_concrete_powder": "concretePowder.lime",
  "green_concrete_powder": "concretePowder.green",
  "cyan_concrete_powder": "concretePowder.cyan",
  "light_blue_concrete_powder": "concretePowder.lightBlue",
  "blue_concrete_powder": "concretePowder.blue",
  "purple_concrete_powder": "concretePowder.purple",
  "magenta_concrete_powder": "concretePowder.magenta",
  "pink_concrete_powder": "concretePowder.pink",
  /* WOOL */
  "white_wool": "wool.white",
  "light_gray_wool": "wool.silver",
  "gray_wool": "wool.gray",
  "brown_wool": "wool.brown",
  "black_wool": "wool.black",
  "red_wool": "wool.red",
  "orange_wool": "wool.orange",
  "yellow_wool": "wool.yellow",
  "lime_wool": "wool.lime",
  "green_wool": "wool.green",
  "cyan_wool": "wool.cyan",
  "light_blue_wool": "wool.lightBlue",
  "blue_wool": "wool.blue",
  "purple_wool": "wool.purple",
  "magenta_wool": "wool.magenta",
  "pink_wool": "wool.pink",
  /* CARPET */
  "white_carpet": "carpet.white",
  "light_gray_carpet": "carpet.silver",
  "gray_carpet": "carpet.gray",
  "brown_carpet": "carpet.brown",
  "black_carpet": "carpet.black",
  "red_carpet": "carpet.red",
  "orange_carpet": "carpet.orange",
  "yellow_carpet": "carpet.yellow",
  "lime_carpet": "carpet.lime",
  "green_carpet": "carpet.green",
  "cyan_carpet": "carpet.cyan",
  "light_blue_carpet": "carpet.lightBlue",
  "blue_carpet": "carpet.blue",
  "purple_carpet": "carpet.purple",
  "magenta_carpet": "carpet.magenta",
  "pink_carpet": "carpet.pink",
  /* STAINED GLASS */
  "white_stained_glass": "stained_glass.white",
  "light_gray_stained_glass": "stained_glass.silver",
  "gray_stained_glass": "stained_glass.gray",
  "brown_stained_glass": "stained_glass.brown",
  "black_stained_glass": "stained_glass.black",
  "red_stained_glass": "stained_glass.red",
  "orange_stained_glass": "stained_glass.orange",
  "yellow_stained_glass": "stained_glass.yellow",
  "lime_stained_glass": "stained_glass.lime",
  "green_stained_glass": "stained_glass.green",
  "cyan_stained_glass": "stained_glass.cyan",
  "light_blue_stained_glass": "stained_glass.light_blue",
  "blue_stained_glass": "stained_glass.blue",
  "purple_stained_glass": "stained_glass.purple",
  "magenta_stained_glass": "stained_glass.magenta",
  "pink_stained_glass": "stained_glass.pink",
  /* STAINED GLASS PANES */
  "white_stained_glass_pane": "stained_glass_pane.white",
  "light_gray_stained_glass_pane": "stained_glass_pane.silver",
  "gray_stained_glass_pane": "stained_glass_pane.gray",
  "brown_stained_glass_pane": "stained_glass_pane.brown",
  "black_stained_glass_pane": "stained_glass_pane.black",
  "red_stained_glass_pane": "stained_glass_pane.red",
  "orange_stained_glass_pane": "stained_glass_pane.orange",
  "yellow_stained_glass_pane": "stained_glass_pane.yellow",
  "lime_stained_glass_pane": "stained_glass_pane.lime",
  "green_stained_glass_pane": "stained_glass_pane.green",
  "cyan_stained_glass_pane": "stained_glass_pane.cyan",
  "light_blue_stained_glass_pane": "stained_glass_pane.light_blue",
  "blue_stained_glass_pane": "stained_glass_pane.blue",
  "purple_stained_glass_pane": "stained_glass_pane.purple",
  "magenta_stained_glass_pane": "stained_glass_pane.magenta",
  "pink_stained_glass_pane": "stained_glass_pane.pink",
  /* MISCELLANEOUS */
  "trip_wire": "tripwire",
  "sponge": "sponge.dry",
  "wet_sponge": "sponge.wet",
  "unpowered_repeater": "repeater",
  "powered_repeater": "repeater",
  "brown_mushroom_block": "brown_mushroom_block.cap",
  "bamboo_sapling": "bamboo",
  "seagrass": "seagrass.seagrass",
  "red_sand": "sand.red",
  "coarse_dirt": "dirt.coarse",
  "piston_arm_collision": "piston",
  "sticky_piston_arm_collision": "sticky_piston",
  "unpowered_comparator": "comparator",
  "powered_comparator": "comparator",
  "skull": "skull.char",
  "sea_lantern": "sealantern",
  "lit_redstone_lamp": "redstone_lamp",
  "chipped_anvil": "anvil.slightlyDamaged",
  "damaged_anvil": "anvil.veryDamaged",
  "lit_furnace": "furnace",
  "lit_blast_furnace": "blast_furnace",
  "lit_smoker": "smoker"
};
var BlockPrefixes = {
  "cherry_standing_sign": "item",
  "bamboo_standing_sign": "item",
  "mangrove_standing_sign": "item",
  "cherry_wall_sign": "item",
  "bamboo_wall_sign": "item",
  "mangrove_wall_sign": "item",
  "wheat": "item",
  "pitcher_crop": "item",
  "melon_stem": "item",
  "unpowered_repeater": "item",
  "powered_repeater": "item",
  "kelp": "item",
  "unpowered_comparator": "item",
  "powered_comparator": "item",
  "skull": "item",
  "flower_pot": "item",
  "glow_frame": "item",
  "frame": "item",
  "brewing_stand": "item",
  /* DOORS */
  "wooden_door": "item",
  "spruce_door": "item",
  "jungle_door": "item",
  "acacia_door": "item",
  "birch_door": "item",
  "dark_oak_door": "item",
  "cherry_door": "item",
  "bamboo_door": "item",
  "mangrove_door": "item",
  /* HANGING SIGNS */
  "oak_hanging_sign": "item",
  "birch_hanging_sign": "item",
  "spruce_hanging_sign": "item",
  "acacia_hanging_sign": "item",
  "dark_oak_hanging_sign": "item",
  "mangrove_hanging_sign": "item",
  "cherry_hanging_sign": "item",
  "bamboo_hanging_sign": "item",
  "jungle_hanging_sign": "item",
  "warped_hanging_sign": "item",
  "crimson_hanging_sign": "item"
};
var ItemTranslationKeys = {
  "wooden_door": "item.wooden_door.name",
  "spruce_door": "item.spruce_door.name",
  "birch_door": "item.birch_door.name",
  "jungle_door": "item.jungle_door.name",
  "acacia_door": "item.acacia_door.name",
  "dark_oak_door": "item.dark_oak_door.name",
  "mangrove_door": "item.mangrove_door.name",
  "cherry_door": "item.cherry_door.name",
  "bamboo_door": "item.bamboo_door.name",
  "pale_oak_door": "item.pale_oak_door.name",
  "wheat_seeds": "item.wheat.name",
  "beetroot_seeds": "item.beetroot.name",
  "carrot": "item.carrot.name",
  "potato": "item.potato.name",
  "melon_seeds": "item.melon_seeds.name",
  "pumpkin_seeds": "item.pumpkin_seeds.name",
  "pitcher_pod": "item.pitcher_pod.name",
  "sugar_cane": "item.reeds.name",
  "glow_berries": "item.glow_berries.name",
  "sweet_berries": "item.sweet_berries.name",
  "oak_sign": "item.sign.name",
  "spruce_sign": "item.spruce_sign.name",
  "jungle_sign": "item.jungle_sign.name",
  "acacia_sign": "item.acacia_sign.name",
  "darkoak_sign": "item.darkoak_sign.name",
  "crimson_sign": "item.crimson_sign.name",
  "warped_sign": "item.warped_sign.name",
  "mangrove_sign": "item.mangrove_sign.name",
  "frame": "item.frame.name",
  "glow_frame": "item.glow_frame.name",
  "seagrass": "tile.seagrass.seagrass.name",
  "powder_snow_bucket": "tile.powder_snow.name"
};

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\Modules\nextVariantModule.js
var VARIANT_SOURCE_GLOBAL_KEY = "InsightAtelierVariants";
function stripNamespace(id) {
  const rawId = String(id || "");
  const parts = rawId.split(":");
  return parts.length > 1 ? parts.slice(1).join(":") : parts[0];
}
function resolveAlias(blockId, aliasMap) {
  let current = blockId;
  const visited = /* @__PURE__ */ new Set();
  while (aliasMap instanceof Map && aliasMap.has(current) && !visited.has(current)) {
    visited.add(current);
    current = aliasMap.get(current);
  }
  return current;
}
function blockIdToDisplayName(blockId) {
  return stripNamespace(blockId).split("_").filter((token) => token.length).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function getVariantSource() {
  const source = globalThis?.[VARIANT_SOURCE_GLOBAL_KEY];
  if (!source || !Array.isArray(source.MATERIAL_CYCLES)) {
    return void 0;
  }
  return {
    cycles: source.MATERIAL_CYCLES,
    aliasMap: source.BLOCK_ALIAS instanceof Map ? source.BLOCK_ALIAS : new Map(Array.isArray(source.BLOCK_ALIAS) ? source.BLOCK_ALIAS : [])
  };
}
var cachedCyclesReference;
var cachedAliasReference;
var cachedLookup = /* @__PURE__ */ new Map();
function ensureLookup(cycles, aliasMap) {
  if (cachedCyclesReference === cycles && cachedAliasReference === aliasMap) {
    return;
  }
  const lookup = /* @__PURE__ */ new Map();
  for (let cycleIndex = 0; cycleIndex < cycles.length; cycleIndex++) {
    const cycle = cycles[cycleIndex];
    if (!Array.isArray(cycle)) {
      continue;
    }
    for (let stateIndex = 0; stateIndex < cycle.length; stateIndex++) {
      const blockId = cycle[stateIndex];
      if (typeof blockId !== "string" || !blockId.length) {
        continue;
      }
      lookup.set(blockId, { cycleIndex, stateIndex });
    }
  }
  cachedCyclesReference = cycles;
  cachedAliasReference = aliasMap;
  cachedLookup = lookup;
}
function findEntryForBlockId(blockId, cycles, aliasMap) {
  ensureLookup(cycles, aliasMap);
  if (cachedLookup.has(blockId)) {
    return cachedLookup.get(blockId);
  }
  const aliased = resolveAlias(blockId, aliasMap);
  if (cachedLookup.has(aliased)) {
    return cachedLookup.get(aliased);
  }
  const stripped = stripNamespace(blockId);
  for (const [candidateId, entry] of cachedLookup.entries()) {
    if (stripNamespace(candidateId) === stripped) {
      return entry;
    }
  }
  return void 0;
}
function collectAtelierNextVariantBlockFields(context) {
  if (!context?.playerSettings?.showCustomFields || !context?.playerSettings?.showCustomVariantPreview) {
    return void 0;
  }
  const blockId = String(context?.block?.typeId || "");
  if (!blockId.length) {
    return void 0;
  }
  const source = getVariantSource();
  if (!source) {
    return void 0;
  }
  const entry = findEntryForBlockId(blockId, source.cycles, source.aliasMap);
  if (!entry) {
    return void 0;
  }
  const cycle = source.cycles[entry.cycleIndex];
  if (!Array.isArray(cycle) || cycle.length <= 1) {
    return void 0;
  }
  const nextIndex = (entry.stateIndex + 1) % cycle.length;
  const nextBlockId = cycle[nextIndex];
  if (typeof nextBlockId !== "string" || !nextBlockId.length) {
    return void 0;
  }
  return `Next Variant: ${blockIdToDisplayName(nextBlockId)}`;
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\Modules\index.js
var moduleBlockFieldInjectors = Object.freeze([
  Object.freeze({
    injector: collectAtelierNextVariantBlockFields,
    metadata: Object.freeze({
      provider: "Insight Modules - Dorios' Atelier",
      components: Object.freeze(["customVariantPreview"])
    })
  })
]);
var moduleEntityFieldInjectors = Object.freeze([]);

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\customFieldInjectors.js
import { system as system10 } from "@minecraft/server";
var blockFieldInjectors = [];
var entityFieldInjectors = [];
var supportedComponentKeys = Object.freeze(
  InsightComponentDefinitions.map((definition) => typeof definition?.key === "string" ? definition.key.trim() : "").filter((componentKey) => componentKey.length > 0)
);
var supportedComponentKeySet = new Set(supportedComponentKeys);
var DEFAULT_LINKED_ENTITY_SCAN_INTERVAL_TICKS = 20;
var DEFAULT_LINKED_ENTITY_SCAN_MAX_DISTANCE = 1.35;
var MIN_LINKED_ENTITY_SCAN_INTERVAL_TICKS = 1;
var MAX_LINKED_ENTITY_SCAN_INTERVAL_TICKS = 200;
var MIN_LINKED_ENTITY_SCAN_MAX_DISTANCE = 0.5;
var MAX_LINKED_ENTITY_SCAN_MAX_DISTANCE = 4;
var DEFAULT_LINKED_ENTITY_CANDIDATE_NAMES = Object.freeze([
  "utilitycraft:machine_entity",
  "entity.utilitycraft:machine_entity",
  "entity.utilitycraft:machine_entity.name"
]);
var linkedEntityCache = /* @__PURE__ */ new Map();
function normalizeProviderName(provider) {
  if (typeof provider !== "string") {
    return void 0;
  }
  const trimmed = provider.trim();
  return trimmed.length ? trimmed : void 0;
}
function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function getCurrentTick() {
  try {
    const tick = Number(system10?.currentTick ?? 0);
    return Number.isFinite(tick) && tick >= 0 ? tick : 0;
  } catch {
    return 0;
  }
}
function normalizeLinkedEntityScanIntervalTicks(playerSettings) {
  const rawValue = Number(playerSettings?.linkedEntityScanIntervalTicks);
  if (!Number.isFinite(rawValue)) {
    return DEFAULT_LINKED_ENTITY_SCAN_INTERVAL_TICKS;
  }
  return Math.floor(clampNumber(rawValue, MIN_LINKED_ENTITY_SCAN_INTERVAL_TICKS, MAX_LINKED_ENTITY_SCAN_INTERVAL_TICKS));
}
function normalizeLinkedEntityScanMaxDistance(playerSettings) {
  const rawValue = Number(playerSettings?.linkedEntityScanMaxDistance);
  if (!Number.isFinite(rawValue)) {
    return DEFAULT_LINKED_ENTITY_SCAN_MAX_DISTANCE;
  }
  return clampNumber(rawValue, MIN_LINKED_ENTITY_SCAN_MAX_DISTANCE, MAX_LINKED_ENTITY_SCAN_MAX_DISTANCE);
}
function normalizeLinkedEntityCandidateNames(playerSettings) {
  const source = Array.isArray(playerSettings?.linkedEntityCandidateNames) ? playerSettings.linkedEntityCandidateNames : DEFAULT_LINKED_ENTITY_CANDIDATE_NAMES;
  const normalized = source.filter((value) => typeof value === "string").map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0);
  if (!normalized.length) {
    return [...DEFAULT_LINKED_ENTITY_CANDIDATE_NAMES];
  }
  return [...new Set(normalized)];
}
function createCandidateSignature(candidateNames) {
  return [...candidateNames].sort((left, right) => left.localeCompare(right)).join("|");
}
function getBlockCacheKey(block) {
  if (!block?.location || !block?.dimension) {
    return void 0;
  }
  const x = Math.floor(Number(block.location.x));
  const y = Math.floor(Number(block.location.y));
  const z = Math.floor(Number(block.location.z));
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return void 0;
  }
  const dimensionId = String(block.dimension.id || "unknown").toLowerCase();
  return `${dimensionId}:${x},${y},${z}`;
}
function getBlockCenter(block) {
  const location = block?.location;
  if (!location) {
    return void 0;
  }
  const x = Number(location.x);
  const y = Number(location.y);
  const z = Number(location.z);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return void 0;
  }
  return {
    x: x + 0.5,
    y: y + 0.5,
    z: z + 0.5
  };
}
function getDistanceSquared(locationA, locationB) {
  if (!locationA || !locationB) {
    return Number.POSITIVE_INFINITY;
  }
  const deltaX = Number(locationA.x) - Number(locationB.x);
  const deltaY = Number(locationA.y) - Number(locationB.y);
  const deltaZ = Number(locationA.z) - Number(locationB.z);
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY) || !Number.isFinite(deltaZ)) {
    return Number.POSITIVE_INFINITY;
  }
  return deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;
}
function isEntityUsable(entity) {
  if (!entity) {
    return false;
  }
  try {
    if (typeof entity.isValid === "function") {
      return Boolean(entity.isValid());
    }
    if (typeof entity.isValid === "boolean") {
      return entity.isValid;
    }
  } catch {
    return false;
  }
  return true;
}
function normalizeEntityIdentity(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}
function isMatchingLinkedEntityCandidate(entity, candidateSet) {
  if (!entity || !(candidateSet instanceof Set) || !candidateSet.size) {
    return false;
  }
  const typeId = normalizeEntityIdentity(entity.typeId);
  const localizationKey = normalizeEntityIdentity(entity.localizationKey);
  const nameTag = normalizeEntityIdentity(entity.nameTag);
  const name = normalizeEntityIdentity(entity.name);
  if (typeId && candidateSet.has(typeId)) {
    return true;
  }
  if (localizationKey && candidateSet.has(localizationKey)) {
    return true;
  }
  if (nameTag && candidateSet.has(nameTag)) {
    return true;
  }
  if (name && candidateSet.has(name)) {
    return true;
  }
  return false;
}
function findNearestLinkedEntity(block, scanDistance, candidateNames) {
  const dimension = block?.dimension;
  const center = getBlockCenter(block);
  if (!dimension || !center) {
    return void 0;
  }
  let nearbyEntities;
  try {
    nearbyEntities = dimension.getEntities({
      location: center,
      maxDistance: scanDistance
    });
  } catch {
    return void 0;
  }
  if (!Array.isArray(nearbyEntities) || !nearbyEntities.length) {
    return void 0;
  }
  const candidateSet = new Set(candidateNames);
  let nearestEntity;
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;
  for (const entity of nearbyEntities) {
    if (!isEntityUsable(entity)) {
      continue;
    }
    if (!isMatchingLinkedEntityCandidate(entity, candidateSet)) {
      continue;
    }
    const distanceSquared = getDistanceSquared(entity.location, center);
    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestEntity = entity;
    }
  }
  return nearestEntity;
}
function getLinkedEntityFromCache(cacheKey, tick, interval, scanDistance, candidateSignature) {
  const cachedEntry = linkedEntityCache.get(cacheKey);
  if (!cachedEntry) {
    return void 0;
  }
  if (cachedEntry.interval !== interval) {
    return void 0;
  }
  if (cachedEntry.scanDistance !== scanDistance) {
    return void 0;
  }
  if (cachedEntry.candidateSignature !== candidateSignature) {
    return void 0;
  }
  if (tick >= cachedEntry.nextScanTick) {
    return void 0;
  }
  if (cachedEntry.entity && !isEntityUsable(cachedEntry.entity)) {
    return void 0;
  }
  return cachedEntry.entity;
}
function resolveLinkedEntityForBlock(context) {
  const block = context?.block;
  const cacheKey = getBlockCacheKey(block);
  if (!cacheKey || !block) {
    return {
      linkedEntity: void 0,
      linkedEntityLastScanTick: void 0,
      linkedEntityIntervalTicks: DEFAULT_LINKED_ENTITY_SCAN_INTERVAL_TICKS,
      linkedEntityScanMaxDistance: DEFAULT_LINKED_ENTITY_SCAN_MAX_DISTANCE
    };
  }
  const tick = getCurrentTick();
  const interval = normalizeLinkedEntityScanIntervalTicks(context?.playerSettings);
  const scanDistance = normalizeLinkedEntityScanMaxDistance(context?.playerSettings);
  const candidateNames = normalizeLinkedEntityCandidateNames(context?.playerSettings);
  const candidateSignature = createCandidateSignature(candidateNames);
  const cachedEntity = getLinkedEntityFromCache(cacheKey, tick, interval, scanDistance, candidateSignature);
  if (cachedEntity !== void 0) {
    const cachedEntry = linkedEntityCache.get(cacheKey);
    return {
      linkedEntity: cachedEntity,
      linkedEntityLastScanTick: cachedEntry?.lastScanTick,
      linkedEntityIntervalTicks: interval,
      linkedEntityScanMaxDistance: scanDistance
    };
  }
  const linkedEntity = findNearestLinkedEntity(block, scanDistance, candidateNames);
  linkedEntityCache.set(cacheKey, {
    entity: linkedEntity,
    nextScanTick: tick + interval,
    lastScanTick: tick,
    interval,
    scanDistance,
    candidateSignature
  });
  return {
    linkedEntity,
    linkedEntityLastScanTick: tick,
    linkedEntityIntervalTicks: interval,
    linkedEntityScanMaxDistance: scanDistance
  };
}
function createBlockInjectorContext(context) {
  const linkData = resolveLinkedEntityForBlock(context);
  return {
    ...context,
    linkedEntity: linkData.linkedEntity,
    machineEntity: linkData.linkedEntity,
    linkedEntityLastScanTick: linkData.linkedEntityLastScanTick,
    linkedEntityIntervalTicks: linkData.linkedEntityIntervalTicks,
    linkedEntityScanMaxDistance: linkData.linkedEntityScanMaxDistance
  };
}
function normalizeComponentKeys(components, provider) {
  if (!Array.isArray(components)) {
    return [];
  }
  const deduplicated = /* @__PURE__ */ new Set();
  const invalidKeys = [];
  for (const componentKey of components) {
    if (typeof componentKey !== "string") {
      continue;
    }
    const normalizedKey = componentKey.trim();
    if (!normalizedKey.length) {
      continue;
    }
    if (!supportedComponentKeySet.has(normalizedKey)) {
      invalidKeys.push(normalizedKey);
      continue;
    }
    deduplicated.add(normalizedKey);
  }
  if (invalidKeys.length) {
    const providerName = provider || "unknown";
    console.warn(
      `[Insight] Ignored unsupported custom field component keys from "${providerName}": ${invalidKeys.join(", ")}`
    );
  }
  return [...deduplicated];
}
function createInjectorEntry(injector, options) {
  const provider = normalizeProviderName(options?.provider);
  const metadata = {
    provider,
    components: normalizeComponentKeys(options?.components, provider)
  };
  return {
    injector,
    metadata
  };
}
function normalizeInjectorResult(result) {
  if (typeof result === "string") {
    const line = result.trim();
    return line ? [line] : [];
  }
  if (!Array.isArray(result)) {
    return [];
  }
  const normalized = [];
  for (const value of result) {
    if (typeof value !== "string") {
      continue;
    }
    const line = value.trim();
    if (!line) {
      continue;
    }
    normalized.push(line);
  }
  return normalized;
}
function registerInjector(list, injector, options) {
  if (typeof injector !== "function") {
    return false;
  }
  if (list.some((entry) => entry.injector === injector)) {
    return true;
  }
  list.push(createInjectorEntry(injector, options));
  return true;
}
function unregisterInjector(list, injector) {
  const index = list.findIndex((entry) => entry.injector === injector);
  if (index === -1) {
    return false;
  }
  list.splice(index, 1);
  return true;
}
function runInjectors(list, context) {
  const lines = [];
  for (const entry of list) {
    try {
      const result = entry.injector(context);
      lines.push(...normalizeInjectorResult(result));
    } catch (error) {
      const provider = entry?.metadata?.provider || "unknown";
      console.warn(`[Insight] Custom field injector from "${provider}" threw: ${error?.message || error}`);
    }
  }
  return lines;
}
function collectCustomBlockFieldLines(context) {
  const runtimeContext = createBlockInjectorContext(context);
  const moduleLines = runInjectors(moduleBlockFieldInjectors, runtimeContext);
  const externalLines = runInjectors(blockFieldInjectors, runtimeContext);
  return [...moduleLines, ...externalLines];
}
function collectCustomEntityFieldLines(context) {
  const moduleLines = runInjectors(moduleEntityFieldInjectors, context);
  const externalLines = runInjectors(entityFieldInjectors, context);
  return [...moduleLines, ...externalLines];
}
function getProvidersByComponent(componentKey) {
  const normalizedComponentKey = typeof componentKey === "string" ? componentKey.trim() : "";
  if (!normalizedComponentKey.length) {
    return [];
  }
  const providerNames = /* @__PURE__ */ new Set();
  const lists = [
    moduleBlockFieldInjectors,
    blockFieldInjectors,
    moduleEntityFieldInjectors,
    entityFieldInjectors
  ];
  for (const list of lists) {
    for (const entry of list) {
      const provider = entry?.metadata?.provider;
      const components = entry?.metadata?.components;
      if (!provider || !Array.isArray(components) || !components.includes(normalizedComponentKey)) {
        continue;
      }
      providerNames.add(provider);
    }
  }
  return [...providerNames].sort((a, b) => a.localeCompare(b));
}
function getSupportedComponentKeys() {
  return [...supportedComponentKeys];
}
function exposeCustomFieldApi() {
  const existingApi = globalThis.InsightCustomFields && typeof globalThis.InsightCustomFields === "object" ? globalThis.InsightCustomFields : {};
  globalThis.InsightCustomFields = {
    ...existingApi,
    registerBlockFieldInjector(injector, options) {
      return registerInjector(blockFieldInjectors, injector, options);
    },
    registerEntityFieldInjector(injector, options) {
      return registerInjector(entityFieldInjectors, injector, options);
    },
    unregisterBlockFieldInjector(injector) {
      return unregisterInjector(blockFieldInjectors, injector);
    },
    unregisterEntityFieldInjector(injector) {
      return unregisterInjector(entityFieldInjectors, injector);
    },
    clearBlockFieldInjectors() {
      blockFieldInjectors.length = 0;
    },
    clearEntityFieldInjectors() {
      entityFieldInjectors.length = 0;
    },
    getRegisteredCounts() {
      return {
        block: moduleBlockFieldInjectors.length + blockFieldInjectors.length,
        entity: moduleEntityFieldInjectors.length + entityFieldInjectors.length
      };
    },
    getProvidersByComponent(componentKey) {
      return getProvidersByComponent(componentKey);
    },
    getSupportedComponentKeys() {
      return getSupportedComponentKeys();
    },
    clearLinkedEntityCache() {
      linkedEntityCache.clear();
    },
    getLinkedEntityCacheSize() {
      return linkedEntityCache.size;
    }
  };
}
exposeCustomFieldApi();

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\stateTraitInjection.js
var blockStateTransformers = [];
var stateLabelAliases = /* @__PURE__ */ new Map();
var defaultStateLabelAliases = Object.freeze({
  "minecraft:cardinal_direction": "Facing",
  "minecraft:facing_direction": "Facing",
  "minecraft:block_face": "Face",
  "minecraft:vertical_half": "Half",
  "minecraft:upside_down_bit": "Upside Down",
  "minecraft:open_bit": "Open",
  "minecraft:in_wall_bit": "In Wall",
  "minecraft:door_hinge_bit": "Hinge Side",
  "minecraft:upper_block_bit": "Upper Half",
  "minecraft:persistent_bit": "Persistent",
  "minecraft:powered_bit": "Powered",
  "minecraft:attached_bit": "Attached",
  "minecraft:triggered_bit": "Triggered",
  "minecraft:liquid_depth": "Liquid Level",
  "minecraft:liquid_type": "Liquid Type",
  "minecraft:stone_type": "Stone Type",
  "minecraft:wood_type": "Wood Type"
});
for (const [stateKey, label] of Object.entries(defaultStateLabelAliases)) {
  stateLabelAliases.set(stateKey, label);
}
function normalizeStateKey(stateKey) {
  return String(stateKey || "").trim().toLowerCase();
}
function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : void 0;
}
function normalizeArrayOfStrings(values, normalizer = normalizeOptionalString) {
  if (!Array.isArray(values)) {
    return [];
  }
  const normalized = [];
  for (const value of values) {
    const next = normalizer(value);
    if (!next) {
      continue;
    }
    normalized.push(next);
  }
  return [...new Set(normalized)];
}
function normalizeEntryLabel(entry, fallbackLabel) {
  const preferredLabel = normalizeOptionalString(entry?.label);
  if (preferredLabel) {
    return preferredLabel;
  }
  const keyLabel = normalizeOptionalString(entry?.key);
  if (keyLabel) {
    return keyLabel;
  }
  return fallbackLabel;
}
function normalizeTransformerOptions(options) {
  const priority = Number(options?.priority);
  return {
    priority: Number.isFinite(priority) ? priority : 0,
    namespaces: normalizeArrayOfStrings(options?.namespaces, (value) => {
      const normalized = normalizeOptionalString(value);
      return normalized ? normalized.toLowerCase() : void 0;
    }),
    typeIdPrefixes: normalizeArrayOfStrings(options?.typeIdPrefixes, (value) => {
      const normalized = normalizeOptionalString(value);
      return normalized ? normalized.toLowerCase() : void 0;
    }),
    requiredTags: normalizeArrayOfStrings(options?.requiredTags, (value) => {
      const normalized = normalizeOptionalString(value);
      return normalized ? normalized.toLowerCase() : void 0;
    })
  };
}
function sortTransformersByPriority() {
  blockStateTransformers.sort((left, right) => left.options.priority - right.options.priority);
}
function registerBlockStateTransformer(transformer, options = {}) {
  if (typeof transformer !== "function") {
    return false;
  }
  if (blockStateTransformers.some((entry) => entry.transformer === transformer)) {
    return true;
  }
  blockStateTransformers.push({
    transformer,
    options: normalizeTransformerOptions(options)
  });
  sortTransformersByPriority();
  return true;
}
function unregisterBlockStateTransformer(transformer) {
  const index = blockStateTransformers.findIndex((entry) => entry.transformer === transformer);
  if (index === -1) {
    return false;
  }
  blockStateTransformers.splice(index, 1);
  return true;
}
function shouldRunTransformer(entry, context) {
  const options = entry.options;
  if (options.namespaces.length) {
    if (!options.namespaces.includes(context.namespace)) {
      return false;
    }
  }
  if (options.typeIdPrefixes.length) {
    const hasPrefix = options.typeIdPrefixes.some((prefix) => context.typeId.startsWith(prefix));
    if (!hasPrefix) {
      return false;
    }
  }
  if (options.requiredTags.length) {
    const missingTag = options.requiredTags.some((tag) => !context.blockTagSet.has(tag));
    if (missingTag) {
      return false;
    }
  }
  return true;
}
function normalizeRenameMap(renameMap) {
  if (!renameMap || typeof renameMap !== "object") {
    return {};
  }
  const normalized = {};
  for (const [stateKey, label] of Object.entries(renameMap)) {
    const normalizedKey = normalizeStateKey(stateKey);
    const normalizedLabel = normalizeOptionalString(label);
    if (!normalizedKey || !normalizedLabel) {
      continue;
    }
    normalized[normalizedKey] = normalizedLabel;
  }
  return normalized;
}
function normalizeReplaceMap(replaceMap) {
  if (!replaceMap || typeof replaceMap !== "object") {
    return {};
  }
  const normalized = {};
  for (const [stateKey, value] of Object.entries(replaceMap)) {
    const normalizedKey = normalizeStateKey(stateKey);
    if (!normalizedKey) {
      continue;
    }
    normalized[normalizedKey] = value;
  }
  return normalized;
}
function normalizeTransformerEntries(entries, context) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const normalized = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const stateKey = normalizeStateKey(entry.key);
    const labelFallback = stateKey ? toTitleWords(stateKey.includes(":") ? stateKey.split(":")[1].split("_") : stateKey.split("_")) : "State";
    const label = normalizeEntryLabel(entry, labelFallback);
    normalized.push({
      stateKey,
      label,
      rawValue: entry.value,
      valueText: context.toMessageText(entry.value),
      injected: true
    });
  }
  return normalized;
}
function normalizeTransformerResult(result, context) {
  if (!result || typeof result !== "object") {
    return {
      hide: /* @__PURE__ */ new Set(),
      rename: {},
      replace: {},
      prepend: [],
      append: []
    };
  }
  return {
    hide: new Set(normalizeArrayOfStrings(result.hide, normalizeStateKey)),
    rename: normalizeRenameMap(result.rename),
    replace: normalizeReplaceMap(result.replace),
    prepend: normalizeTransformerEntries(result.prepend, context),
    append: normalizeTransformerEntries(result.append, context)
  };
}
function applyAliasLabels(entries) {
  for (const entry of entries) {
    if (!entry.stateKey) {
      continue;
    }
    const aliasLabel = stateLabelAliases.get(entry.stateKey);
    if (aliasLabel) {
      entry.label = aliasLabel;
    }
  }
}
function toStateEntries(rawStates, context) {
  const entries = [];
  for (const [stateKey, rawValue] of Object.entries(rawStates || {})) {
    entries.push({
      stateKey: normalizeStateKey(stateKey),
      label: context.formatStateName(stateKey),
      rawValue,
      valueText: context.toMessageText(rawValue),
      injected: false
    });
  }
  applyAliasLabels(entries);
  return entries;
}
function toStateMap(entries) {
  const map = /* @__PURE__ */ Object.create(null);
  for (const entry of entries) {
    if (!entry.stateKey) {
      continue;
    }
    map[entry.stateKey] = entry.rawValue;
  }
  return map;
}
function applyTransformerResult(entries, normalizedResult, context) {
  const filteredEntries = [];
  for (const entry of entries) {
    if (entry.stateKey && normalizedResult.hide.has(entry.stateKey)) {
      continue;
    }
    const nextEntry = {
      ...entry
    };
    if (entry.stateKey && normalizedResult.rename[entry.stateKey]) {
      nextEntry.label = normalizedResult.rename[entry.stateKey];
    }
    if (entry.stateKey && Object.prototype.hasOwnProperty.call(normalizedResult.replace, entry.stateKey)) {
      const nextRawValue = normalizedResult.replace[entry.stateKey];
      nextEntry.rawValue = nextRawValue;
      nextEntry.valueText = context.toMessageText(nextRawValue);
    }
    filteredEntries.push(nextEntry);
  }
  const merged = [
    ...normalizedResult.prepend,
    ...filteredEntries,
    ...normalizedResult.append
  ];
  applyAliasLabels(merged);
  return merged;
}
function registerStateAlias(stateKey, label) {
  const normalizedStateKey = normalizeStateKey(stateKey);
  const normalizedLabel = normalizeOptionalString(label);
  if (!normalizedStateKey || !normalizedLabel) {
    return false;
  }
  stateLabelAliases.set(normalizedStateKey, normalizedLabel);
  return true;
}
function registerStateAliases(aliasMap) {
  if (!aliasMap || typeof aliasMap !== "object") {
    return false;
  }
  let changed = false;
  for (const [stateKey, label] of Object.entries(aliasMap)) {
    changed = registerStateAlias(stateKey, label) || changed;
  }
  return changed;
}
function registerStateMerge(definition = {}) {
  const mergedKey = normalizeStateKey(definition.key || definition.stateKey || "");
  const mergedLabel = normalizeOptionalString(definition.label) || "Merged";
  const sourceStateKeys = normalizeArrayOfStrings(definition.stateKeys, normalizeStateKey);
  if (!mergedKey || sourceStateKeys.length < 2) {
    return false;
  }
  const formatter = typeof definition.formatter === "function" ? definition.formatter : (values) => values.map((value) => String(value)).join(definition.separator || " / ");
  const hideOriginal = definition.hideOriginal !== false;
  const transformer = (context) => {
    const values = sourceStateKeys.map((stateKey) => context.stateMap[stateKey]);
    if (values.some((value) => value === void 0)) {
      return void 0;
    }
    const mergedValue = formatter(values, context);
    return {
      hide: hideOriginal ? sourceStateKeys : [],
      append: [
        {
          key: mergedKey,
          label: mergedLabel,
          value: mergedValue
        }
      ]
    };
  };
  return registerBlockStateTransformer(transformer, definition.options || {});
}
function transformBlockStateEntries(context) {
  const typeId = String(context?.typeId || context?.block?.typeId || "").trim().toLowerCase();
  const namespace = splitTypeId(typeId).namespace;
  const blockTags = Array.isArray(context?.blockTags) ? context.blockTags : [];
  const runtimeContext = {
    ...context,
    typeId,
    namespace,
    blockTagSet: new Set(blockTags.map((tag) => String(tag || "").toLowerCase())),
    toMessageText: typeof context?.toMessageText === "function" ? context.toMessageText : (value) => String(value),
    formatStateName: typeof context?.formatStateName === "function" ? context.formatStateName : (value) => String(value)
  };
  let entries = toStateEntries(context?.rawStates || {}, runtimeContext);
  for (const transformerEntry of blockStateTransformers) {
    if (!shouldRunTransformer(transformerEntry, runtimeContext)) {
      continue;
    }
    const stateMap = toStateMap(entries);
    let rawResult;
    try {
      rawResult = transformerEntry.transformer({
        ...runtimeContext,
        stateMap,
        entries: entries.map((entry) => ({ ...entry }))
      });
    } catch (error) {
      const provider = transformerEntry?.metadata?.provider || "unknown";
      console.warn(`[Insight] State transformer from "${provider}" threw: ${error?.message || error}`);
      continue;
    }
    const normalizedResult = normalizeTransformerResult(rawResult, runtimeContext);
    entries = applyTransformerResult(entries, normalizedResult, runtimeContext);
  }
  return entries;
}
function exposeStateTraitInjectionApi() {
  const existingApi = globalThis.InsightStateTraits && typeof globalThis.InsightStateTraits === "object" ? globalThis.InsightStateTraits : {};
  globalThis.InsightStateTraits = {
    ...existingApi,
    registerBlockStateTransformer(transformer, options) {
      return registerBlockStateTransformer(transformer, options);
    },
    unregisterBlockStateTransformer(transformer) {
      return unregisterBlockStateTransformer(transformer);
    },
    clearBlockStateTransformers() {
      blockStateTransformers.length = 0;
    },
    registerStateAlias(stateKey, label) {
      return registerStateAlias(stateKey, label);
    },
    registerStateAliases(aliasMap) {
      return registerStateAliases(aliasMap);
    },
    clearStateAliases() {
      stateLabelAliases.clear();
      for (const [stateKey, label] of Object.entries(defaultStateLabelAliases)) {
        stateLabelAliases.set(stateKey, label);
      }
    },
    registerStateMerge(definition) {
      return registerStateMerge(definition);
    },
    getRegisteredCounts() {
      return {
        transformers: blockStateTransformers.length,
        aliases: stateLabelAliases.size
      };
    },
    preview(context) {
      return transformBlockStateEntries(context);
    }
  };
}
exposeStateTraitInjectionApi();

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\Deprecated\messages.js
var Emojis = Object.freeze({
  armorFull: "\uF5B9",
  armorHalf: "\uF5BA",
  armorEmpty: "\uF5BB",
  heartCreative: "\uF5CF",
  heartEmpty: "\uF50F",
  heartHalf: "\uF50E",
  heartFull: "\uF50D",
  heartHardcoreHalf: "\uF5CA",
  heartHardcoreFull: "\uF5C9",
  heartWitherHalf: "\uF5CE",
  heartWitherFull: "\uF5CD",
  heartPoisonHalf: "\uF5DE",
  heartPoisonFull: "\uF5DD",
  heartFrozenHalf: "\uF5DC",
  heartFrozenFull: "\uF5DB",
  heartAbsorptionHalf: "\uF5DA",
  heartAbsorptionFull: "\uF5D9",
  heartAnimalHalf: "\uF5CC",
  heartAnimalFull: "\uF5CB",
  heartOnFireHalf: "\uF5AA",
  heartOnFireFull: "\uF5A9",
  hungerEmpty: "\uF5EB",
  hungerHalf: "\uF5EA",
  hungerFull: "\uF5E9",
  hungerFullSaturationHalf: "\uF5AC",
  hungerFullSaturationFull: "\uF5AB",
  hungerHalfSaturationHalf: "\uF5AE",
  hungerHalfSaturationFull: "\uF5AD",
  hungerEmptySaturationFull: "\uF5AF",
  hungerEmptySaturationHalf: "\uF5BF",
  hungerEffectEmpty: "\uF5EE",
  hungerEffectHalf: "\uF5EC",
  hungerEffectFull: "\uF5ED",
  waterBubbleEmpty: "\uF5BE",
  waterBubblePop: "\uF5BD",
  // Also kwown as half
  waterBubbleFull: "\uF5BC"
});
var HeartGlyphSets = Object.freeze({
  normal: Object.freeze({
    full: Emojis.heartFull,
    half: Emojis.heartHalf,
    empty: Emojis.heartEmpty
  }),
  wither: Object.freeze({
    full: Emojis.heartWitherFull,
    half: Emojis.heartWitherHalf,
    empty: Emojis.heartEmpty
  }),
  poison: Object.freeze({
    full: Emojis.heartPoisonFull,
    half: Emojis.heartPoisonHalf,
    empty: Emojis.heartEmpty
  }),
  frozen: Object.freeze({
    full: Emojis.heartFrozenFull,
    half: Emojis.heartFrozenHalf,
    empty: Emojis.heartEmpty
  }),
  burned: Object.freeze({
    full: Emojis.heartOnFireFull,
    half: Emojis.heartOnFireHalf,
    empty: Emojis.heartEmpty
  }),
  animal: Object.freeze({
    full: Emojis.heartAnimalFull,
    half: Emojis.heartAnimalHalf,
    empty: Emojis.heartEmpty
  })
});
var HungerGlyphSets = Object.freeze({
  normal: Object.freeze({
    full: Emojis.hungerFull,
    half: Emojis.hungerHalf,
    empty: Emojis.hungerEmpty
  }),
  effect: Object.freeze({
    full: Emojis.hungerEffectFull,
    half: Emojis.hungerEffectHalf,
    empty: Emojis.hungerEffectEmpty
  }),
  saturation: Object.freeze({
    fullSaturationFull: Emojis.hungerFullSaturationFull,
    fullSaturationHalf: Emojis.hungerFullSaturationHalf,
    halfSaturationFull: Emojis.hungerHalfSaturationFull,
    halfSaturationHalf: Emojis.hungerHalfSaturationHalf,
    emptySaturationFull: Emojis.hungerEmptySaturationFull,
    emptySaturationHalf: Emojis.hungerEmptySaturationHalf
  })
});
var ArmorGlyphs = Object.freeze({
  full: Emojis.armorFull,
  half: Emojis.armorHalf,
  empty: Emojis.armorEmpty
});
var BubbleGlyphs = Object.freeze({
  full: Emojis.waterBubbleFull,
  half: Emojis.waterBubblePop,
  empty: Emojis.waterBubbleEmpty
});
var BubbleDisplay = Object.freeze({
  maxUnits: InsightConfig.system.maxHeartsPerLine * 2
});
var ToolTierColors = Object.freeze({
  any: "\xA7e",
  stone: "\xA77",
  iron: "\xA7i",
  diamond: "\xA7s",
  netherite: "\xA7j"
});
var ToolTierOreGlyphs = Object.freeze({
  any: "\uF573",
  stone: "\uF55B",
  iron: "\uF55A",
  diamond: "\uF559",
  netherite: "\uF55D"
});
var ToolGlyphs = Object.freeze({
  // Updated glyphs from glyph_F5 page.
  shears: "\uF5FE",
  hoe: "\uF5FD",
  shovel: "\uF5FC",
  axe: "\uF5FB",
  pickaxe: "\uF5FA",
  sword: "\uF5F9"
});
var EmojiLayout = Object.freeze({
  blockNameToolSpacing: "  ",
  toolGlyphSpacing: " "
});
var PlayerAttributeComponentIds = Object.freeze({
  // From official Script API docs:
  // - EntityHungerComponent.componentId = "minecraft:player.hunger"
  // - EntitySaturationComponent.componentId = "minecraft:player.saturation"
  // - Player absorption attribute is exposed as "minecraft:absorption"
  hunger: "minecraft:player.hunger",
  saturation: "minecraft:player.saturation",
  absorption: "minecraft:absorption",
  armor: "minecraft:armor"
});
var PlayerAttributeComponentCandidates = Object.freeze({
  armor: ["minecraft:armor", "minecraft:player.armor"]
});
var EntityComponentIds = Object.freeze({
  tameable: "minecraft:tameable",
  rideable: "minecraft:rideable",
  breathable: "minecraft:breathable",
  freezing: "minecraft:freezing"
});
var TameableDisplay = Object.freeze({
  foodsPerLine: 3
});
var EffectDisplay = Object.freeze({
  unknownGlyph: "?",
  infiniteDurationLabel: "\u221E",
  iconAmplifierSpacing: " "
});
var EffectGlyphByTypeId = Object.freeze({
  blindness: "\uF51C",
  conduit: "\uF51D",
  conduit_power: "\uF51D",
  haste: "\uF51E",
  darkness: "\uF51F",
  fire_resistance: "\uF529",
  absorption: "\uF52A",
  health_boost: "\uF54F",
  hunger: "\uF52B",
  invisibility: "\uF52C",
  jump_boost: "\uF52D",
  levitation: "\uF52E",
  mining_fatigue: "\uF52F",
  resistance: "\uF539",
  slow_falling: "\uF53A",
  speed: "\uF53B",
  slowness: "\uF53C",
  strength: "\uF53D",
  weakness: "\uF53E",
  village_hero: "\uF53F",
  night_vision: "\uF549",
  water_breathing: "\uF54A",
  wither: "\uF54B",
  decay: "\uF54B",
  poison: "\uF54C",
  regeneration: "\uF516",
  dolphins_grace: "\uF528",
  fatal_poison: "\uF547",
  raid_omen: "\uF54E",
  trial_omen: "\uF548",
  bad_omen: "\uF538",
  weaving: "\uF526",
  wind_charged: "\uF536",
  infested: "\uF527",
  oozing: "\uF537",
  slimy_boots: "\uF557"
});
var PositiveEffectTypeIds = /* @__PURE__ */ new Set([
  "speed",
  "haste",
  "strength",
  "regeneration",
  "resistance",
  "fire_resistance",
  "water_breathing",
  "night_vision",
  "health_boost",
  "absorption",
  "jump_boost",
  "slow_falling",
  "invisibility",
  "conduit",
  "conduit_power",
  "dolphins_grace",
  "village_hero",
  "saturation",
  "luck"
]);
var NegativeEffectTypeIds = /* @__PURE__ */ new Set([
  "slowness",
  "mining_fatigue",
  "weakness",
  "poison",
  "wither",
  "decay",
  "blindness",
  "darkness",
  "hunger",
  "nausea",
  "levitation",
  "bad_omen",
  "fatal_poison",
  "unluck",
  "instant_damage"
]);
var EffectTextColors = Object.freeze({
  positive: "\xA7a",
  negative: "\xA7c",
  neutral: InsightConfig.display.technicalColor
});
var VanillaEffectLocalizationKeyOverrides = Object.freeze({
  bad_omen: "effect.badOmen",
  infested: "effect.infested",
  oozing: "effect.oozing",
  raid_omen: "effect.raid_omen",
  trial_omen: "effect.trial_omen",
  village_hero: "effect.villageHero",
  weaving: "effect.weaving",
  wind_charged: "effect.wind_charged"
});
var BlockToolTagGlyphs = Object.freeze([
  {
    tags: ["minecraft:is_pickaxe_item_destructible", "minecraft:pickaxe_item_destructible"],
    type: "pickaxe",
    glyph: ToolGlyphs.pickaxe,
    labelKey: "ui.dorios.insight.tool.pickaxe"
  },
  {
    tags: ["minecraft:is_axe_item_destructible", "minecraft:axe_item_destructible"],
    type: "axe",
    glyph: ToolGlyphs.axe,
    labelKey: "ui.dorios.insight.tool.axe"
  },
  {
    tags: ["minecraft:is_shovel_item_destructible", "minecraft:shovel_item_destructible"],
    type: "shovel",
    glyph: ToolGlyphs.shovel,
    labelKey: "ui.dorios.insight.tool.shovel"
  },
  {
    tags: ["minecraft:is_hoe_item_destructible", "minecraft:hoe_item_destructible"],
    type: "hoe",
    glyph: ToolGlyphs.hoe,
    labelKey: "ui.dorios.insight.tool.hoe"
  },
  {
    tags: ["minecraft:is_shears_item_destructible", "minecraft:shears_item_destructible"],
    type: "shears",
    glyph: ToolGlyphs.shears,
    labelKey: "ui.dorios.insight.tool.shears"
  },
  {
    tags: ["minecraft:is_sword_item_destructible", "minecraft:sword_item_destructible"],
    type: "sword",
    glyph: ToolGlyphs.sword,
    labelKey: "ui.dorios.insight.tool.sword"
  }
]);
var BlockTierTags = Object.freeze({
  netherite: Object.freeze([
    "minecraft:requires_netherite_tool",
    "minecraft:netherite_tier_destructible",
    "minecraft:is_netherite_tier_destructible"
  ]),
  diamond: Object.freeze([
    "minecraft:requires_diamond_tool",
    "minecraft:diamond_tier_destructible",
    "minecraft:is_diamond_tier_destructible"
  ]),
  iron: Object.freeze([
    "minecraft:requires_iron_tool",
    "minecraft:iron_tier_destructible",
    "minecraft:is_iron_tier_destructible"
  ]),
  stone: Object.freeze([
    "minecraft:requires_stone_tool",
    "minecraft:stone_tier_destructible",
    "minecraft:is_stone_tier_destructible"
  ])
});
var ToolTierStrength = Object.freeze({
  any: 0,
  wood: 0,
  wooden: 0,
  gold: 0,
  golden: 0,
  stone: 1,
  copper: 1,
  iron: 2,
  diamond: 3,
  netherite: 4
});
var ItemToolTypeSuffixes = Object.freeze([
  Object.freeze({ suffix: "_pickaxe", type: "pickaxe" }),
  Object.freeze({ suffix: "_axe", type: "axe" }),
  Object.freeze({ suffix: "_shovel", type: "shovel" }),
  Object.freeze({ suffix: "_hoe", type: "hoe" }),
  Object.freeze({ suffix: "_sword", type: "sword" })
]);
var ItemToolTypeTagAliases = Object.freeze({
  pickaxe: Object.freeze(["pickaxe", "is_pickaxe"]),
  axe: Object.freeze(["axe", "is_axe"]),
  shovel: Object.freeze(["shovel", "is_shovel"]),
  hoe: Object.freeze(["hoe", "is_hoe"]),
  shears: Object.freeze(["shears", "is_shears"]),
  sword: Object.freeze(["sword", "is_sword"])
});
var ItemTierTagAliases = Object.freeze({
  netherite: Object.freeze(["netherite_tier", "is_netherite_tier"]),
  diamond: Object.freeze(["diamond_tier", "is_diamond_tier"]),
  iron: Object.freeze(["iron_tier", "is_iron_tier"]),
  stone: Object.freeze(["stone_tier", "is_stone_tier"]),
  copper: Object.freeze(["copper_tier", "is_copper_tier"]),
  golden: Object.freeze(["gold_tier", "golden_tier", "is_gold_tier", "is_golden_tier"]),
  wooden: Object.freeze(["wood_tier", "wooden_tier", "is_wood_tier", "is_wooden_tier"])
});
var VillagerEntityTypeIds = /* @__PURE__ */ new Set([
  "minecraft:villager",
  "minecraft:villager_v2",
  "minecraft:zombie_villager",
  "minecraft:zombie_villager_v2"
]);
var VillagerProfessionTokenLocalizationKeys = Object.freeze({
  unskilled: "entity.villager.unskilled",
  unemployed: "entity.villager.unskilled",
  farmer: "entity.villager.farmer",
  fisherman: "entity.villager.fisherman",
  shepherd: "entity.villager.shepherd",
  fletcher: "entity.villager.fletcher",
  librarian: "entity.villager.librarian",
  cartographer: "entity.villager.cartographer",
  cleric: "entity.villager.cleric",
  armorer: "entity.villager.armor",
  weaponsmith: "entity.villager.weapon",
  toolsmith: "entity.villager.tool",
  butcher: "entity.villager.butcher",
  leatherworker: "entity.villager.leather",
  mason: "entity.villager.mason",
  stone_mason: "entity.villager.mason",
  nitwit: "entity.villager.unskilled"
});
function createBlockActionbar(block, playerSettings, context) {
  return buildBlockActionbarPayload(block, playerSettings, context);
}
function createEntityActionbar(entity, playerSettings, context) {
  return buildEntityActionbarPayload(entity, playerSettings, context);
}
function tr2(key, withArgs = []) {
  const entry = { translate: key };
  if (withArgs.length) {
    entry.with = withArgs.map(
      (arg) => arg === void 0 || arg === null ? "" : typeof arg === "object" ? arg : String(arg)
    );
  }
  return entry;
}
function readLocalizationKey(target) {
  const localizationKey = typeof target?.localizationKey === "string" ? target.localizationKey.trim() : "";
  return localizationKey.length ? localizationKey : void 0;
}
function readLocalizationKeyList(target) {
  const rawLocalizationKeys = target?.localizationKeys;
  if (typeof rawLocalizationKeys === "string") {
    const normalized = rawLocalizationKeys.trim();
    return normalized.length ? normalized : void 0;
  }
  if (!Array.isArray(rawLocalizationKeys)) {
    return void 0;
  }
  for (const candidate of rawLocalizationKeys) {
    if (typeof candidate !== "string") {
      continue;
    }
    const normalized = candidate.trim();
    if (normalized.length) {
      return normalized;
    }
  }
  return void 0;
}
function appendDisplayLine(rawtext, displayResult) {
  if (!displayResult) {
    return;
  }
  rawtext.push({ text: "\n" });
  if (typeof displayResult === "string") {
    rawtext.push({ text: displayResult });
  } else if (Array.isArray(displayResult)) {
    rawtext.push(...displayResult);
  } else if (typeof displayResult === "object") {
    rawtext.push(displayResult);
  }
}
function pushRawtextParts(rawtext, parts) {
  if (!Array.isArray(parts) || !parts.length) {
    return;
  }
  for (const part of parts) {
    if (!part) {
      continue;
    }
    rawtext.push(part);
  }
}
function hasEntityComponent(entity, componentIdCandidates) {
  if (!entity || typeof entity.getComponent !== "function") {
    return false;
  }
  for (const componentId of componentIdCandidates) {
    if (typeof componentId !== "string" || !componentId.length) {
      continue;
    }
    try {
      if (entity.getComponent(componentId)) {
        return true;
      }
    } catch {
    }
  }
  return false;
}
function readEntityBooleanState(entity, propertyNames) {
  if (!entity) {
    return void 0;
  }
  for (const propertyName of propertyNames) {
    if (typeof propertyName !== "string" || !propertyName.length) {
      continue;
    }
    try {
      if (typeof entity[propertyName] === "boolean") {
        return entity[propertyName];
      }
    } catch {
    }
    try {
      if (typeof entity.getProperty === "function") {
        const value = entity.getProperty(propertyName);
        if (typeof value === "boolean") {
          return value;
        }
        const numericValue = Number(value);
        if (Number.isFinite(numericValue)) {
          return numericValue > 0;
        }
      }
    } catch {
    }
  }
  return void 0;
}
function createDisplaySubfunctionRegistry() {
  const entityPredicates = Object.freeze({
    /**
     * Checks whether an entity has the baby component.
     * Uses the requested `component.id` path first, then official fallback paths.
     */
    hasIsBabyComponent(entity) {
      const isBabyComponentId = EntityIsBabyComponent?.component?.id || EntityIsBabyComponent?.componentId || "minecraft:is_baby";
      if (hasEntityComponent(entity, [isBabyComponentId, "minecraft:is_baby"])) {
        return true;
      }
      const babyState = readEntityBooleanState(entity, [
        "isBaby",
        "minecraft:is_baby",
        "is_baby"
      ]);
      return babyState === true;
    },
    isOnFireComponent(entity) {
      if (hasEntityComponent(entity, ["minecraft:onfire", "minecraft:on_fire"])) {
        return true;
      }
      const fireState = readEntityBooleanState(entity, [
        "isOnFire",
        "minecraft:onfire",
        "minecraft:on_fire"
      ]);
      if (fireState !== void 0) {
        return fireState;
      }
      try {
        if (typeof entity.getFireTicks === "function") {
          const fireTicks = Number(entity.getFireTicks());
          return Number.isFinite(fireTicks) && fireTicks > 0;
        }
      } catch {
      }
      return false;
    }
  });
  const dividerText = "\xA78------------------------------\xA7r";
  const displayHelpers = Object.freeze({
    dividerText,
    /**
     * Appends a visual divider in the actionbar to separate configurable fields
     * from computed/function-driven fields.
     */
    appendConfigurableFunctionDivider(rawtext) {
      appendDisplayLine(rawtext, { text: dividerText });
    }
  });
  return Object.freeze({
    entityPredicates,
    displayHelpers
  });
}
var DisplaySubfunctions = createDisplaySubfunctionRegistry();
function buildBlockTranslationRawtext(block, playerSettings) {
  const localizationKey = readLocalizationKey(block);
  if (localizationKey) {
    return {
      translate: localizationKey
    };
  }
  const blockTypeId = String(block?.typeId || "");
  if (!blockTypeId.length) {
    return tr2("ui.dorios.insight.display.unknown_block");
  }
  if (playerSettings?.blockNameResolveMode === EntityNameResolveModes.TypeIdToText) {
    return { text: formatTypeIdToText(blockTypeId) };
  }
  const { id } = splitTypeId(blockTypeId);
  const blockIdentifier = id.replace("double_slab", "slab");
  const translationPrefix = BlockPrefixes[blockIdentifier] || "tile";
  const translationName = BlockNames[blockIdentifier] || blockIdentifier;
  if (!blockTypeId.startsWith("minecraft:")) {
    return {
      translate: `tile.${blockTypeId}.name`
    };
  }
  return {
    translate: `${translationPrefix}.${translationName}.name`
  };
}
function hasBlockTag(block, tags, targetTag) {
  if (Array.isArray(tags) && tags.includes(targetTag)) {
    return true;
  }
  try {
    if (typeof block?.hasTag === "function") {
      return block.hasTag(targetTag);
    }
  } catch {
  }
  return false;
}
function hasAnyBlockTag(block, tags, targetTags) {
  if (!Array.isArray(targetTags) || !targetTags.length) {
    return false;
  }
  for (const targetTag of targetTags) {
    if (hasBlockTag(block, tags, targetTag)) {
      return true;
    }
  }
  return false;
}
function isTextDisplayStyle(playerSettings) {
  const style = normalizeDisplayStyleValue(playerSettings?.displayStyle);
  return style !== DisplayStyles.Icon;
}
function isTextOnlyDisplayStyle(playerSettings) {
  const style = normalizeDisplayStyleValue(playerSettings?.displayStyle);
  return style === DisplayStyles.TextFull || style === DisplayStyles.TextPercent;
}
function normalizeDisplayStyleValue(displayStyle) {
  if (displayStyle === DisplayStyles.Text) {
    return DisplayStyles.TextFull;
  }
  return String(displayStyle || DisplayStyles.Icon);
}
function getBlockToolDescriptors(block, blockTags) {
  const descriptors = [];
  for (const entry of BlockToolTagGlyphs) {
    if (hasAnyBlockTag(block, blockTags, entry.tags)) {
      descriptors.push(entry);
    }
  }
  return descriptors;
}
function getRequiredToolTier(blockTags) {
  if (!Array.isArray(blockTags) || !blockTags.length) {
    return "any";
  }
  if (hasAnyBlockTag(void 0, blockTags, BlockTierTags.netherite)) {
    return "netherite";
  }
  if (hasAnyBlockTag(void 0, blockTags, BlockTierTags.diamond)) {
    return "diamond";
  }
  if (hasAnyBlockTag(void 0, blockTags, BlockTierTags.iron)) {
    return "iron";
  }
  if (hasAnyBlockTag(void 0, blockTags, BlockTierTags.stone)) {
    return "stone";
  }
  return "any";
}
function getToolIndicatorTextColor(playerSettings) {
  const configured = String(playerSettings?.toolIndicatorColor || InsightConfig.display.technicalColor).trim();
  return /^§[0-9a-fr]$/i.test(configured) ? configured : InsightConfig.display.technicalColor;
}
function normalizeTagToken(rawTag) {
  const normalized = String(rawTag || "").trim().toLowerCase();
  if (!normalized.length) {
    return "";
  }
  return normalized.startsWith("minecraft:") ? normalized.slice("minecraft:".length) : normalized;
}
function getItemTagTokenSet(itemStack) {
  const tokenSet = /* @__PURE__ */ new Set();
  if (!itemStack) {
    return tokenSet;
  }
  try {
    if (typeof itemStack.getTags === "function") {
      const itemTags = itemStack.getTags();
      if (Array.isArray(itemTags)) {
        for (const rawTag of itemTags) {
          const normalized = normalizeTagToken(rawTag);
          if (!normalized) {
            continue;
          }
          tokenSet.add(normalized);
        }
      }
    }
  } catch {
  }
  return tokenSet;
}
function hasAnyItemTagToken(itemStack, itemTagTokens, candidateTags) {
  if (!Array.isArray(candidateTags) || !candidateTags.length) {
    return false;
  }
  for (const candidateTag of candidateTags) {
    const normalizedCandidate = normalizeTagToken(candidateTag);
    if (!normalizedCandidate) {
      continue;
    }
    if (itemTagTokens.has(normalizedCandidate)) {
      return true;
    }
    try {
      if (typeof itemStack?.hasTag === "function") {
        if (itemStack.hasTag(candidateTag) || itemStack.hasTag(`minecraft:${normalizedCandidate}`) || itemStack.hasTag(normalizedCandidate)) {
          return true;
        }
      }
    } catch {
    }
  }
  return false;
}
function getToolTypeFromItemTypeId(itemTypeId) {
  if (!itemTypeId) {
    return void 0;
  }
  const { id } = splitTypeId(itemTypeId);
  const normalizedId = String(id || "").toLowerCase();
  if (!normalizedId.length) {
    return void 0;
  }
  if (normalizedId === "shears") {
    return "shears";
  }
  for (const entry of ItemToolTypeSuffixes) {
    if (normalizedId.endsWith(entry.suffix)) {
      return entry.type;
    }
  }
  return void 0;
}
function getToolTypeFromItemTags(itemStack, itemTagTokens) {
  for (const [toolType, tagAliases] of Object.entries(ItemToolTypeTagAliases)) {
    if (hasAnyItemTagToken(itemStack, itemTagTokens, tagAliases)) {
      return toolType;
    }
  }
  return void 0;
}
function getToolTierFromItemTypeId(itemTypeId) {
  if (!itemTypeId) {
    return "any";
  }
  const { id } = splitTypeId(itemTypeId);
  const normalizedId = String(id || "").toLowerCase();
  if (!normalizedId.length) {
    return "any";
  }
  const tierPrefix = normalizedId.split("_")[0];
  if (ToolTierStrength[tierPrefix] !== void 0) {
    return tierPrefix;
  }
  return "any";
}
function getToolTierFromItemTags(itemStack, itemTagTokens) {
  const orderedTiers = ["netherite", "diamond", "iron", "stone", "copper", "golden", "wooden"];
  for (const tierName of orderedTiers) {
    const aliases = ItemTierTagAliases[tierName];
    if (!Array.isArray(aliases) || !aliases.length) {
      continue;
    }
    if (hasAnyItemTagToken(itemStack, itemTagTokens, aliases)) {
      return tierName;
    }
  }
  return void 0;
}
function getHeldToolInfo(heldItemStack) {
  if (!heldItemStack) {
    return void 0;
  }
  const itemTagTokens = getItemTagTokenSet(heldItemStack);
  const heldTypeId = heldItemStack?.typeId;
  const toolType = getToolTypeFromItemTags(heldItemStack, itemTagTokens) || getToolTypeFromItemTypeId(heldTypeId);
  const toolTier = getToolTierFromItemTags(heldItemStack, itemTagTokens) || getToolTierFromItemTypeId(heldTypeId);
  if (!toolType && toolTier === "any") {
    return void 0;
  }
  return {
    toolType,
    toolTier
  };
}
function isHeldToolTierSufficient(heldTier, requiredTier) {
  if (requiredTier === "any") {
    return true;
  }
  const heldStrength = ToolTierStrength[heldTier] ?? -1;
  const requiredStrength = ToolTierStrength[requiredTier] ?? 0;
  return heldStrength >= requiredStrength;
}
function isBreakableWithHeldTool(toolDescriptors, requiredTier, heldItemStack) {
  const requiresSpecificToolType = Array.isArray(toolDescriptors) && toolDescriptors.length > 0;
  const heldToolInfo = getHeldToolInfo(heldItemStack);
  if (!requiresSpecificToolType && requiredTier === "any") {
    return true;
  }
  if (!heldToolInfo) {
    return false;
  }
  if (requiresSpecificToolType) {
    if (!heldToolInfo.toolType) {
      return false;
    }
    const matchesToolType = toolDescriptors.some((entry) => entry.type === heldToolInfo.toolType);
    if (!matchesToolType) {
      return false;
    }
  }
  return isHeldToolTierSufficient(heldToolInfo.toolTier, requiredTier);
}
function buildToolTierIndicator(requiredTier, playerSettings, context = {}) {
  const mode = String(playerSettings?.toolTierIndicatorMode || ToolTierIndicatorModes.BooleanIndicator);
  if (mode === ToolTierIndicatorModes.Hidden) {
    return [];
  }
  const colorCode = getToolIndicatorTextColor(playerSettings);
  const requiresTool = requiredTier !== "any";
  const tierLocalizationKeys = {
    any: "ui.dorios.insight.tier.any",
    wood: "ui.dorios.insight.tier.wood",
    stone: "ui.dorios.insight.tier.stone",
    iron: "ui.dorios.insight.tier.iron",
    gold: "ui.dorios.insight.tier.gold",
    diamond: "ui.dorios.insight.tier.diamond",
    netherite: "ui.dorios.insight.tier.netherite"
  };
  const tierLocalizationKey = tierLocalizationKeys[requiredTier];
  const tierRawtext = tierLocalizationKey ? tr2(tierLocalizationKey) : { text: toTitleWords([requiredTier]) };
  if (mode === ToolTierIndicatorModes.BooleanIndicator) {
    const canBreakWithHeldTool = isBreakableWithHeldTool(
      context.toolDescriptors,
      requiredTier,
      context.heldItemStack
    );
    return [
      { text: colorCode },
      tr2("ui.dorios.insight.display.breakable_label"),
      { text: " " },
      tr2(canBreakWithHeldTool ? "ui.dorios.insight.value.yes" : "ui.dorios.insight.value.no"),
      { text: "\xA7r" }
    ];
  }
  if (!requiresTool) {
    return [
      { text: colorCode },
      tr2("ui.dorios.insight.display.tier_label"),
      { text: " " },
      tr2("ui.dorios.insight.tier.any"),
      { text: "\xA7r" }
    ];
  }
  if (mode === ToolTierIndicatorModes.TierIndicatorColor) {
    const color = ToolTierColors[requiredTier] || "\xA77";
    return [{ text: `${color}\u25A0\xA7r` }];
  }
  if (mode === ToolTierIndicatorModes.TierIndicatorOre) {
    const oreGlyph = ToolTierOreGlyphs[requiredTier] || ToolTierOreGlyphs.any;
    return [{ text: `${oreGlyph}` }];
  }
  if (mode === ToolTierIndicatorModes.TextIndicator) {
    return [
      { text: colorCode },
      tr2("ui.dorios.insight.display.tier_label"),
      { text: " " },
      tierRawtext,
      { text: "\xA7r" }
    ];
  }
  return [];
}
function buildBreakableToolsText(toolDescriptors, blockTags, playerSettings, context = {}) {
  const toolTierIndicator = buildToolTierIndicator(getRequiredToolTier(blockTags), playerSettings, {
    ...context,
    toolDescriptors
  });
  const colorCode = getToolIndicatorTextColor(playerSettings);
  if (!toolDescriptors.length) {
    return toolTierIndicator;
  }
  if (isTextOnlyDisplayStyle(playerSettings)) {
    const breakableText = [
      { text: colorCode },
      tr2("ui.dorios.insight.display.breakable_label"),
      { text: " " }
    ];
    for (let index = 0; index < toolDescriptors.length; index++) {
      if (index > 0) {
        breakableText.push({ text: ", " });
      }
      const descriptor = toolDescriptors[index];
      if (descriptor?.labelKey) {
        breakableText.push(tr2(descriptor.labelKey));
      } else if (descriptor?.type) {
        breakableText.push({ text: toTitleWords([descriptor.type]) });
      }
    }
    breakableText.push({ text: "\xA7r" });
    return toolTierIndicator.length ? [...breakableText, { text: " " }, ...toolTierIndicator] : breakableText;
  }
  const toolGlyphs = toolDescriptors.map((entry) => entry.glyph);
  const glyphText = toolGlyphs.join(EmojiLayout.toolGlyphSpacing);
  const glyphParts = [{ text: glyphText }];
  return toolTierIndicator.length ? [...glyphParts, { text: " " }, ...toolTierIndicator] : glyphParts;
}
function getToolIndicatorPlacement(playerSettings) {
  const rawPlacement = String(playerSettings?.toolIndicatorPlacement || ToolIndicatorPlacementModes.BeforeName);
  if (rawPlacement === ToolIndicatorPlacementModes.AfterName) {
    return ToolIndicatorPlacementModes.AfterName;
  }
  if (rawPlacement === ToolIndicatorPlacementModes.BelowName) {
    return ToolIndicatorPlacementModes.BelowName;
  }
  return ToolIndicatorPlacementModes.BeforeName;
}
function buildBreakableToolsPlacement(toolDescriptors, blockTags, playerSettings, context = {}) {
  const toolParts = buildBreakableToolsText(toolDescriptors, blockTags, playerSettings, context);
  if (!Array.isArray(toolParts) || !toolParts.length) {
    return {
      prefixParts: [],
      suffixParts: [],
      belowLineParts: []
    };
  }
  const placement = getToolIndicatorPlacement(playerSettings);
  if (placement === ToolIndicatorPlacementModes.BelowName) {
    return {
      prefixParts: [],
      suffixParts: [],
      belowLineParts: [{ text: "\n" }, ...toolParts]
    };
  }
  if (placement === ToolIndicatorPlacementModes.AfterName) {
    return {
      prefixParts: [],
      suffixParts: [{ text: EmojiLayout.blockNameToolSpacing }, ...toolParts],
      belowLineParts: []
    };
  }
  return {
    prefixParts: [...toolParts, { text: EmojiLayout.blockNameToolSpacing }],
    suffixParts: [],
    belowLineParts: []
  };
}
function buildColumnWrappedList(values, columns = 1) {
  if (!Array.isArray(values) || !values.length) {
    return "";
  }
  const normalizedColumns = Math.max(1, Math.floor(columns));
  const rows = [];
  for (let index = 0; index < values.length; index += normalizedColumns) {
    rows.push(values.slice(index, index + normalizedColumns).join(", "));
  }
  return rows.join("\n");
}
function checkBlockFromItem(itemStack) {
  if (!itemStack?.typeId) {
    return void 0;
  }
  try {
    const blockPlacer = itemStack.getComponent?.("minecraft:block_placer");
    if (blockPlacer) {
      const candidates = [
        blockPlacer.block,
        blockPlacer.blockType,
        blockPlacer.blockItem,
        blockPlacer.blockId,
        blockPlacer.blockTypeId
      ];
      for (const candidate of candidates) {
        if (!candidate) {
          continue;
        }
        if (typeof candidate === "string") {
          return candidate.includes(":") ? candidate : `minecraft:${candidate}`;
        }
        if (typeof candidate === "object") {
          const candidateTypeId = candidate.typeId || candidate.id;
          if (typeof candidateTypeId === "string" && candidateTypeId.length) {
            return candidateTypeId.includes(":") ? candidateTypeId : `minecraft:${candidateTypeId}`;
          }
        }
      }
    }
  } catch {
  }
  const { namespace, id } = splitTypeId(itemStack.typeId);
  if (namespace === "minecraft" && (BlockNames[id] || BlockPrefixes[id])) {
    return itemStack.typeId;
  }
  return void 0;
}
function buildVanillaBlockTranslationKey(blockId) {
  const translationPrefix = BlockPrefixes[blockId] || "tile";
  const translationName = BlockNames[blockId] || blockId;
  return `${translationPrefix}.${translationName}.name`;
}
function buildItemTranslationRawtext(itemStack) {
  const localizationKey = readLocalizationKey(itemStack);
  if (localizationKey) {
    return { translate: localizationKey };
  }
  const itemTypeId = itemStack?.typeId;
  if (!itemTypeId) {
    return tr2("ui.dorios.insight.display.unknown_item");
  }
  const { namespace, id } = splitTypeId(itemTypeId);
  const mappedKey = ItemTranslationKeys[id];
  const blockTypeId = checkBlockFromItem(itemStack);
  if (mappedKey) {
    return { translate: mappedKey };
  }
  if (blockTypeId) {
    const { namespace: blockNamespace, id: blockId } = splitTypeId(blockTypeId);
    if (blockNamespace !== "minecraft") {
      return {
        translate: `tile.${blockTypeId}.name`
      };
    }
    return {
      translate: buildVanillaBlockTranslationKey(blockId)
    };
  }
  if (namespace !== "minecraft") {
    return {
      translate: `item.${itemTypeId}`
    };
  }
  return {
    translate: `item.${id}.name`
  };
}
function buildBlockTypeTranslationRawtext(blockTypeId, playerSettings) {
  const normalizedBlockTypeId = String(blockTypeId || "").trim();
  if (!normalizedBlockTypeId.length) {
    return void 0;
  }
  if (playerSettings?.nameResolveMode === EntityNameResolveModes.TypeIdToText) {
    return {
      text: formatTypeIdToText(normalizedBlockTypeId)
    };
  }
  const { id } = splitTypeId(normalizedBlockTypeId);
  const blockIdentifier = id.replace("double_slab", "slab");
  const translationPrefix = BlockPrefixes[blockIdentifier] || "tile";
  const translationName = BlockNames[blockIdentifier] || blockIdentifier;
  if (!normalizedBlockTypeId.startsWith("minecraft:")) {
    return {
      translate: `tile.${normalizedBlockTypeId}.name`
    };
  }
  return {
    translate: `${translationPrefix}.${translationName}.name`
  };
}
function looksLikeLocalizationKey(value) {
  return typeof value === "string" && /^(entity|item|tile|block|ui)\.[^\s]+$/i.test(value.trim());
}
function tryGetBlockFromEntityLocation(entity) {
  if (!entity?.dimension || !entity.location) {
    return void 0;
  }
  try {
    return entity.dimension.getBlock({
      x: Math.floor(entity.location.x),
      y: Math.floor(entity.location.y),
      z: Math.floor(entity.location.z)
    });
  } catch {
    return void 0;
  }
}
function isLikelyMachineHelperEntity(entity) {
  const entityTypeId = String(entity?.typeId || "").trim().toLowerCase();
  return entityTypeId.endsWith(":machine_entity");
}
function resolveRepresentedBlockId(entity) {
  try {
    const storedBlockId = entity?.getDynamicProperty?.("dorios:machine_block_id");
    if (typeof storedBlockId === "string" && storedBlockId.trim().length > 0) {
      return storedBlockId.trim();
    }
  } catch {
  }
  if (!isLikelyMachineHelperEntity(entity)) {
    return void 0;
  }
  const block = tryGetBlockFromEntityLocation(entity);
  if (typeof block?.typeId === "string" && block.typeId.length > 0 && block.typeId !== "minecraft:air") {
    return block.typeId;
  }
  return void 0;
}
function shouldPreferRepresentedBlockName(entity, representedBlockId) {
  if (!representedBlockId) {
    return false;
  }
  const nickname = String(entity?.nameTag || "").trim();
  if (!nickname.length) {
    return true;
  }
  return looksLikeLocalizationKey(nickname);
}
function buildEntityTranslationRawtext(entity, typeIdForDisplay) {
  const localizationKey = readLocalizationKey(entity);
  if (localizationKey) {
    return { translate: localizationKey };
  }
  const { id } = splitTypeId(typeIdForDisplay);
  if (typeIdForDisplay.startsWith("minecraft:")) {
    return { translate: `entity.${id}.name` };
  }
  return { translate: `entity.${typeIdForDisplay}.name` };
}
function buildEntityResolvedNameRawtext(entity, typeIdForDisplay, itemStack, playerSettings, representedBlockId) {
  if (itemStack?.typeId) {
    return buildItemTranslationRawtext(itemStack);
  }
  if (representedBlockId) {
    return buildBlockTypeTranslationRawtext(representedBlockId, playerSettings);
  }
  if (playerSettings?.nameResolveMode === EntityNameResolveModes.TypeIdToText) {
    return {
      text: formatTypeIdToText(typeIdForDisplay)
    };
  }
  return buildEntityTranslationRawtext(entity, typeIdForDisplay);
}
function pushRawtextPart(rawtext, part) {
  if (!part) {
    return;
  }
  rawtext.push(part);
}
function appendEntityTitle(rawtext, context) {
  const {
    nickname,
    resolvedNameRawtext,
    nameDisplayMode,
    itemStack
  } = context;
  const mode = String(nameDisplayMode || EntityNameDisplayModes.NicknameFirst);
  const hasNickname = typeof nickname === "string" && nickname.trim().length > 0;
  const nicknameValue = hasNickname ? nickname.trim() : "";
  const canShowResolvedName = Boolean(resolvedNameRawtext);
  if (!hasNickname) {
    if (canShowResolvedName) {
      pushRawtextPart(rawtext, resolvedNameRawtext);
    }
    if (itemStack?.amount > 1) {
      rawtext.push({ text: ` \xA77x${itemStack.amount}\xA7r` });
    }
    return;
  }
  if (mode === EntityNameDisplayModes.NicknameOnly) {
    rawtext.push({ text: nicknameValue });
    return;
  }
  if (mode === EntityNameDisplayModes.MobNameOnly) {
    pushRawtextPart(rawtext, canShowResolvedName ? resolvedNameRawtext : { text: nicknameValue });
    return;
  }
  if (!canShowResolvedName) {
    rawtext.push({ text: nicknameValue });
    return;
  }
  if (mode === EntityNameDisplayModes.MobNameAfterNickname) {
    rawtext.push({ text: nicknameValue });
    rawtext.push({ text: " \xA77- \xA7r" });
    pushRawtextPart(rawtext, resolvedNameRawtext);
    return;
  }
  if (mode === EntityNameDisplayModes.NicknameAfterMobName) {
    pushRawtextPart(rawtext, resolvedNameRawtext);
    rawtext.push({ text: ` \xA77- ${nicknameValue}\xA7r` });
    return;
  }
  if (mode === EntityNameDisplayModes.MobNameFirst) {
    pushRawtextPart(rawtext, resolvedNameRawtext);
    rawtext.push({ text: `
\xA77${nicknameValue}\xA7r` });
    return;
  }
  rawtext.push({ text: nicknameValue });
  rawtext.push({ text: "\n\xA77" });
  pushRawtextPart(rawtext, resolvedNameRawtext);
  rawtext.push({ text: "\xA7r" });
}
function normalizeVillagerProfessionName(rawValue) {
  if (typeof rawValue === "string") {
    const normalized = rawValue.trim().toLowerCase();
    if (!normalized.length || normalized === "none") {
      return void 0;
    }
    const label = normalizeVillagerProfessionToken(normalized);
    if (label) {
      return label;
    }
    const sanitized = normalized.includes(":") ? normalized.split(":")[1] : normalized;
    return toTitleWords(sanitized.split("_"));
  }
  if (Number.isFinite(rawValue)) {
    const professionByIndex = [
      "entity.villager.unskilled",
      "entity.villager.farmer",
      "entity.villager.fisherman",
      "entity.villager.shepherd",
      "entity.villager.fletcher",
      "entity.villager.librarian",
      "entity.villager.cartographer",
      "entity.villager.cleric",
      "entity.villager.armor",
      "entity.villager.weapon",
      "entity.villager.tool",
      "entity.villager.butcher",
      "entity.villager.leather",
      "entity.villager.mason",
      "entity.villager.unskilled"
    ];
    const index = Math.max(0, Math.floor(rawValue));
    return professionByIndex[index];
  }
  return void 0;
}
function normalizeVillagerProfessionToken(rawValue) {
  if (typeof rawValue !== "string") {
    return void 0;
  }
  const normalized = rawValue.trim().toLowerCase();
  if (!normalized.length || normalized === "none") {
    return void 0;
  }
  const baseToken = normalized.includes(":") ? normalized.split(":").pop() : normalized;
  const candidates = [baseToken];
  if (baseToken.startsWith("villager_profession_")) {
    candidates.push(baseToken.slice("villager_profession_".length));
  }
  if (baseToken.startsWith("profession_")) {
    candidates.push(baseToken.slice("profession_".length));
  }
  if (baseToken.startsWith("is_")) {
    candidates.push(baseToken.slice(3));
  }
  if (baseToken.endsWith("_profession")) {
    candidates.push(baseToken.slice(0, -"_profession".length));
  }
  for (const candidate of candidates) {
    const localizationKey = VillagerProfessionTokenLocalizationKeys[candidate];
    if (localizationKey) {
      return localizationKey;
    }
  }
  return void 0;
}
function buildVillagerProfessionNameRawtext(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const normalized = value.trim();
  if (!normalized.length) {
    return void 0;
  }
  return normalized.startsWith("entity.villager.") ? { translate: normalized } : { text: normalized };
}
function getVillagerProfessionLabelFromList(values) {
  if (!Array.isArray(values) || !values.length) {
    return void 0;
  }
  for (const value of values) {
    const label = normalizeVillagerProfessionToken(String(value || ""));
    if (label) {
      return label;
    }
  }
  return void 0;
}
function getVillagerProfessionLabel(entity, entityTags, entityFamilies) {
  const entityTypeId = String(entity?.typeId || "").toLowerCase();
  if (!VillagerEntityTypeIds.has(entityTypeId)) {
    return void 0;
  }
  const propertyCandidates = [
    "minecraft:profession",
    "profession",
    "minecraft:villager_profession"
  ];
  for (const propertyName of propertyCandidates) {
    try {
      if (typeof entity?.getProperty !== "function") {
        continue;
      }
      const rawValue = entity.getProperty(propertyName);
      const normalizedLabel = normalizeVillagerProfessionName(rawValue);
      if (normalizedLabel) {
        return normalizedLabel;
      }
    } catch {
    }
  }
  const labelFromTags = getVillagerProfessionLabelFromList(entityTags);
  if (labelFromTags) {
    return labelFromTags;
  }
  const labelFromFamilies = getVillagerProfessionLabelFromList(entityFamilies);
  if (labelFromFamilies) {
    return labelFromFamilies;
  }
  return void 0;
}
function getEntityItemStack(entity) {
  try {
    const itemComponent2 = entity.getComponent("minecraft:item");
    const itemStack = itemComponent2?.itemStack;
    if (!itemStack?.typeId) {
      return void 0;
    }
    return itemStack;
  } catch {
    return void 0;
  }
}
function getRoundedHalfHearts(value) {
  return Math.max(0, Math.ceil(value));
}
function getAttributeValueRange(entity, componentId) {
  try {
    const component = entity.getComponent(componentId);
    if (!component) {
      return void 0;
    }
    const current = Number(component.currentValue);
    const max = Number(component.effectiveMax);
    if (!Number.isFinite(current) || !Number.isFinite(max)) {
      return void 0;
    }
    return {
      current: Math.max(0, current),
      max: Math.max(1, max)
    };
  } catch {
    return void 0;
  }
}
function getAttributeCurrentValue(entity, componentId) {
  try {
    const component = entity.getComponent(componentId);
    if (!component) {
      return void 0;
    }
    const current = Number(component.currentValue);
    return Number.isFinite(current) ? Math.max(0, current) : void 0;
  } catch {
    return void 0;
  }
}
function getAttributeValueRangeFromIds(entity, componentIds) {
  if (!Array.isArray(componentIds)) {
    return getAttributeValueRange(entity, componentIds);
  }
  for (const componentId of componentIds) {
    const range = getAttributeValueRange(entity, componentId);
    if (range) {
      return range;
    }
  }
  return void 0;
}
function getNumericFieldValue(source, fieldNames) {
  if (!source) {
    return void 0;
  }
  for (const field of fieldNames) {
    const value = Number(source[field]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return void 0;
}
function getNumericMethodValue(source, methodNames) {
  if (!source) {
    return void 0;
  }
  for (const methodName of methodNames) {
    const method = source[methodName];
    if (typeof method !== "function") {
      continue;
    }
    try {
      const value = Number(method.call(source));
      if (Number.isFinite(value)) {
        return value;
      }
    } catch {
    }
  }
  return void 0;
}
function getArmorValueRange(entity) {
  const range = getAttributeValueRangeFromIds(entity, PlayerAttributeComponentCandidates.armor);
  if (range) {
    return range;
  }
  const fallbackCurrent = getAttributeCurrentValue(entity, PlayerAttributeComponentIds.armor);
  if (!Number.isFinite(fallbackCurrent)) {
    return void 0;
  }
  const current = Math.max(0, fallbackCurrent);
  return {
    current,
    max: Math.max(20, current)
  };
}
function getAirSupplyInfo(entity) {
  try {
    const component = entity.getComponent(EntityComponentIds.breathable);
    if (!component) {
      return void 0;
    }
    const current = getNumericFieldValue(component, [
      "airSupply",
      "currentAirSupply",
      "remainingAir",
      "air",
      "airLevel"
    ]) ?? getNumericMethodValue(component, [
      "getAirSupply",
      "getCurrentAirSupply",
      "getRemainingAir"
    ]);
    const max = getNumericFieldValue(component, [
      "totalAirSupply",
      "maxAirSupply",
      "maxAir",
      "maximumAirSupply",
      "airSupplyMax"
    ]) ?? getNumericMethodValue(component, [
      "getTotalAirSupply",
      "getMaxAirSupply",
      "getMaximumAirSupply"
    ]);
    if (!Number.isFinite(current) || !Number.isFinite(max)) {
      return void 0;
    }
    return {
      current: Math.max(0, current),
      max: Math.max(1, max)
    };
  } catch {
    return void 0;
  }
}
function normalizeAirSupplyToBubbleUnits(currentValue, maxValue) {
  const current = Math.max(0, Number(currentValue));
  const max = Math.max(1, Number(maxValue));
  const maxUnits = Math.max(2, BubbleDisplay.maxUnits);
  const ratio = max > 0 ? current / max : 0;
  const normalizedCurrent = Math.max(0, Math.min(maxUnits, ratio * maxUnits));
  return {
    current: normalizedCurrent,
    max: maxUnits
  };
}
function isEntityFreezing(entity) {
  try {
    const component = entity.getComponent(EntityComponentIds.freezing);
    if (!component) {
      return false;
    }
    const boolCandidate = component.isFrozen ?? component.isFreezing;
    if (typeof boolCandidate === "boolean") {
      return boolCandidate;
    }
    const numericCandidate = getNumericFieldValue(component, [
      "freezeTicks",
      "frozenTicks",
      "ticksFrozen",
      "freezeTime",
      "frozenTime",
      "totalFreezeTime",
      "remainingFreezeTicks"
    ]) ?? getNumericMethodValue(component, [
      "getFreezeTicks",
      "getFrozenTicks",
      "getFreezeTime"
    ]);
    return Number.isFinite(numericCandidate) ? numericCandidate > 0 : false;
  } catch {
    return false;
  }
}
function isEntityRideable(entity, entityFamilies) {
  try {
    const component = entity.getComponent(EntityComponentIds.rideable);
    if (component) {
      if (Array.isArray(component.seats) && component.seats.length) {
        return true;
      }
      if (typeof component.getSeats === "function") {
        const seats = component.getSeats();
        if (Array.isArray(seats) && seats.length) {
          return true;
        }
      }
      const seatCount = Number(component.seatCount ?? component.numberOfSeats ?? component.seatCountMax);
      if (Number.isFinite(seatCount)) {
        return seatCount > 0;
      }
      return true;
    }
  } catch {
  }
  if (Array.isArray(entityFamilies) && entityFamilies.length) {
    const normalizedFamilies = entityFamilies.map((family) => String(family || "").toLowerCase()).filter((family) => family.length > 0);
    if (normalizedFamilies.includes("rideable") || normalizedFamilies.includes("mount")) {
      return true;
    }
  }
  return false;
}
function getEffectFlags(effects) {
  const flags = {
    hasWither: false,
    hasPoison: false,
    hasHunger: false
  };
  for (const effect of effects) {
    const typeId = resolveEffectTypeId(effect);
    if (!typeId) {
      continue;
    }
    const normalizedTypeId = normalizeEffectTypeId(typeId);
    if (normalizedTypeId === "wither" || normalizedTypeId === "decay") {
      flags.hasWither = true;
    }
    if (normalizedTypeId === "poison" || normalizedTypeId === "fatal_poison") {
      flags.hasPoison = true;
    }
    if (normalizedTypeId === "hunger") {
      flags.hasHunger = true;
    }
  }
  return flags;
}
function getTameableData(entity) {
  try {
    const tameableComponent = entity.getComponent(EntityComponentIds.tameable);
    if (!tameableComponent) {
      return {
        isTameable: false,
        isTamed: false,
        foodTypeIds: []
      };
    }
    let tameItems = tameableComponent.getTameItems;
    if (typeof tameItems === "function") {
      tameItems = tameItems.call(tameableComponent);
    }
    const rawItems = Array.isArray(tameItems) ? tameItems : [];
    const seenTypeIds = /* @__PURE__ */ new Set();
    const foodTypeIds = [];
    for (const itemStack of rawItems) {
      const typeId = itemStack?.typeId;
      if (!typeId || seenTypeIds.has(typeId)) {
        continue;
      }
      seenTypeIds.add(typeId);
      foodTypeIds.push(typeId);
    }
    return {
      isTameable: true,
      isTamed: Boolean(tameableComponent.isTamed),
      foodTypeIds
    };
  } catch {
    return {
      isTameable: false,
      isTamed: false,
      foodTypeIds: []
    };
  }
}
function getEntityEffects(entity) {
  try {
    if (typeof entity.getEffects !== "function") {
      return [];
    }
    const effects = entity.getEffects();
    return Array.isArray(effects) ? effects : [];
  } catch {
    return [];
  }
}
function resolveEffectTypeId(effect) {
  const rawTypeId = effect?.typeId ?? effect?.type?.id ?? effect?.effectType?.id ?? effect?.effectType;
  if (typeof rawTypeId !== "string" || !rawTypeId.length) {
    return void 0;
  }
  return rawTypeId.includes(":") ? rawTypeId : `minecraft:${rawTypeId}`;
}
function resolveEffectLocalizationKey(effect) {
  const localizationTargets = [effect, effect?.type, effect?.effectType];
  for (const target of localizationTargets) {
    const localizationKey = readLocalizationKey(target) || readLocalizationKeyList(target);
    if (localizationKey) {
      return localizationKey;
    }
  }
  return void 0;
}
function resolveVanillaEffectFallbackLocalizationKey(normalizedTypeId) {
  return VanillaEffectLocalizationKeyOverrides[normalizedTypeId] || `potion.${normalizedTypeId}`;
}
function normalizeEffectTypeId(typeId) {
  const { id } = splitTypeId(typeId);
  return id.toLowerCase();
}
function getEffectLevel(effect) {
  const amplifier = Number(effect?.amplifier);
  if (!Number.isFinite(amplifier)) {
    return 1;
  }
  return Math.max(1, Math.floor(amplifier) + 1);
}
function toRomanNumeral(value) {
  const integerValue = Math.max(1, Math.floor(value));
  const converted = integerToRoman(integerValue);
  if (converted) {
    return converted;
  }
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  if (integerValue >= 1 && integerValue <= numerals.length) {
    return numerals[integerValue - 1];
  }
  return `${integerValue}`;
}
function getEffectDurationTicks(effect) {
  const directCandidates = [
    effect?.duration,
    effect?.durationTicks,
    effect?.remainingDuration,
    effect?.remainingDurationTicks
  ];
  for (const candidate of directCandidates) {
    const numericValue = Number(candidate);
    if (Number.isFinite(numericValue)) {
      return Math.max(0, Math.floor(numericValue));
    }
  }
  try {
    if (typeof effect?.getDuration === "function") {
      const durationValue = Number(effect.getDuration());
      if (Number.isFinite(durationValue)) {
        return Math.max(0, Math.floor(durationValue));
      }
    }
  } catch {
  }
  return void 0;
}
function formatSecondsAsClock(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(safeSeconds % 3600 / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
function formatEffectDuration(effect) {
  const durationTicks = getEffectDurationTicks(effect);
  if (!Number.isFinite(durationTicks)) {
    return void 0;
  }
  if (durationTicks >= 2e9) {
    return EffectDisplay.infiniteDurationLabel;
  }
  const durationSeconds = Math.floor(durationTicks / 20);
  return formatSecondsAsClock(durationSeconds);
}
function getEffectPolarity(normalizedTypeId) {
  if (PositiveEffectTypeIds.has(normalizedTypeId)) {
    return "positive";
  }
  if (NegativeEffectTypeIds.has(normalizedTypeId)) {
    return "negative";
  }
  return "neutral";
}
function buildEffectTextEntry(effect) {
  const typeId = resolveEffectTypeId(effect);
  if (!typeId) {
    return void 0;
  }
  const { namespace } = splitTypeId(typeId);
  const normalizedTypeId = normalizeEffectTypeId(typeId);
  const effectLocalizationKey = resolveEffectLocalizationKey(effect);
  const effectNameRawtext = effectLocalizationKey ? { translate: effectLocalizationKey } : namespace === "minecraft" ? { translate: resolveVanillaEffectFallbackLocalizationKey(normalizedTypeId) } : { text: formatTypeIdToText(typeId) };
  const effectLevel = toRomanNumeral(getEffectLevel(effect));
  const effectPolarity = getEffectPolarity(normalizedTypeId);
  const colorCode = EffectTextColors[effectPolarity] || EffectTextColors.neutral;
  const effectDuration = formatEffectDuration(effect);
  const entry = [
    { text: colorCode },
    effectNameRawtext,
    { text: ` ${effectLevel}` }
  ];
  if (effectDuration) {
    entry.push({ text: ` \xA77(${effectDuration})` });
  }
  entry.push({ text: "\xA7r" });
  return entry;
}
function buildEffectEmojiEntry(effect) {
  const typeId = resolveEffectTypeId(effect);
  if (!typeId) {
    return void 0;
  }
  const normalizedTypeId = normalizeEffectTypeId(typeId);
  const glyph = EffectGlyphByTypeId[normalizedTypeId] || EffectDisplay.unknownGlyph;
  const effectLevel = toRomanNumeral(getEffectLevel(effect));
  const effectDuration = formatEffectDuration(effect);
  let entryText = `${glyph}${EffectDisplay.iconAmplifierSpacing}${effectLevel}`;
  if (effectDuration) {
    entryText += ` \xA77(${effectDuration})`;
  }
  return `${entryText}\xA7r`;
}
function buildEffectsDisplay(effects, playerSettings) {
  if (!effects.length) {
    return void 0;
  }
  const maxVisibleEffects = Math.max(0, playerSettings.maxVisibleEffects);
  const visibleEffects = effects.slice(0, maxVisibleEffects);
  if (!visibleEffects.length) {
    return void 0;
  }
  const useTextMode = playerSettings.effectDisplayMode === EffectDisplayModes.Text || isTextDisplayStyle(playerSettings);
  const entries = [];
  for (const effect of visibleEffects) {
    const entry = useTextMode ? buildEffectTextEntry(effect) : buildEffectEmojiEntry(effect);
    if (entry) {
      entries.push(entry);
    }
  }
  if (!entries.length) {
    return void 0;
  }
  const hiddenEffects = effects.length - visibleEffects.length;
  if (useTextMode) {
    const result2 = [tr2("ui.dorios.insight.display.effects_label"), { text: " " }];
    for (let index = 0; index < entries.length; index++) {
      if (index > 0) {
        result2.push({ text: "\xA77, \xA7r" });
      }
      pushRawtextParts(result2, entries[index]);
    }
    if (hiddenEffects > 0) {
      result2.push({ text: "\xA77, \xA78" });
      result2.push(tr2("ui.dorios.insight.display.more_items", [`${hiddenEffects}`]));
    }
    result2.push({ text: "\xA7r" });
    return result2;
  }
  const body = entries.join(" ");
  const result = [tr2("ui.dorios.insight.display.effects", [body])];
  if (hiddenEffects > 0) {
    result.push(useTextMode ? { text: "\xA77, \xA78" } : { text: " \xA78" });
    result.push(tr2("ui.dorios.insight.display.more_items", [`${hiddenEffects}`]));
  }
  result.push({ text: "\xA7r" });
  return result;
}
function buildTameFoodsDisplay(foodTypeIds) {
  if (!Array.isArray(foodTypeIds) || !foodTypeIds.length) {
    return [];
  }
  const foodsPerLine = Math.max(1, Math.floor(TameableDisplay.foodsPerLine));
  const rawtext = [];
  let renderedFoods = 0;
  for (let index = 0; index < foodTypeIds.length; index++) {
    const typeId = String(foodTypeIds[index] || "").trim();
    if (!typeId.length) {
      continue;
    }
    if (renderedFoods > 0) {
      rawtext.push({
        text: renderedFoods % foodsPerLine === 0 ? ",\n" : ", "
      });
    }
    const { namespace, id } = splitTypeId(typeId);
    const mappedKey = ItemTranslationKeys[id];
    if (mappedKey) {
      rawtext.push({ translate: mappedKey });
      renderedFoods += 1;
      continue;
    }
    if (namespace === "minecraft") {
      rawtext.push({ translate: `item.${id}.name` });
      renderedFoods += 1;
      continue;
    }
    rawtext.push({ translate: `item.${typeId}` });
    renderedFoods += 1;
  }
  return rawtext;
}
function appendCustomFieldLines(rawtext, lines) {
  if (!Array.isArray(lines) || !lines.length) {
    return 0;
  }
  let appendedLines = 0;
  for (const line of lines) {
    if (typeof line !== "string" || !line.length) {
      continue;
    }
    rawtext.push({
      text: `
${InsightConfig.display.technicalColor}${line}\xA7r`
    });
    appendedLines += 1;
  }
  return appendedLines;
}
function resolveHealthGlyphSet({
  isPlayer,
  isFreezing,
  effectFlags,
  isOnFire,
  isRideable,
  playerSettings
}) {
  if (isPlayer && playerSettings.showFrozenHearts && isFreezing) {
    return HeartGlyphSets.frozen;
  }
  if (playerSettings.showEffectHearts) {
    if (isOnFire) {
      return HeartGlyphSets.burned;
    }
    if (effectFlags.hasWither) {
      return HeartGlyphSets.wither;
    }
    if (effectFlags.hasPoison) {
      return HeartGlyphSets.poison;
    }
  }
  if (!isPlayer && playerSettings.showAnimalHearts && isRideable) {
    return HeartGlyphSets.animal;
  }
  return HeartGlyphSets.normal;
}
function resolveHungerGlyphSet(effectFlags, playerSettings) {
  if (playerSettings.showHungerEffect && effectFlags.hasHunger) {
    return HungerGlyphSets.effect;
  }
  return HungerGlyphSets.normal;
}
function buildHalfStepEmojiBar(currentValue, maxValue, glyphs, maxIconsPerLine) {
  const current = Math.max(0, currentValue);
  const max = Math.max(1, maxValue);
  const roundedCurrent = getRoundedHalfHearts(current);
  const roundedMax = getRoundedHalfHearts(max);
  const fullGlyphs = Math.floor(roundedCurrent / 2);
  const hasHalfGlyph = roundedCurrent % 2 !== 0;
  const emptyGlyphs = Math.max(0, Math.floor((roundedMax - roundedCurrent) / 2));
  let bar = glyphs.full.repeat(fullGlyphs);
  if (hasHalfGlyph) {
    bar += glyphs.half;
  }
  bar += glyphs.empty.repeat(emptyGlyphs);
  return addLineBreakEvery(bar, maxIconsPerLine);
}
function buildHalfUnitSlotMap(totalHalfUnits, slotCount, fillFromRightToLeft = false) {
  const safeSlotCount = Math.max(0, Math.floor(slotCount));
  const halfUnitsBySlot = Array.from({ length: safeSlotCount }, () => 0);
  let remainingHalfUnits = Math.max(0, Math.min(Math.ceil(totalHalfUnits), safeSlotCount * 2));
  if (!safeSlotCount || remainingHalfUnits <= 0) {
    return halfUnitsBySlot;
  }
  if (fillFromRightToLeft) {
    for (let slotIndex = safeSlotCount - 1; slotIndex >= 0 && remainingHalfUnits > 0; slotIndex--) {
      const slotHalfUnits = Math.min(2, remainingHalfUnits);
      halfUnitsBySlot[slotIndex] = slotHalfUnits;
      remainingHalfUnits -= slotHalfUnits;
    }
    return halfUnitsBySlot;
  }
  for (let slotIndex = 0; slotIndex < safeSlotCount && remainingHalfUnits > 0; slotIndex++) {
    const slotHalfUnits = Math.min(2, remainingHalfUnits);
    halfUnitsBySlot[slotIndex] = slotHalfUnits;
    remainingHalfUnits -= slotHalfUnits;
  }
  return halfUnitsBySlot;
}
function getBaseHungerGlyphForHalfUnits(hungerHalfUnits, hungerGlyphs) {
  if (hungerHalfUnits >= 2) {
    return hungerGlyphs.full;
  }
  if (hungerHalfUnits === 1) {
    return hungerGlyphs.half;
  }
  return hungerGlyphs.empty;
}
function getSaturationAwareHungerGlyphForHalfUnits(hungerHalfUnits, saturationHalfUnits, hungerGlyphs, saturationGlyphs) {
  if (saturationHalfUnits <= 0) {
    return getBaseHungerGlyphForHalfUnits(hungerHalfUnits, hungerGlyphs);
  }
  if (saturationHalfUnits >= 2) {
    if (hungerHalfUnits >= 2) {
      return saturationGlyphs.fullSaturationFull;
    }
    if (hungerHalfUnits === 1) {
      return saturationGlyphs.halfSaturationFull;
    }
    return saturationGlyphs.emptySaturationFull;
  }
  if (hungerHalfUnits >= 2) {
    return saturationGlyphs.fullSaturationHalf;
  }
  if (hungerHalfUnits === 1) {
    return saturationGlyphs.halfSaturationHalf;
  }
  return saturationGlyphs.emptySaturationHalf;
}
function buildHungerWithSaturationEmojiBar(currentValue, maxValue, saturationValue, hungerGlyphs, saturationGlyphs, maxIconsPerLine) {
  const current = Math.max(0, Number(currentValue) || 0);
  const max = Math.max(1, Number(maxValue) || 1);
  const saturation = Math.max(0, Number(saturationValue) || 0);
  const roundedCurrent = getRoundedHalfHearts(current);
  const roundedMax = getRoundedHalfHearts(max);
  const roundedSaturation = getRoundedHalfHearts(Math.min(saturation, max));
  const slotCount = Math.max(1, Math.ceil(roundedMax / 2));
  const hungerHalfUnitsBySlot = buildHalfUnitSlotMap(roundedCurrent, slotCount, false);
  const saturationHalfUnitsBySlot = buildHalfUnitSlotMap(roundedSaturation, slotCount, false);
  let bar = "";
  for (let slotIndex = 0; slotIndex < slotCount; slotIndex++) {
    bar += getSaturationAwareHungerGlyphForHalfUnits(
      hungerHalfUnitsBySlot[slotIndex],
      saturationHalfUnitsBySlot[slotIndex],
      hungerGlyphs,
      saturationGlyphs
    );
  }
  return addLineBreakEvery(bar, maxIconsPerLine);
}
function addLineBreakEvery(input, chunkSize) {
  if (!input || input.length <= chunkSize) {
    return input;
  }
  let output = "";
  for (let index = 0; index < input.length; index++) {
    if (index > 0 && index % chunkSize === 0) {
      output += "\n";
    }
    output += input[index];
  }
  return output;
}
function buildHealthDisplay(currentValue, maxValue, maxHeartDisplayHealth, displayStyle, glyphs = HeartGlyphSets.normal) {
  const current = Math.max(0, currentValue);
  const max = Math.max(1, maxValue);
  const normalizedDisplayStyle = normalizeDisplayStyleValue(displayStyle);
  const percentValue = Math.max(0, Math.min(100, current / max * 100));
  const roundedPercentValue = Math.floor(percentValue * 10) / 10;
  const roundedCurrentValue = Math.floor(current * 10) / 10;
  const roundedMaxValue = Math.floor(max * 10) / 10;
  if (normalizedDisplayStyle === DisplayStyles.IconValue) {
    const halfUnits = getRoundedHalfHearts(current);
    const icon = halfUnits >= 2 ? glyphs.full : halfUnits === 1 ? glyphs.half : glyphs.empty;
    return { text: `${icon} \xA7c${roundedCurrentValue}\xA77/\xA7c${roundedMaxValue}\xA7r` };
  }
  if (normalizedDisplayStyle === DisplayStyles.TextFull) {
    return tr2("ui.dorios.insight.display.health_full", [current.toFixed(1), max.toFixed(1)]);
  }
  if (normalizedDisplayStyle === DisplayStyles.TextPercent) {
    return tr2("ui.dorios.insight.display.health_percent", [`${roundedPercentValue}`]);
  }
  if (normalizedDisplayStyle === DisplayStyles.HybridFull) {
    return tr2("ui.dorios.insight.display.health_hybrid_full", [glyphs.full, current.toFixed(1), max.toFixed(1)]);
  }
  if (normalizedDisplayStyle === DisplayStyles.HybridPercent) {
    return tr2("ui.dorios.insight.display.health_hybrid_percent", [glyphs.full, `${roundedPercentValue}`]);
  }
  const threshold = Number.isFinite(maxHeartDisplayHealth) ? Math.max(1, maxHeartDisplayHealth) : InsightConfig.system.maxHeartDisplayHealth;
  if (max > threshold || current > threshold) {
    return { text: `\xA7c${Math.ceil(current)}\xA7f/\xA7c${Math.ceil(max)}${glyphs.full}` };
  }
  return { text: buildHalfStepEmojiBar(
    current,
    max,
    glyphs,
    InsightConfig.system.maxHeartsPerLine
  ) };
}
function buildHungerDisplay(currentValue, maxValue, displayStyle, glyphs = HungerGlyphSets.normal, saturationValue = void 0, saturationGlyphs = HungerGlyphSets.saturation) {
  const current = Math.max(0, Number(currentValue) || 0);
  const max = Math.max(1, Number(maxValue) || 1);
  const normalizedDisplayStyle = normalizeDisplayStyleValue(displayStyle);
  const roundedPercentValue = Math.floor(Math.max(0, Math.min(100, current / max * 100)) * 10) / 10;
  const roundedCurrentValue = Math.floor(current * 10) / 10;
  const roundedMaxValue = Math.floor(max * 10) / 10;
  if (normalizedDisplayStyle === DisplayStyles.IconValue) {
    const halfUnits = getRoundedHalfHearts(current);
    const icon = halfUnits >= 2 ? glyphs.full : halfUnits === 1 ? glyphs.half : glyphs.empty;
    return { text: `${icon} \xA76${roundedCurrentValue}\xA77/\xA76${roundedMaxValue}\xA7r` };
  }
  if (normalizedDisplayStyle === DisplayStyles.TextFull) {
    return tr2("ui.dorios.insight.display.hunger_full", [current.toFixed(1), max.toFixed(1)]);
  }
  if (normalizedDisplayStyle === DisplayStyles.TextPercent) {
    return tr2("ui.dorios.insight.display.hunger_percent", [`${roundedPercentValue}`]);
  }
  if (normalizedDisplayStyle === DisplayStyles.HybridFull) {
    return tr2("ui.dorios.insight.display.hunger_hybrid_full", [glyphs.full, current.toFixed(1), max.toFixed(1)]);
  }
  if (normalizedDisplayStyle === DisplayStyles.HybridPercent) {
    return tr2("ui.dorios.insight.display.hunger_hybrid_percent", [glyphs.full, `${roundedPercentValue}`]);
  }
  const hasSaturation = Number.isFinite(saturationValue) && saturationValue > 0;
  if (hasSaturation) {
    return {
      text: buildHungerWithSaturationEmojiBar(
        currentValue,
        maxValue,
        saturationValue,
        glyphs,
        saturationGlyphs,
        InsightConfig.system.maxHeartsPerLine
      )
    };
  }
  return {
    text: buildHalfStepEmojiBar(
      currentValue,
      maxValue,
      glyphs,
      InsightConfig.system.maxHeartsPerLine
    )
  };
}
function buildAbsorptionDisplay(currentValue, displayStyle) {
  const current = Number(currentValue);
  if (!Number.isFinite(current) || current <= 0) {
    return void 0;
  }
  if (normalizeDisplayStyleValue(displayStyle) !== DisplayStyles.Icon) {
    return tr2("ui.dorios.insight.display.absorption_text", [current.toFixed(1)]);
  }
  const roundedCurrent = getRoundedHalfHearts(current);
  const fullGlyphs = Math.floor(roundedCurrent / 2);
  const hasHalfGlyph = roundedCurrent % 2 !== 0;
  let absorptionHearts = Emojis.heartAbsorptionFull.repeat(fullGlyphs);
  if (hasHalfGlyph) {
    absorptionHearts += Emojis.heartAbsorptionHalf;
  }
  const wrappedHearts = addLineBreakEvery(absorptionHearts, InsightConfig.system.maxHeartsPerLine);
  return { text: `\xA76${wrappedHearts}\xA7r` };
}
function buildArmorDisplay(currentValue, maxValue, displayStyle) {
  const current = Math.max(0, Number(currentValue) || 0);
  const max = Math.max(1, Number(maxValue) || 1);
  const normalizedDisplayStyle = normalizeDisplayStyleValue(displayStyle);
  const roundedPercentValue = Math.floor(Math.max(0, Math.min(100, current / max * 100)) * 10) / 10;
  if (normalizedDisplayStyle === DisplayStyles.TextFull) {
    return tr2("ui.dorios.insight.display.armor_full", [current.toFixed(1), max.toFixed(1)]);
  }
  if (normalizedDisplayStyle === DisplayStyles.TextPercent) {
    return tr2("ui.dorios.insight.display.armor_percent", [`${roundedPercentValue}`]);
  }
  if (normalizedDisplayStyle === DisplayStyles.HybridFull) {
    return tr2("ui.dorios.insight.display.armor_hybrid_full", [ArmorGlyphs.full, current.toFixed(1), max.toFixed(1)]);
  }
  if (normalizedDisplayStyle === DisplayStyles.HybridPercent) {
    return tr2("ui.dorios.insight.display.armor_hybrid_percent", [ArmorGlyphs.full, `${roundedPercentValue}`]);
  }
  return { text: buildHalfStepEmojiBar(
    currentValue,
    maxValue,
    ArmorGlyphs,
    InsightConfig.system.maxHeartsPerLine
  ) };
}
function buildAirBubbleDisplay(currentValue, maxValue, displayStyle) {
  const current = Math.max(0, Number(currentValue) || 0);
  const max = Math.max(1, Number(maxValue) || 1);
  const normalizedDisplayStyle = normalizeDisplayStyleValue(displayStyle);
  const roundedPercentValue = Math.floor(Math.max(0, Math.min(100, current / max * 100)) * 10) / 10;
  if (normalizedDisplayStyle === DisplayStyles.TextFull) {
    return tr2("ui.dorios.insight.display.air_full", [current.toFixed(1), max.toFixed(1)]);
  }
  if (normalizedDisplayStyle === DisplayStyles.TextPercent) {
    return tr2("ui.dorios.insight.display.air_percent", [`${roundedPercentValue}`]);
  }
  if (normalizedDisplayStyle === DisplayStyles.HybridFull) {
    return tr2("ui.dorios.insight.display.air_hybrid_full", [BubbleGlyphs.full, current.toFixed(1), max.toFixed(1)]);
  }
  if (normalizedDisplayStyle === DisplayStyles.HybridPercent) {
    return tr2("ui.dorios.insight.display.air_hybrid_percent", [BubbleGlyphs.full, `${roundedPercentValue}`]);
  }
  const normalized = normalizeAirSupplyToBubbleUnits(currentValue, maxValue);
  return { text: buildHalfStepEmojiBar(
    normalized.current,
    normalized.max,
    BubbleGlyphs,
    InsightConfig.system.maxHeartsPerLine
  ) };
}
function getBlockLocationLine(block) {
  const location = block?.location;
  if (!location) {
    return void 0;
  }
  return tr2("ui.dorios.insight.display.position", [`${location.x}`, `${location.y}`, `${location.z}`]);
}
function getEntityLocationLine(entity) {
  const location = entity?.location;
  if (!location) {
    return void 0;
  }
  return tr2("ui.dorios.insight.display.position", [location.x.toFixed(1), location.y.toFixed(1), location.z.toFixed(1)]);
}
function getEntityVelocityLine(entity) {
  let velocity;
  try {
    velocity = entity.getVelocity?.();
  } catch {
    velocity = void 0;
  }
  if (!velocity) {
    return void 0;
  }
  return tr2("ui.dorios.insight.display.velocity", [velocity.x.toFixed(2), velocity.y.toFixed(2), velocity.z.toFixed(2)]);
}
function getEntityScoreboardValue(entity, objectiveId) {
  try {
    const identity = entity.scoreboardIdentity;
    if (!identity) {
      return void 0;
    }
    const objective = world10.scoreboard.getObjective(objectiveId);
    if (!objective) {
      return void 0;
    }
    const score = objective.getScore(identity);
    return Number.isFinite(score) ? score : void 0;
  } catch {
    return void 0;
  }
}
function decodeScoreboardMantissaExponent(entity, mantissaObjective, exponentObjective) {
  const mantissa = getEntityScoreboardValue(entity, mantissaObjective);
  if (mantissa === void 0) {
    return void 0;
  }
  const exponent = getEntityScoreboardValue(entity, exponentObjective);
  if (exponent === void 0 || exponent === 0) {
    return mantissa;
  }
  return mantissa * Math.pow(10, exponent);
}
function formatLargeNumber(value) {
  if (!Number.isFinite(value) || value < 0) {
    return "0";
  }
  const suffixes = ["", "K", "M", "B", "T"];
  let tier = Math.floor(Math.log10(Math.max(1, Math.abs(value))) / 3);
  tier = Math.min(tier, suffixes.length - 1);
  if (tier === 0) {
    return value % 1 === 0 ? `${value}` : value.toFixed(1);
  }
  const scaled = value / Math.pow(10, tier * 3);
  return `${scaled.toFixed(1)}${suffixes[tier]}`;
}
function formatEnergyDisplayValue(value) {
  const safeValue = Math.max(0, Number(value) || 0);
  if (safeValue >= 1e15) {
    return `${(safeValue / 1e15).toFixed(2)} PDE`;
  }
  if (safeValue >= 1e12) {
    return `${(safeValue / 1e12).toFixed(2)} TDE`;
  }
  if (safeValue >= 1e9) {
    return `${(safeValue / 1e9).toFixed(2)} GDE`;
  }
  if (safeValue >= 1e6) {
    return `${(safeValue / 1e6).toFixed(2)} MDE`;
  }
  if (safeValue >= 1e3) {
    return `${(safeValue / 1e3).toFixed(1)} kDE`;
  }
  return `${Math.floor(safeValue)} DE`;
}
function formatEntityScoreboardValue(field, value) {
  if (field?.key === "energy") {
    return formatEnergyDisplayValue(value);
  }
  return formatLargeNumber(value);
}
function hasCustomEnergyFieldLine(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    return false;
  }
  return lines.some((line) => {
    if (typeof line !== "string") {
      return false;
    }
    return line.trim().toLowerCase().startsWith("energy:");
  });
}
function shouldRenderEntityScoreboardField(field, playerSettings, options = {}) {
  if (!field || !playerSettings) {
    return false;
  }
  if (field.key === "energy") {
    if (!playerSettings.showCustomEnergyInfo) {
      return false;
    }
    if (options.suppressEnergyField === true) {
      return false;
    }
  }
  return true;
}
var ScoreboardFieldDefinitions = [
  {
    key: "energy",
    labelKey: "ui.dorios.insight.display.scoreboard_energy",
    mantissa: "energy",
    exponent: "energyExp",
    capMantissa: "energyCap",
    capExponent: "energyCapExp",
    mode: "mantissa_exponent_pair"
  },
  {
    key: "capacity",
    labelKey: "ui.dorios.insight.display.scoreboard_capacity",
    objective: "capacity",
    capObjective: "max_capacity",
    mode: "simple_pair"
  }
];
function appendEntityScoreboardFields(rawtext, entity, playerSettings, options = {}) {
  if (!playerSettings.showEntityScoreboards) {
    return;
  }
  try {
    const identity = entity.scoreboardIdentity;
    if (!identity) {
      return;
    }
  } catch {
    return;
  }
  for (const field of ScoreboardFieldDefinitions) {
    if (!shouldRenderEntityScoreboardField(field, playerSettings, options)) {
      continue;
    }
    if (field.mode === "mantissa_exponent_pair") {
      const value = decodeScoreboardMantissaExponent(entity, field.mantissa, field.exponent);
      if (value === void 0) {
        continue;
      }
      const cap = decodeScoreboardMantissaExponent(entity, field.capMantissa, field.capExponent);
      if (cap !== void 0 && cap > 0) {
        appendDisplayLine(rawtext, tr2(field.labelKey, [formatEntityScoreboardValue(field, value), formatEntityScoreboardValue(field, cap)]));
      } else {
        appendDisplayLine(rawtext, tr2(field.labelKey, [formatEntityScoreboardValue(field, value), "---"]));
      }
    } else if (field.mode === "simple_pair") {
      const value = getEntityScoreboardValue(entity, field.objective);
      if (value === void 0) {
        continue;
      }
      const cap = field.capObjective ? getEntityScoreboardValue(entity, field.capObjective) : void 0;
      if (cap !== void 0 && cap > 0) {
        appendDisplayLine(rawtext, tr2(field.labelKey, [formatEntityScoreboardValue(field, value), formatEntityScoreboardValue(field, cap)]));
      } else {
        appendDisplayLine(rawtext, tr2(field.labelKey, [formatEntityScoreboardValue(field, value), "---"]));
      }
    }
  }
}
function appendBlockTags(rawtext, blockTags, playerSettings) {
  if (!playerSettings.showBlockTags || !blockTags.length) {
    return;
  }
  const maxTags = Math.max(0, playerSettings.maxVisibleBlockTags);
  const visibleTags = blockTags.slice(0, maxTags);
  if (!visibleTags.length) {
    return;
  }
  const formattedTags = buildColumnWrappedList(visibleTags, playerSettings.tagColumns);
  rawtext.push({ text: "\n" });
  rawtext.push(tr2("ui.dorios.insight.display.tags", [`${InsightConfig.display.tagsColor}${formattedTags}\xA7r`]));
  const hiddenTags = blockTags.length - visibleTags.length;
  if (hiddenTags > 0) {
    rawtext.push({ text: " " });
    rawtext.push(tr2("ui.dorios.insight.display.more_items", [`${hiddenTags}`]));
  }
}
function appendEntityTags(rawtext, entityTags, playerSettings) {
  if (!playerSettings.showEntityTags || !entityTags.length) {
    return;
  }
  const maxTags = Math.max(0, playerSettings.maxVisibleEntityTags);
  const visibleTags = entityTags.slice(0, maxTags);
  if (!visibleTags.length) {
    return;
  }
  const formattedTags = buildColumnWrappedList(visibleTags, playerSettings.tagColumns);
  rawtext.push({ text: "\n" });
  rawtext.push(tr2("ui.dorios.insight.display.tags", [`${InsightConfig.display.tagsColor}${formattedTags}\xA7r`]));
  const hiddenTags = entityTags.length - visibleTags.length;
  if (hiddenTags > 0) {
    rawtext.push({ text: " " });
    rawtext.push(tr2("ui.dorios.insight.display.more_items", [`${hiddenTags}`]));
  }
}
function getEntityFamilies(entity) {
  try {
    const typeFamily = entity.getComponent("minecraft:type_family");
    if (!typeFamily || typeof typeFamily.getTypeFamilies !== "function") {
      return [];
    }
    return typeFamily.getTypeFamilies() ?? [];
  } catch {
    return [];
  }
}
function appendEntityFamilies(rawtext, entityFamilies, playerSettings) {
  if (!playerSettings.showEntityFamilies || !entityFamilies.length) {
    return;
  }
  const maxFamilies = Math.max(0, playerSettings.maxVisibleEntityFamilies);
  const visibleFamilies = entityFamilies.slice(0, maxFamilies);
  if (!visibleFamilies.length) {
    return;
  }
  const formattedFamilies = buildColumnWrappedList(visibleFamilies, playerSettings.familyColumns);
  rawtext.push({ text: "\n" });
  rawtext.push(tr2("ui.dorios.insight.display.families", [`${InsightConfig.display.tagsColor}${formattedFamilies}\xA7r`]));
  const hiddenFamilies = entityFamilies.length - visibleFamilies.length;
  if (hiddenFamilies > 0) {
    rawtext.push({ text: " " });
    rawtext.push(tr2("ui.dorios.insight.display.more_items", [`${hiddenFamilies}`]));
  }
}
function toBlockStateNumber(stateValue) {
  const numericValue = Number(stateValue);
  return Number.isFinite(numericValue) ? numericValue : void 0;
}
function countContainerUsedSlots(container) {
  if (!container) {
    return void 0;
  }
  const size = Number(container.size);
  if (!Number.isFinite(size) || size <= 0) {
    return void 0;
  }
  let usedSlots = 0;
  let totalItems = 0;
  for (let slot = 0; slot < size; slot++) {
    let itemStack;
    try {
      itemStack = container.getItem(slot);
    } catch {
      continue;
    }
    if (!itemStack) {
      continue;
    }
    const amount = Number(itemStack.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }
    usedSlots += 1;
    totalItems += amount;
  }
  return {
    usedSlots,
    totalSlots: Math.floor(size),
    totalItems
  };
}
function collectBlockSpecificConfigurationLines(block, blockStates) {
  const lines = [];
  const blockTypeId = String(block?.typeId || "").toLowerCase();
  const states = blockStates && typeof blockStates === "object" ? blockStates : {};
  if (blockTypeId.includes("cauldron")) {
    let liquidState = String(
      states["cauldron_liquid"] ?? states["liquid_type"] ?? states["liquid"] ?? "water"
    );
    let fillLevel = toBlockStateNumber(states["fill_level"]) ?? toBlockStateNumber(states["liquid_depth"]);
    try {
      const fluidContainer = block?.getComponent?.("minecraft:fluid_container");
      const fluidType = fluidContainer?.getFluidType?.();
      const fluidTypeId = String(fluidType?.typeId ?? fluidType?.id ?? fluidType ?? "").trim();
      if (fluidTypeId.length) {
        liquidState = fluidTypeId.includes(":") ? fluidTypeId.split(":").pop() || fluidTypeId : fluidTypeId;
      }
      const componentFillLevel = Number(fluidContainer?.fillLevel);
      if (Number.isFinite(componentFillLevel)) {
        fillLevel = componentFillLevel;
      }
    } catch {
    }
    const readableLiquid = toMessageText(liquidState.replace(/_/g, " "));
    lines.push(fillLevel !== void 0 ? `Cauldron: ${readableLiquid} (Level ${fillLevel})` : `Cauldron: ${readableLiquid}`);
  }
  if (blockTypeId.endsWith("chiseled_bookshelf")) {
    const slotStateKeys = [
      "slot_0_occupied_bit",
      "slot_1_occupied_bit",
      "slot_2_occupied_bit",
      "slot_3_occupied_bit",
      "slot_4_occupied_bit",
      "slot_5_occupied_bit",
      "slot_0_occupied",
      "slot_1_occupied",
      "slot_2_occupied",
      "slot_3_occupied",
      "slot_4_occupied",
      "slot_5_occupied"
    ];
    const occupiedSlotIndexes = /* @__PURE__ */ new Set();
    let occupiedSlots = 0;
    for (const slotStateKey of slotStateKeys) {
      if (!(slotStateKey in states)) {
        continue;
      }
      const slotMatch = slotStateKey.match(/slot_(\d+)_occupied/);
      const slotIndex = slotMatch ? Number(slotMatch[1]) : -1;
      if (Number.isFinite(slotIndex) && occupiedSlotIndexes.has(slotIndex)) {
        continue;
      }
      const rawValue = states[slotStateKey];
      if (rawValue === true || Number(rawValue) === 1) {
        occupiedSlots += 1;
        if (Number.isFinite(slotIndex) && slotIndex >= 0) {
          occupiedSlotIndexes.add(slotIndex);
        }
      }
    }
    lines.push(`Bookshelf Slots: ${occupiedSlots}/6`);
  }
  if (blockTypeId.endsWith("bell")) {
    const attachment = toMessageText(String(states["attachment"] ?? states["minecraft:attachment"] ?? "unknown"));
    const direction = toMessageText(String(
      states["minecraft:cardinal_direction"] ?? states["direction"] ?? states["facing_direction"] ?? "unknown"
    ));
    lines.push(`Bell: ${attachment}, Facing ${direction}`);
  }
  try {
    const inventoryComponent = block?.getComponent?.("minecraft:inventory");
    const usage = countContainerUsedSlots(inventoryComponent?.container);
    if (usage) {
      lines.push(`Container Slots: ${usage.usedSlots}/${usage.totalSlots}`);
      lines.push(`Container Items: ${usage.totalItems}`);
    }
  } catch {
  }
  return lines;
}
function buildNearbyItemClusterLine(itemClusterContext) {
  if (!itemClusterContext || typeof itemClusterContext !== "object") {
    return void 0;
  }
  const entityCount = Number(itemClusterContext.entityCount);
  const totalAmount = Number(itemClusterContext.totalAmount);
  if (!Number.isFinite(entityCount) || entityCount < 2) {
    return void 0;
  }
  const safeTotalAmount = Number.isFinite(totalAmount) ? Math.max(entityCount, Math.floor(totalAmount)) : entityCount;
  return `${InsightConfig.display.technicalColor}Nearby Items: ${Math.floor(entityCount)} entities (x${safeTotalAmount})\xA7r`;
}
function buildBlockActionbarPayload(block, playerSettings, context = {}) {
  const blockTags = sortBlockTagsForDisplay(getBlockTagsSafe(block));
  const namespaceInfo = resolveInjectedNamespace(block.typeId, blockTags);
  const rawtext = [];
  const toolDescriptors = getBlockToolDescriptors(block, blockTags);
  const breakableToolsPlacement = buildBreakableToolsPlacement(toolDescriptors, blockTags, playerSettings, context);
  pushRawtextParts(rawtext, breakableToolsPlacement.prefixParts);
  rawtext.push(buildBlockTranslationRawtext(block, playerSettings));
  pushRawtextParts(rawtext, breakableToolsPlacement.suffixParts);
  pushRawtextParts(rawtext, breakableToolsPlacement.belowLineParts);
  if (playerSettings.showNamespace) {
    rawtext.push({
      text: formatNamespaceLabel(namespaceInfo.displayNamespace, InsightConfig.display.namespaceColor)
    });
  }
  let customFieldLineCount = 0;
  if (playerSettings.showCustomFields) {
    const customFieldLines = collectCustomBlockFieldLines({
      block,
      playerSettings,
      blockTags,
      namespaceInfo,
      formatStateName,
      formatTypeIdToText,
      splitTypeId,
      toMessageText
    });
    customFieldLineCount = appendCustomFieldLines(rawtext, customFieldLines);
  }
  let states = {};
  try {
    states = block.permutation.getAllStates();
  } catch {
    states = {};
  }
  const rawStateEntries = Object.entries(states);
  const blockSpecificConfigurationLines = collectBlockSpecificConfigurationLines(block, states);
  const stateEntries = transformBlockStateEntries({
    block,
    typeId: block.typeId,
    rawStates: states,
    blockTags,
    namespaceInfo,
    formatStateName,
    toMessageText
  });
  const shouldShowBlockFunctionSection = playerSettings.showBlockStates && stateEntries.length > 0 || playerSettings.showBlockTags && blockTags.length > 0 || playerSettings.showTypeId || playerSettings.showCoordinates || playerSettings.showTechnicalData;
  if (customFieldLineCount > 0 && shouldShowBlockFunctionSection) {
    DisplaySubfunctions.displayHelpers.appendConfigurableFunctionDivider(rawtext);
  }
  if (playerSettings.showBlockStates && blockSpecificConfigurationLines.length) {
    appendCustomFieldLines(rawtext, blockSpecificConfigurationLines);
  }
  if (playerSettings.showBlockStates && stateEntries.length) {
    rawtext.push({ text: InsightConfig.display.separator });
    const maxRows = Math.max(0, playerSettings.maxVisibleStates);
    const visibleEntries = stateEntries.slice(0, maxRows);
    if (visibleEntries.length) {
      const stateColumns = Math.max(1, playerSettings.stateColumns || 1);
      const renderedStateEntries = visibleEntries.map((entry) => `${entry.label}: ${entry.valueText}`);
      const wrappedStates = buildColumnWrappedList(renderedStateEntries, stateColumns);
      rawtext.push({
        text: `
${wrappedStates}`
      });
    }
    const hiddenRows = stateEntries.length - visibleEntries.length;
    if (hiddenRows > 0) {
      rawtext.push({ text: " " });
      rawtext.push(tr2("ui.dorios.insight.display.more_items", [`${hiddenRows}`]));
    }
  }
  appendBlockTags(rawtext, blockTags, playerSettings);
  if (playerSettings.showTypeId) {
    appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.type_id", [block.typeId]));
  }
  if (playerSettings.showCoordinates) {
    appendDisplayLine(rawtext, getBlockLocationLine(block));
  }
  if (playerSettings.showTechnicalData) {
    appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.technical_block", [`${rawStateEntries.length}`, `${stateEntries.length}`, `${blockTags.length}`]));
    if (namespaceInfo.injected && playerSettings.showNamespaceResolutionDebug) {
      appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.namespace_debug", [namespaceInfo.originalNamespace, namespaceInfo.displayNamespace]));
      appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.namespace_mapped_by", [namespaceInfo.source]));
    }
  }
  return { rawtext };
}
function buildEntityActionbarPayload(entity, playerSettings, context = {}) {
  const rawtext = [];
  let entityTags = [];
  let healthComponent;
  const tameableData = getTameableData(entity);
  const isTargetPlayer = entity.typeId === "minecraft:player";
  const hungerInfo = isTargetPlayer ? getAttributeValueRange(entity, PlayerAttributeComponentIds.hunger) : void 0;
  const armorInfo = isTargetPlayer ? getArmorValueRange(entity) : void 0;
  const absorptionValue = isTargetPlayer ? getAttributeCurrentValue(entity, PlayerAttributeComponentIds.absorption) : void 0;
  const saturationValue = isTargetPlayer ? getAttributeCurrentValue(entity, PlayerAttributeComponentIds.saturation) : void 0;
  const airInfo = isTargetPlayer ? getAirSupplyInfo(entity) : void 0;
  const isFreezing = isTargetPlayer && playerSettings.showFrozenHearts ? isEntityFreezing(entity) : false;
  const effects = getEntityEffects(entity);
  const effectFlags = getEffectFlags(effects);
  const itemStack = entity.typeId === "minecraft:item" ? getEntityItemStack(entity) : void 0;
  const typeIdForDisplay = itemStack?.typeId || entity.typeId;
  const representedBlockId = itemStack?.typeId ? void 0 : resolveRepresentedBlockId(entity);
  const titleNickname = shouldPreferRepresentedBlockName(entity, representedBlockId) ? void 0 : entity.nameTag;
  try {
    if (typeof entity.getTags === "function") {
      entityTags = entity.getTags() ?? [];
    }
  } catch {
    entityTags = [];
  }
  const namespaceInfo = resolveInjectedNamespace(typeIdForDisplay, entityTags);
  const isBaby = DisplaySubfunctions.entityPredicates.hasIsBabyComponent(entity);
  const isOnFire = DisplaySubfunctions.entityPredicates.isOnFireComponent(entity);
  const entityFamilies = getEntityFamilies(entity);
  const villagerProfessionLabel = getVillagerProfessionLabel(entity, entityTags, entityFamilies);
  const villagerProfessionNameRawtext = buildVillagerProfessionNameRawtext(villagerProfessionLabel);
  const isRideable = !isTargetPlayer && playerSettings.showAnimalHearts ? isEntityRideable(entity, entityFamilies) : false;
  const healthGlyphs = resolveHealthGlyphSet({
    isPlayer: isTargetPlayer,
    isFreezing,
    effectFlags,
    isOnFire,
    isRideable,
    playerSettings
  });
  const hungerGlyphs = resolveHungerGlyphSet(effectFlags, playerSettings);
  try {
    healthComponent = entity.getComponent(EntityHealthComponent.componentId);
  } catch {
    healthComponent = void 0;
  }
  appendEntityTitle(rawtext, {
    nickname: titleNickname,
    resolvedNameRawtext: buildEntityResolvedNameRawtext(entity, typeIdForDisplay, itemStack, playerSettings, representedBlockId),
    nameDisplayMode: playerSettings.nameDisplayMode,
    itemStack
  });
  if (isBaby) {
    rawtext.push({ text: " \xA77(" });
    rawtext.push(tr2("ui.dorios.insight.display.isBaby"));
    rawtext.push({ text: ")\xA7r" });
  }
  if (villagerProfessionNameRawtext && playerSettings.villagerProfessionDisplay === VillagerProfessionDisplayModes.AfterName) {
    rawtext.push({ text: " \xA77(" });
    rawtext.push(villagerProfessionNameRawtext);
    rawtext.push({ text: ")\xA7r" });
  }
  if (villagerProfessionNameRawtext && playerSettings.villagerProfessionDisplay === VillagerProfessionDisplayModes.BelowName) {
    appendDisplayLine(rawtext, [
      tr2("ui.dorios.insight.display.profession_label"),
      { text: " " },
      villagerProfessionNameRawtext,
      { text: "\xA7r" }
    ]);
  }
  if (playerSettings.showNamespace) {
    rawtext.push({
      text: formatNamespaceLabel(namespaceInfo.displayNamespace, InsightConfig.display.namespaceColor)
    });
  }
  if (isOnFire) {
    appendDisplayLine(rawtext, { text: `${InsightConfig.display.technicalColor}On Fire\xA7r` });
  }
  const nearbyItemClusterLine = buildNearbyItemClusterLine(context?.nearbyItemCluster);
  if (nearbyItemClusterLine) {
    appendDisplayLine(rawtext, { text: nearbyItemClusterLine });
  }
  let customFieldLineCount = 0;
  let entityHasCustomEnergyLine = false;
  if (playerSettings.showCustomFields) {
    const customFieldLines = collectCustomEntityFieldLines({
      entity,
      playerSettings,
      typeIdForDisplay,
      namespaceInfo,
      formatTypeIdToText,
      splitTypeId,
      toMessageText
    });
    entityHasCustomEnergyLine = hasCustomEnergyFieldLine(customFieldLines);
    customFieldLineCount = appendCustomFieldLines(rawtext, customFieldLines);
  }
  const shouldShowEntityFunctionSection = playerSettings.showEntityScoreboards || playerSettings.showHealth && healthComponent || playerSettings.showAbsorption && Number.isFinite(absorptionValue) && absorptionValue > 0 || isTargetPlayer && playerSettings.showArmor && armorInfo || playerSettings.showHunger && hungerInfo || isTargetPlayer && playerSettings.showAirBubbles && airInfo && airInfo.current < airInfo.max || playerSettings.showEffects || playerSettings.showTameable || playerSettings.showTameFoods && tameableData.isTameable || playerSettings.showEntityTags && entityTags.length > 0 || playerSettings.showEntityFamilies && entityFamilies.length > 0 || playerSettings.showTypeId || playerSettings.showCoordinates || playerSettings.showVelocity || playerSettings.showTechnicalData;
  if (customFieldLineCount > 0 && shouldShowEntityFunctionSection) {
    DisplaySubfunctions.displayHelpers.appendConfigurableFunctionDivider(rawtext);
  }
  appendEntityScoreboardFields(rawtext, entity, playerSettings, {
    suppressEnergyField: entityHasCustomEnergyLine
  });
  if (playerSettings.showHealth && healthComponent) {
    appendDisplayLine(rawtext, buildHealthDisplay(
      healthComponent.currentValue,
      healthComponent.effectiveMax,
      playerSettings.maxHeartDisplayHealth,
      playerSettings.healthDisplayStyle,
      healthGlyphs
    ));
  }
  if (playerSettings.showAbsorption && Number.isFinite(absorptionValue) && absorptionValue > 0) {
    appendDisplayLine(rawtext, buildAbsorptionDisplay(absorptionValue, playerSettings.absorptionDisplayStyle));
  }
  if (isTargetPlayer && playerSettings.showArmor && armorInfo) {
    appendDisplayLine(rawtext, buildArmorDisplay(armorInfo.current, armorInfo.max, playerSettings.armorDisplayStyle));
  }
  if (playerSettings.showHunger && hungerInfo) {
    appendDisplayLine(
      rawtext,
      buildHungerDisplay(
        hungerInfo.current,
        hungerInfo.max,
        playerSettings.hungerDisplayStyle,
        hungerGlyphs,
        saturationValue
      )
    );
  }
  if (isTargetPlayer && playerSettings.showAirBubbles && airInfo && airInfo.current < airInfo.max) {
    appendDisplayLine(rawtext, buildAirBubbleDisplay(airInfo.current, airInfo.max, playerSettings.airDisplayStyle));
  }
  if (playerSettings.showEffects) {
    appendDisplayLine(rawtext, buildEffectsDisplay(effects, playerSettings));
  }
  if (playerSettings.showTameable) {
    appendDisplayLine(rawtext, tr2(
      tameableData.isTameable ? "ui.dorios.insight.display.tameable_yes" : "ui.dorios.insight.display.tameable_no"
    ));
    if (tameableData.isTameable) {
      appendDisplayLine(rawtext, tr2(
        tameableData.isTamed ? "ui.dorios.insight.display.tamed_yes" : "ui.dorios.insight.display.tamed_no"
      ));
    }
  }
  if (playerSettings.showTameFoods && tameableData.isTameable) {
    const foodsRawtext = buildTameFoodsDisplay(tameableData.foodTypeIds);
    if (foodsRawtext.length) {
      appendDisplayLine(rawtext, [
        tr2("ui.dorios.insight.display.foods_label"),
        { text: " " },
        ...foodsRawtext,
        { text: "\xA7r" }
      ]);
    }
  }
  appendEntityTags(rawtext, entityTags, playerSettings);
  appendEntityFamilies(rawtext, entityFamilies, playerSettings);
  if (playerSettings.showTypeId) {
    appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.type_id", [typeIdForDisplay]));
  }
  if (playerSettings.showCoordinates) {
    appendDisplayLine(rawtext, getEntityLocationLine(entity));
  }
  if (playerSettings.showVelocity) {
    appendDisplayLine(rawtext, getEntityVelocityLine(entity));
  }
  if (playerSettings.showTechnicalData) {
    appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.technical_entity", [`${entityTags.length}`, `${entityFamilies.length}`]));
    if (namespaceInfo.injected && playerSettings.showNamespaceResolutionDebug) {
      appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.namespace_debug", [namespaceInfo.originalNamespace, namespaceInfo.displayNamespace]));
      appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.namespace_mapped_by", [namespaceInfo.source]));
    }
    if (playerSettings.showHealth && healthComponent) {
      const current = Math.max(0, healthComponent.currentValue);
      const max = Math.max(1, healthComponent.effectiveMax);
      const healthPercent = Math.floor(current / max * 1e3) / 10;
      appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.technical_hp", [current.toFixed(1), max.toFixed(1), `${healthPercent}`]));
    }
    if (playerSettings.showHunger && hungerInfo) {
      appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.technical_hunger", [hungerInfo.current.toFixed(1), hungerInfo.max.toFixed(1)]));
    }
    if (playerSettings.showHunger && Number.isFinite(saturationValue)) {
      appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.technical_saturation", [saturationValue.toFixed(2)]));
    }
    if (playerSettings.showAbsorption && Number.isFinite(absorptionValue) && absorptionValue > 0) {
      appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.technical_absorption", [absorptionValue.toFixed(1)]));
    }
    if (playerSettings.showEffects) {
      appendDisplayLine(rawtext, tr2("ui.dorios.insight.display.technical_effects", [`${effects.length}`]));
    }
  }
  return { rawtext };
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\wailaComposer.js
var NearbyItemClusterDistance = 0.25;
var IgnoredMachineHelperIdentifiers = Object.freeze([
  "utilitycraft:machine_entity",
  "entity.utilitycraft:machine_entity",
  "entity.utilitycraft:machine_entity.name"
]);
function getPlayerMainhandItem(player) {
  try {
    const equippable = player.getComponent?.("minecraft:equippable");
    if (equippable && typeof equippable.getEquipment === "function") {
      return equippable.getEquipment("Mainhand") ?? equippable.getEquipment("mainhand") ?? equippable.getEquipment("slot.weapon.mainhand");
    }
  } catch {
  }
  try {
    const inventory = player.getComponent?.("minecraft:inventory")?.container;
    const selectedSlot = Number(player.selectedSlotIndex ?? player.selectedSlot ?? 0);
    if (inventory && Number.isFinite(selectedSlot)) {
      return inventory.getItem(Math.max(0, selectedSlot));
    }
  } catch {
  }
  return void 0;
}
function getItemEntityAmount(entity) {
  if (!entity || entity.typeId !== "minecraft:item") {
    return 0;
  }
  try {
    const itemComponent2 = entity.getComponent?.("minecraft:item");
    const amount = Number(itemComponent2?.itemStack?.amount);
    return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 1;
  } catch {
    return 1;
  }
}
function getDistanceBetweenEntities(source, target) {
  const sourceLocation = source?.location;
  const targetLocation = target?.location;
  if (!sourceLocation || !targetLocation) {
    return Number.POSITIVE_INFINITY;
  }
  const deltaX = Number(targetLocation.x) - Number(sourceLocation.x);
  const deltaY = Number(targetLocation.y) - Number(sourceLocation.y);
  const deltaZ = Number(targetLocation.z) - Number(sourceLocation.z);
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
}
function getNearbyItemClusterContext(targetEntity) {
  if (!targetEntity || targetEntity.typeId !== "minecraft:item") {
    return void 0;
  }
  const dimension = targetEntity.dimension;
  const location = targetEntity.location;
  if (!dimension || !location) {
    return void 0;
  }
  let nearbyItems;
  try {
    nearbyItems = dimension.getEntities({
      type: "minecraft:item",
      location,
      maxDistance: NearbyItemClusterDistance
    });
  } catch {
    return void 0;
  }
  if (!Array.isArray(nearbyItems) || nearbyItems.length < 2) {
    return void 0;
  }
  let entityCount = 0;
  let totalAmount = 0;
  for (const nearbyItem of nearbyItems) {
    const distance = getDistanceBetweenEntities(targetEntity, nearbyItem);
    if (!Number.isFinite(distance) || distance > NearbyItemClusterDistance) {
      continue;
    }
    entityCount += 1;
    totalAmount += getItemEntityAmount(nearbyItem);
  }
  if (entityCount < 2) {
    return void 0;
  }
  return {
    entityCount,
    totalAmount,
    maxDistance: NearbyItemClusterDistance
  };
}
function resolveEntityScoreboardFallback(settings) {
  if (typeof settings?.showEntityScoreboards === "boolean") {
    return settings.showEntityScoreboards;
  }
  const mode = String(settings?.mode || "").trim().toLowerCase();
  if (mode === "detailed" || mode === "debug") {
    return true;
  }
  if (mode === "essential") {
    return Boolean(settings?.isSneaking);
  }
  return Boolean(settings?.showTechnicalData || settings?.isSneaking);
}
function normalizeLegacySettings(settings) {
  const displayStyle = settings?.displayStyle;
  return {
    ...settings,
    blockNameResolveMode: settings?.blockNameResolveMode ?? settings?.nameResolveMode,
    healthDisplayStyle: settings?.healthDisplayStyle ?? displayStyle,
    hungerDisplayStyle: settings?.hungerDisplayStyle ?? displayStyle,
    armorDisplayStyle: settings?.armorDisplayStyle ?? displayStyle,
    absorptionDisplayStyle: settings?.absorptionDisplayStyle ?? displayStyle,
    airDisplayStyle: settings?.airDisplayStyle ?? displayStyle,
    showEntityScoreboards: resolveEntityScoreboardFallback(settings),
    showCustomFluidInfo: typeof settings?.showCustomFluidInfo === "boolean" ? settings.showCustomFluidInfo : Boolean(settings?.showCustomFields),
    showCustomGasInfo: typeof settings?.showCustomGasInfo === "boolean" ? settings.showCustomGasInfo : Boolean(settings?.showCustomFields),
    showCustomCobblestoneCount: typeof settings?.showCustomCobblestoneCount === "boolean" ? settings.showCustomCobblestoneCount : Boolean(settings?.showCustomFields)
  };
}
function toRawMessage(payload) {
  if (payload && typeof payload === "object" && Array.isArray(payload.rawtext)) {
    return payload;
  }
  return null;
}
function composeBlockDisplay(block, player, settings) {
  try {
    return toRawMessage(createBlockActionbar(
      block,
      normalizeLegacySettings(settings),
      {
        heldItemStack: getPlayerMainhandItem(player)
      }
    ));
  } catch {
    return null;
  }
}
function composeEntityDisplay(entity, player, settings) {
  try {
    return toRawMessage(createEntityActionbar(
      entity,
      normalizeLegacySettings(settings),
      {
        heldItemStack: getPlayerMainhandItem(player),
        nearbyItemCluster: getNearbyItemClusterContext(entity)
      }
    ));
  } catch {
    return null;
  }
}
function composeBlockDisplayForTarget(block, player, settings) {
  return composeBlockDisplay(block, player, settings);
}
function composeEntityDisplayForTarget(entity, player, settings) {
  return composeEntityDisplay(entity, player, settings);
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\targetDataCollector.js
var CHANNEL_SUFFIX = "insight_target";
var TIER_LIST = {
  "minecraft:stone_tier_destructible": [
    "minecraft:stone_tier",
    "minecraft:copper_tier",
    "minecraft:iron_tier",
    "minecraft:diamond_tier",
    "minecraft:netherite_tier"
  ],
  "minecraft:iron_tier_destructible": [
    "minecraft:iron_tier",
    "minecraft:diamond_tier",
    "minecraft:netherite_tier"
  ],
  "minecraft:diamond_tier_destructible": [
    "minecraft:diamond_tier",
    "minecraft:netherite_tier"
  ]
};
var TIER_KEYS = Object.keys(TIER_LIST);
var IGNORED_MACHINE_HELPER_IDENTIFIERS = Object.freeze([
  "utilitycraft:machine",
  "utilitycraft:machine_entity",
  "entity.utilitycraft:machine",
  "entity.utilitycraft:machine.name",
  "entity.utilitycraft:machine_entity",
  "entity.utilitycraft:machine_entity.name"
]);
var EffectGlyphByTypeId2 = Object.freeze({
  blindness: "\uF51C",
  conduit: "\uF51D",
  conduit_power: "\uF51D",
  haste: "\uF51E",
  darkness: "\uF51F",
  fire_resistance: "\uF529",
  absorption: "\uF52A",
  health_boost: "\uF54F",
  hunger: "\uF52B",
  invisibility: "\uF52C",
  jump_boost: "\uF52D",
  levitation: "\uF52E",
  mining_fatigue: "\uF52F",
  resistance: "\uF539",
  slow_falling: "\uF53A",
  speed: "\uF53B",
  slowness: "\uF53C",
  strength: "\uF53D",
  weakness: "\uF53E",
  village_hero: "\uF53F",
  night_vision: "\uF549",
  water_breathing: "\uF54A",
  wither: "\uF54B",
  decay: "\uF54B",
  poison: "\uF54C",
  regeneration: "\uF516",
  dolphins_grace: "\uF528",
  fatal_poison: "\uF547",
  raid_omen: "\uF54E",
  trial_omen: "\uF548",
  bad_omen: "\uF538",
  weaving: "\uF526",
  wind_charged: "\uF536",
  infested: "\uF527",
  oozing: "\uF537"
});
var VillagerProfessionLocKeys = Object.freeze({
  unskilled: "entity.villager.unskilled",
  unemployed: "entity.villager.unskilled",
  farmer: "entity.villager.farmer",
  fisherman: "entity.villager.fisherman",
  shepherd: "entity.villager.shepherd",
  fletcher: "entity.villager.fletcher",
  librarian: "entity.villager.librarian",
  cartographer: "entity.villager.cartographer",
  cleric: "entity.villager.cleric",
  armorer: "entity.villager.armor",
  weaponsmith: "entity.villager.weapon",
  toolsmith: "entity.villager.tool",
  butcher: "entity.villager.butcher",
  leatherworker: "entity.villager.leather",
  mason: "entity.villager.mason",
  stone_mason: "entity.villager.mason",
  nitwit: "entity.villager.unskilled"
});
var entityHeightCache = { "minecraft:player": 2 };
var playerTargetCache = /* @__PURE__ */ new Map();
var playerNoTargetTicks = /* @__PURE__ */ new Map();
function normalizeHeaderKey(value, fallback = "unknown") {
  const normalized = String(value ?? "").replace(/[\r\n\t]+/g, " ").trim();
  return normalized.length ? normalized : fallback;
}
function clampSingleDigitValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(9, Math.floor(numeric)));
}
function getEntityHeaderKey(entity) {
  if (!entity) {
    return "unknown";
  }
  if (entity.typeId === "minecraft:player") {
    return normalizeHeaderKey(
      entity.nameTag || entity.name || entity.typeId,
      "minecraft:player"
    );
  }
  if (entity.typeId === "minecraft:item") {
    try {
      const itemStack = entity.getComponent("minecraft:item")?.itemStack;
      return normalizeHeaderKey(
        itemStack?.localizationKey || itemStack?.typeId || entity.localizationKey || entity.typeId,
        "minecraft:item"
      );
    } catch {
      return normalizeHeaderKey(entity.localizationKey || entity.typeId, "minecraft:item");
    }
  }
  return normalizeHeaderKey(entity.localizationKey || entity.typeId, "unknown");
}
function getBlockHeaderKey(block) {
  return normalizeHeaderKey(block?.localizationKey || block?.typeId, "minecraft:unknown");
}
function stripLeadingTitleLine(rawtextParts) {
  if (!Array.isArray(rawtextParts) || !rawtextParts.length) {
    return [];
  }
  const detailParts = [];
  let bodyStarted = false;
  for (const part of rawtextParts) {
    if (!part || typeof part !== "object") {
      continue;
    }
    if (bodyStarted) {
      detailParts.push(part);
      continue;
    }
    const text = typeof part.text === "string" ? part.text : void 0;
    if (text === void 0) {
      continue;
    }
    const newlineIndex = text.indexOf("\n");
    if (newlineIndex === -1) {
      continue;
    }
    bodyStarted = true;
    const remainingText = text.slice(newlineIndex + 1);
    if (remainingText.length) {
      detailParts.push({
        ...part,
        text: remainingText
      });
    }
  }
  return detailParts;
}
function getEntityAux(entity) {
  const sign = entity.id > 0;
  return (sign ? "" : "-") + Math.abs(entity.id).toString().padStart(12, "0");
}
function isEntityInvisible(entity) {
  try {
    if (typeof entity.isInvisible === "boolean") return entity.isInvisible;
  } catch {
  }
  try {
    if (entity.getComponent?.("minecraft:is_invisible")) return true;
  } catch {
  }
  try {
    const effects = entity.getEffects?.();
    if (Array.isArray(effects)) {
      for (const effect of effects) {
        if ((effect?.typeId ?? "").toLowerCase().includes("invisibility")) return true;
      }
    }
  } catch {
  }
  return false;
}
function normalizeEntityIdentity2(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}
function isIgnoredMachineHelperEntity(entity, settings) {
  if (!settings?.ignoreMachineHelperEntities) {
    return false;
  }
  const typeId = normalizeEntityIdentity2(entity?.typeId);
  const localizationKey = normalizeEntityIdentity2(entity?.localizationKey);
  const nameTag = normalizeEntityIdentity2(entity?.nameTag);
  if (typeId.endsWith(":machine_entity")) {
    return true;
  }
  const candidateSet = new Set(IGNORED_MACHINE_HELPER_IDENTIFIERS);
  if (typeId && candidateSet.has(typeId)) {
    return true;
  }
  if (localizationKey && candidateSet.has(localizationKey)) {
    return true;
  }
  if (nameTag && candidateSet.has(nameTag)) {
    return true;
  }
  return false;
}
function measureEntityHeight(entity, player) {
  try {
    const scanLoc = { ...entity.location };
    scanLoc.y += 15;
    const results = player.dimension.getEntitiesFromRay(
      scanLoc,
      { x: 0, y: -1, z: 0 },
      { ignoreBlockCollision: true, includeLiquidBlocks: false, includePassableBlocks: false, maxDistance: 15 }
    );
    const match = results.find((e) => e.entity.id === entity.id);
    if (match) {
      entityHeightCache[entity.typeId] = Math.round(15 - match.distance + 0.3);
    }
  } catch {
  }
}
function collectAndSendTargetData(player, settings) {
  try {
    const playerId = player.id;
    const screenData = {
      prefix: "a",
      key: "",
      renderAux: "",
      currentHealth: 0,
      maxHealth: 0,
      wailaTheme: clampSingleDigitValue(settings?.wailaColorThemeId),
      acceptSword: 0,
      acceptPickaxe: 0,
      acceptAxe: 0,
      acceptShovel: 0,
      acceptHoe: 0,
      acceptShears: 0,
      entityHeight: 0,
      detail: { rawtext: [] }
    };
    const maxDist = settings.maxDistance || 9;
    const useIconAndIndicatorMode = String(settings?.toolTierIndicatorMode || "").trim().toLowerCase() === "icon_and_indicator";
    let entityHit;
    const entityHits = player.getEntitiesFromViewDirection({
      maxDistance: maxDist,
      includeLiquidBlocks: false,
      includePassableBlocks: true
    });
    if (Array.isArray(entityHits) && entityHits.length > 0) {
      const allowInvisibleTargets = Boolean(settings.includeInvisibleEntities);
      entityHit = entityHits.find((hit) => {
        const entity = hit?.entity;
        if (!entity) {
          return false;
        }
        if (isIgnoredMachineHelperEntity(entity, settings)) {
          return false;
        }
        if (!allowInvisibleTargets && isEntityInvisible(entity)) {
          return false;
        }
        return true;
      });
    }
    let blockHit;
    if (!entityHit) {
      blockHit = player.getBlockFromViewDirection({
        maxDistance: maxDist,
        includeLiquidBlocks: settings.includeLiquidBlocks ?? false,
        includePassableBlocks: true
      });
    }
    const hasTarget = Boolean(entityHit?.entity || blockHit?.block);
    if (!hasTarget) {
      const clearDelay = Math.max(0, Number(settings?.clearAfterNoTargetTicks) || 0);
      if (clearDelay > 0) {
        const step = Math.max(1, Number(settings?.updateIntervalTicks) || 1);
        const nextTicks = (playerNoTargetTicks.get(playerId) ?? 0) + step;
        if (nextTicks < clearDelay) {
          playerNoTargetTicks.set(playerId, nextTicks);
          return;
        }
      }
      playerNoTargetTicks.set(playerId, 0);
    } else {
      playerNoTargetTicks.set(playerId, 0);
    }
    if (entityHit?.entity) {
      const entity = entityHit.entity;
      const isItem = entity.typeId === "minecraft:item";
      const isPlayer = entity.typeId === "minecraft:player";
      screenData.key = getEntityHeaderKey(entity);
      if (isPlayer) {
        screenData.prefix = "A";
      } else if (!isItem) {
        if (entityHeightCache[entity.typeId] === void 0 || entity.hasComponent("minecraft:scale") || entity.hasComponent("minecraft:is_baby")) {
          measureEntityHeight(entity, player);
        }
      }
      if (!isItem && entity.hasComponent("minecraft:health")) {
        try {
          const health = entity.getComponent("minecraft:health");
          const current = health.currentValue || 0;
          const max = health.effectiveMax || 20;
          screenData.currentHealth = Math.min(999, Math.round(current));
          screenData.maxHealth = Math.min(999, Math.round(max));
        } catch {
        }
      }
      if (entity.hasComponent("minecraft:health")) {
        screenData.renderAux = getEntityAux(entity);
        screenData.entityHeight = entityHeightCache[entity.typeId] || 0;
      }
      if (entity.hasComponent("minecraft:is_baby") || entity.hasComponent("minecraft:scale")) {
        delete entityHeightCache[entity.typeId];
      }
      const entityDetail = composeEntityDisplayForTarget(entity, player, settings);
      if (Array.isArray(entityDetail?.rawtext) && entityDetail.rawtext.length) {
        screenData.detail.rawtext.push(...stripLeadingTitleLine(entityDetail.rawtext));
      }
    } else if (blockHit?.block) {
      const block = blockHit.block;
      screenData.key = getBlockHeaderKey(block);
      if (useIconAndIndicatorMode) {
        try {
          const equipment = player.getComponent("minecraft:equippable");
          const mainhand = equipment?.getEquipment?.("Mainhand");
          const tags = block.getTags();
          for (const tag of tags) {
            if (tag === "minecraft:is_pickaxe_item_destructible") {
              screenData.acceptPickaxe = 1;
              let inTier = false;
              for (const tierTag of TIER_KEYS) {
                if (tags.includes(tierTag)) {
                  if (mainhand) {
                    for (const tierLevel of TIER_LIST[tierTag]) {
                      if (mainhand.hasTag(tierLevel)) {
                        screenData.acceptPickaxe = 2;
                        break;
                      }
                    }
                  }
                  inTier = true;
                  break;
                }
              }
              if (!inTier && mainhand?.hasTag("minecraft:is_pickaxe")) {
                screenData.acceptPickaxe = 2;
              }
            } else if (tag === "minecraft:is_axe_item_destructible") {
              screenData.acceptAxe = mainhand?.hasTag("minecraft:is_axe") ? 2 : 1;
            } else if (tag === "minecraft:is_shovel_item_destructible") {
              screenData.acceptShovel = mainhand?.hasTag("minecraft:is_shovel") ? 2 : 1;
            } else if (tag === "minecraft:is_hoe_item_destructible") {
              screenData.acceptHoe = mainhand?.hasTag("minecraft:is_hoe") ? 2 : 1;
            } else if (tag === "minecraft:is_sword_item_destructible") {
              screenData.acceptSword = mainhand?.hasTag("minecraft:is_sword") ? 2 : 1;
            } else if (tag === "minecraft:is_shears_item_destructible") {
              screenData.acceptShears = mainhand?.hasTag("minecraft:is_shears") ? 2 : 1;
            }
          }
        } catch {
        }
      }
      const blockDetail = composeBlockDisplayForTarget(block, player, settings);
      if (Array.isArray(blockDetail?.rawtext) && blockDetail.rawtext.length) {
        screenData.detail.rawtext.push(...stripLeadingTitleLine(blockDetail.rawtext));
      }
    }
    const exportUi = screenData.prefix + screenData.acceptShears.toString() + screenData.acceptHoe.toString() + screenData.acceptShovel.toString() + screenData.acceptAxe.toString() + screenData.acceptPickaxe.toString() + screenData.acceptSword.toString() + screenData.entityHeight.toString().padStart(2, "0") + "b" + screenData.currentHealth.toString().padStart(3, "0") + screenData.maxHealth.toString().padStart(3, "0") + screenData.wailaTheme.toString() + "0" + screenData.key.slice(0, 48).padStart(48, "~");
    const rawMessage = {
      rawtext: [
        { text: exportUi },
        ...screenData.detail.rawtext,
        { text: CHANNEL_SUFFIX }
      ]
    };
    sendRaw(player, CHANNEL_TARGET, rawMessage);
    setSubtitle(player, screenData.renderAux || null);
    playerTargetCache.set(playerId, screenData);
  } catch {
  }
}
function cleanupPlayer3(playerId) {
  playerTargetCache.delete(playerId);
  playerNoTargetTicks.delete(playerId);
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\biomeDataCollector.js
import { world as world11, system as system11 } from "@minecraft/server";
var DIMENSION_NAMES = {
  "minecraft:overworld": "Overworld",
  "minecraft:nether": "Nether",
  "minecraft:the_end": "The End"
};
var NOTIFICATION_DURATION_TICKS = 20 * 4;
var playerBiomeState = /* @__PURE__ */ new Map();
function formatBiomeName(biomeId) {
  const name = biomeId.includes(":") ? biomeId.split(":")[1] : biomeId;
  return name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function tickPlayer(player) {
  const id = player.id;
  if (!playerBiomeState.has(id)) {
    playerBiomeState.set(id, {
      biomeId: void 0,
      biomeName: "",
      dimensionName: "",
      duration: 0
    });
  }
  const state = playerBiomeState.get(id);
  if (state.duration === 0) {
    try {
      if (!player.dimension.isChunkLoaded(player.location)) return;
      const biome = player.dimension.getBiome(player.location);
      if (biome) {
        if (state.biomeId !== biome.id) {
          state.biomeId = biome.id;
          state.biomeName = formatBiomeName(biome.id);
          state.dimensionName = DIMENSION_NAMES[player.dimension.id] || "Unknown";
          state.duration = 1;
        }
      } else {
        state.biomeId = void 0;
        state.biomeName = "";
        state.dimensionName = "";
      }
    } catch {
    }
    return;
  }
  if (state.duration > NOTIFICATION_DURATION_TICKS) {
    state.biomeName = "";
    state.dimensionName = "";
    state.duration = 0;
    send(player, CHANNEL_BIOME, "");
    return;
  }
  state.duration++;
  const dimRevealLen = Math.floor(state.dimensionName.length / 5 + state.duration);
  const bioRevealLen = Math.floor(state.biomeName.length / 5 + state.duration);
  const dimText = state.dimensionName.substring(0, dimRevealLen).padStart(64, "~");
  const bioText = state.biomeName.substring(0, bioRevealLen).padStart(64, "~");
  send(player, CHANNEL_BIOME, dimText + bioText);
}
var initialized = false;
function initialize2() {
  if (initialized) return;
  initialized = true;
  system11.runInterval(() => {
    for (const player of world11.getAllPlayers()) {
      try {
        const settings = getPlayerDisplaySettings(player);
        if (settings.disabled || !settings.enableBiomeIndicator) continue;
        tickPlayer(player);
      } catch {
      }
    }
  }, 1);
}
function cleanupPlayer4(playerId) {
  playerBiomeState.delete(playerId);
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display\controller.js
var playerUpdateSchedule = /* @__PURE__ */ new Map();
var suppressedPlayers = /* @__PURE__ */ new Set();
var globalTickCounter = 0;
var initialized2 = false;
var EMPTY_TARGET_RAW = Object.freeze({
  rawtext: [{ text: "" }]
});
function getPlayerCacheKey(player) {
  return player.id || player.name;
}
function canRunUpdateNow(player, settings) {
  const cacheKey = getPlayerCacheKey(player);
  const nextTick = playerUpdateSchedule.get(cacheKey) ?? 0;
  if (globalTickCounter < nextTick) {
    return false;
  }
  playerUpdateSchedule.set(cacheKey, globalTickCounter + Math.max(1, settings.updateIntervalTicks));
  return true;
}
function isSuppressed(settings) {
  if (settings.disabled) {
    return true;
  }
  if (settings.requireSneak && !settings.isSneaking) {
    return true;
  }
  return false;
}
function clearPlayerUiState(player) {
  clearPlayer(player);
  setSubtitle(player, null);
  sendRaw(player, CHANNEL_TARGET, EMPTY_TARGET_RAW);
  cleanupPlayer3(player.id);
  cleanupPlayer2(player.id);
}
function processPlayer(player, settings) {
  const playerKey = player.id;
  if (isSuppressed(settings)) {
    if (suppressedPlayers.has(playerKey)) {
      return;
    }
    clearPlayerUiState(player);
    suppressedPlayers.add(playerKey);
    return;
  }
  suppressedPlayers.delete(playerKey);
  collectAndSendHudData(player, settings);
  collectAndSendTargetData(player, settings);
}
function processEntityHit(data) {
  if (!InsightConfig.compatibility.useEntityHitFallback) {
    return;
  }
  if (data.damagingEntity?.typeId !== "minecraft:player") {
    return;
  }
  const player = data.damagingEntity;
  const settings = getPlayerDisplaySettings(player);
  if (isSuppressed(settings)) {
    return;
  }
  collectAndSendTargetData(player, settings);
}
function cleanupPlayerState(playerId) {
  playerUpdateSchedule.delete(playerId);
  suppressedPlayers.delete(playerId);
  cleanupPlayer3(playerId);
  cleanupPlayer2(playerId);
  cleanupPlayer4(playerId);
}
function initializeDisplayController() {
  if (initialized2) {
    return;
  }
  initialized2 = true;
  initializeUIQueue();
  initialize2();
  system12.runInterval(() => {
    globalTickCounter += 1;
    for (const player of world12.getAllPlayers()) {
      try {
        const settings = getPlayerDisplaySettings(player);
        if (!canRunUpdateNow(player, settings)) {
          continue;
        }
        processPlayer(player, settings);
      } catch {
      }
    }
  }, 1);
  world12.afterEvents.entityHitEntity.subscribe((data) => {
    try {
      processEntityHit(data);
    } catch {
    }
  });
  world12.afterEvents.playerLeave.subscribe((event) => {
    cleanupPlayerState(event.playerId);
  });
}

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\display.js
if (InsightConfig.system.showLoadMessage) {
  system13.run(() => {
    try {
      world13.sendMessage(InsightConfig.system.loadMessage);
    } catch {
    }
  });
}
initializeDisplayController();
initializeInsightCommands();
world13.afterEvents.playerSpawn.subscribe((event) => {
  if (!InsightConfig.system.showInitializationModeMessage || !event.initialSpawn) {
    return;
  }
  system13.run(() => {
    try {
      event.player.sendMessage(`${InsightConfig.display.initializedPrefix}${getCurrentModeLabel()} Mode`);
    } catch {
    }
  });
});

// utilitysky-file:C:\Users\chave\Documents\GitHub\Dorios Studios\Dorios-Insight\BP\scripts\legacy\main.js
dependencies_exports.initialize(
  INSIGHT_METADATA,
  INSIGHT_DEPENDENCY_OPTIONS
);
registry_exports.install();
