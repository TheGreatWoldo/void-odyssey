import type { ProductionSystemEvent } from '@/domain/events/production-system-events';
import type { ProductionModule } from '@/domain/models/module/production-module';
import { ModuleId } from '@/domain/models/module/production-module-id';
import { createPowerContainer } from '@/domain/models/resources/power-container';
import { createResource, ResourceType, TransientResourceTypes } from '@/domain/models/resources/resource';
import type { ContainerMap, ResourceContainer } from '@/domain/models/resources/resource-container';
import type { ItemContainerOptions } from '@/domain/models/storage/item-container';
import { createItemContainer } from '@/domain/models/storage/item-container';
import { createDomainEventCollector } from '@/shared/domain-event';
import { generateId } from '@/shared/utils';

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
 */
export interface ProductionSystem {
  readonly id: string;

  /** Read-only inspection view of installed modules. Mutate via `installModule` / `removeModule`. */
  readonly modules: InstalledModules;

  /**
   * Installs a module into the system.
   * Returns false if the module container has insufficient space.
   * Reactors are always sorted before other modules in the tick order.
   */
  installModule(module: ProductionModule): boolean;

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

  // Composite power store — batteries are added/removed at runtime via addBattery/removeBattery.
  // Power is routed through this container; all other resource types point at the shared container.
  const powerContainer = createPowerContainer();

  // Build ContainerMap: Power routes to the composite power container; everything else to resources.
  const containerMap: ContainerMap = new Map(
    (Object.values(ResourceType) as ResourceType[]).map(type => [
      type,
      type === ResourceType.Power ? powerContainer : resources,
    ])
  );

  // Sorted tick list — maintained at install/remove time so tick never needs to sort.
  // Reactors occupy the front; all others are appended in install order.
  const tickOrder: ProductionModule[] = [];

  function installModule(module: ProductionModule): boolean {
    if (!modules.store(module)) return false;

    if (module.type === ModuleId.ReactorCore) {
      // Insert before the first non-reactor.
      const insertAt = tickOrder.findIndex(m => m.type !== ModuleId.ReactorCore);
      if (insertAt === -1) {
        tickOrder.push(module);
      } else {
        tickOrder.splice(insertAt, 0, module);
      }
    } else {
      tickOrder.push(module);
    }

    eventCollector.push({
      type: 'ModuleInstalled',
      occurredOn: Date.now(),
      systemId: id,
      moduleId: module.id,
      moduleType: module.type,
    });

    return true;
  }

  function removeModule(moduleId: string): ProductionModule | undefined {
    const removed = modules.take(moduleId) as ProductionModule | undefined;
    if (!removed) return undefined;

    const idx = tickOrder.findIndex(m => m.id === moduleId);
    if (idx !== -1) tickOrder.splice(idx, 1);

    eventCollector.push({
      type: 'ModuleRemoved',
      occurredOn: Date.now(),
      systemId: id,
      moduleId: removed.id,
      moduleType: removed.type,
    });

    return removed;
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
    modules: installedModules,
    installModule,
    removeModule,
    addBattery: (battery) => { powerContainer.addContainer(battery); },
    removeBattery: (battery) => { powerContainer.removeContainer(battery); },
    tick,
    drainEvents: () => eventCollector.drain(),
  };
}
