export const ProductionModuleLifecycleState = {
  Offline: 'offline',
  WarmingUp: 'warming-up',
  Active: 'active',
  CoolingDown: 'cooling-down',
  Failed: 'failed',
} as const;

export type ProductionModuleLifecycleState =
  (typeof ProductionModuleLifecycleState)[keyof typeof ProductionModuleLifecycleState];
