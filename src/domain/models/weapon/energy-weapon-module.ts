import type { DamagePacket, DamageType } from '@/domain/models/combat/damage';
import { createDamagePacket } from '@/domain/models/combat/damage';
import type { ProductionModuleOptions } from '@/domain/models/module/production-module';
import type { ModuleUpgrade } from '@/domain/models/module/production-module-upgrade';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import type { ContainerMap } from '@/domain/models/resources/resource-container';
import { err, ok, type Result } from '@/shared/result';
import { isNullOrWhiteSpace } from '@/shared/string-utils';

import type { WeaponModule } from './weapon-module';
import { createWeaponModuleBase } from './weapon-module-base';

/**
 * Options for creating an energy weapon module.
 * Energy weapons charge over time by consuming power, then fire when fully charged.
 * They do not use ammo.
 */
export interface EnergyWeaponModuleOptions extends ProductionModuleOptions {
  /** The elemental nature of the damage produced when this weapon fires. */
  damageType: DamageType;

  /** Seconds to reach full charge from 0 at actualThrottle = 1. Must be > 0. */
  chargeTime: number;

  /** Power consumed per second at full throttle while charging. Must be >= 0. */
  powerCostPerSecond: number;
}

/**
 * A weapon module that charges over time using power and fires as a triggered burst.
 * `produce()` advances chargeProgress and consumes power.
 * `fire()` returns a DamagePacket when fully charged, resetting chargeProgress to 0.
 */
export interface EnergyWeaponModule extends WeaponModule {
  readonly weaponKind: 'energy';

  /** Charge level in [0, 1]. 1 = fully charged and ready to fire. */
  readonly chargeProgress: number;

  /** Seconds to reach full charge from 0 at actualThrottle = 1. */
  readonly chargeTime: number;

  /** Power consumed per second at full throttle. */
  readonly powerCostPerSecond: number;

  /** Returns true when chargeProgress >= 1 — weapon is ready to fire. */
  isCharged(): boolean;
}

/**
 * Returns true when `m` is an EnergyWeaponModule.
 */
export function isEnergyWeaponModule(m: WeaponModule): m is EnergyWeaponModule {
  return m.weaponKind === 'energy';
}

export function createEnergyWeaponModule(
  id: string,
  name: string,
  options: EnergyWeaponModuleOptions
): Result<EnergyWeaponModule, string> {
  const {
    initialCondition = 1,
    rampRate = Infinity,
    type,
    maxOutput = 0,
    snapOutputToInteger = false,
    chargeTime,
    powerCostPerSecond,
    damageType,
  } = options;

  if (isNullOrWhiteSpace(id))
    return err('EnergyWeaponModule id must be a non-empty string');

  if (isNullOrWhiteSpace(name))
    return err('EnergyWeaponModule name must be a non-empty string');

  if (initialCondition < 0 || initialCondition > 1)
    return err(`EnergyWeaponModule condition must be in [0, 1], got ${initialCondition}`);

  if (rampRate < 0)
    return err(`EnergyWeaponModule rampRate must be >= 0, got ${rampRate}`);

  if (chargeTime <= 0)
    return err(`EnergyWeaponModule chargeTime must be > 0, got ${chargeTime}`);

  if (powerCostPerSecond < 0)
    return err(`EnergyWeaponModule powerCostPerSecond must be >= 0, got ${powerCostPerSecond}`);

  const base = createWeaponModuleBase(id, {
    initialCondition,
    rampRate,
    type,
    maxOutput,
    snapOutputToInteger,
  });

  let chargeProgress = 0;

  function isCharged(): boolean {
    return chargeProgress >= 1;
  }

  function produce(deltaTime: number, containerMap: ContainerMap): void {
    chargeProgress = Math.min(1, chargeProgress + (base.actualThrottle * deltaTime) / chargeTime);

    if (powerCostPerSecond > 0) {
      const powerCost = powerCostPerSecond * base.actualThrottle * deltaTime;
      const powerContainer = containerMap.get(ResourceType.Power);
      if (powerContainer) {
        powerContainer.destroy(createResource(ResourceType.Power, powerCost));
      }
    }
  }

  function drain(_containerMap: ContainerMap): void {
    // Energy weapons do not produce resources — no drain needed.
  }

  function reset(): void {
    chargeProgress = 0;
  }

  function fire(_containerMap: ContainerMap): DamagePacket | undefined {
    if (!isCharged()) return undefined;
    chargeProgress = 0;
    return createDamagePacket(damageType, maxOutput);
  }

  return ok({
    id,
    type: base.type,
    name,
    storableType: 'module' as const,
    slotCost: base.slotCost,
    weaponKind: 'energy' as const,
    damageType,
    chargeTime,
    powerCostPerSecond,
    maxOutput,

    get condition() { return base.condition; },
    get chargeProgress() { return chargeProgress; },
    get upgrades() { return base.upgrades; },
    get throttle() { return base.throttle; },
    get actualThrottle() { return base.actualThrottle; },
    get rampRate() { return base.rampRate; },
    get enabled() { return base.enabled; },

    enable: () => base.enable(),
    disable: () => base.disable(),

    addUpgrade: (upgrade: ModuleUpgrade) => base.addUpgrade(upgrade),
    enableUpgrade: (upgradeId: string) => base.enableUpgrade(upgradeId),
    disableUpgrade: (upgradeId: string) => base.disableUpgrade(upgradeId),

    get costMultiplier() { return base.costMultiplier; },

    isOperational: () => base.isOperational(),
    isCharged,

    setCondition: (value: number) => base.setCondition(value),
    setThrottle: (value: number) => base.setThrottle(value),
    stepRamp: (deltaTime: number) => base.stepRamp(deltaTime),
    produce,
    drain,
    reset,
    fire,
  });
}
