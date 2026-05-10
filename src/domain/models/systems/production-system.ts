import type { Inventory, InventoryOptions } from '@/domain/models/inventory/inventory';
import { createInventory } from '@/domain/models/inventory/inventory';
import type { ProductionModule } from '@/domain/models/module/production-module';
import { ModuleId } from '@/domain/models/module/production-module-id';
import { createResource, ResourceType, TransientResourceTypes } from '@/domain/models/resources/resource';
import type { ContainerMap } from '@/domain/models/resources/resource-container';
import type { ItemContainerOptions } from '@/domain/models/storage/item-container';
import { createItemContainer } from '@/domain/models/storage/item-container';
import { generateId } from '@/shared/utils';

export interface ProductionSystemOptions {
  id?: string;

  /** Options forwarded to the internal ItemContainer that holds installed modules. */
  modules?: ItemContainerOptions;

  /** Options forwarded to the inventory (items + resources). */
  inventory?: InventoryOptions;
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
 * `modules` is a read-only inspection view (restricted to `storableType === 'module'`).
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

  /** Shared resource + item inventory for all modules in this system. */
  readonly inventory: Inventory;

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
}

export function createProductionSystem(
  options: ProductionSystemOptions = {}
): ProductionSystem {
  const {
    id = generateId(),
    modules: moduleOptions = {},
    inventory: inventoryOptions = {},
  } = options;

  const modules = createItemContainer({ ...moduleOptions, allowedTypes: ['module'] });

  const inventory = createInventory(inventoryOptions);

  // Build ContainerMap once — all ResourceTypes point at the single resource container.
  // This is the contract expected by ProductionModule.produce() and .drain().
  const containerMap: ContainerMap = new Map(
    (Object.values(ResourceType) as ResourceType[]).map(type => [type, inventory.resources])
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

    return true;
  }

  function removeModule(moduleId: string): ProductionModule | undefined {
    const removed = modules.take(moduleId) as ProductionModule | undefined;
    if (!removed) return undefined;

    const idx = tickOrder.findIndex(m => m.id === moduleId);
    if (idx !== -1) tickOrder.splice(idx, 1);

    return removed;
  }

  function tick(deltaTime: number): void {
    // Reset transient resources before any module produces — they represent
    // instantaneous rates (shield output, thrust, etc.) not persistent pools.
    for (const type of TransientResourceTypes) {
      const current = inventory.resources.get(type);
      if (current > 0) inventory.resources.destroy(createResource(type, current));
    }

    for (const module of tickOrder) {
      module.stepRamp(deltaTime);

      if (!module.isOperational()) {
        module.reset();
        continue;
      }

      module.produce(deltaTime, containerMap);
      module.drain(containerMap);
    }
  }

  const installedModules: InstalledModules = {
    get capacity() { return modules.capacity; },
    freeSpace: () => modules.freeSpace(),
    has: (id) => modules.has(id),
    list: () => modules.list() as readonly ProductionModule[],
  };

  return { id, modules: installedModules, inventory, installModule, removeModule, tick };
}
