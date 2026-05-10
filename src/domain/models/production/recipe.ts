import type { Resource, ResourceType } from '@/domain/models/resources/resource';

/**
 * Defines a continuous production process.
 *
 * - `primaryOutput` — the resource type this module is rated for. The module itself
 *   sets the maximum quantity (via `maxOutput`); the recipe does not encode an amount
 *   for the primary output.
 * - `costsPerSecond` — inputs consumed at full throttle (including Power).
 *   Upgrades apply `costMultiplier` to scale these down.
 * - `byproductsPerSecond` — collateral outputs that scale proportionally with
 *   effective throttle. They have no cap — they are side effects of the primary process.
 */
export interface Recipe {
  name: string;
  primaryOutput: ResourceType;
  byproductsPerSecond: Resource[];
  /**
   * Non-power input costs, pre-filtered at creation time.
   * These are binary gates — if any is insufficient the fraction is 0.
   * Use this in hot paths instead of iterating costsPerSecond with a Power check.
   */
  readonly nonPowerCosts: readonly Resource[];
  /**
   * Total power drawn per second at throttle 1, cost multiplier 1.
   * Zero when the recipe has no Power cost.
   */
  readonly powerCostPerSecond: number;
  /**
   * Returns true when all non-Power inputs are fully available AND power fraction > 0.
   */
  canExecute(
    amounts: ReadonlyMap<ResourceType, number>,
    deltaTime: number,
    costMultiplier: number
  ): boolean;
  /**
   * Returns the effective production fraction in [0, 1] for this tick.
   *
   * Non-power inputs act as a binary gate — if any is insufficient the result is 0.
   * Power is the fractional dimension: `min(1, availablePower / powerNeeded)`.
   * When the recipe has no power cost, the power fraction is always 1.
   *
   * `amounts` must contain entries for every resource type used by the recipe,
   * including ResourceType.Power when powerCostPerSecond > 0.
   */
  calculateFraction(
    amounts: ReadonlyMap<ResourceType, number>,
    deltaTime: number,
    costMultiplier: number
  ): number;
}

export interface RecipeData {
  name: string;
  primaryOutput: ResourceType;
  costsPerSecond: Resource[];
  byproductsPerSecond?: Resource[];
}

/** Creates a Recipe with production-logic behaviour methods. */
export function createRecipe(data: RecipeData): Recipe {
  // Pre-filter at creation time so hot-path loops never need to check for Power.
  const nonPowerCosts = data.costsPerSecond.filter(r => r.id !== 'Power');
  const powerCostPerSecond = data.costsPerSecond.find(r => r.id === 'Power')?.amount ?? 0;

  function calculateFraction(
    amounts: ReadonlyMap<ResourceType, number>,
    deltaTime: number,
    costMultiplier: number
  ): number {
    // Non-power inputs are a binary gate.
    for (const r of nonPowerCosts) {
      const needed = r.amount * costMultiplier * deltaTime;
      const available = amounts.get(r.id) ?? 0;
      if (available < needed) return 0;
    }

    // Power is the fractional dimension.
    if (powerCostPerSecond <= 0) return 1;

    const powerNeeded = powerCostPerSecond * costMultiplier * deltaTime;
    const powerAvailable = amounts.get('Power' as ResourceType) ?? 0;

    return Math.min(1, powerAvailable / powerNeeded);
  }

  function canExecute(
    amounts: ReadonlyMap<ResourceType, number>,
    deltaTime: number,
    costMultiplier: number
  ): boolean {
    return calculateFraction(amounts, deltaTime, costMultiplier) > 0;
  }

  return {
    name: data.name,
    primaryOutput: data.primaryOutput,
    byproductsPerSecond: data.byproductsPerSecond ?? [],
    nonPowerCosts,
    powerCostPerSecond,
    canExecute,
    calculateFraction,
  };
}
