import { describe, expect, it } from 'vitest';

import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { createResourceContainer } from '@/domain/models/resources/resource-container';
import { createItemContainer } from '@/domain/models/storage/item-container';
import type { Storable } from '@/domain/models/storage/storable';
import { StorableType } from '@/domain/models/storage/storable';
import { allItems, containersHolding, hasTotalOf, itemsOfType, totalOf } from './container-query';

function makeContainer(capacity = 100) {
  return createResourceContainer({ capacity });
}

function fuel(amount: number) {
  return createResource(ResourceType.Fuel, amount);
}

function food(amount: number) {
  return createResource(ResourceType.Food, amount);
}

/**
 * Test helper — adds resource to container.
 * Asserts success to fail fast in tests if setup fails.
 */
function addResource(container: ReturnType<typeof makeContainer>, resource: ReturnType<typeof fuel>) {
  const result = container.add(resource);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`Failed to add resource: ${result.error.kind}`);
}

/**
 * Test helper — adds child container.
 * Asserts success to fail fast in tests if setup fails.
 */
function addChild(
  parent: ReturnType<typeof makeContainer>,
  child: ReturnType<typeof makeContainer> | ReturnType<typeof createItemContainer>
) {
  const result = parent.addContainer(child);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`Failed to add container: ${result.error.kind}`);
}

/**
 * Test helper — stores item in container.
 * Asserts success to fail fast in tests if setup fails.
 */
function storeItem(container: ReturnType<typeof createItemContainer>, item: Storable & { readonly id: string }) {
  const result = container.store(item);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`Failed to store item: ${result.error.kind}`);
}

