import type { PowerSystem } from '@/domain/models/systems/power-system';

/**
 * Domain service for power system queries and analysis.
 *
 * Provides high-level queries for power adequacy, demand prediction,
 * and system health without coupling to specific aggregate implementations.
 *
 * Use this in the application layer to make throttle decisions and provide feedback.
 */

export interface PowerMetrics {
  /** Current power stored (units) */
  readonly storedPower: number;
  /** Total battery capacity (units) */
  readonly totalCapacity: number;
  /** Available storage space (units) */
  readonly freeSpace: number;
  /** Stored power as % of capacity (0-100) */
  readonly percentFull: number;
  /** Is power < 20% threshold? */
  readonly isLow: boolean;
  /** Is power < 10% threshold? */
  readonly isCritical: boolean;
}

/**
 * Gets current power metrics for a power system.
 */
export function getPowerMetrics(powerSystem: PowerSystem): PowerMetrics {
  const storedPower = powerSystem.getStoredPower();
  const totalCapacity = powerSystem.getTotalCapacity();
  const percentFull = totalCapacity > 0 ? (storedPower / totalCapacity) * 100 : 0;

  return {
    storedPower,
    totalCapacity,
    freeSpace: powerSystem.getFreeSpace(),
    percentFull,
    isLow: powerSystem.isLowPower(),
    isCritical: powerSystem.isCriticalPower(),
  };
}

/**
 * Calculates if the power system can sustain the given demand for a duration.
 *
 * @param powerSystem The power system to check
 * @param demandPerSecond Power cost per second (units/s)
 * @param durationSeconds How long to sustain (seconds)
 * @returns true if stored power >= demandPerSecond * durationSeconds
 */
export function canSustain(
  powerSystem: PowerSystem,
  demandPerSecond: number,
  durationSeconds: number
): boolean {
  const requiredPower = demandPerSecond * durationSeconds;
  return powerSystem.getStoredPower() >= requiredPower;
}

/**
 * Calculates how long the power system can sustain the given demand before running out.
 *
 * @param powerSystem The power system to check
 * @param demandPerSecond Power cost per second (units/s)
 * @returns Duration in seconds until power is depleted; Infinity if demand is 0
 */
export function getEndurance(
  powerSystem: PowerSystem,
  demandPerSecond: number
): number {
  if (demandPerSecond <= 0) return Infinity;
  return powerSystem.getStoredPower() / demandPerSecond;
}

/**
 * Calculates optimal throttle level to sustain target endurance.
 * Useful for autopilot: "I want 2 minutes of reserve endurance at this demand".
 *
 * @param powerSystem The power system
 * @param baseDemand Power cost at 100% throttle (units/s)
 * @param targetEnduranceSeconds Desired minimum endurance (seconds)
 * @returns Throttle level [0, 1] that maintains the target endurance
 */
export function getThrottleForEndurance(
  powerSystem: PowerSystem,
  baseDemand: number,
  targetEnduranceSeconds: number
): number {
  if (baseDemand <= 0) return 1; // No demand = run at full
  if (targetEnduranceSeconds <= 0) return 0; // Impossible target = idle

  const requiredPower = baseDemand * targetEnduranceSeconds;
  const stored = powerSystem.getStoredPower();

  if (stored >= requiredPower) {
    return 1; // Can run at full throttle and still maintain endurance
  }

  // Throttle down: stored / (baseDemand * targetEndurance) = throttle
  return stored / requiredPower;
}
