import type { ProductionModule } from '@/domain/models/module/production-module';
import { createProductionModule } from '@/domain/models/module/production-module';
import { ModuleId } from '@/domain/models/module/production-module-id';
import { createRecipe } from '@/domain/models/production/recipe';
import { createBatteryContainer } from '@/domain/models/resources/power-container';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { createResourceContainer } from '@/domain/models/resources/resource-container';
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
      const system = createProductionSystem({ resources: createResourceContainer() });

      expect(system.modules.list()).toHaveLength(0);
    });

    it('accepts a module via installModule()', () => {
      const system = createProductionSystem({ modules: { capacity: 100 }, resources: createResourceContainer() });
      const reactor = makeModule('reactor-1', 'Reactor', reactorRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });

      const stored = system.installModule(reactor);

      expect(stored).toBe(true);
      expect(system.modules.has('reactor-1')).toBe(true);
    });

    it('rejects a module with an incompatible storableType (allowedTypes enforcement)', () => {
      const system = createProductionSystem({ modules: { capacity: 100 }, resources: createResourceContainer() });

      // Cast a fake storable with storableType !== 'module' to bypass TypeScript's
      // structural check and verify that the container's runtime whitelist rejects it.
      const fakeModule = { id: 'item-1', storableType: 'upgrade', slotCost: 1 } as unknown as ProductionModule;
      const stored = system.installModule(fakeModule);

      expect(stored).toBe(false);
    });

    it('rejects module when dependency is missing (ion engines require reactor)', () => {
      const system = createProductionSystem({ modules: { capacity: 100 }, resources: createResourceContainer() });
      const engines = makeModule('engine-1', 'Ion Engines', oxygenRecipe, {
        type: ModuleId.IonEngines,
        maxOutput: 10,
      });

      const stored = system.installModule(engines);

      expect(stored).toBe(false);
      expect(system.modules.has('engine-1')).toBe(false);
    });

    it('accepts module once dependency is installed first', () => {
      const system = createProductionSystem({ modules: { capacity: 100 }, resources: createResourceContainer() });
      const reactor = makeModule('reactor-1', 'Reactor', reactorRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });
      const engines = makeModule('engine-1', 'Ion Engines', oxygenRecipe, {
        type: ModuleId.IonEngines,
        maxOutput: 10,
      });

      expect(system.installModule(reactor)).toBe(true);
      expect(system.installModule(engines)).toBe(true);
      expect(system.modules.has('engine-1')).toBe(true);
    });

    it('rejects unique module duplication (second shield generator)', () => {
      const system = createProductionSystem({ modules: { capacity: 100 }, resources: createResourceContainer() });
      const reactor = makeModule('reactor-1', 'Reactor', reactorRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });
      const shieldA = makeModule('shield-a', 'Shield A', oxygenRecipe, {
        type: ModuleId.ShieldGenerator,
        maxOutput: 5,
      });
      const shieldB = makeModule('shield-b', 'Shield B', oxygenRecipe, {
        type: ModuleId.ShieldGenerator,
        maxOutput: 5,
      });

      expect(system.installModule(reactor)).toBe(true);
      expect(system.installModule(shieldA)).toBe(true);
      expect(system.installModule(shieldB)).toBe(false);
    });

    it('rejects conflicting module pair (armor plating vs fuel scoop)', () => {
      const system = createProductionSystem({ modules: { capacity: 100 }, resources: createResourceContainer() });
      const armor = makeModule('armor-1', 'Armor', oxygenRecipe, {
        type: ModuleId.ArmorPlating,
        maxOutput: 0,
      });
      const scoop = makeModule('scoop-1', 'Fuel Scoop', oxygenRecipe, {
        type: ModuleId.FuelScoop,
        maxOutput: 0,
      });

      expect(system.installModule(armor)).toBe(true);
      expect(system.installModule(scoop)).toBe(false);
    });

    it('removes a module via removeModule()', () => {
      const system = createProductionSystem({ modules: { capacity: 100 }, resources: createResourceContainer() });
      const reactor = makeModule('reactor-1', 'Reactor', reactorRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });

      system.installModule(reactor);
      const taken = system.removeModule('reactor-1');

      expect(taken).toBeDefined();
      expect(system.modules.has('reactor-1')).toBe(false);
    });

    it('removed module is no longer ticked', () => {
      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({
        modules: { capacity: 100 },
        resources,
      });

      const lifeSupport = makeModule('ls1', 'Life Support', oxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
      });

      system.installModule(lifeSupport);
      system.tick(1);
      expect(resources.get(ResourceType.Oxygen)).toBeCloseTo(3);

      system.removeModule('ls1');
      system.tick(1);

      // Oxygen should not have increased after removal
      expect(resources.get(ResourceType.Oxygen)).toBeCloseTo(3);
    });

    it('installModules installs all modules atomically when batch is valid', () => {
      const system = createProductionSystem({ modules: { capacity: 100 }, resources: createResourceContainer() });
      const reactor = makeModule('reactor-1', 'Reactor', reactorRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });
      const engines = makeModule('engine-1', 'Ion Engines', oxygenRecipe, {
        type: ModuleId.IonEngines,
        maxOutput: 10,
      });

      const result = system.installModules([reactor, engines]);

      expect(result.ok).toBe(true);
      expect(system.modules.has('reactor-1')).toBe(true);
      expect(system.modules.has('engine-1')).toBe(true);
    });

    it('installModules rolls back all installs when one module fails', () => {
      const system = createProductionSystem({ modules: { capacity: 100 }, resources: createResourceContainer() });

      const reactor = makeModule('reactor-1', 'Reactor', reactorRecipe, {
        type: ModuleId.ReactorCore,
        maxOutput: 10,
      });

      const shieldA = makeModule('shield-a', 'Shield A', oxygenRecipe, {
        type: ModuleId.ShieldGenerator,
        maxOutput: 5,
      });

      const shieldB = makeModule('shield-b', 'Shield B', oxygenRecipe, {
        type: ModuleId.ShieldGenerator,
        maxOutput: 5,
      });

      const result = system.installModules([reactor, shieldA, shieldB]);

      expect(result.ok).toBe(false);
      expect(system.modules.has('reactor-1')).toBe(false);
      expect(system.modules.has('shield-a')).toBe(false);
      expect(system.modules.has('shield-b')).toBe(false);
      expect(system.modules.list()).toHaveLength(0);
    });
  });

  describe('tick — reactor only', () => {
    it('accumulates Power in battery when reactor has Fuel', () => {
      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({
        modules: { capacity: 100 },
        resources,
      });

      const battery = createBatteryContainer({ capacity: 100 });
      system.addBattery(battery);

      // Pre-load Fuel so the reactor can run
      resources.add(createResource(ResourceType.Fuel, 10));

      const reactor = makeModule('r1', 'Reactor', reactorRecipe, {
        type: ModuleId.ReactorCore,
        maxOutput: 5,
      });

      system.installModule(reactor);
      system.tick(1);

      // Reactor produces 5 Power/s × 1s into the battery; Fuel cost is 1/s × 1s = 1 consumed
      expect(battery.get(ResourceType.Power)).toBeCloseTo(5);
      expect(resources.get(ResourceType.Fuel)).toBeCloseTo(9);
    });

    it('produces nothing when Fuel is absent', () => {
      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({
        modules: { capacity: 100 },
        resources,
      });

      const battery = createBatteryContainer({ capacity: 100 });
      system.addBattery(battery);

      const reactor = makeModule('r1', 'Reactor', reactorRecipe, {
        type: ModuleId.ReactorCore,
        maxOutput: 5,
      });

      system.installModule(reactor);
      system.tick(1);

      expect(battery.get(ResourceType.Power)).toBe(0);
    });
  });

  describe('tick — non-reactor producer only', () => {
    it('accumulates Oxygen in inventory (no input cost)', () => {
      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({
        modules: { capacity: 100 },
        resources,
      });

      const lifeSupport = makeModule('ls1', 'Life Support', oxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
      });

      system.installModule(lifeSupport);
      system.tick(1);

      expect(resources.get(ResourceType.Oxygen)).toBeCloseTo(3);
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
      // Note: Power is excluded from the input-cost check by design (filtered out of
      // nonPowerCosts at recipe creation time), so Oxygen and Water are used here instead.
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

      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({
        modules: { capacity: 100 },
        resources,
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
      expect(resources.get(ResourceType.Water)).toBeCloseTo(2);
      expect(resources.get(ResourceType.Oxygen)).toBeCloseTo(4); // 5 - 1
    });
  });

  describe('tick — non-reactor priority ordering', () => {
    it('runs life-support producer before medbay consumer regardless of install order', () => {
      const oxygenSourceRecipe = createRecipe({
        name: 'OxygenSource',
        primaryOutput: ResourceType.Oxygen,
        costsPerSecond: [],
      });

      const oxygenConsumerRecipe = createRecipe({
        name: 'MedbayConsumer',
        primaryOutput: ResourceType.Water,
        costsPerSecond: [createResource(ResourceType.Oxygen, 1)],
      });

      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({
        modules: { capacity: 100 },
        resources,
      });

      const producer = makeModule('ls1', 'Life Support', oxygenSourceRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
      });

      const consumer = makeModule('med1', 'Medbay Consumer', oxygenConsumerRecipe, {
        type: ModuleId.Medbay,
        maxOutput: 2,
      });

      system.installModule(consumer);
      system.installModule(producer);

      system.tick(1);

      expect(resources.get(ResourceType.Water)).toBeCloseTo(2);
      expect(resources.get(ResourceType.Oxygen)).toBeCloseTo(2);
    });
  });

  describe('tick — disabled module', () => {
    it('skips a disabled module without accumulating output', () => {
      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({
        modules: { capacity: 100 },
        resources,
      });

      const lifeSupport = makeModule('ls1', 'Life Support', oxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
      });

      lifeSupport.disable();
      system.installModule(lifeSupport);
      system.tick(1);

      expect(resources.get(ResourceType.Oxygen)).toBe(0);
    });
  });

  describe('tick — zero-condition module', () => {
    it('skips a module with condition = 0', () => {
      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({
        modules: { capacity: 100 },
        resources,
      });

      const lifeSupport = makeModule('ls1', 'Life Support', oxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
        initialCondition: 0,
      });

      system.installModule(lifeSupport);
      system.tick(1);

      expect(resources.get(ResourceType.Oxygen)).toBe(0);
    });
  });

  describe('battery \u2014 power routing', () => {
    /** A module that consumes 2 Power/s and produces 3 Oxygen/s. */
    const powerToOxygenRecipe = createRecipe({
      name: 'PowerToOxygen',
      primaryOutput: ResourceType.Oxygen,
      costsPerSecond: [createResource(ResourceType.Power, 2)],
    });

    it('reactor fills battery; consumer draws from it in the same tick', () => {
      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({ modules: { capacity: 100 }, resources });
      const battery = createBatteryContainer({ capacity: 100 });
      system.addBattery(battery);

      // Seed Fuel for the reactor
      resources.add(createResource(ResourceType.Fuel, 10));

      const reactor = makeModule('r1', 'Reactor', reactorRecipe, {
        type: ModuleId.ReactorCore,
        maxOutput: 10, // 10 Power/s
      });

      const consumer = makeModule('c1', 'Consumer', powerToOxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3, // 3 Oxygen/s at full power
      });

      // Reactor runs first (ReactorCore sort) — drains 10 Power into battery.
      // Consumer then draws 2 Power → fraction 1 → produces 3 Oxygen.
      system.installModule(consumer);
      system.installModule(reactor);

      system.tick(1);

      // 10 Power produced, 2 consumed by consumer, 8 remain in battery.
      expect(battery.get(ResourceType.Power)).toBeCloseTo(8);
      expect(resources.get(ResourceType.Oxygen)).toBeCloseTo(3);
    });

    it('consumer idles when no battery is installed', () => {
      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({ modules: { capacity: 100 }, resources });

      // No battery added — power container has zero capacity.
      resources.add(createResource(ResourceType.Fuel, 10));

      const reactor = makeModule('r1', 'Reactor', reactorRecipe, {
        type: ModuleId.ReactorCore,
        maxOutput: 10,
      });

      const consumer = makeModule('c1', 'Consumer', powerToOxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
      });

      system.installModule(consumer);
      system.installModule(reactor);
      system.tick(1);

      // Reactor output is wasted (no battery capacity). Consumer gets fraction 0 → Idle.
      expect(resources.get(ResourceType.Oxygen)).toBe(0);
    });

    it('consumer runs at partial rate when battery is underpowered', () => {
      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({ modules: { capacity: 100 }, resources });
      const battery = createBatteryContainer({ capacity: 100 });
      system.addBattery(battery);

      // Pre-charge battery with 1 Power (consumer needs 2/s → fraction 0.5)
      battery.add(createResource(ResourceType.Power, 1));

      const consumer = makeModule('c1', 'Consumer', powerToOxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
      });

      system.installModule(consumer);
      system.tick(1);

      // fraction 0.5 → 3 × 0.5 = 1.5 Oxygen; 2 × 0.5 = 1 Power consumed
      expect(resources.get(ResourceType.Oxygen)).toBeCloseTo(1.5);
      expect(battery.get(ResourceType.Power)).toBeCloseTo(0);
    });

    it('removeBattery stops routing power through it', () => {
      const resources = createResourceContainer({ capacity: 1000 });
      const system = createProductionSystem({ modules: { capacity: 100 }, resources });
      const battery = createBatteryContainer({ capacity: 100 });
      system.addBattery(battery);
      battery.add(createResource(ResourceType.Power, 10));

      const consumer = makeModule('c1', 'Consumer', powerToOxygenRecipe, {
        type: ModuleId.LifeSupport,
        maxOutput: 3,
      });

      system.installModule(consumer);
      system.removeBattery(battery);
      system.tick(1);

      // Battery removed — consumer sees 0 Power → Idle
      expect(resources.get(ResourceType.Oxygen)).toBe(0);
      // Power still in the battery (untouched after removal)
      expect(battery.get(ResourceType.Power)).toBeCloseTo(10);
    });
  });
});
