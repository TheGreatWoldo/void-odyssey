import { ResourceType } from '@/domain/models/resources/resource';

/**
 * Variant identifier for kinetic ammunition.
 * Each variant is a separate ResourceType in the inventory — carry multiple types simultaneously.
 * The ammoType travels with the DamagePacket so future effect systems (DoT, slow, etc.)
 * can read it without changing the packet shape.
 */
export const AmmoType = {
  Standard: 'Standard',
  Poison:   'Poison',
  Fire:     'Fire',
  Cold:     'Cold',
} as const;

export type AmmoType = (typeof AmmoType)[keyof typeof AmmoType];

/**
 * Maps each AmmoType to the ResourceType that represents it in the inventory.
 * Used by kinetic weapons to consume the correct ammo pool on fire.
 */
export const AmmoResourceType: Record<AmmoType, ResourceType> = {
  [AmmoType.Standard]: ResourceType.AmmoStandard,
  [AmmoType.Poison]:   ResourceType.AmmoPoison,
  [AmmoType.Fire]:     ResourceType.AmmoFire,
  [AmmoType.Cold]:     ResourceType.AmmoCold,
};
