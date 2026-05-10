import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { describe, expect, it } from 'vitest';
import { createRecipe } from './recipe';

function makeSources(entries: { id: ResourceType; amount: number }[]) {
  const map = new Map<ResourceType, number>();
  for (const { id, amount } of entries) {
    map.set(id, amount);
  }
  return map;
}

const fuelToVelocityRecipe = createRecipe({
  name: 'Test',
  primaryOutput: ResourceType.Power,
  costsPerSecond: [createResource(ResourceType.Fuel, 1)],
});

const powerOnlyRecipe = createRecipe({
  name: 'PowerOnly',
  primaryOutput: ResourceType.Oxygen,
  costsPerSecond: [createResource(ResourceType.Power, 4)],
});

const multiCostRecipe = createRecipe({
  name: 'Multi',
  primaryOutput: ResourceType.Oxygen,
  costsPerSecond: [
    createResource(ResourceType.Water, 0.5),
    createResource(ResourceType.Power, 2),
  ],
});

describe('createRecipe', () => {
  describe('calculateFraction', () => {
    it('returns 1 when all non-Power inputs are available', () => {
      const sources = makeSources([{ id: ResourceType.Fuel, amount: 5 }]);

      expect(fuelToVelocityRecipe.calculateFraction(sources, 1, 1)).toBe(1);
    });

    it('returns 0 when a non-Power input is insufficient', () => {
      const sources = makeSources([{ id: ResourceType.Fuel, amount: 0 }]);

      expect(fuelToVelocityRecipe.calculateFraction(sources, 1, 1)).toBe(0);
    });

    it('returns 0 when required source container is absent from the map', () => {
      const sources = new Map(); // no Fuel container

      expect(fuelToVelocityRecipe.calculateFraction(sources, 1, 1)).toBe(0);
    });

    it('returns 0 when Power is absent and recipe has a power cost', () => {
      const sources = new Map<ResourceType, number>();

      expect(powerOnlyRecipe.calculateFraction(sources, 1, 1)).toBe(0);
    });

    it('returns 1 when Power fully covers the cost', () => {
      // Needs 4 Power/s × 1s = 4 Power
      const sources = makeSources([{ id: ResourceType.Power, amount: 4 }]);

      expect(powerOnlyRecipe.calculateFraction(sources, 1, 1)).toBe(1);
    });

    it('returns a fractional value when Power partially covers the cost', () => {
      // Needs 4 Power/s × 1s = 4; only 2 available → fraction 0.5
      const sources = makeSources([{ id: ResourceType.Power, amount: 2 }]);

      expect(powerOnlyRecipe.calculateFraction(sources, 1, 1)).toBeCloseTo(0.5);
    });

    it('applies deltaTime and costMultiplier to determine required amount', () => {
      // Needs 1 Fuel/s × 2s = 2 Fuel
      const enoughSources = makeSources([{ id: ResourceType.Fuel, amount: 2 }]);
      const shortSources = makeSources([{ id: ResourceType.Fuel, amount: 1 }]);

      expect(fuelToVelocityRecipe.calculateFraction(enoughSources, 2, 1)).toBe(1);
      expect(fuelToVelocityRecipe.calculateFraction(shortSources, 2, 1)).toBe(0);
    });

    it('applies costMultiplier correctly', () => {
      // Needs 1 Fuel/s × 1s × 3 multiplier = 3 Fuel
      const enoughSources = makeSources([{ id: ResourceType.Fuel, amount: 3 }]);
      const shortSources = makeSources([{ id: ResourceType.Fuel, amount: 2 }]);

      expect(fuelToVelocityRecipe.calculateFraction(enoughSources, 1, 3)).toBe(1);
      expect(fuelToVelocityRecipe.calculateFraction(shortSources, 1, 3)).toBe(0);
    });

    it('returns 0 when non-Power input is insufficient regardless of Power', () => {
      // Water is insufficient — binary gate fires before power fraction
      const noWater = makeSources([
        { id: ResourceType.Water, amount: 0 },
        { id: ResourceType.Power, amount: 100 },
      ]);

      expect(multiCostRecipe.calculateFraction(noWater, 1, 1)).toBe(0);
    });

    it('returns power fraction when non-Power inputs are sufficient but Power is partial', () => {
      // Water OK (0.5/s needed), Power only half available (2/s needed, 1 available)
      const sources = makeSources([
        { id: ResourceType.Water, amount: 1 },
        { id: ResourceType.Power, amount: 1 },
      ]);

      expect(multiCostRecipe.calculateFraction(sources, 1, 1)).toBeCloseTo(0.5);
    });

    it('returns 1 when all inputs including Power are fully available', () => {
      const sources = makeSources([
        { id: ResourceType.Water, amount: 1 },
        { id: ResourceType.Power, amount: 4 },
      ]);

      expect(multiCostRecipe.calculateFraction(sources, 1, 1)).toBe(1);
    });
  });

  describe('canExecute', () => {
    it('returns true when calculateFraction > 0', () => {
      const sources = makeSources([{ id: ResourceType.Fuel, amount: 5 }]);

      expect(fuelToVelocityRecipe.canExecute(sources, 1, 1)).toBe(true);
    });

    it('returns false when calculateFraction is 0', () => {
      const sources = new Map();

      expect(fuelToVelocityRecipe.canExecute(sources, 1, 1)).toBe(false);
    });
  });
});
