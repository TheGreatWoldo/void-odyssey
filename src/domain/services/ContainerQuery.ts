import type { ResourceType } from '@/domain/models/resources/resource';
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
    .filter((n): n is ResourceContainer => 'get' in n)
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
    .filter((n): n is ResourceContainer => 'get' in n && n.get(type) > 0);
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
    .filter((n): n is ItemContainer => 'list' in n)
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
    .filter((n): n is ItemContainer => 'list' in n)
    .flatMap(c => c.list());
}
