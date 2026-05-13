import type { AmmoType } from '@/domain/models/combat/ammo';
import { AmmoResourceType } from '@/domain/models/combat/ammo';
import type { DamagePacket, DamageType } from '@/domain/models/combat/damage';
import { createDamagePacket } from '@/domain/models/combat/damage';
import type { ProductionModuleOptions } from '@/domain/models/module/production-module';
import type { ModuleUpgrade } from '@/domain/models/module/production-module-upgrade';
import { createResource } from '@/domain/models/resources/resource';
import type { ContainerMap } from '@/domain/models/resources/resource-container';
import { err, ok, type Result } from '@/shared/result';
import { isNullOrWhiteSpace } from '@/shared/string-utils';

import type { WeaponModule } from './weapon-module';
import { createWeaponModuleBase } from './weapon-module-base';

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
  readonly weaponKind: 'kinetic';

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
  return m.weaponKind === 'kinetic';
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

  const base = createWeaponModuleBase(id, {
    initialCondition,
    rampRate,
    type,
    maxOutput,
    snapOutputToInteger,
  });

  let loadedAmmoType: AmmoType = initialAmmoType;

  function fire(containerMap: ContainerMap): DamagePacket | undefined {
    const ammoResourceType = AmmoResourceType[loadedAmmoType];
    const ammoContainer = containerMap.get(ammoResourceType);

    if (!ammoContainer || ammoContainer.get(ammoResourceType) < 1) return undefined;

    ammoContainer.destroy(createResource(ammoResourceType, 1));

    return createDamagePacket(damageType, maxOutput, loadedAmmoType);
  }

  return ok({
    id,
    type: base.type,
    name,
    storableType: 'module' as const,
    slotCost: base.slotCost,
    weaponKind: 'kinetic' as const,
    damageType,
    maxOutput,

    get loadedAmmoType() { return loadedAmmoType; },
    get condition() { return base.condition; },
    get upgrades() { return base.upgrades; },
    get throttle() { return base.throttle; },
    get actualThrottle() { return base.actualThrottle; },
    get rampRate() { return base.rampRate; },
    get enabled() { return base.enabled; },

    enable: () => base.enable(),
    disable: () => base.disable(),

    loadAmmo: (ammoType: AmmoType) => { loadedAmmoType = ammoType; },

    addUpgrade: (upgrade: ModuleUpgrade) => base.addUpgrade(upgrade),
    enableUpgrade: (upgradeId: string) => base.enableUpgrade(upgradeId),
    disableUpgrade: (upgradeId: string) => base.disableUpgrade(upgradeId),

    get costMultiplier() { return base.costMultiplier; },

    isOperational: () => base.isOperational(),

    setCondition: (value: number) => base.setCondition(value),
    setThrottle: (value: number) => base.setThrottle(value),
    stepRamp: (deltaTime: number) => base.stepRamp(deltaTime),

    // Kinetic weapons do not charge or consume power — these are intentional no-ops.
    produce: (_deltaTime: number, _containerMap: ContainerMap) => {},
    drain: (_containerMap: ContainerMap) => {},
    reset: () => {},

    fire,
  });
}
