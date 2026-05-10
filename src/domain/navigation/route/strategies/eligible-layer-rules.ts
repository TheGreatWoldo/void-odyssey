/**
 * Layer eligibility predicates for use with AbsoluteTypeAllocation / ProbabilisticTypeAllocation.
 * One named export per node type — implementations may coincide, but each type has its own rule.
 */

export const shipyardEligibleLayer = (l: number, total: number) =>
  l >= 2 && l < total - 1;

export const storeEligibleLayer = (l: number, total: number) =>
  l > 2 && l < total - 1;

export const eventEligibleLayer = (l: number, total: number) =>
  l >= 1 && l < total - 1;

export const combatEligibleLayer = (l: number, total: number) =>
  l >= 1 && l < total - 1;

export const relicEligibleLayer = (l: number, total: number) =>
  l >= 2 && l < total - 1;

export const hiddenCacheEligibleLayer = (l: number, total: number) =>
  l >= 2 && l < total - 1;
