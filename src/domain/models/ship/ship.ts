import type { ShipEvent } from '@/domain/events/ship-events';
import type { Inventory } from '@/domain/models/inventory/inventory';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import type { RoomsLayout } from '@/domain/models/ship/rooms-layout';
import type { ShipCapability } from '@/domain/models/ship/ship-capability';
import { aggregateShipCapabilities } from '@/domain/models/ship/ship-capability';
import { type ShipClass } from '@/domain/models/ship/ship-class';
import { ShipState, type ShipState as ShipStateType } from '@/domain/models/ship/ship-state';
import type { PowerSystem } from '@/domain/models/systems/power-system';
import type { ProductionSystem } from '@/domain/models/systems/production-system';
import { createDomainEventCollector } from '@/shared/domain-event';
import { generateId } from '@/shared/id-utils';
import { err, ok, type Result } from '@/shared/result';

export interface ShipOptions {
  id?: string;
  name: string;
  class: ShipClass;
  productionSystem: ProductionSystem;
  inventory: Inventory;
  layout: RoomsLayout;

  /** Initial hull points added to inventory. Defaults to 100. */
  initialHull?: number;

  /** Initial ship state. Defaults to Docked. */
  initialState?: ShipStateType;
}

/**
 * Aggregate Root — The ship itself.
 *
 * Owns and orchestrates:
 *   - ProductionSystem (power, module lifecycle, production ticks)
 *   - Inventory (cargo, supplies, upgrades, Hull and Shield resources)
 *   - Layout (rooms, sections, doors)
 *   - Operational state (Docked, Traveling, InCombat, Damaged, Destroyed)
 *
 * Health mechanics:
 *   - Hull: persistent resource in inventory. Restored by consuming HullPlating via repairHull().
 *   - Shield: transient resource. Produced by ShieldGenerator module each tick, destroyed by damage.
 *   - Damage applies to Shield first, then Hull.
 *
 * Exposes computed capabilities from installed modules (firepower, thrust, etc.)
 * and enforces ship-level constraints (module count, power draw, damage states).
 *
 * Invariants:
 *   - Ship must have a production system.
 *   - Ship must have an inventory with initial Hull and Shield resources.
 *   - Hull and Shield are queried from inventory.resources, not stored independently.
 *   - repairHull() consumes HullPlating resource and restores Hull.
 *   - Shield regeneration is automatic via ShieldGenerator module production.
 *   - Module installation respects inventory space constraints.
 */
export interface Ship {
  readonly id: string;
  readonly name: string;
  readonly class: ShipClass;

  /** Structural layout: rooms, sections, doors. */
  readonly layout: RoomsLayout;

  /** Owned production system — read via this reference. */
  readonly production: ProductionSystem;

  /** Owned power system (via production aggregate). */
  readonly power: PowerSystem;

  /** Owned inventory. Contains Hull, Shield, and HullPlating resources. */
  readonly inventory: Inventory;

  /** Operational state: Docked, Traveling, InCombat, Damaged, Destroyed. */
  readonly state: ShipStateType;

  // Health queries

  /**
   * Gets current hull points from inventory resource.
   * Hull is a persistent resource consumed by damage and restored by repairs using HullPlating.
   */
  getHull(): number;

  /**
   * Gets current shield points from inventory resource.
   * Shield is transient — produced by ShieldGenerator module each tick, destroyed by damage.
   */
  getShield(): number;

  /** Derived capabilities from installed modules. Snapshot — call again if modules change. */
  getCapabilities(): ShipCapability;

  /**
   * Transitions the ship to a new state.
   * Validates that the transition is legal (e.g., can't leave InCombat without being Healthy first).
   * Returns error if the transition is invalid.
   */
  setState(newState: ShipStateType): Result<void, string>;

  /**
   * Applies damage to the ship.
   * Shield absorbs first (destroys Shield resource); remainder destroys Hull resource.
   * Does NOT automatically transition ship state — the application layer
   * must react to damage events and call setState() if needed.
   *
   * @param damageAmount The damage to apply.
   * @returns ok(void) if damage applied successfully, err if ship is destroyed or invalid.
   */
  takeDamage(damageAmount: number): Result<void, string>;

  /**
   * Repairs hull damage by consuming HullPlating from inventory.
   * Converts HullPlating (physical resource) into Hull (health resource).
   * Only allowed while ship is Docked or not in InCombat.
   *
   * @param amount Hull points to restore (consumes equal amount of HullPlating).
   * @returns ok(void) if repair succeeded, err if ship cannot be repaired or insufficient plating.
   */
  repairHull(amount: number): Result<void, string>;

  /**
   * Returns true when the ship is operational:
   *   - hull > 0 (not destroyed)
   *   - state !== Destroyed
   */
  isOperational(): boolean;

  /**
   * Returns true when the ship is healthy:
   *   - hull > 0 and ship is not in Damaged or Destroyed state
   */
  isHealthy(): boolean;

