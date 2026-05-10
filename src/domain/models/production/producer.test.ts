import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { createResourceContainer } from '@/domain/models/resources/resource-container';
import { describe, expect, it } from 'vitest';
import { createProducer, ProductionState } from './producer';
import { createRecipe } from './recipe';

const fuelToVelocityRecipe = createRecipe({
  name: 'Test',
  primaryOutput: ResourceType.Power,
  costsPerSecond: [createResource(ResourceType.Fuel, 2)],
});

const powerToOxygenRecipe = createRecipe({
  name: 'PowerConsumer',
  primaryOutput: ResourceType.Oxygen,
  costsPerSecond: [createResource(ResourceType.Power, 4)],
});

function makeFuelSource(amount: number) {
  const c = createResourceContainer({ capacity: amount * 10 });
  c.add(createResource(ResourceType.Fuel, amount));
  return new Map<ResourceType, ReturnType<typeof createResourceContainer>>([
    [ResourceType.Fuel, c],
  ]);
}

function makeTarget(id: ResourceType, capacity = 1000) {
  return new Map<ResourceType, ReturnType<typeof createResourceContainer>>([
    [id, createResourceContainer({ capacity })],
  ]);
}

describe('createProducer', () => {
  describe('produce', () => {
    it('starts in Idle state', () => {
      const p = createProducer('test-producer', fuelToVelocityRecipe);

      expect(p.state).toBe(ProductionState.Idle);
      expect(p.lastFraction).toBe(0);
    });

    it('sets state to Active and consumes inputs when sources are sufficient', () => {
      const sources = makeFuelSource(10);
      const p = createProducer('test-producer', fuelToVelocityRecipe);

      p.produce(1, sources, 1);

      expect(p.state).toBe(ProductionState.Active);
      // 2 Fuel/s × 1s consumed
      expect(sources.get(ResourceType.Fuel)!.get(ResourceType.Fuel)).toBe(8);
    });

    it('accumulates output in internal stock', () => {
      const sources = makeFuelSource(10);
      const p = createProducer('test-producer', fuelToVelocityRecipe);

      p.produce(1, sources, 1, 1, 5); // maxOutput = 5

      // 5 Power × throttle 1 × deltaTime 1
      expect(p.getStock(ResourceType.Power)).toBeCloseTo(5);
    });

    it('sets state to Idle and produces nothing when sources are insufficient', () => {
      const emptySources = makeFuelSource(0);
      const p = createProducer('test-producer', fuelToVelocityRecipe);

      p.produce(1, emptySources, 1);

      expect(p.state).toBe(ProductionState.Idle);
      expect(p.getStock(ResourceType.Power)).toBe(0);
    });

    it('does not consume Power — Power is debited externally', () => {
      // powerToOxygenRecipe costs Power. No Power source is provided.
      // produce() must skip Power in the consume loop and still run.
      const emptySources = new Map<ResourceType, ReturnType<typeof createResourceContainer>>();
      const p = createProducer('test-producer', powerToOxygenRecipe);

      // calculateFraction skips Power → returns 1 → produce runs
      p.produce(1, emptySources, 1, 1, 1);

      expect(p.state).toBe(ProductionState.Active);
      expect(p.getStock(ResourceType.Oxygen)).toBeCloseTo(1);
    });

    it('scales primary output by effectiveThrottle × maxOutput', () => {
      const sources = makeFuelSource(10);
      const p = createProducer('test-producer', fuelToVelocityRecipe);

      p.produce(1, sources, 0.5, 1, 10); // throttle 0.5, maxOutput 10 → 5 Power

      expect(p.getStock(ResourceType.Power)).toBeCloseTo(5);
    });

    it('scales consumption by upgradeCostMult × effectiveThrottle', () => {
      const sources = makeFuelSource(10);
      const p = createProducer('test-producer', fuelToVelocityRecipe);

      p.produce(1, sources, 0.5, 1); // throttle 0.5 → 1 Fuel consumed instead of 2

      expect(sources.get(ResourceType.Fuel)!.get(ResourceType.Fuel)).toBeCloseTo(9);
    });
  });

  describe('drain', () => {
    it('moves accumulated stock into target containers', () => {
      const sources = makeFuelSource(10);
      const targets = makeTarget(ResourceType.Power);
      const p = createProducer('test-producer', fuelToVelocityRecipe);

      p.produce(1, sources, 1, 1, 1);
      p.drain(targets);

      expect(p.getStock(ResourceType.Power)).toBe(0);
      expect(targets.get(ResourceType.Power)!.get(ResourceType.Power)).toBeCloseTo(1);
    });

    it('leaves stock in place if target container is absent', () => {
      const sources = makeFuelSource(10);
      const p = createProducer('test-producer', fuelToVelocityRecipe);

      p.produce(1, sources, 1, 1, 1);
      p.drain(new Map()); // no target for Power

      expect(p.getStock(ResourceType.Power)).toBeCloseTo(1);
    });
  });

  describe('reset', () => {
    it('sets state to Idle without touching sources or stock', () => {
      const sources = makeFuelSource(10);
      const p = createProducer('test-producer', fuelToVelocityRecipe);
      p.produce(1, sources, 1, 1, 1);

      p.reset();

      expect(p.state).toBe(ProductionState.Idle);
      expect(p.lastFraction).toBe(0);
      // Stock from the produce() call is untouched
      expect(p.getStock(ResourceType.Power)).toBeCloseTo(1);
      // Fuel was already consumed before reset — sources unchanged from that point
      expect(sources.get(ResourceType.Fuel)!.get(ResourceType.Fuel)).toBe(8);
    });
  });
});
