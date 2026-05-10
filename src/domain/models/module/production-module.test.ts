import { createRecipe } from '@/domain/models/production/recipe';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { createResourceContainer } from '@/domain/models/resources/resource-container';
import { describe, expect, it } from 'vitest';
import { createProductionModule } from './production-module';
import { ModuleId } from './production-module-id';

const powerRecipe = createRecipe({
  name: 'TestReactor',
  primaryOutput: ResourceType.Power,
  costsPerSecond: [createResource(ResourceType.Fuel, 1)],
});

const primaryOutputType = ResourceType.Power; // produced by powerRecipe

describe('createProductionModule', () => {
  describe('validation', () => {
    it('throws when id is blank', () => {
      expect(() => createProductionModule('', 'Module', powerRecipe, { type: ModuleId.ReactorCore })).toThrow();
      expect(() => createProductionModule('  ', 'Module', powerRecipe, { type: ModuleId.ReactorCore })).toThrow();
    });

    it('throws when name is blank', () => {
      expect(() => createProductionModule('m1', '', powerRecipe, { type: ModuleId.ReactorCore })).toThrow();
      expect(() => createProductionModule('m1', '  ', powerRecipe, { type: ModuleId.ReactorCore })).toThrow();
    });

    it('throws when condition is below 0', () => {
      expect(() => createProductionModule('m1', 'Module', powerRecipe, { type: ModuleId.ReactorCore, initialCondition: -0.1 })).toThrow();
    });

    it('throws when condition is above 1', () => {
      expect(() => createProductionModule('m1', 'Module', powerRecipe, { type: ModuleId.ReactorCore, initialCondition: 1.1 })).toThrow();
    });

    it('accepts condition = 0 and condition = 1', () => {
      expect(() => createProductionModule('m1', 'M', powerRecipe, { type: ModuleId.ReactorCore, initialCondition: 0 })).not.toThrow();
      expect(() => createProductionModule('m2', 'M', powerRecipe, { type: ModuleId.ReactorCore, initialCondition: 1 })).not.toThrow();
    });

    it('throws when rampRate is negative', () => {
      expect(() => createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, rampRate: -1 })).toThrow();
    });
  });

  describe('initial state', () => {
    it('exposes id, name, and condition', () => {
      const m = createProductionModule('reactor', 'Reactor', powerRecipe, { type: ModuleId.ReactorCore, initialCondition: 0.8 });

      expect(m.id).toBe('reactor');
      expect(m.name).toBe('Reactor');
      expect(m.condition).toBe(0.8);
    });

    it('defaults throttle and actualThrottle to 1', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });

      expect(m.throttle).toBe(1);
      expect(m.actualThrottle).toBe(1);
    });

    it('defaults enabled to true', () => {
      expect(createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore }).enabled).toBe(true);
    });
  });

  describe('isOperational', () => {
    it('returns true when condition > 0', () => {
      expect(createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, initialCondition: 0.1 }).isOperational()).toBe(true);
    });

    it('returns false when condition = 0', () => {
      expect(createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, initialCondition: 0 }).isOperational()).toBe(false);
    });

    it('returns false when enabled is false', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.disable();

      expect(m.isOperational()).toBe(false);
    });
  });

  describe('setThrottle', () => {
    it('clamps to 0 when given a negative value', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.setThrottle(-1);

      expect(m.throttle).toBe(0);
    });

    it('clamps to 1 when given a value above 1', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.setThrottle(2);

      expect(m.throttle).toBe(1);
    });

    it('sets a value within [0, 1]', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.setThrottle(0.4);

      expect(m.throttle).toBe(0.4);
    });

    describe('snapOutputToInteger', () => {
      const scanRecipe = createRecipe({
        name: 'Scan',
        primaryOutput: ResourceType.ScanRange,
        costsPerSecond: [],
      });

      it('snaps throttle to nearest integer output (0.6 → 0.5, maxN=2)', () => {
        const m = createProductionModule('m', 'M', scanRecipe, { type: ModuleId.SensorArray, snapOutputToInteger: true, maxOutput: 2 });
        m.setThrottle(0.6);

        expect(m.throttle).toBeCloseTo(0.5);
      });

      it('snaps throttle to nearest integer output (0.8 → 1.0, maxN=2)', () => {
        const m = createProductionModule('m', 'M', scanRecipe, { type: ModuleId.SensorArray, snapOutputToInteger: true, maxOutput: 2 });
        m.setThrottle(0.8);

        expect(m.throttle).toBeCloseTo(1.0);
      });

      it('snaps to maxN/maxN=1.0 when maxOutput is non-integer (e.g. 2.5 → maxN=2)', () => {
        const m = createProductionModule('m', 'M', scanRecipe, { type: ModuleId.SensorArray, snapOutputToInteger: true, maxOutput: 2.5 });
        m.setThrottle(0.9);

        expect(m.throttle).toBeCloseTo(1.0);
      });

      it('range 2 at 100% when maxOutput=2.5', () => {
        const m = createProductionModule('m', 'M', scanRecipe, { type: ModuleId.SensorArray, snapOutputToInteger: true, maxOutput: 2.5 });
        m.setThrottle(0.8);

        expect(m.throttle).toBeCloseTo(1.0);
      });

      it('clamps snapped value to 1 when it would exceed 1', () => {
        const m = createProductionModule('m', 'M', scanRecipe, { type: ModuleId.SensorArray, snapOutputToInteger: true, maxOutput: 2 });
        m.setThrottle(1.5);

        expect(m.throttle).toBe(1);
      });

      it('clamps snapped value to 0 when given a negative', () => {
        const m = createProductionModule('m', 'M', scanRecipe, { type: ModuleId.SensorArray, snapOutputToInteger: true, maxOutput: 2 });
        m.setThrottle(-0.1);

        expect(m.throttle).toBe(0);
      });

      it('does not snap when snapOutputToInteger is false', () => {
        const m = createProductionModule('m', 'M', scanRecipe, { type: ModuleId.SensorArray });
        m.setThrottle(0.6);

        expect(m.throttle).toBe(0.6);
      });

      it('falls back to normal clamp when maxOutput < 1', () => {
        const m = createProductionModule('m', 'M', scanRecipe, { type: ModuleId.SensorArray, snapOutputToInteger: true, maxOutput: 0.5 });
        m.setThrottle(0.6);

        expect(m.throttle).toBe(0.6);
      });
    });
  });

  describe('enable / disable', () => {
    it('toggles the enabled flag', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.disable();

      expect(m.enabled).toBe(false);

      m.enable();

      expect(m.enabled).toBe(true);
    });
  });

  describe('stepRamp', () => {
    it('with Infinity rampRate, snaps actualThrottle to throttle immediately', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, rampRate: Infinity });
      m.setThrottle(0.3);
      m.stepRamp(1);

      expect(m.actualThrottle).toBe(0.3);
    });

    it('with finite rampRate, advances actualThrottle by rampRate × deltaTime', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, rampRate: 0.5 });
      m.setThrottle(0);
      m.stepRamp(1);

      expect(m.actualThrottle).toBeCloseTo(0.5);
    });

    it('does not overshoot the target throttle', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, rampRate: 10 });
      m.setThrottle(0);
      m.stepRamp(1);

      expect(m.actualThrottle).toBe(0);
    });
  });

  describe('setCondition', () => {
    it('throws when value is below 0', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });

      expect(() => m.setCondition(-0.1)).toThrow();
    });

    it('throws when value is above 1', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });

      expect(() => m.setCondition(1.1)).toThrow();
    });

    it('accepts boundary values 0 and 1', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });

      expect(() => m.setCondition(0)).not.toThrow();
      expect(() => m.setCondition(1)).not.toThrow();
    });
  });

  describe('addUpgrade', () => {
    it('throws when the upgrade targets a resource the module does not produce', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });

      expect(() =>
        m.addUpgrade({
          id: 'u1', name: 'U1',
          costFactor: 1,
          targetResourceType: ResourceType.Food,
          enabled: true,
        })
      ).toThrow();
    });

    it('accepts an upgrade that targets a produced resource type', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });

      expect(() =>
        m.addUpgrade({
          id: 'u1', name: 'U1',
          costFactor: 0.8,
          targetResourceType: primaryOutputType,
          enabled: true,
        })
      ).not.toThrow();
    });
  });

  describe('setUpgradeEnabled', () => {
    it('throws when the upgrade id does not exist', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });

      expect(() => m.setUpgradeEnabled('nonexistent', true)).toThrow();
    });

    it('toggles an installed upgrade', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.addUpgrade({ id: 'u1', name: 'U1', costFactor: 0.8, targetResourceType: primaryOutputType, enabled: true });
      m.setUpgradeEnabled('u1', false);

      expect(m.upgrades[0].enabled).toBe(false);
    });
  });

  describe('costMultiplier', () => {
    it('returns 1 with no upgrades', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });

      expect(m.costMultiplier).toBe(1);
    });

    it('accumulates upgrade cost multipliers', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.addUpgrade({ id: 'u1', name: 'U1', costFactor: 0.8, targetResourceType: primaryOutputType, enabled: true });

      expect(m.costMultiplier).toBeCloseTo(0.8);
    });

    it('stacks multiple upgrade costFactors additively', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.addUpgrade({ id: 'u1', name: 'U1', costFactor: 0.8, targetResourceType: primaryOutputType, enabled: true });
      m.addUpgrade({ id: 'u2', name: 'U2', costFactor: 0.7, targetResourceType: primaryOutputType, enabled: true });

      // additive: 1 + (0.8 - 1) + (0.7 - 1) = 0.5
      expect(m.costMultiplier).toBeCloseTo(0.5);
    });

    it('skips disabled upgrades', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.addUpgrade({ id: 'u1', name: 'U1', costFactor: 0.5, targetResourceType: primaryOutputType, enabled: false });

      expect(m.costMultiplier).toBe(1);
    });

    it('clamps to 0 when additive reductions drive the multiplier below zero', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.addUpgrade({ id: 'u1', name: 'U1', costFactor: 0.3, targetResourceType: primaryOutputType, enabled: true });
      m.addUpgrade({ id: 'u2', name: 'U2', costFactor: 0.3, targetResourceType: primaryOutputType, enabled: true });

      // additive: 1 + (0.3 - 1) + (0.3 - 1) = -0.4 → clamped to 0
      expect(m.costMultiplier).toBe(0);
    });
  });

  describe('produce', () => {
    function makeContainerMap(types: ResourceType[]) {
      return new Map(
        types.map((t) => [t, createResourceContainer({ allowedResources: [t], capacity: 1000 })])
      );
    }

    it('does not accumulate output when disabled', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore });
      m.disable();
      const sources = makeContainerMap([ResourceType.Fuel]);
      const targets = makeContainerMap([ResourceType.Power]);

      // Seed fuel so the module would produce if enabled
      sources.get(ResourceType.Fuel)!.add(createResource(ResourceType.Fuel, 100));

      m.produce(1, sources);
      m.drain(targets);

      expect(targets.get(ResourceType.Power)!.get(ResourceType.Power)).toBe(0);
    });

    it('does not accumulate output when condition is 0', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, initialCondition: 0 });
      const sources = makeContainerMap([ResourceType.Fuel]);
      const targets = makeContainerMap([ResourceType.Power]);

      sources.get(ResourceType.Fuel)!.add(createResource(ResourceType.Fuel, 100));

      m.produce(1, sources);
      m.drain(targets);

      expect(targets.get(ResourceType.Power)!.get(ResourceType.Power)).toBe(0);
    });

    it('accumulates output when enabled', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });
      const sources = makeContainerMap([ResourceType.Fuel]);
      const targets = makeContainerMap([ResourceType.Power]);

      sources.get(ResourceType.Fuel)!.add(createResource(ResourceType.Fuel, 100));

      m.produce(1, sources);
      m.drain(targets);

      expect(targets.get(ResourceType.Power)!.get(ResourceType.Power)).toBeGreaterThan(0);
    });
  });

  describe('drain', () => {
    it('moves accumulated output into target containers', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });
      const sources = new Map([[ResourceType.Fuel, createResourceContainer({ allowedResources: [ResourceType.Fuel], capacity: 1000 })]]);
      const targets = new Map([[ResourceType.Power, createResourceContainer({ allowedResources: [ResourceType.Power], capacity: 1000 })]]);

      sources.get(ResourceType.Fuel)!.add(createResource(ResourceType.Fuel, 100));
      m.produce(1, sources);

      const powerBefore = targets.get(ResourceType.Power)!.get(ResourceType.Power);
      m.drain(targets);
      const powerAfter = targets.get(ResourceType.Power)!.get(ResourceType.Power);

      expect(powerAfter).toBeGreaterThan(powerBefore);
    });

    it('leaves no stock after draining', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });
      const sources = new Map([[ResourceType.Fuel, createResourceContainer({ allowedResources: [ResourceType.Fuel], capacity: 1000 })]]);
      const targets = new Map([[ResourceType.Power, createResourceContainer({ allowedResources: [ResourceType.Power], capacity: 1000 })]]);

      sources.get(ResourceType.Fuel)!.add(createResource(ResourceType.Fuel, 100));
      m.produce(1, sources);
      m.drain(targets);

      // A second drain should add nothing — buffer was emptied
      const powerAfterFirst = targets.get(ResourceType.Power)!.get(ResourceType.Power);
      m.drain(targets);
      expect(targets.get(ResourceType.Power)!.get(ResourceType.Power)).toBe(powerAfterFirst);
    });
  });

  describe('reset', () => {
    it('resets state to Idle without discarding accumulated output', () => {
      const m = createProductionModule('m', 'M', powerRecipe, { type: ModuleId.ReactorCore, maxOutput: 10 });
      const sources = new Map([[ResourceType.Fuel, createResourceContainer({ allowedResources: [ResourceType.Fuel], capacity: 1000 })]]);
      const targets = new Map([[ResourceType.Power, createResourceContainer({ allowedResources: [ResourceType.Power], capacity: 1000 })]]);

      sources.get(ResourceType.Fuel)!.add(createResource(ResourceType.Fuel, 100));
      m.produce(1, sources);

      // reset() sets state to Idle but does not discard buffered output
      m.reset();

      // drain still moves whatever was accumulated before the reset
      m.drain(targets);
      expect(targets.get(ResourceType.Power)!.get(ResourceType.Power)).toBeGreaterThan(0);
    });
  });
});
