import type { ProductionSystemEvent } from '@/domain/events/production-system-events';
import { getModulePriority, validateModuleInterconnection } from '@/domain/models/module/module-interconnection';
import type { ProductionModule } from '@/domain/models/module/production-module';
import { createResource, ResourceType, TransientResourceTypes } from '@/domain/models/resources/resource';
import type { ContainerMap, ResourceContainer } from '@/domain/models/resources/resource-container';
import type { ItemContainerOptions } from '@/domain/models/storage/item-container';
import { createItemContainer } from '@/domain/models/storage/item-container';
import type { PowerSystem } from '@/domain/models/systems/power-system';
import { createPowerSystem } from '@/domain/models/systems/power-system';
import { createDomainEventCollector } from '@/shared/domain-event';
import { err, ok, type Result } from '@/shared/result';
import { generateId } from '@/shared/id-utils';

export interface ProductionSystemOptions {
  id?: string;

  /** Options forwarded to the internal ItemContainer that holds installed modules. */
  modules?: ItemContainerOptions;

  /** Shared resource container owned by the parent (e.g. ship). All produced and consumed resources flow through this. */
  resources: ResourceContainer;
}

/**
 * Read-only inspection view of the installed module container.
 * Mutation is intentionally excluded — use `installModule` / `removeModule` on the
 * `ProductionSystem` to maintain tick-order consistency.
 */
export interface InstalledModules {
  readonly capacity: number;
  freeSpace(): number;
  has(id: string): boolean;
  list(): readonly ProductionModule[];
}

/**
 * Aggregate that wires a set of production modules to a shared inventory.
 *
 * `modules` is a read-only inspection view of installed modules.
 * Install a module via `installModule(module)`.
 * Remove  a module via `removeModule(id)`.
 *
 * `tick(deltaTime)` runs one production cycle:
 *   1. Reactor modules (ReactorCore) produce and drain first.
 *   2. All remaining operational modules produce and drain in install order.
 * The tick order is fixed at install/remove time — sorting never runs inside tick.
 *
 * All modules share a single ContainerMap pointing every ResourceType at
 * `inventory.resources`. This means all produced resources flow into the
 * same resource pool, and all consumed resources are drawn from it.
 *
 * Invariants (contract):
 * - ContainerMap routing is resolved once when the aggregate is created and is never
 *   re-resolved during tick(). This keeps simulation deterministic and avoids hidden
 *   runtime topology coupling.
 * - Disabled or non-operational modules are explicitly skipped and reset every tick.
 *   This guarantees no stale output accumulation while preserving deterministic drain order.
 * - Tick order is computed at install/remove boundaries only, not inside tick(), so
 *   runtime performance and behavior remain stable under load.
 */
export interface ProductionSystem {
  readonly id: string;

  /** Owned power aggregate — source of truth for power storage, reserve, and demand queries. */
  readonly power: PowerSystem;

  /** Read-only inspection view of installed modules. Mutate via `installModule` / `removeModule`. */
  readonly modules: InstalledModules;

  /**
   * Installs a module into the system.
   * Returns false if the module container has insufficient space.
   * Reactors are always sorted before other modules in the tick order.
   */
  installModule(module: ProductionModule): boolean;

  /**
   * Atomically installs a batch of modules in the provided order.
   * If any module fails validation/storage, all prior installs in this batch are rolled back.
   */
  installModules(batch: readonly ProductionModule[]): Result<void, string>;

  /**
   * Removes an installed module by id.
   * Returns the removed module, or undefined if not found.
   */
  removeModule(id: string): ProductionModule | undefined;

  /**
   * Runs one production tick across all installed modules.
   * Reactors produce and drain before all other modules.
   * Disabled or zero-condition modules are skipped.
   */
  tick(deltaTime: number): void;

  /**
   * Adds a battery container to the internal PowerContainer.
   * The battery's capacity is immediately available for power storage.
   * Batteries are filled and drained left-to-right in the order they were added.
   */
  addBattery(battery: ResourceContainer): void;

  /**
   * Removes a previously added battery container.
   * Any power stored inside it is lost (it leaves with the container).
   */
  removeBattery(battery: ResourceContainer): void;

  /**
   * Returns all domain events raised since the last call and clears the queue.
   * Call this once per tick (or frame) in the application layer to react to
   * module lifecycle changes and resource pressure.
   */
  drainEvents(): readonly ProductionSystemEvent[];
}

