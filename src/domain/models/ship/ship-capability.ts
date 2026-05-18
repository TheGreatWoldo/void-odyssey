import type { ProductionModule } from '@/domain/models/module/production-module';
import { ModuleId } from '@/domain/models/module/production-module-id';

/**
 * Aggregated ship capabilities computed from installed modules.
 * These are derived properties — read-only snapshots of current module configuration.
 */
export interface ShipCapability {
  /** Sum of maxOutput from all IonEngines modules. */
  readonly maxThrust: number;

  /** Sum of maxOutput from all ShieldGenerator modules. */
  readonly maxShieldGeneration: number;

  /** Sum of maxOutput from all SensorArray modules. */
  readonly maxScanRange: number;

  /** Sum of maxOutput from all PlasmaCannon (energy) modules. */
  readonly maxEnergyFirepower: number;

  /** Sum of maxOutput from kinetic weapon modules (future). */
  readonly maxKineticFirepower: number;

  /** Sum of maxOutput from all CommsArray modules. */
  readonly maxCommsRange: number;

  /** Total firepower (energy + kinetic). */
  readonly totalFirepower: number;

  /** Sum of maxOutput from all CrewQuarters modules. */
  readonly maxCrewCapacity: number;

  /** Maximum jump range: derived from JumpDrive module output. */
  readonly maxJumpRange: number;
}

/**
 * Aggregates ship capabilities from installed modules.
 *
 * Iterates all installed modules, selects those with specific types,
 * and sums their maxOutput values.
 * Exposed as read-only snapshots — does not cache; always reflects current state.
 *
 * @param modules All installed production modules in the ship.
 * @returns Computed ShipCapability snapshot.
 */
export function aggregateShipCapabilities(modules: readonly ProductionModule[]): ShipCapability {
  let maxThrust = 0;
  let maxShieldGeneration = 0;
  let maxScanRange = 0;
  let maxEnergyFirepower = 0;
  let maxKineticFirepower = 0;
  let maxCommsRange = 0;
  let maxCrewCapacity = 0;
  let maxJumpRange = 0;

  for (const module of modules) {
    // Skip non-operational modules from capability calculation
    if (!module.isOperational()) continue;

    const moduleOutput = module.maxOutput;

    // Dispatch based on module type to accumulate capabilities
    switch (module.type) {
      case ModuleId.IonEngines:
        maxThrust += moduleOutput;
        break;

      case ModuleId.ShieldGenerator:
        maxShieldGeneration += moduleOutput;
        break;

      case ModuleId.SensorArray:
        maxScanRange += moduleOutput;
        break;

      case ModuleId.PlasmaCannon:
        maxEnergyFirepower += moduleOutput;
        break;

      case ModuleId.CommsArray:
        maxCommsRange += moduleOutput;
        break;

      case ModuleId.CrewQuarters:
        maxCrewCapacity += moduleOutput;
        break;

      case ModuleId.JumpDrive:
        maxJumpRange += moduleOutput;
        break;

      // Reactor, battery, life support, and other support modules don't contribute to combat capabilities
    }
  }

  const totalFirepower = maxEnergyFirepower + maxKineticFirepower;

  return {
    maxThrust,
    maxShieldGeneration,
    maxScanRange,
    maxEnergyFirepower,
    maxKineticFirepower,
    totalFirepower,
    maxCommsRange,
    maxCrewCapacity,
    maxJumpRange,
  };
}
