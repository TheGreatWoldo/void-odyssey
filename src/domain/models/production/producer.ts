import { ResourceType } from '@/domain/models/resources/resource';
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
 * Entity — owned and lifecycle-managed by ProductionModule, which is installed
 * into ProductionSystem (the true Aggregate Root).
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
 * Power is the fractional dimension: if the power source is depleted the module
 * runs at a proportionally reduced rate. All non-power inputs and outputs are
 * scaled by the same fraction.
 *
 * Contract rationale:
 * - recipe.nonPowerCosts are binary gates for eligibility at each tick: if any gate
 *   cannot satisfy required input, fraction collapses accordingly.
 * - Power is intentionally treated as the only continuous dimension to model brownout
 *   behavior without introducing partial-consumption semantics for every resource.
 * - The same computed fraction MUST drive both consumption and production in the same tick;
 *   otherwise resource conservation and upgrade math diverge.
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
  // Indexed against recipe.nonPowerCosts — Power is handled separately via powerBuffer.
  const costBuffers = recipe.nonPowerCosts.map(r => ({ id: r.id, amount: 0 }))
  // Pre-allocated amounts map passed to recipe.calculateFraction — includes Power when recipe has a cost.
  const amountsBuffer = new Map<ResourceType, number>([
    ...recipe.nonPowerCosts.map(r => [r.id, 0] as [ResourceType, number]),
    ...(recipe.powerCostPerSecond > 0 ? [[ResourceType.Power, 0] as [ResourceType, number]] : []),
  ]);
  const primaryBuffer: { id: ResourceType; amount: number } = { id: recipe.primaryOutput, amount: 0 };
  const byproductBuffers = recipe.byproductsPerSecond.map(r => ({ id: r.id, amount: 0 }));
  const powerBuffer: { id: ResourceType; amount: number } = { id: ResourceType.Power, amount: 0 };

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

    // Invariant: the source container map is pre-resolved once at installation time.
    // Producer never performs topology/resource routing lookups beyond map key access.
    // Reason: this keeps per-tick work deterministic/O(1) and prevents runtime drift when
    // unrelated containers are added elsewhere in the object graph.

    // Populate amounts buffer from live container values for the recipe check.
    for (const r of recipe.nonPowerCosts) {
      amountsBuffer.set(r.id, sources.get(r.id)?.get(r.id) ?? 0);
    }

    // Include available Power so calculateFraction can compute the power fraction.
    if (recipe.powerCostPerSecond > 0) {
      amountsBuffer.set(ResourceType.Power, sources.get(ResourceType.Power)?.get(ResourceType.Power) ?? 0);
    }

    const fraction = recipe.calculateFraction(amountsBuffer, deltaTime, combinedCostMult);

    if (fraction <= 0 || effectiveThrottle <= 0) {
      currentState = ProductionState.Idle;
      currentFraction = 0;
      return;
    }

    const nonPowerCosts = recipe.nonPowerCosts;

    // Contract: non-power costs are consumed only after fraction is established,
    // and use that exact fraction. This prevents overconsumption when power is scarce.
    for (let i = 0; i < nonPowerCosts.length; i++) {
      const r = nonPowerCosts[i];
      costBuffers[i].amount = r.amount * upgradeCostMult * effectiveThrottle * fraction * deltaTime;
      sources.get(r.id)!.destroy(costBuffers[i]);
    }

    // Consume Power proportional to the fraction actually produced.
    if (recipe.powerCostPerSecond > 0) {
      const powerSource = sources.get(ResourceType.Power);
      if (powerSource) {
        powerBuffer.amount = recipe.powerCostPerSecond * upgradeCostMult * effectiveThrottle * fraction * deltaTime;
        powerSource.destroy(powerBuffer);
      }
    }

    currentFraction = effectiveThrottle * fraction;
    currentState = currentFraction >= 1 ? ProductionState.Active : ProductionState.Partial;

    // Produce primary output scaled by effective throttle × power fraction.
    primaryBuffer.amount = maxOutput * effectiveThrottle * fraction * deltaTime;
    storage.add(primaryBuffer);

    // Produce byproducts proportional to effective throttle × power fraction.
    for (let i = 0; i < recipe.byproductsPerSecond.length; i++) {
      byproductBuffers[i].amount = recipe.byproductsPerSecond[i].amount * effectiveThrottle * fraction * deltaTime;
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
