import { generateId } from '@/shared/utils';

import type { Resource, ResourceType } from '../resources/resource';
import type { ResourceContainer, ResourceContainerOptions } from '../resources/resource-container';
import { createResourceContainer } from '../resources/resource-container';
import type { ItemContainer, ItemContainerOptions } from '../storage/item-container';
import { createItemContainer } from '../storage/item-container';
import type { Storable } from '../storage/storable';

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

  /**
   * Transfers all resources and all items from this inventory into `target`.
   * Resources are moved first; then items are stored in target if space allows.
   * Returns the amounts refused — enforces that the two containers are treated
   * as a co-owned unit and cannot be partially transferred without tracking loss.
   */
  transfer(target: Inventory): { resourcesRefused: number; itemsRefused: number };
}

export function createInventory(options: InventoryOptions = {}): Inventory {
  const {
    id = generateId(),
    items: itemOptions = {},
    resources: resourceOptions = {},
  } = options;

  const items = createItemContainer(itemOptions);
  const resources = createResourceContainer(resourceOptions);

  return {
    id,
    items,
    resources,

    getResource: (type) => resources.get(type),
    addResource: (resource) => resources.add(resource),
    destroyResource: (resource) => resources.destroy(resource),
    hasResource: (resource) => resources.has(resource),
    hasAllResources: (list) => resources.hasAll(list),

    storeItem: (item) => items.store(item),
    takeItem: (itemId) => items.take(itemId),
    hasItem: (itemId) => items.has(itemId),
    listItems: () => items.list(),

    transfer(target) {
      const resourcesRefused = resources.moveAll(target.resources);

      let itemsRefused = 0;

      for (const item of items.list()) {
        items.take(item.id);
        if (!target.items.store(item)) {
          items.store(item);
          itemsRefused++;
        }
      }

      return { resourcesRefused, itemsRefused };
    },
  };
}
