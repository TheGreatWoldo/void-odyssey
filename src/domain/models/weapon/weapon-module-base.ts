import type { ModuleId } from '@/domain/models/module/production-module-id';
import { ModuleSlotCosts } from '@/domain/models/module/production-module-id';
import type { ModuleUpgrade } from '@/domain/models/module/production-module-upgrade';
import { validateModuleUpgradeInstall } from '@/domain/services/module-upgrade-validation';
import { err, ok, type Result } from '@/shared/result';

export interface WeaponModuleBaseOptions {
  initialCondition?: number;
  rampRate?: number;
  type: ModuleId;
  maxOutput?: number;
  snapOutputToInteger?: boolean;
}

/**
 * Shared state and behaviour composed into every weapon module.
 * Handles upgrades, condition, throttle, and ramp — everything that
 * EnergyWeaponModule and KineticWeaponModule would otherwise duplicate.
 *
 * Internal composable — not part of the public domain interface.
 * Created after all factory-level validation has already passed.
 */
export interface WeaponModuleBase {
  readonly type: ModuleId;
  readonly slotCost: number;
  readonly maxOutput: number;
  readonly snapOutputToInteger: boolean;
  readonly rampRate: number;

  readonly condition: number;
  readonly throttle: number;
  readonly actualThrottle: number;
  readonly enabled: boolean;
  readonly costMultiplier: number;
  readonly upgrades: readonly ModuleUpgrade[];

  enable(): void;
  disable(): void;
  isOperational(): boolean;

  setThrottle(value: number): void;
  stepRamp(deltaTime: number): void;
  setCondition(value: number): Result<void, string>;
  addUpgrade(upgrade: ModuleUpgrade): Result<void, string>;
  enableUpgrade(upgradeId: string): Result<void, string>;
  disableUpgrade(upgradeId: string): Result<void, string>;
}

/**
 * Creates the shared weapon module base. Called by createEnergyWeaponModule
 * and createKineticWeaponModule after all argument validation has passed.
 */
export function createWeaponModuleBase(
  id: string,
  options: WeaponModuleBaseOptions
): WeaponModuleBase {

  const {
    initialCondition = 1,
    rampRate = Infinity,
    type,
    maxOutput = 0,
    snapOutputToInteger = false,
  } = options;

  type MutableModuleUpgrade = { -readonly [K in keyof ModuleUpgrade]: ModuleUpgrade[K] };

  const upgradeMap = new Map<string, MutableModuleUpgrade>();

  let cachedCostMultiplier: number | null = null;
  let cachedUpgrades: readonly ModuleUpgrade[] | null = null;
  let condition = initialCondition;
  let throttle = 1;
  let actualThrottle = 1;
  let enabled = true;

  function addUpgrade(upgrade: ModuleUpgrade): Result<void, string> {
    const validation = validateModuleUpgradeInstall(
      {
        moduleId: id,
        moduleType: type,
        producedResourceTypes: [],
        existingUpgrades: Array.from(upgradeMap.values()).map(existing => ({
          id: existing.id,
          type: existing.type,
          targetResourceType: existing.targetResourceType,
        })),
        validateTargetResourceType: false,
      },
      upgrade
    );

    if (!validation.ok) return validation;

    upgradeMap.set(upgrade.id, { ...upgrade });
    cachedCostMultiplier = null;
    cachedUpgrades = null;

    return ok(undefined);
  }

  function enableUpgrade(upgradeId: string): Result<void, string> {
    const upgrade = upgradeMap.get(upgradeId);

    if (!upgrade) return err(`Upgrade '${upgradeId}' not found on module '${id}'`);

    upgrade.enabled = true;
    cachedCostMultiplier = null;
    cachedUpgrades = null;

    return ok(undefined);
  }

  function disableUpgrade(upgradeId: string): Result<void, string> {
    const upgrade = upgradeMap.get(upgradeId);

    if (!upgrade) return err(`Upgrade '${upgradeId}' not found on module '${id}'`);

    upgrade.enabled = false;
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
      return err(`WeaponModule condition must be in [0, 1], got ${value}`);

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

  return {
    type,
    slotCost: ModuleSlotCosts[type],
    maxOutput,
    snapOutputToInteger,
    rampRate,

    get condition() { return condition; },
    get throttle() { return throttle; },
    get actualThrottle() { return actualThrottle; },
    get enabled() { return enabled; },

    get upgrades() {
      if (!cachedUpgrades) cachedUpgrades = [...upgradeMap.values()] as readonly ModuleUpgrade[];
      return cachedUpgrades;
    },

    get costMultiplier() { return computeCostMultiplier(); },

    enable: () => { enabled = true; },
    disable: () => { enabled = false; },

    isOperational: () => condition > 0 && enabled,

    addUpgrade,
    enableUpgrade,
    disableUpgrade,
    setThrottle,
    setCondition,
    stepRamp,
  };
}
