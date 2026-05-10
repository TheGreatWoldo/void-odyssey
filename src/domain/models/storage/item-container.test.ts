import { describe, expect, it } from 'vitest';

import { createItemContainer } from '@/domain/models/storage/item-container';
import type { Storable } from '@/domain/models/storage/storable';

function makeItem(id: string, slotCost: number): Storable & { readonly id: string } {
  return { id, slotCost, storableType: 'module' as const };
}

describe('createItemContainer', () => {
  describe('store / has / list', () => {
    it('starts empty with full free space', () => {
      const c = createItemContainer({ capacity: 10 });

      expect(c.list()).toHaveLength(0);
      expect(c.freeSpace()).toBe(10);
    });

    it('stores an item and reduces free space by its slotCost', () => {
      const c = createItemContainer({ capacity: 10 });
      const item = makeItem('a', 4);

      const stored = c.store(item);

      expect(stored).toBe(true);
      expect(c.has('a')).toBe(true);
      expect(c.freeSpace()).toBe(6);
    });

    it('returns false and does not store when item exceeds free space', () => {
      const c = createItemContainer({ capacity: 3 });
      const item = makeItem('a', 5);

      const stored = c.store(item);

      expect(stored).toBe(false);
      expect(c.has('a')).toBe(false);
      expect(c.freeSpace()).toBe(3);
    });

    it('stores multiple items that together fill capacity exactly', () => {
      const c = createItemContainer({ capacity: 8 });

      expect(c.store(makeItem('a', 5))).toBe(true);
      expect(c.store(makeItem('b', 3))).toBe(true);
      expect(c.freeSpace()).toBe(0);
    });

    it('rejects item when no space remains', () => {
      const c = createItemContainer({ capacity: 4 });
      c.store(makeItem('a', 4));

      expect(c.store(makeItem('b', 1))).toBe(false);
    });

    it('list returns all stored items', () => {
      const c = createItemContainer({ capacity: 20 });
      const a = makeItem('a', 2);
      const b = makeItem('b', 3);
      c.store(a);
      c.store(b);

      expect(c.list()).toContain(a);
      expect(c.list()).toContain(b);
    });

    it('unbounded container accepts any amount', () => {
      const c = createItemContainer();

      for (let i = 0; i < 100; i++) {
        expect(c.store(makeItem(`item-${i}`, 999))).toBe(true);
      }
    });
  });

  describe('has', () => {
    it('returns false for unknown id', () => {
      const c = createItemContainer({ capacity: 10 });

      expect(c.has('x')).toBe(false);
    });

    it('returns true after item is stored', () => {
      const c = createItemContainer({ capacity: 10 });
      c.store(makeItem('x', 1));

      expect(c.has('x')).toBe(true);
    });
  });

  describe('take', () => {
    it('removes the item and returns it', () => {
      const c = createItemContainer({ capacity: 10 });
      const item = makeItem('a', 4);
      c.store(item);

      const taken = c.take('a');

      expect(taken).toBe(item);
      expect(c.has('a')).toBe(false);
      expect(c.freeSpace()).toBe(10);
    });

    it('restores free space after taking', () => {
      const c = createItemContainer({ capacity: 10 });
      c.store(makeItem('a', 6));
      c.take('a');

      expect(c.freeSpace()).toBe(10);
    });

    it('returns undefined for an unknown id', () => {
      const c = createItemContainer({ capacity: 10 });

      expect(c.take('missing')).toBeUndefined();
    });

    it('allows a new item to be stored after taking', () => {
      const c = createItemContainer({ capacity: 4 });
      c.store(makeItem('a', 4));
      c.take('a');

      expect(c.store(makeItem('b', 4))).toBe(true);
    });
  });

  describe('getStorageNodes', () => {
    it('always returns an empty array — ItemContainer does not nest', () => {
      const c = createItemContainer({ capacity: 10 });

      expect(c.getStorageNodes()).toHaveLength(0);
    });
  });
});
