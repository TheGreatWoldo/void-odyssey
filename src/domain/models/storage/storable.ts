/** Discriminator for the kind of thing being stored. */
export type StorableType = 'resource' | 'module' | 'upgrade';

/**
 * Implemented by anything that can occupy physical space in a container.
 * slotCost is the number of capacity slots one unit (or instance) of this item consumes.
 */
export interface Storable {
  readonly storableType: StorableType;
  readonly slotCost: number;
}
