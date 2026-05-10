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

    it('ignores Power cost — returns 1 even when no Power source is provided', () => {
      // No Power source in the map; calculateFraction must skip it
      const sources = new Map();

      expect(powerOnlyRecipe.calculateFraction(sources, 1, 1)).toBe(1);
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

    it('skips Power in multi-cost recipe but still checks non-Power inputs', () => {
      // Water is insufficient; Power is skipped
      const noWater = makeSources([{ id: ResourceType.Water, amount: 0 }]);

      expect(multiCostRecipe.calculateFraction(noWater, 1, 1)).toBe(0);

      // Water is sufficient; Power is skipped → returns 1
      const withWater = makeSources([{ id: ResourceType.Water, amount: 1 }]);

      expect(multiCostRecipe.calculateFraction(withWater, 1, 1)).toBe(1);
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
