import type { ResourceType } from '@/domain/models/resources/resource';
import type { ResourceContainer } from '@/domain/models/resources/resource-container';

/**
 * Recursively collects all containers in the tree rooted at each entry in `roots`,
 * including the roots themselves.
 */
function flatten(roots: readonly ResourceContainer[]): ResourceContainer[] {
  const result: ResourceContainer[] = [];

  function walk(container: ResourceContainer): void {
    result.push(container);

    for (const child of container.getContainers()) {
      walk(child);
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return result;
}

/**
 * Returns the total amount of a resource type across all containers and their
 * nested descendants.
 */
export function totalOf(
  type: ResourceType,
  roots: readonly ResourceContainer[]
): number {
  return flatten(roots).reduce((sum, c) => sum + c.get(type), 0);
}

/**
 * Returns all containers (including nested descendants) that hold at least one
 * unit of the given resource type.
 */
export function containersHolding(
  type: ResourceType,
  roots: readonly ResourceContainer[]
): ResourceContainer[] {
  return flatten(roots).filter(c => c.get(type) > 0);
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
