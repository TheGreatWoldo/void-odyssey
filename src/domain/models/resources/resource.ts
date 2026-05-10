/** Physical resources that occupy cargo slots. */
export const CargoType = {
  Fuel: 'Fuel',
  Food: 'Food',
  Water: 'Water',
  Oxygen: 'Oxygen',
} as const;

export type CargoType = (typeof CargoType)[keyof typeof CargoType];

/** Abstract resources that drive ship stats. */
export const StatType = {
  Power: 'Power',
  Hull: 'Hull',
  Thrust: 'Thrust',
  Shield: 'Shield',
  ScanRange: 'ScanRange',
  Firepower: 'Firepower',
  JumpRange: 'JumpRange',
  Comms: 'Comms',
  CrewCapacity: 'CrewCapacity',
} as const;

export type StatType = (typeof StatType)[keyof typeof StatType];

/**
 * Stat types that are instantaneous rates — reset to zero each tick before
 * producers run. Hull is excluded: it accumulates (structural damage persists).
 * Power is excluded: it persists in battery containers between ticks.
 */
export type InstantStatType = Exclude<StatType, typeof StatType.Hull | typeof StatType.Power>;
export const INSTANT_STAT_TYPES: readonly InstantStatType[] = [
  StatType.Thrust,
  StatType.Shield,
  StatType.ScanRange,
  StatType.Firepower,
  StatType.JumpRange,
  StatType.Comms,
  StatType.CrewCapacity,
];

/** Union of all resource types — used where containers or recipes handle both. */
export const ResourceType = { ...CargoType, ...StatType } as const;
export type ResourceType = CargoType | StatType;

/** A typed quantity of a resource. */
export interface Resource {
  id: ResourceType;
  amount: number;
}

/** Creates a Resource. */
export function createResource(id: ResourceType, amount: number): Resource {
  return { id, amount };
}

/**
 * Slots occupied per unit of each resource type that occupies physical space.
 * Cargo types are physical goods. Power has a slot cost because it is stored
 * in finite battery containers (1 Power unit = 1 slot).
 */
export const ResourceSizes: Partial<Record<CargoType | StatType, number>> = {
  [CargoType.Fuel]: 2,
  [CargoType.Food]: 1,
  [CargoType.Water]: 1,
  [CargoType.Oxygen]: 1,
  [StatType.Power]: 1,
};
