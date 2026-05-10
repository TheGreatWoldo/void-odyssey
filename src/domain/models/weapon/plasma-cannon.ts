import { DamageType } from '@/domain/models/combat/damage';
import { ModuleId } from '@/domain/models/module/production-module-id';
import { createEnergyWeaponModule, type EnergyWeaponModule } from '@/domain/models/weapon/energy-weapon-module';
import type { Result } from '@/shared/result';

/**
 * Creates a Plasma Cannon — a high-energy directed-beam weapon.
 *
 * Charges over 2 seconds by consuming 10 Power/s at full throttle.
 * When fired, deals 25 energy damage. Uses AmmoType.Standard by default.
 * No ammo consumed — energy weapons draw on ship power only.
 */
export function createPlasmaCannon(
  id: string,
  name = 'Plasma Cannon'
): Result<EnergyWeaponModule, string> {
  return createEnergyWeaponModule(id, name, {
    type: ModuleId.PlasmaCannon,
    damageType: DamageType.Energy,
    maxOutput: 25,
    chargeTime: 2.0,
    powerCostPerSecond: 10,
    rampRate: Infinity,
  });
}
