import type { Resource, ResourceType } from '@/domain/models/resources/resource';
import type { ResourceContainer, ResourceContainerOptions } from '@/domain/models/resources/resource-container';
import { createResourceContainer } from '@/domain/models/resources/resource-container';
import type { ItemContainer, ItemContainerOptions } from '@/domain/models/storage/item-container';
import { createItemContainer } from '@/domain/models/storage/item-container';
import type { Storable } from '@/domain/models/storage/storable';
import { err, ok, type Result } from '@/shared/result';
import { generateId } from '@/shared/id-utils';

export interface PerishableItem {
  /** UTC timestamp in ms when the item becomes spoiled. */
  readonly expiresAtMs: number;
}

export interface InventoryOptions {
  id?: string;
  items?: ItemContainerOptions;
  resources?: ResourceContainerOptions;
}

/**
 * Composite domain entity pairing an ItemContainer with a ResourceContainer.
 * Acts as the base for higher-order models such as ships, stations, cargo drones, and shops.
 *
 * Forwarded resource methods:
 *   getResource(id)          — amount of a resource type held
 *   addResource(resource)    — add resource; returns refused remainder
 *   destroyResource(resource)— remove and discard up to the given amount
 *   hasResource(resource)    — true if the amount is available
 *   hasAllResources(list)    — true if every resource in the list is available
 *
 * Forwarded item methods:
 *   storeItem(item)          — store an item; returns false if no space
 *   takeItem(id)             — remove and return item by id
 *   hasItem(id)              — true if item is present
 *   listItems()              — all stored items
 */
export interface Inventory {
  readonly id: string;
  readonly items: ItemContainer;
  readonly resources: ResourceContainer;

  // Resource convenience
  getResource(id: ResourceType): number;
  addResource(resource: Resource): number;
  destroyResource(resource: Resource): void;
  hasResource(resource: Resource): boolean;
  hasAllResources(resources: readonly Resource[]): boolean;

  // Item convenience
  storeItem(item: Storable & { readonly id: string }): boolean;
  takeItem(id: string): (Storable & { readonly id: string }) | undefined;
  hasItem(id: string): boolean;
  listItems(): readonly (Storable & { readonly id: string })[];

  /** Marks expired items as spoiled based on the provided wall-clock time. */
  advanceLifecycle(nowMs: number): void;

  /** Returns true when the item has been marked as spoiled. */
  isItemSpoiled(id: string): boolean;

  /** Removes all spoiled items from inventory and returns the number purged. */
  purgeSpoiledItems(): number;

  /**
   * Transfers all resources and all items from this inventory into `target`.
   * Resources are moved first; then items are stored in target if space allows.
   * Returns the amounts refused — enforces that the two containers are treated
   * as a co-owned unit and cannot be partially transferred without tracking loss.
   */
  transfer(target: Inventory): { resourcesRefused: number; itemsRefused: number };

  /**
   * Atomically transfers selected resources (by type, full available amount) and selected items.
   * On any failure, all prior moves in this operation are rolled back.
   */
  transferBatch(
    target: Inventory,
    itemIds: readonly string[],
    resourceIds: readonly ResourceType[]
  ): Result<void, string>;
}

export function createInventory(options: InventoryOptions = {}): Inventory {
  const {
    id = generateId(),
    items: itemOptions = {},
    resources: resourceOptions = {},
  } = options;

  const items = createItemContainer(itemOptions);
  const resources = createResourceContainer(resourceOptions);
  const spoiledItemIds = new Set<string>();

  function isPerishable(item: Storable & { readonly id: string }): item is (Storable & { readonly id: string } & PerishableItem) {
    return 'expiresAtMs' in item && typeof (item as PerishableItem).expiresAtMs === 'number';
  }

  function markSpoilage(nowMs: number): void {
    for (const item of items.list()) {
      if (isPerishable(item) && item.expiresAtMs <= nowMs) {
        spoiledItemIds.add(item.id);
      }
    }
  }

  return {
    id,
    items,
    resources,

    getResource: (type) => resources.get(type),
    addResource: (resource) => {
      const result = resources.add(resource);
      return result.ok ? result.value : resource.amount;
    },
    destroyResource: (resource) => resources.destroy(resource),
    hasResource: (resource) => resources.has(resource),
    hasAllResources: (list) => resources.hasAll(list),

    storeItem: (item) => {
      const result = items.store(item);
      return result.ok;
    },
    takeItem: (itemId) => {
      const taken = items.take(itemId);
      if (taken) spoiledItemIds.delete(itemId);
      return taken;
    },
    hasItem: (itemId) => items.has(itemId),
    listItems: () => items.list(),

    advanceLifecycle(nowMs) {
      markSpoilage(nowMs);
    },

    isItemSpoiled(itemId) {
      return spoiledItemIds.has(itemId);
    },

    purgeSpoiledItems() {
      let purged = 0;

      for (const itemId of Array.from(spoiledItemIds)) {
        const removed = items.take(itemId);
        if (removed) purged++;
        spoiledItemIds.delete(itemId);
      }

      return purged;
    },

    transfer(target) {
      const resourcesRefused = resources.moveAll(target.resources);

      let itemsRefused = 0;

      for (const item of items.list()) {
        items.take(item.id);
        const storeResult = target.items.store(item);
        if (!storeResult.ok) {
          items.store(item);
          itemsRefused++;
        }
      }

      return { resourcesRefused, itemsRefused };
    },

    transferBatch(target, itemIds, resourceIds) {
      const uniqueItemIds = Array.from(new Set(itemIds));
      const uniqueResourceIds = Array.from(new Set(resourceIds));

      const movedItems: Array<Storable & { readonly id: string }> = [];
      const movedResources: Array<{ id: ResourceType; amount: number }> = [];

      const rollback = () => {
        for (let i = movedItems.length - 1; i >= 0; i--) {
          const item = movedItems[i];
          target.items.take(item.id);
          items.store(item);
        }

        for (let i = movedResources.length - 1; i >= 0; i--) {
          const moved = movedResources[i];
          target.resources.destroy(moved);
          resources.add(moved);
        }
      };

      for (const resourceId of uniqueResourceIds) {
        const amount = resources.get(resourceId);
        if (amount <= 0) {
          rollback();
          return err(`Resource '${resourceId}' is not available for batch transfer`);
        }

        const payload = { id: resourceId, amount };
        resources.destroy(payload);

        const addResult = target.resources.add(payload);
        if (!addResult.ok || addResult.value > 0) {
          resources.add(payload);
          rollback();
          return err(`Failed to transfer resource '${resourceId}' atomically`);
        }

        movedResources.push(payload);
      }

      for (const itemId of uniqueItemIds) {
        const item = items.take(itemId);
        if (!item) {
          rollback();
          return err(`Item '${itemId}' not found for batch transfer`);
        }

        const storeResult = target.items.store(item);
        if (!storeResult.ok) {
          items.store(item);
          rollback();
          return err(`Failed to transfer item '${itemId}' atomically`);
        }

        movedItems.push(item);
      }

      return ok(undefined);
    },
  };
}