export function createProductionSystem(
  options: ProductionSystemOptions
): ProductionSystem {
  const {
    id = generateId(),
    modules: moduleOptions = {},
    resources,
  } = options;

  const modules = createItemContainer({ ...moduleOptions, allowedTypes: ['module'] });
  const eventCollector = createDomainEventCollector<ProductionSystemEvent>();

  const powerSystem = createPowerSystem({ id: `${id}-power` });

  // Build ContainerMap once at aggregate construction time.
  // Contract: this routing table is immutable during simulation ticks.
  // Reason: per-tick re-resolution would couple simulation correctness to external mutation
  // and introduce non-deterministic behavior/perf cliffs.
  const containerMap: ContainerMap = new Map(
    (Object.values(ResourceType) as ResourceType[]).map(type => [
      type,
      type === ResourceType.Power ? powerSystem.powerContainer : resources,
    ])
  );

  // Sorted tick list — maintained at install/remove time so tick never needs to sort.
  // Lower priority value runs earlier; same-priority modules preserve install order.
  const tickOrder: ProductionModule[] = [];

  function installOne(module: ProductionModule, emitEvent: boolean): boolean {
    const installedTypes = modules.list().map(m => (m as ProductionModule).type);
    const validation = validateModuleInterconnection(module.type, installedTypes);
    if (!validation.ok) return false;

    const storeResult = modules.store(module);
    if (!storeResult.ok) return false;

    const modulePriority = getModulePriority(module.type);
    const insertAt = tickOrder.findIndex(m => getModulePriority(m.type) > modulePriority);

    if (insertAt === -1) {
      tickOrder.push(module);
    } else {
      tickOrder.splice(insertAt, 0, module);
    }

    if (emitEvent) {
      eventCollector.push({
        type: 'ModuleInstalled',
        occurredOn: Date.now(),
        systemId: id,
        moduleId: module.id,
        moduleType: module.type,
      });
    }

    return true;
  }

  function removeOne(moduleId: string, emitEvent: boolean): ProductionModule | undefined {
    const removed = modules.take(moduleId) as ProductionModule | undefined;
    if (!removed) return undefined;

    const idx = tickOrder.findIndex(m => m.id === moduleId);
    if (idx !== -1) tickOrder.splice(idx, 1);

    if (emitEvent) {
      eventCollector.push({
        type: 'ModuleRemoved',
        occurredOn: Date.now(),
        systemId: id,
        moduleId: removed.id,
        moduleType: removed.type,
      });
    }

    return removed;
  }

  function installModule(module: ProductionModule): boolean {
    return installOne(module, true);
  }

  function installModules(batch: readonly ProductionModule[]): Result<void, string> {
    const installedIds: string[] = [];

    for (const module of batch) {
      const installed = installOne(module, false);
      if (!installed) {
        for (let i = installedIds.length - 1; i >= 0; i--) {
          removeOne(installedIds[i], false);
        }
        return err(`Batch install failed at module '${module.id}'`);
      }
      installedIds.push(module.id);
    }

    for (const moduleId of installedIds) {
      const module = modules.list().find(m => (m as ProductionModule).id === moduleId) as ProductionModule | undefined;
      if (!module) continue;
      eventCollector.push({
        type: 'ModuleInstalled',
        occurredOn: Date.now(),
        systemId: id,
        moduleId: module.id,
        moduleType: module.type,
      });
    }

    return ok(undefined);
  }

  function removeModule(moduleId: string): ProductionModule | undefined {
    return removeOne(moduleId, true);
  }

  function resetTransientResources(): void {
    // Transient resources represent instantaneous rates (shield output, thrust, etc.)
    // — not persistent pools. They are zeroed before each tick so modules always
    // produce into a clean slate. ProductionSystem owns this enforcement.
    for (const type of TransientResourceTypes) {
      const current = resources.get(type);
      if (current > 0) resources.destroy(createResource(type, current));
    }
  }

  function tick(deltaTime: number): void {
    resetTransientResources();

    for (const module of tickOrder) {
      module.stepRamp(deltaTime);

      // Contract: modules that are disabled or effectively failed (condition <= 0)
      // are skipped and reset every tick.
      // Reason: this prevents hidden buffered output from appearing when a module toggles
      // back on, and keeps lifecycle transitions explicit in aggregate state.
      if (!module.isOperational()) {
        module.reset();
        continue;
      }

      module.produce(deltaTime, containerMap);
      module.drain(containerMap);
    }

    // Emit a pressure signal if the shared resource pool is completely full.
    if (resources.freeSpace() === 0) {
      eventCollector.push({
        type: 'ResourceContainerFull',
        occurredOn: Date.now(),
        systemId: id,
      });
    }
  }

  const installedModules: InstalledModules = {
    get capacity() { return modules.capacity; },
    freeSpace: () => modules.freeSpace(),
    has: (id) => modules.has(id),
    list: () => modules.list() as readonly ProductionModule[],
  };

  return {
    id,
    power: powerSystem,
    modules: installedModules,
    installModule,
    installModules,
    removeModule,
    addBattery: (battery) => {
      powerSystem.addBattery(battery);
    },
    removeBattery: (battery) => {
      powerSystem.removeBattery(battery);
    },
    tick,
    drainEvents: () => eventCollector.drain(),
  };
}
