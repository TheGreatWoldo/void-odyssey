import type { AmmoType } from '@/domain/models/combat/ammo';
import { AmmoResourceType } from '@/domain/models/combat/ammo';
import type { DamagePacket, DamageType } from '@/domain/models/combat/damage';
import { createDamagePacket } from '@/domain/models/combat/damage';
import type { ProductionModuleOptions } from '@/domain/models/module/production-module';
import type { ModuleId } from '@/domain/models/module/production-module-id';
import { ModuleSlotCosts } from '@/domain/models/module/production-module-id';
import type { ModuleUpgrade } from '@/domain/models/module/production-module-upgrade';
import { createResource } from '@/domain/models/resources/resource';
import type { ContainerMap } from '@/domain/models/resources/resource-container';
import { err, ok, type Result } from '@/shared/result';
import { isNullOrWhiteSpace } from '@/shared/string-utils';

import type { WeaponModule } from './weapon-module';

/**
 * Options for creating a kinetic weapon module.
 * Kinetic weapons fire immediately on trigger, consuming one unit of the loaded ammo type.
 * They do not charge and do not consume power.
 */
export interface KineticWeaponModuleOptions extends ProductionModuleOptions {
  /** The elemental nature of the damage produced when this weapon fires. */
  damageType: DamageType;

  /** The ammo variant loaded at creation time. Can be changed via `loadAmmo()`. */
  loadedAmmoType: AmmoType;
}

/**
 * A weapon module that fires instantly on trigger by consuming one ammo unit.
 * No charging, no power cost. `produce()` and `reset()` are no-ops.
 * `fire()` checks for ammo, consumes one unit, and returns a DamagePacket.
 */
export interface KineticWeaponModule extends WeaponModule {
  /** The ammo variant currently loaded. Changed via `loadAmmo()`. */
  readonly loadedAmmoType: AmmoType;

  /**
   * Changes the loaded ammo type.
   * Does not affect any state other than which ResourceType is consumed on fire.
   */
  loadAmmo(type: AmmoType): void;
}

/**
 * Returns true when `m` is a KineticWeaponModule.
 */
export function isKineticWeaponModule(m: WeaponModule): m is KineticWeaponModule {
  return 'loadedAmmoType' in m;
}

export function createKineticWeaponModule(
  id: string,
  name: string,
  options: KineticWeaponModuleOptions
): Result<KineticWeaponModule, string> {
  const {
    initialCondition = 1,
    rampRate = Infinity,
    type,
    maxOutput = 0,
    snapOutputToInteger = false,
    damageType,
    loadedAmmoType: initialAmmoType,
  } = options;

  if (isNullOrWhiteSpace(id))
    return err('KineticWeaponModule id must be a non-empty string');

  if (isNullOrWhiteSpace(name))
    return err('KineticWeaponModule name must be a non-empty string');

  if (initialCondition < 0 || initialCondition > 1)
    return err(`KineticWeaponModule condition must be in [0, 1], got ${initialCondition}`);

  if (rampRate < 0)
    return err(`KineticWeaponModule rampRate must be >= 0, got ${rampRate}`);

  // --- Mutable state ---

  type MutableModuleUpgrade = { -readonly [K in keyof ModuleUpgrade]: ModuleUpgrade[K] };

  const upgradeMap = new Map<string, MutableModuleUpgrade>();

  let cachedCostMultiplier: number | null = null;
  let cachedUpgrades: readonly ModuleUpgrade[] | null = null;
  let condition = initialCondition;
  let throttle = 1;
  let actualThrottle = 1;
  let enabled = true;
  let loadedAmmoType: AmmoType = initialAmmoType;

  // --- Upgrades ---

  function addUpgrade(upgrade: ModuleUpgrade): Result<void, string> {
    upgradeMap.set(upgrade.id, { ...upgrade });
    cachedCostMultiplier = null;
    cachedUpgrades = null;
    return ok(undefined);
  }

  function setUpgradeEnabled(upgradeId: string, upgEnabled: boolean): Result<void, string> {
    const upgrade = upgradeMap.get(upgradeId);
    if (!upgrade) return err(`Upgrade '${upgradeId}' not found on module '${id}'`);
    upgrade.enabled = upgEnabled;
    cachedCostMultiplier = null;
    cachedUpgrades = null;
    return ok(undefined);
  }

  function computeCostMultiplier(): number {
    if (cachedCostMultiplier !== null) return cachedCostMultiplier;
    let cost = 1;
    for (const u of upgradeMap.values()) {
      if (!u.enabled) continue;
      cost += u.costFactor - 1;
    }
    cachedCostMultiplier = Math.max(0, cost);
    return cachedCostMultiplier;
  }

  // --- Throttle & ramp ---

  function setThrottle(value: number): void {
    if (snapOutputToInteger) {
      const maxN = Math.floor(maxOutput);
      if (maxN > 0) {
        const snapped = Math.round(value * maxN) / maxN;
        throttle = Math.max(0, Math.min(1, snapped));
        return;
      }
    }
    throttle = Math.max(0, Math.min(1, value));
  }

  function setCondition(value: number): Result<void, string> {
    if (value < 0 || value > 1)
      return err(`KineticWeaponModule condition must be in [0, 1], got ${value}`);
    condition = value;
    return ok(undefined);
  }

  function stepRamp(deltaTime: number): void {
    if (rampRate === Infinity) {
      actualThrottle = throttle;
      return;
    }
    const step = rampRate * deltaTime;
    if (actualThrottle < throttle) {
      actualThrottle = Math.min(throttle, actualThrottle + step);
    } else if (actualThrottle > throttle) {
      actualThrottle = Math.max(throttle, actualThrottle - step);
    }
  }

  // --- Weapon-specific ---

  function fire(containerMap: ContainerMap): DamagePacket | undefined {
    const ammoResourceType = AmmoResourceType[loadedAmmoType];
    const ammoContainer = containerMap.get(ammoResourceType);

    if (!ammoContainer || ammoContainer.get(ammoResourceType) < 1) return undefined;

    ammoContainer.destroy(createResource(ammoResourceType, 1));

    return createDamagePacket(damageType, maxOutput, loadedAmmoType);
  }

  return ok({
    id,
    type,
    name,
    storableType: 'module' as const,
    slotCost: ModuleSlotCosts[type as ModuleId],
    damageType,
    maxOutput,

    get loadedAmmoType() { return loadedAmmoType; },
    get condition() { return condition; },

    get upgrades() {
      if (!cachedUpgrades) cachedUpgrades = [...upgradeMap.values()] as readonly ModuleUpgrade[];
      return cachedUpgrades;
    },

    get throttle() { return throttle; },
    get actualThrottle() { return actualThrottle; },
    get rampRate() { return rampRate; },
    get enabled() { return enabled; },

    enable: () => { enabled = true; },
    disable: () => { enabled = false; },

    loadAmmo: (type: AmmoType) => { loadedAmmoType = type; },

    addUpgrade,
    setUpgradeEnabled,

    get costMultiplier() { return computeCostMultiplier(); },

    isOperational: () => condition > 0 && enabled,

    setCondition,
    setThrottle,
    stepRamp,

    // Kinetic weapons do not charge or consume power — these are intentional no-ops.
    produce: (_deltaTime: number, _containerMap: ContainerMap) => {},
    drain: (_containerMap: ContainerMap) => {},
    reset: () => {},

    fire,
  });
}
