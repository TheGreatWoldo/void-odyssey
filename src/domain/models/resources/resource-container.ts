import { generateId } from '@/shared/utils';
import type { Resource } from './resource';
import { ResourceSizes, ResourceType } from './resource';

/**
 * A map from resource type to the container that holds it.
 * Resolved once at module install time and passed to produce() and drain().
 */
export type ContainerMap = ReadonlyMap<ResourceType, ResourceContainer>;

/** Options for creating a ResourceContainer. Omit capacity for an unbounded container. */
export interface ResourceContainerOptions {
  /** Stable identity for this container. Defaults to a generated UUID if omitted. */
  id?: string;
  labelKey?: string;
  capacity?: number;
  allowedResources?: ResourceType[];
}

/**
 * Bounded, typed storage for resources.
 * add()            — accepts what fits, returns any refused remainder.
 * destroy()        — removes up to the requested amount and discards it.
 * moveTo()         — transfers what is available; excess refused by target is returned to source.
 * addContainer()   — nests a child container, consuming its full capacity from this container's space.
 * removeContainer()— removes a previously added child container, freeing its capacity.
 * getContainers()  — returns all nested child containers.
 */
export interface ResourceContainer {
  readonly id: string;
  readonly labelKey: string;
  readonly capacity: number;
  get(id: ResourceType): number;
  /** Returns true if this container is allowed to hold resources of this type. */
  accepts(id: ResourceType): boolean;
  /** Adds as much of the resource as fits. Returns the refused remainder amount. */
  add(resource: Resource): number;
  destroy(resource: Resource): void;
  has(resource: Resource): boolean;
  /** Moves as much of the resource as available into target. Returns the refused remainder amount. */
  moveTo(resource: Resource, target: ResourceContainer): number;
  /** Moves all resources into target. Returns the total amount refused by the target (resource conservation). */
  moveAll(target: ResourceContainer): number;
  /** Returns true if all supplied resources are individually satisfiable by this container. */
  hasAll(resources: readonly Resource[]): boolean;
  freeSpace(): number;
  addContainer(container: ResourceContainer): boolean;
  removeContainer(container: ResourceContainer): void;
  getContainers(): readonly ResourceContainer[];
}

export function createResourceContainer(
  options: ResourceContainerOptions = {}
): ResourceContainer {
  // --- State ---

  const {
    id = generateId(),
    labelKey = 'container',
    capacity = Infinity,
    allowedResources,
  } = options;
  const whitelist = allowedResources ? new Set(allowedResources) : null;
  const store = new Map<ResourceType, number>();
  const children: ResourceContainer[] = [];
  let childCapacityUsed = 0;
  // Incrementally tracked to avoid a full Map iteration on every freeSpace() call.
  // Accepts minor float drift over long sessions in exchange for O(1) space queries.
  let usedSpace = 0;
  // Operation counter used to trigger periodic revalidation of usedSpace.
  // Float drift accumulates over thousands of add/destroy calls; revalidating every 1024 ops
  // corrects it before it can cause allocation bugs. The 1024 interval (bitmask check) is
  // chosen to keep the revalidation cost negligible vs. the savings from O(1) freeSpace().
  let _opCount = 0;

  // --- Helpers ---

  function freeSpace(): number {
    return capacity - usedSpace - childCapacityUsed;
  }

  /** Recomputes usedSpace from the store — corrects any accumulated float drift. */
  function revalidateUsedSpace(): void {
    let actual = 0;
    for (const [id, amount] of store.entries()) {
      actual += amount * slotCost(id);
    }
    usedSpace = actual;
  }

  /** Returns false if the container has an allowedResources whitelist that excludes this id. */
  function isAllowed(id: ResourceType): boolean {
    return whitelist === null || whitelist.has(id);
  }

  /** Slot cost for one unit. Non-zero for resources listed in ResourceSizes (cargo types and Power); zero for all other stat types. */
  function slotCost(id: ResourceType): number {
    return ResourceSizes[id as keyof typeof ResourceSizes] ?? 0;
  }

  /** How many units of a resource fit given current free space. Stat resources (slot cost 0) always fit. */
  function fitsInSpace(id: ResourceType, amount: number): number {
    const cost = slotCost(id);
    return cost > 0 ? Math.floor(freeSpace() / cost) : amount;
  }

  /** Writes units directly into the store. */
  function deposit(id: ResourceType, amount: number): void {
    if (amount <= 0) return;
    store.set(id, get(id) + amount);
    usedSpace += amount * slotCost(id);
    if ((++_opCount & 0x3ff) === 0) revalidateUsedSpace();
  }

  /** Removes units directly from the store. */
  function withdraw(id: ResourceType, amount: number): void {
    if (amount <= 0) return;
    const current = get(id);
    const actual = Math.min(amount, current);
    store.set(id, current - actual);
    usedSpace -= actual * slotCost(id);
    if ((++_opCount & 0x3ff) === 0) revalidateUsedSpace();
  }

  // --- Public API ---

  function get(id: ResourceType): number {
    return store.get(id) ?? 0;
  }

  function has(resource: Resource): boolean {
    return get(resource.id) >= resource.amount;
  }

  function add(resource: Resource): number {
    const { id, amount } = resource;

    if (!isAllowed(id)) return amount;

    const accepted = Math.max(0, Math.min(amount, fitsInSpace(id, amount)));
    if (accepted > 0) deposit(id, accepted);

    return amount - accepted;
  }

  function removeAmount(id: ResourceType, amount: number): number {
    const actual = Math.min(amount, get(id));
    withdraw(id, actual);
    return actual;
  }

  function destroy(resource: Resource): void {
    withdraw(resource.id, Math.min(resource.amount, get(resource.id)));
  }

  // Per-container buffer reused by moveTo to avoid allocating a Resource on every transfer.
  // Safe because moveTo is synchronous and target.add() does not call back into this container.
  const _moveBuffer: Resource = { id: ResourceType.Fuel, amount: 0 };

  function moveTo(resource: Resource, target: ResourceContainer): number {
    const id = resource.id;
    const actualRemoved = removeAmount(id, resource.amount);
    if (actualRemoved <= 0) return 0;
    _moveBuffer.id = id;
    _moveBuffer.amount = actualRemoved;
    const refused = target.add(_moveBuffer);
    if (refused > 0) deposit(id, refused);
    return refused;
  }

  function moveAll(target: ResourceContainer): number {
    let totalRefused = 0;
    for (const [id, amount] of store.entries()) {
      if (amount > 0) {
        _moveBuffer.id = id;
        _moveBuffer.amount = amount;
        totalRefused += moveTo(_moveBuffer, target);
      }
    }
    return totalRefused;
  }

  function addContainer(container: ResourceContainer): boolean {
    if (container.capacity > freeSpace()) return false;
    children.push(container);
    childCapacityUsed += container.capacity;

    return true;
  }

  function removeContainer(container: ResourceContainer): void {
    const idx = children.indexOf(container);

    if (idx === -1) return;
    children.splice(idx, 1);
    childCapacityUsed -= container.capacity;
  }

  function getContainers(): readonly ResourceContainer[] {
    return children;
  }

  function accepts(id: ResourceType): boolean {
    return isAllowed(id);
  }

  function hasAll(resources: readonly Resource[]): boolean {
    return resources.every(r => has(r));
  }

  return {
    id,
    labelKey,
    capacity,
    get,
    accepts,
    add,
    destroy,
    has,
    hasAll,
    moveTo,
    moveAll,
    freeSpace,
    addContainer,
    removeContainer,
    getContainers,
  };
}
