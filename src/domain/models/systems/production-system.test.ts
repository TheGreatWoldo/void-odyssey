import type { ProductionModule } from '@/domain/models/module/production-module';
import { createProductionModule } from '@/domain/models/module/production-module';
import { ModuleId } from '@/domain/models/module/production-module-id';
import { createRecipe } from '@/domain/models/production/recipe';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { describe, expect, it } from 'vitest';
import { createProductionSystem } from './production-system';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeModule(
  id: string,
  name: string,
  ...args: [Parameters<typeof createProductionModule>[2], Parameters<typeof createProductionModule>[3]]
) {
  const result = createProductionModule(id, name, args[0], args[1]);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

/** A reactor that burns Fuel to produce Power. */
const reactorRecipe = createRecipe({
  name: 'TestReactor',
  primaryOutput: ResourceType.Power,
  costsPerSecond: [createResource(ResourceType.Fuel, 1)],
});

/** A life support module that produces Oxygen with no non-Power input costs. */
const oxygenRecipe = createRecipe({
  name: 'TestLifeSupport',
  primaryOutput: ResourceType.Oxygen,
  costsPerSecond: [],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createProductionSystem', () => {
  describe('module installation', () => {
    it('starts with an empty module list', () => {
      const system = createProductionSystem();

      expect(system.modules.list()).toHaveLength(0);
    });

    it('accepts a module via installModule()', () => {
      const system = createProductionSystem({ modules: { capacity: 100 } });
      const reactor = makeModule('reactor-1', 'Reactor', reactorRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });

      const stored = system.installModule(reactor);

      expect(stored).toBe(true);
      expect(system.modules.has('reactor-1')).toBe(true);
    });

    it('rejects a module with an incompatible storableType (allowedTypes enforcement)', () => {
      const system = createProductionSystem({ modules: { capacity: 100 } });

      // Cast a fake storable with storableType !== 'module' to bypass TypeScript's
      // structural check and verify that the container's runtime whitelist rejects it.
      const fakeModule = { id: 'item-1', storableType: 'upgrade', slotCost: 1 } as unknown as ProductionModule;
      const stored = system.installModule(fakeModule);

      expect(stored).toBe(false);
    });

    it('removes a module via removeModule()', () => {
      const system = createProductionSystem({ modules: { capacity: 100 } });
      const reactor = makeModule('reactor-1', 'Reactor', reactorRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });

      system.installModule(reactor);
      const taken = system.removeModule('reactor-1');

      expect(taken).toBeDefined();
      expect(system.modules.has('reactor-1')).toBe(false);
    });

    it('removed module is no longer ticked', () => {
      const system = createProductionSystem({
        modules: { capacity: 100 },
        inventory: { resources: { capacity: 1000 } },
      });

      const lifeSupport = makeModule('ls1', 'Life Support', oxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
      });

      system.installModule(lifeSupport);
      system.tick(1);
      expect(system.inventory.getResource(ResourceType.Oxygen)).toBeCloseTo(3);

      system.removeModule('ls1');
      system.tick(1);

      // Oxygen should not have increased after removal
      expect(system.inventory.getResource(ResourceType.Oxygen)).toBeCloseTo(3);
    });
  });

  describe('tick — reactor only', () => {
    it('accumulates Power in inventory when reactor has Fuel', () => {
      const system = createProductionSystem({
        modules: { capacity: 100 },
        inventory: { resources: { capacity: 1000 } },
      });

      // Pre-load Fuel so the reactor can run
      system.inventory.addResource(createResource(ResourceType.Fuel, 10));

      const reactor = makeModule('r1', 'Reactor', reactorRecipe, {
        type: ModuleId.ReactorCore,
        maxOutput: 5,
      });

      system.installModule(reactor);
      system.tick(1);

      // Reactor produces 5 Power/s × 1s; Fuel cost is 1/s × 1s = 1 Fuel consumed
      expect(system.inventory.getResource(ResourceType.Power)).toBeCloseTo(5);
      expect(system.inventory.getResource(ResourceType.Fuel)).toBeCloseTo(9);
    });

    it('produces nothing when Fuel is absent', () => {
      const system = createProductionSystem({
        modules: { capacity: 100 },
        inventory: { resources: { capacity: 1000 } },
      });

      const reactor = makeModule('r1', 'Reactor', reactorRecipe, {
        type: ModuleId.ReactorCore,
        maxOutput: 5,
      });

      system.installModule(reactor);
      system.tick(1);

      expect(system.inventory.getResource(ResourceType.Power)).toBe(0);
    });
  });

  describe('tick — non-reactor producer only', () => {
    it('accumulates Oxygen in inventory (no input cost)', () => {
      const system = createProductionSystem({
        modules: { capacity: 100 },
        inventory: { resources: { capacity: 1000 } },
      });

      const lifeSupport = makeModule('ls1', 'Life Support', oxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
      });

      system.installModule(lifeSupport);
      system.tick(1);

      expect(system.inventory.getResource(ResourceType.Oxygen)).toBeCloseTo(3);
    });
  });

  describe('tick — reactor + producer ordering', () => {
    it('reactor drains its output first so the producer can consume it in the same tick', () => {
      // The reactor (ReactorCore) produces Oxygen with no input cost.
      // The producer (LifeSupport) produces Water, consuming 1 Oxygen/s.
      //
      // The consumer is installed FIRST, the reactor SECOND.
      // Without reactor-first sorting, the consumer would run first, find 0 Oxygen, and idle.
      // With reactor-first sorting, the reactor runs first, drains Oxygen, then the consumer runs.
      //
      // Note: Power is excluded from the produce/consume hot path by design (debited by the
      // external ship grid), so we use Oxygen and Water to test ordering instead.
      const oxygenSourceRecipe = createRecipe({
        name: 'OxygenSource',
        primaryOutput: ResourceType.Oxygen,
        costsPerSecond: [],
      });

      const waterFromOxygenRecipe = createRecipe({
        name: 'WaterFromOxygen',
        primaryOutput: ResourceType.Water,
        costsPerSecond: [createResource(ResourceType.Oxygen, 1)],
      });

      const system = createProductionSystem({
        modules: { capacity: 100 },
        inventory: { resources: { capacity: 1000 } },
      });

      const reactor = makeModule('r1', 'Reactor', oxygenSourceRecipe, {
        type: ModuleId.ReactorCore,
        maxOutput: 5,
      });

      const consumer = makeModule('c1', 'Consumer', waterFromOxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 2,
      });

      // Install consumer first, reactor second — wrong install order.
      // The reactor-first ordering in installModule() must override install order.
      system.installModule(consumer);
      system.installModule(reactor);

      system.tick(1);

      // Reactor produced 5 Oxygen, drained into inventory.
      // Consumer consumed 1 Oxygen and produced 2 Water.
      expect(system.inventory.getResource(ResourceType.Water)).toBeCloseTo(2);
      expect(system.inventory.getResource(ResourceType.Oxygen)).toBeCloseTo(4); // 5 - 1
    });
  });

  describe('tick — disabled module', () => {
    it('skips a disabled module without accumulating output', () => {
      const system = createProductionSystem({
        modules: { capacity: 100 },
        inventory: { resources: { capacity: 1000 } },
      });

      const lifeSupport = makeModule('ls1', 'Life Support', oxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
      });

      lifeSupport.disable();
      system.installModule(lifeSupport);
      system.tick(1);

      expect(system.inventory.getResource(ResourceType.Oxygen)).toBe(0);
    });
  });

  describe('tick — zero-condition module', () => {
    it('skips a module with condition = 0', () => {
      const system = createProductionSystem({
        modules: { capacity: 100 },
        inventory: { resources: { capacity: 1000 } },
      });

      const lifeSupport = makeModule('ls1', 'Life Support', oxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
        initialCondition: 0,
      });

      system.installModule(lifeSupport);
      system.tick(1);

      expect(system.inventory.getResource(ResourceType.Oxygen)).toBe(0);
    });
  });
});