describe('ContainerQuery', () => {
  describe('totalOf', () => {
    it('returns 0 when no containers are provided', () => {
      expect(totalOf(ResourceType.Fuel, [])).toBe(0);
    });

    it('returns 0 when containers hold no resources', () => {
      const a = makeContainer();
      const b = makeContainer();

      expect(totalOf(ResourceType.Fuel, [a, b])).toBe(0);
    });

    it('sums a resource across multiple root containers', () => {
      const a = makeContainer();
      const b = makeContainer();
      addResource(a, fuel(3));
      addResource(b, fuel(5));

      expect(totalOf(ResourceType.Fuel, [a, b])).toBe(8);
    });

    it('includes resources in nested child containers', () => {
      const parent = makeContainer();
      const child = makeContainer(20);
      addResource(child, fuel(4));
      addChild(parent, child);

      expect(totalOf(ResourceType.Fuel, [parent])).toBe(4);
    });

    it('sums resources across both parent and nested child', () => {
      const parent = makeContainer();
      const child = makeContainer(20);
      addResource(parent, fuel(2));
      addResource(child, fuel(4));
      addChild(parent, child);

      expect(totalOf(ResourceType.Fuel, [parent])).toBe(6);
    });

    it('recurses through multiple levels of nesting', () => {
      const grandparent = makeContainer();
      const parent = makeContainer(50);
      const child = makeContainer(20);
      addResource(child, fuel(1));
      addResource(parent, fuel(2));
      addChild(parent, child);
      addChild(grandparent, parent);

      expect(totalOf(ResourceType.Fuel, [grandparent])).toBe(3);
    });

    it('only counts the queried resource type', () => {
      const a = makeContainer();
      addResource(a, fuel(5));
      addResource(a, food(10));

      expect(totalOf(ResourceType.Fuel, [a])).toBe(5);
      expect(totalOf(ResourceType.Food, [a])).toBe(10);
    });
  });

  describe('containersHolding', () => {
    it('returns an empty array when no containers hold the resource', () => {
      const a = makeContainer();
      const b = makeContainer();

      expect(containersHolding(ResourceType.Fuel, [a, b])).toHaveLength(0);
    });

    it('returns only containers that hold the resource', () => {
      const a = makeContainer();
      const b = makeContainer();
      addResource(a, fuel(3));

      const result = containersHolding(ResourceType.Fuel, [a, b]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(a);
    });

    it('includes nested containers that hold the resource', () => {
      const parent = makeContainer();
      const child = makeContainer(20);
      addResource(child, fuel(5));
      addChild(parent, child);

      const result = containersHolding(ResourceType.Fuel, [parent]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(child);
    });

    it('returns both parent and child when both hold the resource', () => {
      const parent = makeContainer();
      const child = makeContainer(20);
      addResource(parent, fuel(2));
      addResource(child, fuel(5));
      addChild(parent, child);

      const result = containersHolding(ResourceType.Fuel, [parent]);

      expect(result).toHaveLength(2);
      expect(result).toContain(parent);
      expect(result).toContain(child);
    });
  });

  describe('hasTotalOf', () => {
    it('returns false when containers are empty', () => {
      const a = makeContainer();

      expect(hasTotalOf(ResourceType.Fuel, 1, [a])).toBe(false);
    });

    it('returns true when total exactly meets the required amount', () => {
      const a = makeContainer();
      addResource(a, fuel(3));

      expect(hasTotalOf(ResourceType.Fuel, 3, [a])).toBe(true);
    });

    it('returns true when total exceeds the required amount', () => {
      const a = makeContainer();
      addResource(a, fuel(10));

      expect(hasTotalOf(ResourceType.Fuel, 5, [a])).toBe(true);
    });

    it('returns false when total is below the required amount', () => {
      const a = makeContainer();
      addResource(a, fuel(2));

      expect(hasTotalOf(ResourceType.Fuel, 5, [a])).toBe(false);
    });

    it('spans multiple containers to meet the required amount', () => {
      const a = makeContainer();
      const b = makeContainer();
      addResource(a, fuel(3));
      addResource(b, fuel(3));

      expect(hasTotalOf(ResourceType.Fuel, 6, [a, b])).toBe(true);
      expect(hasTotalOf(ResourceType.Fuel, 7, [a, b])).toBe(false);
    });

    it('counts resources in nested containers toward the total', () => {
      const parent = makeContainer();
      const child = makeContainer(20);
      addResource(child, fuel(4));
      addChild(parent, child);

      expect(hasTotalOf(ResourceType.Fuel, 4, [parent])).toBe(true);
    });
  });
});

function makeItemContainer(capacity = 100) {
  return createItemContainer({ capacity });
}

function makeItem(id: string, storableType: Storable['storableType'], slotCost = 4): Storable & { readonly id: string } {
  return { id, storableType, slotCost };
}

describe('ContainerQuery — items', () => {
  describe('allItems', () => {
    it('returns empty array when no item containers exist', () => {
      const rc = makeContainer();

      expect(allItems([rc])).toHaveLength(0);
    });

    it('returns items from a standalone ItemContainer', () => {
      const ic = makeItemContainer();
      const item = makeItem('m1', StorableType.Module);
      storeItem(ic, item);

      expect(allItems([ic])).toContain(item);
    });

    it('returns items from an ItemContainer nested inside a ResourceContainer', () => {
      const rc = makeContainer();
      const ic = makeItemContainer(20);
      const item = makeItem('m1', StorableType.Module);
      storeItem(ic, item);
      addChild(rc, ic);

      expect(allItems([rc])).toContain(item);
    });

    it('aggregates items across multiple item containers', () => {
      const ic1 = makeItemContainer();
      const ic2 = makeItemContainer();
      const a = makeItem('a', StorableType.Module);
      const b = makeItem('b', StorableType.Upgrade);
      storeItem(ic1, a);
      storeItem(ic2, b);

      const result = allItems([ic1, ic2]);

      expect(result).toContain(a);
      expect(result).toContain(b);
    });
  });

  describe('itemsOfType', () => {
    it('returns only items matching the requested storableType', () => {
      const ic = makeItemContainer();
      const mod = makeItem('m1', StorableType.Module);
      const upg = makeItem('u1', StorableType.Upgrade);
      storeItem(ic, mod);
      storeItem(ic, upg);

      expect(itemsOfType(StorableType.Module, [ic])).toContain(mod);
      expect(itemsOfType(StorableType.Module, [ic])).not.toContain(upg);
    });

    it('returns empty array when no items of that type exist', () => {
      const ic = makeItemContainer();
      storeItem(ic, makeItem('m1', StorableType.Module));

      expect(itemsOfType(StorableType.Upgrade, [ic])).toHaveLength(0);
    });

    it('traverses nested item containers', () => {
      const rc = makeContainer();
      const ic = makeItemContainer(20);
      const item = makeItem('m1', StorableType.Module);
      ic.store(item);
      rc.addContainer(ic);

      expect(itemsOfType(StorableType.Module, [rc])).toContain(item);
    });
  });
});
