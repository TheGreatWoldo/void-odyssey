import type { Inventory } from '@/domain/models/inventory/inventory';
import type { Resource, ResourceType } from '@/domain/models/resources/resource';
import type { ResourceContainer } from '@/domain/models/resources/resource-container';
import type { ItemContainer } from '@/domain/models/storage/item-container';
import type { Storable, StorableType } from '@/domain/models/storage/storable';
import type { IStorageNode } from '@/domain/models/storage/storage-node';

/**
 * Recursively collects all IStorageNodes in the tree rooted at each entry in `roots`,
 * including the roots themselves.
 */
function flattenNodes(roots: readonly IStorageNode[]): IStorageNode[] {
  const result: IStorageNode[] = [];

  function walk(node: IStorageNode): void {
    result.push(node);

    for (const child of node.getStorageNodes()) {
      walk(child);
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return result;
}

/**
 * Returns the total amount of a resource type across all ResourceContainers and their
 * nested descendants.
 */
export function totalOf(
  type: ResourceType,
  roots: readonly ResourceContainer[]
): number {
  return flattenNodes(roots)
    .filter((n): n is ResourceContainer => n.kind === 'resource')
    .reduce((sum, c) => sum + c.get(type), 0);
}

/**
 * Returns all ResourceContainers (including nested descendants) that hold at least one
 * unit of the given resource type.
 */
export function containersHolding(
  type: ResourceType,
  roots: readonly ResourceContainer[]
): ResourceContainer[] {
  return flattenNodes(roots)
    .filter((n): n is ResourceContainer => n.kind === 'resource')
    .filter(c => c.get(type) > 0);
}

/**
 * Returns true if the total amount of a resource across all containers and their
 * nested descendants meets or exceeds the required amount.
 */
export function hasTotalOf(
  type: ResourceType,
  amount: number,
  roots: readonly ResourceContainer[]
): boolean {
  return totalOf(type, roots) >= amount;
}

/**
 * Returns all instance items of a given storableType across all ItemContainers
 * reachable from the provided roots.
 */
export function itemsOfType(
  storableType: StorableType,
  roots: readonly IStorageNode[]
): (Storable & { readonly id: string })[] {
  return flattenNodes(roots)
    .filter((n): n is ItemContainer => n.kind === 'item')
    .flatMap(c => c.list())
    .filter(item => item.storableType === storableType);
}

/**
 * Returns all instance items across all ItemContainers reachable from the provided roots.
 */
export function allItems(
  roots: readonly IStorageNode[]
): (Storable & { readonly id: string })[] {
  return flattenNodes(roots)
    .filter((n): n is ItemContainer => n.kind === 'item')
    .flatMap(c => c.list());
}

// ---------------------------------------------------------------------------
// Inventory-aware queries
// ---------------------------------------------------------------------------

/**
 * Returns the total amount of a resource type across the resource containers
 * of all provided inventories (including nested descendants).
 */
export function totalOfInInventories(
  type: ResourceType,
  inventories: readonly Inventory[]
): number {
  return totalOf(type, inventories.map(inv => inv.resources));
}

/**
 * Returns true if the combined resource total across all inventories meets
 * or exceeds the required amount.
 */
export function hasTotalOfInInventories(
  type: ResourceType,
  amount: number,
  inventories: readonly Inventory[]
): boolean {
  return totalOfInInventories(type, inventories) >= amount;
}

/**
 * Returns all ResourceContainers (including nested descendants) from the given
 * inventories that hold at least one unit of the specified resource type.
 */
export function containersHoldingInInventories(
  type: ResourceType,
  inventories: readonly Inventory[]
): ResourceContainer[] {
  return containersHolding(type, inventories.map(inv => inv.resources));
}

/**
 * Returns true if all supplied resources are satisfiable across the combined
 * resource containers of the provided inventories.
 */
export function inventoriesHaveAll(
  resources: readonly Resource[],
  inventories: readonly Inventory[]
): boolean {
  return resources.every(r =>
    totalOfInInventories(r.id, inventories) >= r.amount
  );
}

/**
 * Returns all stored items of a given storableType across the item containers
 * of all provided inventories.
 */
export function itemsOfTypeInInventories(
  storableType: StorableType,
  inventories: readonly Inventory[]
): (Storable & { readonly id: string })[] {
  return inventories.flatMap(inv => inv.listItems())
    .filter(item => item.storableType === storableType);
}

/**
 * Returns all stored items across the item containers of all provided inventories.
 */
export function allItemsInInventories(
  inventories: readonly Inventory[]
): (Storable & { readonly id: string })[] {
  return inventories.flatMap(inv => inv.listItems());
}
