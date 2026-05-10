/** Storable, transferable resources that flow through containers. */
export const ResourceType = {
  Fuel: 'Fuel',
  Food: 'Food',
  Water: 'Water',
  Oxygen: 'Oxygen',
  Power: 'Power',
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

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
 */
export const ResourceSizes: Partial<Record<ResourceType, number>> = {
  [ResourceType.Fuel]: 2,
  [ResourceType.Food]: 1,
  [ResourceType.Water]: 1,
  [ResourceType.Oxygen]: 1,
  [ResourceType.Power]: 1,
};
