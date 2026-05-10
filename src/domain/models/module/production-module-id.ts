export const ModuleId = {
  ReactorCore: 'reactor-core',
  IonEngines: 'ion-engines',
  ShieldGenerator: 'shield-generator',
  LifeSupport: 'life-support',
  WaterReclaimer: 'water-reclaimer',
  SensorArray: 'sensor-array',
  RepairDrones: 'repair-drones',
  PlasmaCannon: 'plasma-cannon',
  JumpDrive: 'jump-drive',
  ArmorPlating: 'armor-plating',
  NavComputer: 'nav-computer',
  CrewQuarters: 'crew-quarters',
  Medbay: 'medbay',
  FuelScoop: 'fuel-scoop',
  CommsArray: 'comms-array',
} as const;

export type ModuleId = (typeof ModuleId)[keyof typeof ModuleId];

/**
 * Physical slot cost for each module type when stored in an ItemContainer.
 * Larger or more complex modules occupy more cargo space.
 */
export const ModuleSlotCosts: Record<ModuleId, number> = {
  [ModuleId.ReactorCore]:     8,
  [ModuleId.IonEngines]:      6,
  [ModuleId.ShieldGenerator]: 4,
  [ModuleId.LifeSupport]:     4,
  [ModuleId.WaterReclaimer]:  3,
  [ModuleId.SensorArray]:     3,
  [ModuleId.RepairDrones]:    3,
  [ModuleId.PlasmaCannon]:    5,
  [ModuleId.JumpDrive]:       6,
  [ModuleId.ArmorPlating]:    6,
  [ModuleId.NavComputer]:     2,
  [ModuleId.CrewQuarters]:    8,
  [ModuleId.Medbay]:          4,
  [ModuleId.FuelScoop]:       3,
  [ModuleId.CommsArray]:      2,
};
