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
