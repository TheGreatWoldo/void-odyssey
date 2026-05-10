import type { Resource, ResourceType } from '@/domain/models/resources/resource';
import type { ContainerMap } from '@/domain/models/resources/resource-container';
import { createResourceContainer } from '@/domain/models/resources/resource-container';
import type { Recipe } from './recipe';

export const ProductionState = {
  Idle: 'idle',
  Partial: 'partial',
  Active: 'active',
} as const;

export type ProductionState = (typeof ProductionState)[keyof typeof ProductionState];

/**
 * Aggregate Root for a single production process.
 *
 * Encapsulates a Recipe's execution cycle and its output accumulator.
 * External code interacts only through this interface — the internal
 * ResourceContainer (output buffer) is a private implementation detail.
 *
 * Invariant: outputs are only committed after drain() is called. Never read
 * or write the output buffer mid-tick; doing so breaks resource conservation.
 *
 * Runs a Recipe each tick: pulls inputs from pre-resolved source containers,
 * consumes them, and accumulates outputs.
 * Call drain() to push accumulated outputs into pre-resolved target containers.
 * Sources and targets are resolved once at module install time — not on every tick.
 *
 * Power is excluded from the consume loop — it is filtered out of
 * `nonPowerCosts` at recipe creation time and never appears in source lookups.
 */
export interface Producer {
  readonly id: string;
  readonly recipe: Recipe;
  readonly state: ProductionState;
  /** 0 = idle, 0–1 = partial, 1 = fully active. Updated each produce() call. */
  readonly lastFraction: number;
  getStock(id: ResourceType): number;
  /**
   * Runs one tick of production.
   * @param effectiveThrottle — ramped throttle in [0, 1].
   * @param upgradeCostMult   — cost multiplier from installed upgrades (default 1).
   * @param maxOutput         — module's rated ceiling for its primary output.
   */
  produce(
    deltaTime: number,
    sources: ContainerMap,
    effectiveThrottle: number,
    upgradeCostMult?: number,
    maxOutput?: number
  ): void;
  drain(targets: ContainerMap): void;
  /** Resets state to Idle without consuming any inputs. Called for disabled modules. */
  reset(): void;
}

export function createProducer(id: string, recipe: Recipe): Producer {
  // Output-only accumulator. Inputs are consumed directly from sources — never staged here.
  const storage = createResourceContainer();
  let currentState: ProductionState = ProductionState.Idle;
  let currentFraction = 0;

  // Pre-allocated mutable buffers reused every tick to avoid per-tick allocations.
  // Indexed against recipe.nonPowerCosts — Power is excluded at recipe creation time.
  const costBuffers = recipe.nonPowerCosts.map(r => ({ id: r.id, amount: 0 } as Resource));
  // Pre-allocated amounts map passed to recipe.calculateFraction — avoids Map construction each tick.
  const amountsBuffer = new Map<ResourceType, number>(recipe.nonPowerCosts.map(r => [r.id, 0]));
  const primaryBuffer: Resource = { id: recipe.primaryOutput, amount: 0 };
  const byproductBuffers = recipe.byproductsPerSecond.map(r => ({ id: r.id, amount: 0 } as Resource));

  function getStock(id: ResourceType): number {
    return storage.get(id);
  }

  // Moves all accumulated outputs from producer storage into the pre-resolved target containers.
  function drain(targets: ContainerMap): void {
    // Drain primary output.
    const primaryStock = storage.get(recipe.primaryOutput);
    if (primaryStock > 0) {
      const target = targets.get(recipe.primaryOutput);
      if (target) {
        primaryBuffer.amount = primaryStock;
        storage.moveTo(primaryBuffer, target);
      }
    }
    // Drain byproducts.
    for (let i = 0; i < recipe.byproductsPerSecond.length; i++) {
      const inStorage = storage.get(recipe.byproductsPerSecond[i].id);
      if (inStorage <= 0) continue;
      const target = targets.get(recipe.byproductsPerSecond[i].id);
      if (!target) continue;
      byproductBuffers[i].amount = inStorage;
      storage.moveTo(byproductBuffers[i], target);
    }
  }

  function reset(): void {
    currentState = ProductionState.Idle;
    currentFraction = 0;
  }

  function produce(
    deltaTime: number,
    sources: ContainerMap,
    effectiveThrottle: number,
    upgradeCostMult = 1,
    maxOutput = 0
  ): void {
    const combinedCostMult = upgradeCostMult * effectiveThrottle;

    // Populate amounts buffer from live container values for the recipe check.
    for (const r of recipe.nonPowerCosts) {
      amountsBuffer.set(r.id, sources.get(r.id)?.get(r.id) ?? 0);
    }
    const fraction = recipe.calculateFraction(amountsBuffer, deltaTime, combinedCostMult);

    if (fraction <= 0 || effectiveThrottle <= 0) {
      currentState = ProductionState.Idle;
      currentFraction = 0;
      return;
    }

    const nonPowerCosts = recipe.nonPowerCosts;

    // Consume all non-Power inputs. Power is excluded at recipe creation time (nonPowerCosts).
    for (let i = 0; i < nonPowerCosts.length; i++) {
      const r = nonPowerCosts[i];
      costBuffers[i].amount = r.amount * upgradeCostMult * effectiveThrottle * deltaTime;
      sources.get(r.id)!.destroy(costBuffers[i]);
    }

    currentFraction = effectiveThrottle;
    currentState = effectiveThrottle >= 1 ? ProductionState.Active : ProductionState.Partial;

    // Produce primary output: module max scaled by effective throttle.
    primaryBuffer.amount = maxOutput * effectiveThrottle * deltaTime;
    storage.add(primaryBuffer);

    // Produce byproducts proportional to effective throttle.
    for (let i = 0; i < recipe.byproductsPerSecond.length; i++) {
      byproductBuffers[i].amount = recipe.byproductsPerSecond[i].amount * effectiveThrottle * deltaTime;
      storage.add(byproductBuffers[i]);
    }
  }

  return {
    id,
    recipe,
    get state() { return currentState; },
    get lastFraction() { return currentFraction; },
    getStock,
    produce,
    drain,
    reset,
  };
}
