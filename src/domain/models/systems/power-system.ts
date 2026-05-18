import type { PowerSystemEvent } from '@/domain/events/power-system-events';
import type { ProductionModule } from '@/domain/models/module/production-module';
import { createPowerContainer } from '@/domain/models/resources/power-container';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import type { ResourceContainer } from '@/domain/models/resources/resource-container';
import { createDomainEventCollector } from '@/shared/domain-event';
import type { Result } from '@/shared/result';
import { err, ok } from '@/shared/result';
import { generateId } from '@/shared/id-utils';

/**
 * Aggregate that manages power generation, storage, and demand.
 *
 * Owned by Ship or other power-consuming entity.
 * Tracks batteries (power storage), calculates demand from modules,
 * and provides queries for power adequacy.
 *
 * Power flows:
 *   - ReactorCore modules produce power each tick
 *   - Power is stored in batteries (composite container)
 *   - Other modules consume power based on their recipes
 *   - Application layer queries reserve capacity and makes throttle decisions
 */
export interface PowerSystem {
  readonly id: string;

  /**
   * Returns the internal power container (composite battery store).
   * Use this to add/access batteries; prefer addBattery/removeBattery for safety.
   */
  readonly powerContainer: ResourceContainer;

  /**
   * Returns all installed battery containers.
   */
  getBatteries(): readonly ResourceContainer[];

  /**
   * Adds a battery container to power storage.
   * Returns Ok(void) on success.
   * Returns Err if the battery is already present.
   */
  addBattery(battery: ResourceContainer): Result<void, string>;

  /**
   * Removes a battery container.
   * Any power stored inside is lost (the container leaves).
   */
  removeBattery(battery: ResourceContainer): void;

  /**
   * Returns the sum of all battery capacities.
   */
  getTotalCapacity(): number;

  /**
   * Returns current power stored across all batteries.
   */
  getStoredPower(): number;

  /**
   * Returns available power storage space (free capacity).
   */
  getFreeSpace(): number;

  /**
   * Adds power to the battery store.
   * Returns Ok(refused) if successful; Ok(0) if all accepted.
   * Returns Err if power type is rejected (should never happen).
   */
  addPower(amount: number): Result<number, string>;

  /**
   * Removes power from the battery store.
   * Drains batteries left-to-right (oldest first).
   */
  removePower(amount: number): void;

  /**
   * Calculates total power cost (demand) from the given modules.
   * Accounts for throttle level (if module tracks it).
   *
   * Returns the sum of all non-zero power costs.
   * Does NOT account for module condition or enabled state
   * — caller should filter modules before passing.
   */
  calculateDemand(modules: readonly ProductionModule[]): number;

  /**
   * Returns excess power (stored power - last calculated demand).
   * Positive = surplus; negative = deficit (unsustainable).
   *
   * Note: This is informational only. Actual power draw happens during
   * production tick when modules consume from the power container.
   */
  getExcess(lastCalculatedDemand: number): number;

  /**
   * Returns true if stored power < 20% of total capacity.
   * Used for UI/audio warnings.
   */
  isLowPower(): boolean;

  /**
   * Returns true if stored power < 10% of total capacity.
   * Used for critical warnings (systems may shut down).
   */
  isCriticalPower(): boolean;

  /**
   * Returns all domain events raised since the last call and clears the queue.
   */
  drainEvents(): readonly PowerSystemEvent[];
}

export interface PowerSystemOptions {
  id?: string;
}

export function createPowerSystem(options: PowerSystemOptions = {}): PowerSystem {
  const { id = generateId() } = options;

  const powerContainer = createPowerContainer({
    id: `${id}-power-container`,
    labelKey: 'power-storage',
  });

  const eventCollector = createDomainEventCollector<PowerSystemEvent>();

  function getTotalCapacity(): number {
    return powerContainer.capacity;
  }

  function getBatteries(): readonly ResourceContainer[] {
    return powerContainer.getContainers();
  }

  function getStoredPower(): number {
    return powerContainer.get(ResourceType.Power);
  }

  function getFreeSpace(): number {
    return powerContainer.freeSpace();
  }

  function addBattery(battery: ResourceContainer): Result<void, string> {
    if (powerContainer.getContainers().includes(battery)) {
      return err('Battery already installed');
    }

    const addResult = powerContainer.addContainer(battery);
    if (!addResult.ok) {
      return err(`Failed to add battery: ${addResult.error.kind}`);
    }

    eventCollector.push({
      type: 'BatteryAdded',
      occurredOn: Date.now(),
      systemId: id,
      batteryCapacity: battery.capacity,
      totalCapacity: getTotalCapacity(),
    });

    return ok(undefined);
  }

  function removeBattery(battery: ResourceContainer): void {
    if (!powerContainer.getContainers().includes(battery)) return;

    powerContainer.removeContainer(battery);

    eventCollector.push({
      type: 'BatteryRemoved',
      occurredOn: Date.now(),
      systemId: id,
      batteryCapacity: battery.capacity,
      totalCapacity: getTotalCapacity(),
    });
  }

  function addPower(amount: number): Result<number, string> {
    if (amount <= 0) return ok(0);

    const addResult = powerContainer.add(createResource(ResourceType.Power, amount));
    if (!addResult.ok) {
      return err(`Failed to add power: ${addResult.error.kind}`);
    }

    return ok(addResult.value);
  }

  function removePower(amount: number): void {
    if (amount <= 0) return;

    powerContainer.destroy(createResource(ResourceType.Power, amount));
  }

  function calculateDemand(modules: readonly ProductionModule[]): number {
    let totalDemand = 0;

    for (const module of modules) {
      if (!module.isOperational()) continue;
      totalDemand += module.powerCostPerSecond * module.actualThrottle * module.costMultiplier;
    }

    return totalDemand;
  }

  function getExcess(lastCalculatedDemand: number): number {
    return getStoredPower() - lastCalculatedDemand;
  }

  function isLowPower(): boolean {
    const cap = getTotalCapacity();
    if (cap === 0) return true;
    return getStoredPower() < cap * 0.2;
  }

  function isCriticalPower(): boolean {
    const cap = getTotalCapacity();
    if (cap === 0) return true;
    return getStoredPower() < cap * 0.1;
  }

  return {
    id,
    powerContainer,
    getBatteries,
    addBattery,
    removeBattery,
    getTotalCapacity,
    getStoredPower,
    getFreeSpace,
    addPower,
    removePower,
    calculateDemand,
    getExcess,
    isLowPower,
    isCriticalPower,
    drainEvents: () => eventCollector.drain(),
  };
}
