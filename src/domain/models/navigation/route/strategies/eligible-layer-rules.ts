/**
 * Stop index eligibility predicates for use with AbsoluteTypeAllocation / ProbabilisticTypeAllocation.
 * One named export per node type — implementations may coincide, but each type has its own rule.
 */

export const shipyardEligibleStopIndex = (s: number, total: number) =>
  s >= 2 && s < total - 1;

export const storeEligibleStopIndex = (s: number, total: number) =>
  s > 2 && s < total - 1;

export const eventEligibleStopIndex = (s: number, total: number) =>
  s >= 1 && s < total - 1;

export const combatEligibleStopIndex = (s: number, total: number) =>
  s >= 1 && s < total - 1;

export const relicEligibleStopIndex = (s: number, total: number) =>
  s >= 2 && s < total - 1;

export const hiddenCacheEligibleStopIndex = (s: number, total: number) =>
  s >= 2 && s < total - 1;
