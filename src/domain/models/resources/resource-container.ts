import type { ItemContainer } from '@/domain/models/storage/item-container';
import type { IStorageNode } from '@/domain/models/storage/storage-node';
import type { Result } from '@/shared/result';
import { err, ok } from '@/shared/result';
import { generateId } from '@/shared/id-utils';
import type { ResourceContainerError } from './container-errors';
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
  /**
   * Controls both which resource types are accepted and their individual caps.
   * - Omit entirely → all resource types accepted, limits come from shared capacity only.
   * - Provide a record → only keys present are accepted.
   *   - `null`   → whitelisted, no per-type cap (shared capacity is the only limit).
   *   - `number` → whitelisted and capped at that amount, independently of shared capacity.
   */
  perTypeCapacity?: Partial<Record<ResourceType, number | null>>;
}

/**
 * Bounded, typed storage for resources.
 * add()            — accepts what fits, returns refused amount or error.
 * destroy()        — removes up to the requested amount and discards it.
 * moveTo()         — transfers what is available; excess refused by target is returned to source.
 * addContainer()   — nests a child container, consuming its full capacity from this container's space.
 * removeContainer()— removes a previously added child container, freeing its capacity.
 * getContainers()  — returns all nested child containers.
 */
export interface ResourceContainer extends IStorageNode {
  readonly id: string;
  readonly kind: 'resource';
  readonly labelKey: string;
  readonly capacity: number;
  get(id: ResourceType): number;
  /** Returns true if this container is allowed to hold resources of this type. */
  accepts(id: ResourceType): boolean;
  /**
   * Returns how many additional units of the given type this container can accept,
   * taking both shared capacity and any per-type cap into account.
   */
  freeSpaceFor(id: ResourceType): number;
  /**
   * Adds as much of the resource as fits.
   * Returns Ok(refused amount) on success (0 if fully accepted).
   * Returns Err(error) if the container configuration rejects this resource type or cap is exceeded.
   */
  add(resource: Resource): Result<number, ResourceContainerError>;
  destroy(resource: Resource): void;
  has(resource: Resource): boolean;
  /**
   * Moves as much of the resource as available into target.
   * Returns Ok(refused remainder) on success.
   * Returns Err(error) if the target container rejects the resource type or exceeds cap.
   */
  moveTo(resource: Resource, target: ResourceContainer): Result<number, ResourceContainerError>;
  /** Moves all resources into target. Returns the total amount refused by the target (resource conservation). */
  moveAll(target: ResourceContainer): number;
  /** Returns true if all supplied resources are individually satisfiable by this container. */
  hasAll(resources: readonly Resource[]): boolean;
  freeSpace(): number;
  /**
   * Nests a child container, consuming its full capacity from this container's space.
   * Returns Ok(void) on success.
   * Returns Err if the child container does not fit.
   */
  addContainer(container: ResourceContainer | ItemContainer): Result<void, ResourceContainerError>;
  removeContainer(container: ResourceContainer): void;
  getContainers(): readonly ResourceContainer[];
  /** IStorageNode — returns nested ResourceContainers as IStorageNode[]. */
  getStorageNodes(): readonly IStorageNode[];
}

