import { describe, expect, it } from 'vitest';

import { createInventory } from '@/domain/models/inventory/inventory';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { StorableType } from '@/domain/models/storage/storable';

function makeItem(id: string, slotCost = 1) {
  return { id, slotCost, storableType: StorableType.Module };
}

describe('createInventory', () => {

  it('has a stable id', () => {
    const inv = createInventory({ id: 'inv-1' });

    expect(inv.id).toBe('inv-1');
  });

  it('generates a unique id when none is provided', () => {
    const a = createInventory();
    const b = createInventory();

    expect(a.id).not.toBe(b.id);
  });

  it('exposes items and resources containers', () => {
    const inv = createInventory();

    expect(inv.items).toBeDefined();
    expect(inv.resources).toBeDefined();
  });

});

describe('Inventory — resource convenience methods', () => {

  it('getResource returns 0 when nothing has been added', () => {
    const inv = createInventory();

    expect(inv.getResource(ResourceType.Food)).toBe(0);
  });

  it('addResource stores the amount and returns refused remainder', () => {
    const inv = createInventory({ resources: { capacity: 5 } });

    const refused = inv.addResource(createResource(ResourceType.Food, 3));

    expect(refused).toBe(0);
    expect(inv.getResource(ResourceType.Food)).toBe(3);
  });

  it('hasResource returns true when enough resources are held', () => {
    const inv = createInventory();
    inv.addResource(createResource(ResourceType.Water, 10));

    expect(inv.hasResource({ id: ResourceType.Water, amount: 5 })).toBe(true);
    expect(inv.hasResource({ id: ResourceType.Water, amount: 10 })).toBe(true);
    expect(inv.hasResource({ id: ResourceType.Water, amount: 11 })).toBe(false);
  });

  it('hasAllResources returns true only when every resource is satisfied', () => {
    const inv = createInventory();
    inv.addResource(createResource(ResourceType.Food, 5));
    inv.addResource(createResource(ResourceType.Water, 5));

    const resources = [
      { id: ResourceType.Food, amount: 5 },
      { id: ResourceType.Water, amount: 5 },
    ] as const;

    expect(inv.hasAllResources(resources)).toBe(true);
    expect(inv.hasAllResources([{ id: ResourceType.Food, amount: 6 }, { id: ResourceType.Water, amount: 5 }])).toBe(false);
  });

  it('destroyResource removes the requested amount', () => {
    const inv = createInventory();
    inv.addResource(createResource(ResourceType.Fuel, 10));

    inv.destroyResource({ id: ResourceType.Fuel, amount: 4 });

    expect(inv.getResource(ResourceType.Fuel)).toBe(6);
  });

});

describe('Inventory — item convenience methods', () => {

  it('storeItem returns true and makes item findable', () => {
    const inv = createInventory({ items: { capacity: 10 } });
    const item = makeItem('mod-1', 2);

    const stored = inv.storeItem(item);

    expect(stored).toBe(true);
    expect(inv.hasItem('mod-1')).toBe(true);
  });

  it('storeItem returns false when no space remains', () => {
    const inv = createInventory({ items: { capacity: 1 } });
    inv.storeItem(makeItem('mod-1', 1));

    expect(inv.storeItem(makeItem('mod-2', 1))).toBe(false);
  });

  it('takeItem removes and returns the item', () => {
    const inv = createInventory({ items: { capacity: 10 } });
    const item = makeItem('mod-1', 2);
    inv.storeItem(item);

    const taken = inv.takeItem('mod-1');

    expect(taken).toBe(item);
    expect(inv.hasItem('mod-1')).toBe(false);
  });

  it('takeItem returns undefined for unknown id', () => {
    const inv = createInventory();

    expect(inv.takeItem('no-such-item')).toBeUndefined();
  });

  it('listItems returns all stored items', () => {
    const inv = createInventory({ items: { capacity: 20 } });
    const a = makeItem('a', 2);
    const b = makeItem('b', 3);
    inv.storeItem(a);
    inv.storeItem(b);

    expect(inv.listItems()).toContain(a);
    expect(inv.listItems()).toContain(b);
  });

});

describe('Inventory.transfer', () => {

  it('moves all resources to target', () => {
    const source = createInventory();
    const target = createInventory();
    source.addResource(createResource(ResourceType.Food, 5));

    source.transfer(target);

    expect(source.getResource(ResourceType.Food)).toBe(0);
    expect(target.getResource(ResourceType.Food)).toBe(5);
  });

  it('moves all items to target', () => {
    const source = createInventory({ items: { capacity: 10 } });
    const target = createInventory({ items: { capacity: 10 } });
    source.storeItem(makeItem('x', 2));

    source.transfer(target);

    expect(source.hasItem('x')).toBe(false);
    expect(target.hasItem('x')).toBe(true);
  });

  it('reports resourcesRefused when target lacks capacity', () => {
    const source = createInventory();
    const target = createInventory({ resources: { capacity: 2 } });
    source.addResource(createResource(ResourceType.Food, 10));

    const { resourcesRefused } = source.transfer(target);

    expect(resourcesRefused).toBeGreaterThan(0);
  });

  it('reports itemsRefused when target lacks item capacity', () => {
    const source = createInventory({ items: { capacity: 10 } });
    const target = createInventory({ items: { capacity: 0 } });
    source.storeItem(makeItem('x', 1));

    const { itemsRefused } = source.transfer(target);

    expect(itemsRefused).toBe(1);
  });

  it('returns zero refused counts when transfer succeeds completely', () => {
    const source = createInventory({ items: { capacity: 10 } });
    const target = createInventory({ items: { capacity: 10 } });
    source.addResource(createResource(ResourceType.Water, 3));
    source.storeItem(makeItem('item-1', 2));

    const result = source.transfer(target);

    expect(result.resourcesRefused).toBe(0);
    expect(result.itemsRefused).toBe(0);
  });

});
