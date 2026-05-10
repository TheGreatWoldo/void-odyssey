import type { AmmoType } from '@/domain/models/combat/ammo';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import type { ResourceContainer } from '@/domain/models/resources/resource-container';

/**
 * Discriminator for the physical nature of damage.
 * Energy weapons omit ammoType. Kinetic weapons include it so future effect
 * systems (poison DoT, fire burn, cold slow) can act on it without changing
 * the packet shape.
 */
export const DamageType = {
  Kinetic:   'Kinetic',
  Energy:    'Energy',
  Explosive: 'Explosive',
} as const;

export type DamageType = (typeof DamageType)[keyof typeof DamageType];

/**
 * A discrete unit of damage produced by a weapon when it fires.
 * `ammoType` is present for kinetic weapons; absent for energy weapons.
 */
export interface DamagePacket {
  readonly type: DamageType;
  readonly amount: number;
  readonly ammoType?: AmmoType;
}

/** Creates a DamagePacket. `ammoType` is optional — omit for energy weapons. */
export function createDamagePacket(
  type: DamageType,
  amount: number,
  ammoType?: AmmoType
): DamagePacket {
  return ammoType !== undefined ? { type, amount, ammoType } : { type, amount };
}

/**
 * Applies a damage packet to a resource container (typically a ship's resource pool).
 *
 * Shield absorbs first — up to all available Shield is destroyed before any Hull damage
 * is dealt. Any remaining damage after shield absorption reduces Hull directly.
 *
 * Defeat condition: caller reads `resources.get(ResourceType.Hull) <= 0`.
 */
export function applyDamage(packet: DamagePacket, resources: ResourceContainer): void {
  const currentShield = resources.get(ResourceType.Shield);

  const absorbed = Math.min(packet.amount, currentShield);

  if (absorbed > 0) {
    resources.destroy(createResource(ResourceType.Shield, absorbed));
  }

  const remainder = packet.amount - absorbed;

  if (remainder > 0) {
    resources.destroy(createResource(ResourceType.Hull, remainder));
  }
}