  /**
   * Returns all domain events raised since the last call and clears the queue.
   * Call this once per game tick or frame to react to ship state changes.
   */
  drainEvents(): readonly ShipEvent[];
}

export function createShip(options: ShipOptions): Result<Ship, string> {
  const {
    id = generateId(),
    name,
    class: shipClass,
    productionSystem,
    inventory,
    layout,
    initialHull = 100,
    initialState = ShipState.Docked,
  } = options;

  let currentState: ShipStateType = initialState;

  // Event collector for domain events
  const eventCollector = createDomainEventCollector<ShipEvent>();

  // Validate initial options
  if (initialHull <= 0) {
    return err('initialHull must be greater than 0');
  }
  if (!productionSystem) {
    return err('productionSystem is required');
  }
  if (!inventory) {
    return err('inventory is required');
  }

  // Validate initial state — a new ship can only start in Docked state
  if (initialState !== ShipState.Docked) {
    return err(`A new ship must start in ${ShipState.Docked} state, not ${initialState}`);
  }

  // Initialize Hull resource in inventory
  inventory.addResource(createResource(ResourceType.Hull, initialHull));

  function getHull(): number {
    return inventory.getResource(ResourceType.Hull);
  }

  function getShield(): number {
    return inventory.getResource(ResourceType.Shield);
  }

  function isOperational(): boolean {
    return getHull() > 0 && currentState !== ShipState.Destroyed;
  }

  function isHealthy(): boolean {
    return getHull() > 0 && currentState !== ShipState.Damaged && currentState !== ShipState.Destroyed;
  }

  function getCapabilities(): ShipCapability {
    return aggregateShipCapabilities(productionSystem.modules.list());
  }

  function setState(newState: ShipStateType): Result<void, string> {
    // Validate legal state transitions
    if (currentState === ShipState.Destroyed) {
      return err('Ship is destroyed and cannot change state');
    }

    // Can't leave InCombat until healthy again
    if (currentState === ShipState.InCombat && newState !== ShipState.InCombat && !isHealthy()) {
      return err('Cannot leave combat until ship is repaired');
    }

    // Can't transition to Damaged unless actually damaged
    if (newState === ShipState.Damaged && getHull() > 0) {
      return err('Cannot transition to Damaged state while hull is above 0');
    }

    const fromState = currentState;
    currentState = newState;

    eventCollector.push({
      type: 'ShipStateChanged',
      shipId: id,
      fromState,
      toState: newState,
      occurredOn: Date.now(),
    });

    return ok(void 0);
  }

  function takeDamage(damageAmount: number): Result<void, string> {
    if (currentState === ShipState.Destroyed) {
      return err('Ship is destroyed and cannot take further damage');
    }

    if (damageAmount < 0) {
      return err('Damage amount must be non-negative');
    }

    // Shield absorbs first
    const currentShield = getShield();
    const shieldAbsorbed = Math.min(damageAmount, currentShield);

    if (shieldAbsorbed > 0) {
      inventory.destroyResource(createResource(ResourceType.Shield, shieldAbsorbed));
    }

    const remainder = damageAmount - shieldAbsorbed;

    // Remaining damage goes to hull
    if (remainder > 0) {
      inventory.destroyResource(createResource(ResourceType.Hull, remainder));
    }

    const finalHull = getHull();

    eventCollector.push({
      type: 'ShipDamaged',
      shipId: id,
      damageAmount,
      hullRemaining: Math.max(0, finalHull),
      maxHull: initialHull,
      occurredOn: Date.now(),
    });

    return ok(void 0);
  }

  function repairHull(amount: number): Result<void, string> {
    if (currentState === ShipState.Destroyed) {
      return err('Destroyed ship cannot be repaired');
    }

    if (currentState === ShipState.InCombat) {
      return err('Cannot repair while in combat');
    }

    if (amount < 0) {
      return err('Repair amount must be non-negative');
    }

    // Check availability of HullPlating
    const hullPlatingAvailable = inventory.getResource(ResourceType.HullPlating);
    if (hullPlatingAvailable < amount) {
      return err(`Insufficient HullPlating. Required: ${amount}, Available: ${hullPlatingAvailable}`);
    }

    // Consume HullPlating and restore Hull
    inventory.destroyResource(createResource(ResourceType.HullPlating, amount));
    inventory.addResource(createResource(ResourceType.Hull, amount));

    const finalHull = getHull();

    eventCollector.push({
      type: 'ShipHullRepaired',
      shipId: id,
      amountRestored: amount,
      currentHull: finalHull,
      occurredOn: Date.now(),
    });

    return ok(void 0);
  }

  return ok({
    id,
    name,
    class: shipClass,
    layout,
    production: productionSystem,
    power: productionSystem.power,
    inventory,
    get state() {
      return currentState;
    },

    getHull,
    getShield,
    getCapabilities,
    setState,
    takeDamage,
    repairHull,
    isOperational,
    isHealthy,
    drainEvents: () => eventCollector.drain(),
  });
}
