import { createProducer } from '@/domain/models/production/producer';
import type { Recipe } from '@/domain/models/production/recipe';
import type { ContainerMap } from '@/domain/models/resources/resource-container';
import type { Storable } from '@/domain/models/storage/storable';
import { validateModuleUpgradeInstall } from '@/domain/services/module-upgrade-validation';
import { err, ok, type Result } from '@/shared/result';
import { isNullOrWhiteSpace } from '@/shared/string-utils';

import type { ModuleId } from './production-module-id';
import { ModuleSlotCosts } from './production-module-id';
import {
    ProductionModuleLifecycleState,
    type ProductionModuleLifecycleState as ProductionModuleLifecycleStateType,
} from './production-module-lifecycle-state';
import {
    UpgradeLifecycleState,
    type ModuleUpgrade,
    type UpgradeLifecycleState as UpgradeLifecycleStateType,
} from './production-module-upgrade';


export interface ProductionModuleOptions {
  /** Initial and maximum condition in [0, 1]. Default: 1. */
  initialCondition?: number;

  /** Rate at which actualThrottle moves toward throttle, in throttle-units per second. Default: Infinity (instant). */
  rampRate?: number;

  /** Stable module type identifier — required. */
  type: ModuleId;

  /**
   * Maximum primary output at full throttle (e.g. 50 velocity units, 20 power/s).
   * The recipe does not encode this — it is a physical property of the module hardware.
   */
  maxOutput?: number;

  /**
   * When true, setThrottle() snaps the requested value to the nearest throttle
   * position that produces an integer steady-state primary output.
   * Only meaningful when maxOutput >= 1. When maxOutput < 1, snapping is silently skipped
   * and the value is clamped to [0, 1] normally.
   */
  snapOutputToInteger?: boolean;

  /** Condition wear per second at full effective throttle. Default: 0 (no passive wear). */
  degradationPerSecond?: number;

  /** Seconds to ramp from 0 to 1 while warming up. Overrides rampRate when ramping up. */
  warmUpSeconds?: number;

  /** Seconds to ramp from 1 to 0 while cooling down. Overrides rampRate when ramping down. */
  coolDownSeconds?: number;
}

export interface ProductionModule extends Storable {
  readonly id: string;

  /** Stable module type — invariant across instances (e.g. ModuleId.ReactorCore for all reactor cores). */
  readonly type: ModuleId;

  readonly name: string;
  readonly condition: number;
  readonly lifecycleState: ProductionModuleLifecycleStateType;
  readonly ageSeconds: number;
  readonly upgrades: readonly ModuleUpgrade[];

  /** Player-controlled target throttle in [0, 1]. */
  readonly throttle: number;

  /**
   * Current effective throttle in [0, 1], ramping toward `throttle` at `rampRate` units/second.
   * Reflects the actual production rate this tick.
   */
  readonly actualThrottle: number;

  /** Rate at which actualThrottle moves toward throttle, in throttle-units per second. Infinity = instant. */
  readonly rampRate: number;

  /** Whether the player has this module switched on. Instant-off override. */
  readonly enabled: boolean;

  enable(): void;
  disable(): void;

  /**
   * Maximum primary output at full throttle. This is a hardware property of the module —
   * the recipe and upgrades determine the power cost to reach any value in [0, maxOutput].
   * Zero for battery modules.
   */
  readonly maxOutput: number;

  /** Base power cost at full throttle before upgrades and throttle scaling. */
  readonly powerCostPerSecond: number;

  addUpgrade(upgrade: ModuleUpgrade): Result<void, string>;
  startUpgradeInstall(upgrade: ModuleUpgrade): Result<void, string>;
  completeUpgradeInstall(upgradeId: string): Result<void, string>;
  enableUpgrade(upgradeId: string): Result<void, string>;
  disableUpgrade(upgradeId: string): Result<void, string>;
  setCondition(value: number): Result<void, string>;

  readonly costMultiplier: number;

  /**
   * Returns true when the module is enabled and condition > 0.
   * Does not check throttle — a module at throttle 0 is still operational.
    * Callers should check this before invoking produce().
    *
    * Contract rationale:
    * - "operational" models capability-to-run, not current output.
    * - throttle=0 is an intentional idle state, not a failure state.
    * - condition<=0 is terminal for production until externally repaired.
   */
  isOperational(): boolean;

  setThrottle(value: number): void;

  /** Advances actualThrottle toward throttle by rampRate * deltaTime. */
  stepRamp(deltaTime: number): void;

  /** Runs one production tick, consuming inputs and accumulating output. Uses actualThrottle, internal multipliers, and maxOutput. */
  produce(deltaTime: number, sources: ContainerMap): void;

  /** Moves all accumulated output into the target containers. */
  drain(targets: ContainerMap): void;

  /** Resets production state to Idle without touching accumulated stock. */
  reset(): void;
}

