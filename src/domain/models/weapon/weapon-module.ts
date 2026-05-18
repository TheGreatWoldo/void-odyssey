import type { DamagePacket, DamageType } from '@/domain/models/combat/damage';
import type { ProductionModule } from '@/domain/models/module/production-module';
import { getWeaponKind } from '@/domain/models/module/production-module-id';
import type { ContainerMap } from '@/domain/models/resources/resource-container';

/**
 * Base interface for all weapon modules.
 * Extends ProductionModule — weapons participate in the normal tick cycle
 * (stepRamp, produce, drain) so power charging integrates with the production system.
 *
 * `weaponKind` is a stable discriminant for type-narrowing without duck-typing.
 * The weapon kind can also be derived from the module type via getWeaponKind(module.type).
 *
 * `fire()` is the external trigger. It returns a DamagePacket when the weapon
 * is ready to fire, or undefined when it cannot (not charged, no ammo, etc.).
 * The caller is responsible for calling `applyDamage` on the target.
 */
export interface WeaponModule extends ProductionModule {
  readonly weaponKind: 'energy' | 'kinetic';
  readonly damageType: DamageType;

  /**
   * Attempts to fire the weapon.
   * Returns a DamagePacket on success, undefined if the weapon cannot fire
   * (e.g. energy weapon not fully charged, kinetic weapon out of ammo).
   */
  fire(containerMap: ContainerMap): DamagePacket | undefined;
}

/**
 * Returns true when `m` is a WeaponModule.
 * Duck-typed — no import cycle with concrete subtype files.
 */
export function isWeaponModule(m: ProductionModule): m is WeaponModule {
  return 'fire' in m && 'damageType' in m;
}

/**
 * Gets the weapon kind (energy or kinetic) for a weapon module.
 * Returns undefined if the module is not a weapon.
 */
export function getWeaponModuleKind(module: ProductionModule): 'energy' | 'kinetic' | undefined {
  return getWeaponKind(module.type);
}
