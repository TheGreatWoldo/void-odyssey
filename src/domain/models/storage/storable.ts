/** Discriminator for the kind of thing being stored. */
export const StorableType = {
  Resource: 'resource',
  Module: 'module',
  Upgrade: 'upgrade',
} as const

export type StorableType = typeof StorableType[keyof typeof StorableType]

/**
 * Implemented by anything that can occupy physical space in a container.
 * slotCost is the number of capacity slots one unit (or instance) of this item consumes.
 */
export interface Storable {
  readonly storableType: StorableType;
  readonly slotCost: number;
}
