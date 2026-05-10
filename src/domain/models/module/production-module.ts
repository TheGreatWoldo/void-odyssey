import { createProducer } from '@/domain/models/production/producer';
import type { Recipe } from '@/domain/models/production/recipe';
import type { ContainerMap } from '@/domain/models/resources/resource-container';
import type { Storable } from '@/domain/models/storage/storable';
import { err, ok, type Result } from '@/shared/result';
import { isNullOrWhiteSpace } from '@/shared/string-utils';

import type { ModuleId } from './production-module-id';
import { ModuleSlotCosts } from './production-module-id';
import type { ModuleUpgrade } from './production-module-upgrade';


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
}

export interface ProductionModule extends Storable {
  readonly id: string;

  /** Stable module type — invariant across instances (e.g. ModuleId.ReactorCore for all reactor cores). */
  readonly type: ModuleId;

  readonly name: string;
  readonly condition: number;
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

  addUpgrade(upgrade: ModuleUpgrade): Result<void, string>;
  setUpgradeEnabled(upgradeId: string, enabled: boolean): Result<void, string>;
  setCondition(value: number): Result<void, string>;

  readonly costMultiplier: number;

  /**
   * Returns true when the module is enabled and condition > 0.
   * Does not check throttle — a module at throttle 0 is still operational.
   * Callers should check this before invoking produce().
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
  } = options;

  if (isNullOrWhiteSpace(id))
    return err('ProductionModule id must be a non-empty string');

  if (isNullOrWhiteSpace(name))
    return err('ProductionModule name must be a non-empty string');

  if (initialCondition < 0 || initialCondition > 1)
    return err(`ProductionModule condition must be in [0, 1], got ${initialCondition}`);

  if (rampRate < 0)
    return err(`ProductionModule rampRate must be >= 0, got ${rampRate}`);

  type MutableModuleUpgrade = { -readonly [K in keyof ModuleUpgrade]: ModuleUpgrade[K] };

  const upgradeMap = new Map<string, MutableModuleUpgrade>();
  const outputTypes = new Set<string>([
    recipe.primaryOutput,
    ...recipe.byproductsPerSecond.map((g) => g.id),
  ]);

  let cachedCostMultiplier: number | null = null;
  let cachedUpgrades: readonly ModuleUpgrade[] | null = null;
  let condition = initialCondition;
  let throttle = 1;
  let actualThrottle = 1;
  let enabled = true;

  function addUpgrade(upgrade: ModuleUpgrade): Result<void, string> {
    if (!outputTypes.has(upgrade.targetResourceType)) {
      return err(
        `Upgrade '${upgrade.id}' targets '${upgrade.targetResourceType}' but module '${id}' does not produce it`
      );
    }

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

    // Clamp to 0: additive stacking can drive the multiplier negative when
    // multiple large-discount upgrades combine (e.g. 0.3 + 0.3 → 1 - 0.7 - 0.7 = -0.4).
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
      return err(`ProductionModule condition must be in [0, 1], got ${value}`);

    condition = value;

    return ok(undefined);
  }

  function enable(): void {
    enabled = true;
  }

  function disable(): void {
    enabled = false;
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

  const producer = createProducer(id, recipe);

  return ok({
    id,
    type,
    name,
    storableType: 'module' as const,
    slotCost: ModuleSlotCosts[type],

    get condition() { return condition; },

    get upgrades() {
      if (!cachedUpgrades) cachedUpgrades = [...upgradeMap.values()] as readonly ModuleUpgrade[];
      return cachedUpgrades;
    },

    maxOutput,

    get throttle() { return throttle; },
    get actualThrottle() { return actualThrottle; },
    get rampRate() { return rampRate; },
    get enabled() { return enabled; },

    addUpgrade,
    setUpgradeEnabled,

    get costMultiplier() { return computeCostMultiplier(); },

    isOperational: () => condition > 0 && enabled,

    setCondition,
    setThrottle,
    enable,
    disable,
    stepRamp,

    produce: (deltaTime, sources) => {
      if (!enabled || condition <= 0) return;
      producer.produce(deltaTime, sources, actualThrottle, computeCostMultiplier(), maxOutput);
    },

    drain: (targets) => producer.drain(targets),
    reset: () => producer.reset(),
  });
}
