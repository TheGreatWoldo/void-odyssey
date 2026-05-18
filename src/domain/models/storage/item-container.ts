import type { Result } from '@/shared/result';
import { err, ok } from '@/shared/result';
import { generateId } from '@/shared/id-utils';

import type { ItemContainerError } from '@/domain/models/resources/container-errors';
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
 * store()  — adds the item if it fits; returns Ok(void) on success or Err(error) if rejected.
 * take()   — removes and returns the item with the given id, or undefined if absent.
 * has()    — returns true if an item with the given id is present.
 * list()   — returns all stored items.
 */
export interface ItemContainer extends IStorageNode {
  readonly labelKey: string;
  readonly kind: 'item';
  /**
   * Stores the item if it fits.
   * Returns Ok(void) on success.
   * Returns Err(error) if the container is full or rejects this item type.
   */
  store(item: Storable & { readonly id: string }): Result<void, ItemContainerError>;
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

  function store(item: Storable & { readonly id: string }): Result<void, ItemContainerError> {
    if (whitelist !== null && !whitelist.has(item.storableType)) {
      return err({
        kind: 'type-not-accepted',
        itemType: item.storableType,
      });
    }

    if (item.slotCost > freeSpace()) {
      return err({
        kind: 'full',
        requestedSlots: item.slotCost,
        available: freeSpace(),
      });
    }

    items.set(item.id, item);
    usedSpace += item.slotCost;

    return ok(undefined);
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
