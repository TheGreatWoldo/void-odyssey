import { generateId } from '@/shared/utils';

import type { Storable, StorableType } from './storable';
import type { IStorageNode } from './storage-node';

export interface ItemContainerOptions {
  /** Stable identity. Defaults to a generated UUID if omitted. */
  id?: string;
  labelKey?: string;
  capacity?: number;
  /** When set, only items whose storableType is in this list will be accepted by store(). */
  allowedTypes?: StorableType[];
}

/**
 * Bounded storage for instance items — objects that implement Storable and
 * carry their own identity and state (e.g. ProductionModule, ModuleUpgrade).
 *
 * store()  — adds the item if it fits; returns false if there is not enough space.
 * take()   — removes and returns the item with the given id, or undefined if absent.
 * has()    — returns true if an item with the given id is present.
 * list()   — returns all stored items.
 */
export interface ItemContainer extends IStorageNode {
  readonly labelKey: string;
  readonly kind: 'item';
  store(item: Storable & { readonly id: string }): boolean;
  take(id: string): (Storable & { readonly id: string }) | undefined;
  has(id: string): boolean;
  list(): readonly (Storable & { readonly id: string })[];
}

export function createItemContainer(
  options: ItemContainerOptions = {}
): ItemContainer {
  const {
    id = generateId(),
    labelKey = 'item-container',
    capacity = Infinity,
    allowedTypes,
  } = options;

  const whitelist = allowedTypes ? new Set(allowedTypes) : null;
  const items = new Map<string, Storable & { readonly id: string }>();
  let usedSpace = 0;

  function freeSpace(): number {
    return capacity - usedSpace;
  }

  function store(item: Storable & { readonly id: string }): boolean {
    if (whitelist !== null && !whitelist.has(item.storableType)) return false;
    if (item.slotCost > freeSpace()) return false;

    items.set(item.id, item);
    usedSpace += item.slotCost;

    return true;
  }

  function take(itemId: string): (Storable & { readonly id: string }) | undefined {
    const item = items.get(itemId);

    if (item === undefined) return undefined;
    items.delete(itemId);
    usedSpace -= item.slotCost;

    return item;
  }

  function has(itemId: string): boolean {
    return items.has(itemId);
  }

  function list(): readonly (Storable & { readonly id: string })[] {
    return Array.from(items.values());
  }

  function getStorageNodes(): readonly IStorageNode[] {
    return [];
  }

  return {
    id,
    kind: 'item' as const,
    labelKey,
    capacity,
    freeSpace,
    store,
    take,
    has,
    list,
    getStorageNodes,
  };
}
