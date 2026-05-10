import type { DamagePacket, DamageType } from '@/domain/models/combat/damage';
import { createDamagePacket } from '@/domain/models/combat/damage';
import type { ProductionModuleOptions } from '@/domain/models/module/production-module';
import type { ModuleId } from '@/domain/models/module/production-module-id';
import { ModuleSlotCosts } from '@/domain/models/module/production-module-id';
import type { ModuleUpgrade } from '@/domain/models/module/production-module-upgrade';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import type { ContainerMap } from '@/domain/models/resources/resource-container';
import { err, ok, type Result } from '@/shared/result';
import { isNullOrWhiteSpace } from '@/shared/string-utils';

import type { WeaponModule } from './weapon-module';

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
  return 'chargeProgress' in m;
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

  // --- Mutable state ---

  type MutableModuleUpgrade = { -readonly [K in keyof ModuleUpgrade]: ModuleUpgrade[K] };

  const upgradeMap = new Map<string, MutableModuleUpgrade>();

  let cachedCostMultiplier: number | null = null;
  let cachedUpgrades: readonly ModuleUpgrade[] | null = null;
  let condition = initialCondition;
  let throttle = 1;
  let actualThrottle = 1;
  let enabled = true;
  let chargeProgress = 0;

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
      return err(`EnergyWeaponModule condition must be in [0, 1], got ${value}`);
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

  function isCharged(): boolean {
    return chargeProgress >= 1;
  }

  function produce(deltaTime: number, containerMap: ContainerMap): void {
    chargeProgress = Math.min(1, chargeProgress + (actualThrottle * deltaTime) / chargeTime);

    if (powerCostPerSecond > 0) {
      const powerCost = powerCostPerSecond * actualThrottle * deltaTime;
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
    type,
    name,
    storableType: 'module' as const,
    slotCost: ModuleSlotCosts[type as ModuleId],
    damageType,
    chargeTime,
    powerCostPerSecond,
    maxOutput,

    get condition() { return condition; },
    get chargeProgress() { return chargeProgress; },

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

    addUpgrade,
    setUpgradeEnabled,

    get costMultiplier() { return computeCostMultiplier(); },

    isOperational: () => condition > 0 && enabled,
    isCharged,

    setCondition,
    setThrottle,
    stepRamp,
    produce,
    drain,
    reset,
    fire,
  });
}
