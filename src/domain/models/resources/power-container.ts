import { generateId } from '@/shared/utils';

import type { IStorageNode } from '../storage/storage-node';
import type { Resource } from './resource';
import { ResourceType } from './resource';
import type { ResourceContainer, ResourceContainerOptions } from './resource-container';
import { createResourceContainer } from './resource-container';

/**
 * Composite ResourceContainer that routes all Power through an ordered list of
 * battery ResourceContainers.
 *
 * - add(Power, n)      — fills batteries left-to-right; excess is refused
 * - destroy(Power, n)  — drains batteries left-to-right
 * - get(Power)         — sum across all batteries
 * - freeSpace()        — sum of free space across all batteries
 * - capacity           — sum of battery capacities (dynamic, updated on add/remove)
 *
 * Only ResourceType.Power is accepted — all other types are refused immediately.
 *
 * Batteries are added and removed via addContainer() / removeContainer().
 * The composite does NOT reserve space from any parent — it IS the top-level
 * store for Power and is placed directly into the ContainerMap at the Power key.
 */
export interface PowerContainer extends ResourceContainer {
  readonly kind: 'resource';
}

export function createPowerContainer(options: { id?: string; labelKey?: string } = {}): PowerContainer {
  const {
    id = generateId(),
    labelKey = 'power',
  } = options;

  const batteries: ResourceContainer[] = [];

  // Per-tick transfer buffer — avoids allocating a Resource object on every call.
  const transferBuffer: { id: ResourceType; amount: number } = {
    id: ResourceType.Power,
    amount: 0,
  };

  function totalCapacity(): number {
    let sum = 0;
    for (const b of batteries) sum += b.capacity;
    return sum;
  }

  function freeSpace(): number {
    let sum = 0;
    for (const b of batteries) sum += b.freeSpace();
    return sum;
  }

  function get(_id: ResourceType): number {
    // Only Power is tracked — any other type would always be 0.
    let sum = 0;
    for (const b of batteries) sum += b.get(ResourceType.Power);
    return sum;
  }

  function accepts(type: ResourceType): boolean {
    return type === ResourceType.Power;
  }

  function freeSpaceFor(type: ResourceType): number {
    if (type !== ResourceType.Power) return 0;
    return freeSpace();
  }

  function add(resource: Resource): number {
    if (resource.id !== ResourceType.Power) return resource.amount;

    let remaining = resource.amount;

    for (const b of batteries) {
      if (remaining <= 0) break;
      transferBuffer.amount = remaining;
      remaining = b.add(transferBuffer);
    }

    return remaining;
  }

  function destroy(resource: Resource): void {
    if (resource.id !== ResourceType.Power) return;

    let remaining = resource.amount;

    for (const b of batteries) {
      if (remaining <= 0) break;
      const available = b.get(ResourceType.Power);
      const toConsume = Math.min(remaining, available);
      if (toConsume > 0) {
        transferBuffer.amount = toConsume;
        b.destroy(transferBuffer);
        remaining -= toConsume;
      }
    }
  }

  function has(resource: Resource): boolean {
    if (resource.id !== ResourceType.Power) return resource.amount === 0;
    return get(ResourceType.Power) >= resource.amount;
  }

  function hasAll(resources: readonly Resource[]): boolean {
    return resources.every(r => has(r));
  }

  function moveTo(resource: Resource, target: ResourceContainer): number {
    if (resource.id !== ResourceType.Power) return resource.amount;

    const actual = Math.min(resource.amount, get(ResourceType.Power));
    if (actual <= 0) return 0;

    destroy({ id: ResourceType.Power, amount: actual });

    transferBuffer.amount = actual;
    const refused = target.add(transferBuffer);

    if (refused > 0) {
      transferBuffer.amount = refused;
      add(transferBuffer);
    }

    return refused;
  }

  function moveAll(target: ResourceContainer): number {
    const total = get(ResourceType.Power);
    if (total <= 0) return 0;
    return moveTo({ id: ResourceType.Power, amount: total }, target);
  }

  function addContainer(container: ResourceContainer): boolean {
    batteries.push(container);
    return true;
  }

  function removeContainer(container: ResourceContainer): void {
    const idx = batteries.indexOf(container);
    if (idx !== -1) batteries.splice(idx, 1);
  }

  function getContainers(): readonly ResourceContainer[] {
    return batteries;
  }

  function getStorageNodes(): readonly IStorageNode[] {
    return batteries;
  }

  return {
    id,
    kind: 'resource' as const,
    labelKey,

    get capacity() { return totalCapacity(); },

    get,
    accepts,
    freeSpaceFor,
    freeSpace,
    add,
    destroy,
    has,
    hasAll,
    moveTo,
    moveAll,
    addContainer,
    removeContainer,
    getContainers,
    getStorageNodes,
  };
}

/**
 * Creates a battery ResourceContainer — a plain ResourceContainer that accepts
 * only Power, with a fixed capacity cap.
 */
export function createBatteryContainer(options: ResourceContainerOptions & { capacity: number }): ResourceContainer {
  return createResourceContainer({
    ...options,
    perTypeCapacity: { [ResourceType.Power]: null },
  });
}
