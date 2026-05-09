import { createProducer } from '@/domain/models/production/producer';
import type { Recipe } from '@/domain/models/production/recipe';
import type { ContainerMap } from '@/domain/models/production/resource-container';
import { isBlank } from '@/shared/string-utils';
import type { ModuleId } from './module-id';
import type { ModuleUpgrade } from './module-upgrade';

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
   * Only meaningful when maxOutput is a whole number.
   */
  snapOutputToInteger?: boolean;
}

export interface ProductionModule {
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
  addUpgrade(upgrade: ModuleUpgrade): void;
  setUpgradeEnabled(upgradeId: string, enabled: boolean): void;
  setCondition(value: number): void;
  readonly costMultiplier: number;
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
): ProductionModule {
  const {
    initialCondition = 1,
    rampRate = Infinity,
    type,
    maxOutput = 0,
    snapOutputToInteger = false,
  } = options;

  if (isBlank(id))
    throw new Error('ProductionModule id must be a non-empty string');

  if (isBlank(name))
    throw new Error('ProductionModule name must be a non-empty string');

  if (initialCondition < 0 || initialCondition > 1)
    throw new Error(`ProductionModule condition must be in [0, 1], got ${initialCondition}`);

  if (isBlank(type))
    throw new Error('ProductionModule type is required');

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

  function addUpgrade(upgrade: ModuleUpgrade): void {
    if (!outputTypes.has(upgrade.targetResourceType)) {
      throw new Error(
        `Upgrade '${upgrade.id}' targets '${upgrade.targetResourceType}' but module '${id}' does not produce it`
      );
    }
    upgradeMap.set(upgrade.id, { ...upgrade });
    cachedCostMultiplier = null;
    cachedUpgrades = null;
  }

  function setUpgradeEnabled(upgradeId: string, upgEnabled: boolean): void {
    const upgrade = upgradeMap.get(upgradeId);
    if (!upgrade) throw new Error(`Upgrade '${upgradeId}' not found on module '${id}'`);
    upgrade.enabled = upgEnabled;
    cachedCostMultiplier = null;
    cachedUpgrades = null;
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

  function setCondition(value: number): void {
    if (value < 0 || value > 1)
      throw new Error(`ProductionModule condition must be in [0, 1], got ${value}`);
    condition = value;
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

  return {
    id,
    type,
    name,
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
    produce: (deltaTime, sources) =>
      producer.produce(deltaTime, sources, actualThrottle, computeCostMultiplier(), maxOutput),
    drain: (targets) => producer.drain(targets),
    reset: () => producer.reset(),
  };
}