export function createResourceContainer(
  options: ResourceContainerOptions = {}
): ResourceContainer {
  // --- State ---

  const {
    id = generateId(),
    labelKey = 'container',
    capacity = Infinity,
    perTypeCapacity = null,
  } = options;
  // null  → no perTypeCapacity record provided; all types accepted.
  // record → only keys present are accepted; value null = no cap, number = capped.
  const perTypeCaps: Partial<Record<ResourceType, number | null>> | null = perTypeCapacity;
  const store = new Map<ResourceType, number>();
  const children: ResourceContainer[] = [];
  const itemChildren: ItemContainer[] = [];
  let childCapacityUsed = 0;
  // Incrementally tracked to avoid a full Map iteration on every freeSpace() call.
  // Accepts minor float drift over long sessions in exchange for O(1) space queries.
  let usedSpace = 0;
  // Operation counter used to trigger periodic revalidation of usedSpace.
  // Float drift accumulates over thousands of add/destroy calls; revalidating every 1024 ops
  // corrects it before it can cause allocation bugs. The 1024 interval (bitmask check) is
  // chosen to keep the revalidation cost negligible vs. the savings from O(1) freeSpace().
  let opCount = 0;
  const REVALIDATION_OP_MASK = 0x3ff; // trigger every 1024 ops

  // --- Helpers ---

  function freeSpace(): number {
    return capacity - usedSpace - childCapacityUsed;
  }

  /** Recomputes usedSpace from the store — corrects any accumulated float drift. */
  function revalidateUsedSpace(): void {
    let actual = 0;
    for (const [type, amount] of store.entries()) {
      actual += amount * slotCost(type);
    }
    usedSpace = actual;
  }

  /** Returns false when a perTypeCapacity record is set and this type is not a key in it. */
  function isAllowed(id: ResourceType): boolean {
    return perTypeCaps === null || Object.prototype.hasOwnProperty.call(perTypeCaps, id);
  }

  /** Slot cost for one unit of a resource, in capacity slots. */
  function slotCost(id: ResourceType): number {
    return ResourceSizes[id] ?? 1;
  }

  /** How many units of a resource fit given current free space. */
  function fitsInSpace(id: ResourceType): number {
    return Math.floor(freeSpace() / slotCost(id));
  }

  /**
   * How many additional units of the given type can be accepted, respecting both
   * the shared capacity and any per-type cap.
   */
  function freeSpaceFor(id: ResourceType): number {
    const spaceBased = fitsInSpace(id);
    if (perTypeCaps === null) return spaceBased;

    const cap = perTypeCaps[id];
    // null = whitelisted but no per-type cap; undefined = not allowed (isAllowed guards this).
    if (cap === null || cap === undefined) return spaceBased;

    const remaining = Math.max(0, cap - get(id));
    return Math.min(spaceBased, remaining);
  }

  /** Writes units directly into the store. */
  function deposit(id: ResourceType, amount: number): void {
    if (amount <= 0) return;
    store.set(id, get(id) + amount);
    usedSpace += amount * slotCost(id);
    if ((++opCount & REVALIDATION_OP_MASK) === 0) revalidateUsedSpace();
  }

  /** Removes units directly from the store. */
  function withdraw(id: ResourceType, amount: number): void {
    if (amount <= 0) return;
    const current = get(id);
    const actual = Math.min(amount, current);
    store.set(id, current - actual);
    usedSpace -= actual * slotCost(id);
    if ((++opCount & REVALIDATION_OP_MASK) === 0) revalidateUsedSpace();
  }

  // --- Public API ---

  function get(id: ResourceType): number {
    return store.get(id) ?? 0;
  }

  function has(resource: Resource): boolean {
    return get(resource.id) >= resource.amount;
  }

  function add(resource: Resource): Result<number, ResourceContainerError> {
    const { id, amount } = resource;

    if (!isAllowed(id)) {
      return err({
        kind: 'type-not-accepted',
        resourceType: id,
      });
    }

    const freeFor = freeSpaceFor(id);

    // Check per-type cap if configured
    if (perTypeCaps !== null && perTypeCaps[id] !== undefined && perTypeCaps[id] !== null) {
      const cap = perTypeCaps[id] as number;
      const current = get(id);
      if (current >= cap) {
        return err({
          kind: 'type-cap-exceeded',
          resourceType: id,
          cap,
          current,
          available: 0,
        });
      }
      if (freeFor < amount) {
        return err({
          kind: 'type-cap-exceeded',
          resourceType: id,
          cap,
          current,
          available: cap - current,
        });
      }
    }

    const accepted = Math.max(0, Math.min(amount, freeFor));
    const refused = amount - accepted;

    if (accepted > 0) {
      deposit(id, accepted);
    } else if (refused > 0) {
      return err({
        kind: 'full',
        refused,
      });
    }

    return ok(refused);
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
  const moveBuffer: { id: ResourceType; amount: number } = { id: ResourceType.Fuel, amount: 0 };

  function moveTo(resource: Resource, target: ResourceContainer): Result<number, ResourceContainerError> {
    const id = resource.id;
    const actualRemoved = removeAmount(id, resource.amount);
    if (actualRemoved <= 0) return ok(0);
    moveBuffer.id = id;
    moveBuffer.amount = actualRemoved;
    const addResult = target.add(moveBuffer);

    if (!addResult.ok) {
      // Add failed — restore the resource to this container
      deposit(id, actualRemoved);
      return addResult;
    }

    const refused = addResult.value;
    if (refused > 0) {
      deposit(id, refused);
    }

    return ok(refused);
  }

  function moveAll(target: ResourceContainer): number {
    let totalRefused = 0;
    for (const [type, amount] of store.entries()) {
      if (amount > 0) {
        moveBuffer.id = type;
        moveBuffer.amount = amount;
        const result = moveTo(moveBuffer, target);
        if (result.ok) {
          totalRefused += result.value;
        }
      }
    }
    return totalRefused;
  }

  function addContainer(container: ResourceContainer | ItemContainer): Result<void, ResourceContainerError> {
    if (container.capacity > freeSpace()) {
      return err({
        kind: 'full',
        refused: container.capacity,
      });
    }

    if (container.kind === 'item') {
      itemChildren.push(container);
    } else {
      children.push(container);
    }
    childCapacityUsed += container.capacity;

    return ok(undefined);
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

  function getStorageNodes(): readonly IStorageNode[] {
    return [...children, ...itemChildren];
  }

  function accepts(id: ResourceType): boolean {
    return isAllowed(id);
  }

  function hasAll(resources: readonly Resource[]): boolean {
    return resources.every(r => has(r));
  }

  return {
    id,
    kind: 'resource' as const,
    labelKey,
    capacity,
    get,
    accepts,
    freeSpaceFor,
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
    getStorageNodes,
  };
}