export function createProductionModule(
  id: string,
  name: string,
  recipe: Recipe,
  options: ProductionModuleOptions
): Result<ProductionModule, string> {
  const {
    initialCondition = 1,
    rampRate = Infinity,
    type,
    maxOutput = 0,
    snapOutputToInteger = false,
    degradationPerSecond = 0,
    warmUpSeconds = 0,
    coolDownSeconds = 0,
  } = options;

  if (isNullOrWhiteSpace(id))
    return err('ProductionModule id must be a non-empty string');

  if (isNullOrWhiteSpace(name))
    return err('ProductionModule name must be a non-empty string');

  if (initialCondition < 0 || initialCondition > 1)
    return err(`ProductionModule condition must be in [0, 1], got ${initialCondition}`);

  if (rampRate < 0)
    return err(`ProductionModule rampRate must be >= 0, got ${rampRate}`);

  if (degradationPerSecond < 0)
    return err(`ProductionModule degradationPerSecond must be >= 0, got ${degradationPerSecond}`);

  if (warmUpSeconds < 0)
    return err(`ProductionModule warmUpSeconds must be >= 0, got ${warmUpSeconds}`);

  if (coolDownSeconds < 0)
    return err(`ProductionModule coolDownSeconds must be >= 0, got ${coolDownSeconds}`);

  type MutableModuleUpgrade =
    Omit<{ -readonly [K in keyof ModuleUpgrade]: ModuleUpgrade[K] }, 'lifecycleState'> & {
    lifecycleState: UpgradeLifecycleStateType;
  };

  const upgradeMap = new Map<string, MutableModuleUpgrade>();
  const outputTypes = new Set<string>([
    recipe.primaryOutput,
    ...recipe.byproductsPerSecond.map((g) => g.id),
  ]);

  let cachedCostMultiplier = 1;
  let cachedUpgrades: readonly ModuleUpgrade[] = [];
  let condition = initialCondition;
  let lifecycleState: ProductionModuleLifecycleStateType =
    initialCondition > 0 ? ProductionModuleLifecycleState.Active : ProductionModuleLifecycleState.Failed;
  let ageSeconds = 0;
  let throttle = 1;
  let actualThrottle = 1;
  let enabled = true;

  function normalizeUpgrade(upgrade: ModuleUpgrade): MutableModuleUpgrade {
    const resolvedLifecycle = upgrade.lifecycleState
      ?? (upgrade.enabled ? UpgradeLifecycleState.Active : UpgradeLifecycleState.Installed);

    return {
      ...upgrade,
      lifecycleState: resolvedLifecycle,
      enabled: resolvedLifecycle === UpgradeLifecycleState.Active,
    };
  }

  function validateUpgradeTarget(upgrade: ModuleUpgrade): Result<void, string> {
    return validateModuleUpgradeInstall(
      {
        moduleId: id,
        moduleType: type,
        producedResourceTypes: Array.from(outputTypes),
        existingUpgrades: Array.from(upgradeMap.values()).map(existing => ({
          id: existing.id,
          type: existing.type,
          targetResourceType: existing.targetResourceType,
        })),
      },
      upgrade
    );
  }

  function addUpgrade(upgrade: ModuleUpgrade): Result<void, string> {
    const validation = validateUpgradeTarget(upgrade);
    if (!validation.ok) return validation;

    const normalized = normalizeUpgrade(upgrade);
    if (normalized.lifecycleState === UpgradeLifecycleState.Installing) {
      normalized.lifecycleState = UpgradeLifecycleState.Installed;
      normalized.enabled = false;
    }

    upgradeMap.set(upgrade.id, normalized);
    recomputeCache();

    return ok(undefined);
  }

  function startUpgradeInstall(upgrade: ModuleUpgrade): Result<void, string> {
    const validation = validateUpgradeTarget(upgrade);
    if (!validation.ok) return validation;

    const installing: MutableModuleUpgrade = {
      ...upgrade,
      lifecycleState: UpgradeLifecycleState.Installing,
      enabled: false,
    };

    upgradeMap.set(upgrade.id, installing);
    recomputeCache();

    return ok(undefined);
  }

  function completeUpgradeInstall(upgradeId: string): Result<void, string> {
    const upgrade = upgradeMap.get(upgradeId);

    if (!upgrade) return err(`Upgrade '${upgradeId}' not found on module '${id}'`);
    if (upgrade.lifecycleState !== UpgradeLifecycleState.Installing) {
      return err(`Upgrade '${upgradeId}' is not installing`);
    }

    upgrade.lifecycleState = UpgradeLifecycleState.Installed;
    upgrade.enabled = false;
    recomputeCache();

    return ok(undefined);
  }

  function enableUpgrade(upgradeId: string): Result<void, string> {
    const upgrade = upgradeMap.get(upgradeId);

    if (!upgrade) return err(`Upgrade '${upgradeId}' not found on module '${id}'`);

    if (upgrade.lifecycleState === UpgradeLifecycleState.Installing) {
      return err(`Upgrade '${upgradeId}' is still installing`);
    }

    upgrade.enabled = true;
    upgrade.lifecycleState = UpgradeLifecycleState.Active;
    recomputeCache();

    return ok(undefined);
  }

  function disableUpgrade(upgradeId: string): Result<void, string> {
    const upgrade = upgradeMap.get(upgradeId);

    if (!upgrade) return err(`Upgrade '${upgradeId}' not found on module '${id}'`);

    upgrade.enabled = false;
    upgrade.lifecycleState = UpgradeLifecycleState.Disabled;
    recomputeCache();

    return ok(undefined);
  }

  function recomputeCache(): void {
    cachedUpgrades = [...upgradeMap.values()];
    let cost = 1;
    for (const u of upgradeMap.values()) {
      if (!u.enabled || u.lifecycleState !== UpgradeLifecycleState.Active) continue;
      cost += u.costFactor - 1;
    }
    // Clamp to 0: additive stacking can drive the multiplier negative when
    // multiple large-discount upgrades combine (e.g. 0.3 + 0.3 → 1 - 0.7 - 0.7 = -0.4).
    cachedCostMultiplier = Math.max(0, cost);
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
      return err(`ProductionModule condition must be in [0, 1], got ${value}`);

    condition = value;

    return ok(undefined);
  }

  function enable(): void {
    if (condition <= 0) {
      lifecycleState = ProductionModuleLifecycleState.Failed;
      return;
    }

    enabled = true;
  }

  function disable(): void {
    enabled = false;
  }

  function computeRampRate(isWarmingUp: boolean): number {
    if (isWarmingUp && warmUpSeconds > 0) {
      return 1 / warmUpSeconds;
    }

    if (!isWarmingUp && coolDownSeconds > 0) {
      return 1 / coolDownSeconds;
    }

    return rampRate;
  }

  function stepRamp(deltaTime: number): void {
    ageSeconds += Math.max(0, deltaTime);

    const targetThrottle = enabled ? throttle : 0;
    const isWarmingUp = actualThrottle < targetThrottle;
    const effectiveRampRate = computeRampRate(isWarmingUp);

    if (effectiveRampRate === Infinity) {
      actualThrottle = targetThrottle;
    } else {
      const step = effectiveRampRate * deltaTime;

      if (actualThrottle < targetThrottle) {
        actualThrottle = Math.min(targetThrottle, actualThrottle + step);
      } else if (actualThrottle > targetThrottle) {
        actualThrottle = Math.max(targetThrottle, actualThrottle - step);
      }
    }

    // Invariant: passive wear is applied only while the module is effectively under load.
    // Reason: avoids degrading offline inventory modules and keeps wear proportional to
    // actual utilization rather than requested throttle alone.
    if (enabled && actualThrottle > 0 && degradationPerSecond > 0 && condition > 0) {
      condition = Math.max(0, condition - degradationPerSecond * actualThrottle * deltaTime);
      if (condition === 0) {
        enabled = false;
        throttle = 0;
      }
    }

    if (condition <= 0) {
      lifecycleState = ProductionModuleLifecycleState.Failed;
    } else if (!enabled && actualThrottle <= 0) {
      lifecycleState = ProductionModuleLifecycleState.Offline;
    } else if (actualThrottle < targetThrottle) {
      lifecycleState = ProductionModuleLifecycleState.WarmingUp;
    } else if (actualThrottle > targetThrottle) {
      lifecycleState = ProductionModuleLifecycleState.CoolingDown;
    } else if (enabled && actualThrottle > 0) {
      lifecycleState = ProductionModuleLifecycleState.Active;
    } else {
      lifecycleState = ProductionModuleLifecycleState.Offline;
    }
  }

  const producer = createProducer(id, recipe);

  return ok({
    id,
    type,
    name,
    storableType: 'module' as const,
    slotCost: ModuleSlotCosts[type],

    get condition() { return condition; },
    get lifecycleState() { return lifecycleState; },
    get ageSeconds() { return ageSeconds; },

    get upgrades() { return cachedUpgrades; },

    maxOutput,
    powerCostPerSecond: recipe.powerCostPerSecond,

    get throttle() { return throttle; },
    get actualThrottle() { return actualThrottle; },
    get rampRate() { return rampRate; },
    get enabled() { return enabled; },

    addUpgrade,
    startUpgradeInstall,
    completeUpgradeInstall,
    enableUpgrade,
    disableUpgrade,

    get costMultiplier() { return cachedCostMultiplier; },

    isOperational: () => condition > 0 && enabled,

    setCondition,
    setThrottle,
    enable,
    disable,
    stepRamp,

    produce: (deltaTime, sources) => {
      if (!enabled || condition <= 0) return;
      producer.produce(deltaTime, sources, actualThrottle, cachedCostMultiplier, maxOutput);
    },

    drain: (targets) => producer.drain(targets),
    reset: () => producer.reset(),
  });
}
