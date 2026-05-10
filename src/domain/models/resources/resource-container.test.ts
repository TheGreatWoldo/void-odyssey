import { describe, expect, it } from 'vitest';
import { createResource, ResourceType } from './resource';
import { createResourceContainer } from './resource-container';

describe('createResourceContainer', () => {
  describe('add / get / freeSpace', () => {
    it('starts empty with full free space', () => {
      const c = createResourceContainer({ capacity: 10 });

      expect(c.get(ResourceType.Food)).toBe(0);
      expect(c.freeSpace()).toBe(10);
    });

    it('accepts resources and reduces free space', () => {
      const c = createResourceContainer({ capacity: 10 });

      const refused = c.add(createResource(ResourceType.Food, 6));

      expect(refused).toBe(0);
      expect(c.get(ResourceType.Food)).toBe(6);
      expect(c.freeSpace()).toBe(4);
    });

    it('accounts for slot cost — Fuel uses 2 slots per unit', () => {
      const c = createResourceContainer({ capacity: 10 });

      // 4 Fuel units = 8 slots; 1 slot remaining
      c.add(createResource(ResourceType.Fuel, 4));

      expect(c.freeSpace()).toBe(2);
    });

    it('returns refused remainder when capacity is exceeded', () => {
      const c = createResourceContainer({ capacity: 4 }); // 2 Fuel units fit

      const refused = c.add(createResource(ResourceType.Fuel, 5));

      expect(c.get(ResourceType.Fuel)).toBe(2);
      expect(refused).toBe(3);
    });

    it('rejects resources not in perTypeCapacity whitelist', () => {
      const c = createResourceContainer({ capacity: 20, perTypeCapacity: { [ResourceType.Fuel]: null } });

      const refused = c.add(createResource(ResourceType.Food, 5));

      expect(refused).toBe(5);
      expect(c.get(ResourceType.Food)).toBe(0);
    });

    it('accepts any resource when no whitelist is set', () => {
      const c = createResourceContainer({ capacity: 20 });

      c.add(createResource(ResourceType.Fuel, 1));
      c.add(createResource(ResourceType.Food, 1));

      expect(c.get(ResourceType.Fuel)).toBe(1);
      expect(c.get(ResourceType.Food)).toBe(1);
    });

    it('unbounded container (no capacity) accepts any amount', () => {
      const c = createResourceContainer();

      const refused = c.add(createResource(ResourceType.Food, 100_000));

      expect(refused).toBe(0);
      expect(c.get(ResourceType.Food)).toBe(100_000);
    });
  });

  describe('accepts', () => {
    it('returns true for all types when no whitelist', () => {
      const c = createResourceContainer();

      expect(c.accepts(ResourceType.Fuel)).toBe(true);
      expect(c.accepts(ResourceType.Power)).toBe(true);
    });

    it('returns true only for whitelisted types', () => {
      const c = createResourceContainer({ perTypeCapacity: { [ResourceType.Water]: null } });

      expect(c.accepts(ResourceType.Water)).toBe(true);
      expect(c.accepts(ResourceType.Fuel)).toBe(false);
    });
  });

  describe('has', () => {
    it('returns true when the container holds at least the requested amount', () => {
      const c = createResourceContainer({ capacity: 20 });
      c.add(createResource(ResourceType.Food, 5));

      expect(c.has({ id: ResourceType.Food, amount: 5 })).toBe(true);
      expect(c.has({ id: ResourceType.Food, amount: 4 })).toBe(true);
    });

    it('returns false when the container holds less than the requested amount', () => {
      const c = createResourceContainer({ capacity: 20 });
      c.add(createResource(ResourceType.Food, 3));

      expect(c.has({ id: ResourceType.Food, amount: 4 })).toBe(false);
    });

    it('returns false when the resource is absent', () => {
      const c = createResourceContainer({ capacity: 20 });

      expect(c.has({ id: ResourceType.Fuel, amount: 1 })).toBe(false);
    });
  });

  describe('destroy', () => {
    it('removes up to the available amount', () => {
      const c = createResourceContainer({ capacity: 20 });
      c.add(createResource(ResourceType.Food, 8));

      c.destroy(createResource(ResourceType.Food, 5));

      expect(c.get(ResourceType.Food)).toBe(3);
      expect(c.freeSpace()).toBe(17);
    });

    it('clamps to available when requested amount exceeds stock', () => {
      const c = createResourceContainer({ capacity: 20 });
      c.add(createResource(ResourceType.Food, 3));

      c.destroy(createResource(ResourceType.Food, 10)); // only 3 available

      expect(c.get(ResourceType.Food)).toBe(0);
      expect(c.freeSpace()).toBe(20);
    });

    it('no-ops when resource is absent', () => {
      const c = createResourceContainer({ capacity: 20 });

      expect(() => c.destroy(createResource(ResourceType.Fuel, 5))).not.toThrow();
      expect(c.freeSpace()).toBe(20);
    });
  });

  describe('moveTo', () => {
    it('transfers the requested amount to the target', () => {
      const src = createResourceContainer({ capacity: 20 });
      const dst = createResourceContainer({ capacity: 20 });
      src.add(createResource(ResourceType.Food, 10));

      const refused = src.moveTo(createResource(ResourceType.Food, 6), dst);

      expect(refused).toBe(0);
      expect(src.get(ResourceType.Food)).toBe(4);
      expect(dst.get(ResourceType.Food)).toBe(6);
    });

    it('returns refused amount and restores it to source when target is full', () => {
      const src = createResourceContainer({ capacity: 20 });
      const dst = createResourceContainer({ capacity: 4 }); // 2 Fuel units fit
      src.add(createResource(ResourceType.Fuel, 5));

      const refused = src.moveTo(createResource(ResourceType.Fuel, 5), dst);

      expect(refused).toBe(3);
      expect(dst.get(ResourceType.Fuel)).toBe(2);
      expect(src.get(ResourceType.Fuel)).toBe(3); // 3 returned to source
    });

    it('returns 0 when source has none of the resource', () => {
      const src = createResourceContainer({ capacity: 20 });
      const dst = createResourceContainer({ capacity: 20 });

      const refused = src.moveTo(createResource(ResourceType.Food, 5), dst);

      expect(refused).toBe(0);
      expect(dst.get(ResourceType.Food)).toBe(0);
    });
  });

  describe('moveAll', () => {
    it('transfers all resources to the target', () => {
      const src = createResourceContainer({ capacity: 30 });
      const dst = createResourceContainer({ capacity: 30 });
      src.add(createResource(ResourceType.Food, 5));
      src.add(createResource(ResourceType.Water, 3));

      src.moveAll(dst);

      expect(src.get(ResourceType.Food)).toBe(0);
      expect(src.get(ResourceType.Water)).toBe(0);
      expect(dst.get(ResourceType.Food)).toBe(5);
      expect(dst.get(ResourceType.Water)).toBe(3);
    });
  });

  describe('addContainer / removeContainer / getContainers', () => {
    it('nests a child container and reduces free space by child capacity', () => {
      const parent = createResourceContainer({ capacity: 30 });
      const child = createResourceContainer({ capacity: 10 });

      const added = parent.addContainer(child);

      expect(added).toBe(true);
      expect(parent.freeSpace()).toBe(20);
      expect(parent.getContainers()).toContain(child);
    });

    it('returns false when child capacity exceeds available free space', () => {
      const parent = createResourceContainer({ capacity: 5 });
      const child = createResourceContainer({ capacity: 10 });

      const added = parent.addContainer(child);

      expect(added).toBe(false);
      expect(parent.freeSpace()).toBe(5);
    });

    it('removeContainer restores free space', () => {
      const parent = createResourceContainer({ capacity: 30 });
      const child = createResourceContainer({ capacity: 10 });
      parent.addContainer(child);

      parent.removeContainer(child);

      expect(parent.freeSpace()).toBe(30);
      expect(parent.getContainers()).toHaveLength(0);
    });

    it('removeContainer is a no-op for an unknown container', () => {
      const parent = createResourceContainer({ capacity: 30 });
      const stranger = createResourceContainer({ capacity: 10 });

      expect(() => parent.removeContainer(stranger)).not.toThrow();
      expect(parent.freeSpace()).toBe(30);
    });
  });
});

describe('hasAll', () => {
  it('returns true only when every resource is fully satisfied', () => {
    const c = createResourceContainer({ capacity: 30 });
    c.add(createResource(ResourceType.Food, 5));
    c.add(createResource(ResourceType.Water, 2));

    expect(c.hasAll([createResource(ResourceType.Food, 3)])).toBe(true);
    expect(c.hasAll([createResource(ResourceType.Food, 3), createResource(ResourceType.Water, 3)])).toBe(false);
    expect(c.hasAll([createResource(ResourceType.Fuel, 1)])).toBe(false);
  });

  it('returns false when the container is empty', () => {
    const c = createResourceContainer({ capacity: 20 });
    expect(c.hasAll([createResource(ResourceType.Food, 1)])).toBe(false);
  });

  it('returns true for an empty resource list', () => {
    const c = createResourceContainer({ capacity: 20 });
    expect(c.hasAll([])).toBe(true);
  });
});
