import type { Resource, ResourceType } from '@/domain/models/resources/resource';
import { StatType } from '@/domain/models/resources/resource';

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
   * Use this in hot paths instead of iterating costsPerSecond with a Power check.
   */
  readonly nonPowerCosts: readonly Resource[];
  /**
   * Total power drawn per second at throttle 1, cost multiplier 1.
   * Zero when the recipe has no Power cost.
   */
  readonly powerCostPerSecond: number;
  /**
   * Returns true when all non-Power inputs are fully available.
   * Power is excluded — it is managed by the ship's grid before produce() is called.
   */
  canExecute(
    amounts: ReadonlyMap<ResourceType, number>,
    deltaTime: number,
    costMultiplier: number
  ): boolean;
  /**
   * Returns 1 if all non-Power inputs are available, 0 otherwise.
   * Power is excluded from this check — it is debited by the ship grid before produce() runs.
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
  const nonPowerCosts = data.costsPerSecond.filter(r => r.id !== StatType.Power);
  const powerCostPerSecond = data.costsPerSecond.find(r => r.id === StatType.Power)?.amount ?? 0;

  function calculateFraction(
    amounts: ReadonlyMap<ResourceType, number>,
    deltaTime: number,
    costMultiplier: number
  ): number {
    // Power is excluded — it is debited by the ship grid before produce() runs.
    for (const r of nonPowerCosts) {
      const needed = r.amount * costMultiplier * deltaTime;
      const available = amounts.get(r.id) ?? 0;
      if (available < needed) return 0;
    }
    return 1;
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
