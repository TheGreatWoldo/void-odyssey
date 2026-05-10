/** Storable, transferable resources that flow through containers. */
export const ResourceType = {
  // Physical cargo resources
  Fuel: 'Fuel',
  Food: 'Food',
  Water: 'Water',
  Oxygen: 'Oxygen',
  Power: 'Power',

  // Intangible ship-capability resources (no physical cargo size)
  Hull:         'Hull',
  Shield:       'Shield',
  Thrust:       'Thrust',
  ScanRange:    'ScanRange',
  Firepower:    'Firepower',
  JumpRange:    'JumpRange',
  Comms:        'Comms',
  CrewCapacity: 'CrewCapacity',
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

/**
 * Intangible resource types that are reset to zero at the start of every tick
 * before any module produces. Only Hull is excluded — it is a persistent pool
 * that accumulates structural damage over time.
 */
export const TransientResourceTypes: readonly ResourceType[] = [
  ResourceType.Shield,
  ResourceType.Thrust,
  ResourceType.ScanRange,
  ResourceType.Firepower,
  ResourceType.JumpRange,
  ResourceType.Comms,
  ResourceType.CrewCapacity,
];

/** A typed quantity of a resource. */
export interface Resource {
  readonly id: ResourceType;
  readonly amount: number;
}

/** Creates a Resource. */
export function createResource(id: ResourceType, amount: number): Resource {
  return { id, amount };
}

/**
 * Slots occupied per unit of each resource type that occupies physical space.
 * Power has a slot cost because it is stored in finite battery containers
 * (1 Power unit = 1 slot).
 * Intangible types have no slot cost — their limits are enforced via
 * per-type capacity caps on the container.
 */
export const ResourceSizes: Partial<Record<ResourceType, number>> = {
  [ResourceType.Fuel]:  2,
  [ResourceType.Food]:  1,
  [ResourceType.Water]: 1,
  [ResourceType.Oxygen]: 1,
  [ResourceType.Power]: 1,
};
