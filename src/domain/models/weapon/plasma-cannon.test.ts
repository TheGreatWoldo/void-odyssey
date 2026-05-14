import { describe, expect, it } from 'vitest';

import { DamageType } from '@/domain/models/combat/damage';
import { ModuleId } from '@/domain/models/module/production-module-id';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { createResourceContainer } from '@/domain/models/resources/resource-container';
import { isEnergyWeaponModule } from '@/domain/models/weapon/energy-weapon-module';
import { createPlasmaCannon } from '@/domain/models/weapon/plasma-cannon';
import { isWeaponModule } from '@/domain/models/weapon/weapon-module';

function makeContainerMap(power = 100) {
  const c = createResourceContainer();
  c.add(createResource(ResourceType.Power, power));
  return new Map([[ResourceType.Power, c]]) as ReadonlyMap<typeof ResourceType.Power, typeof c>;
}

describe('createPlasmaCannon', () => {

  it('succeeds with a valid id', () => {
    const result = createPlasmaCannon('pc-1');

    expect(result.ok).toBe(true);
  });

  it('fails with a blank id', () => {
    const result = createPlasmaCannon('');

    expect(result.ok).toBe(false);
  });

  it('has the correct module type', () => {
    const result = createPlasmaCannon('pc-1');
    if (!result.ok) throw new Error(result.error);

    expect(result.value.type).toBe(ModuleId.PlasmaCannon);
  });

  it('has energy damage type', () => {
    const result = createPlasmaCannon('pc-1');
    if (!result.ok) throw new Error(result.error);

    expect(result.value.damageType).toBe(DamageType.Energy);
  });

  it('satisfies isWeaponModule and isEnergyWeaponModule guards', () => {
    const result = createPlasmaCannon('pc-1');
    if (!result.ok) throw new Error(result.error);
    const cannon = result.value;

    expect(isWeaponModule(cannon)).toBe(true);
    expect(isEnergyWeaponModule(cannon)).toBe(true);
  });

  it('uses the supplied name', () => {
    const result = createPlasmaCannon('pc-1', 'Custom Name');
    if (!result.ok) throw new Error(result.error);

    expect(result.value.name).toBe('Custom Name');
  });

  it('defaults name to Plasma Cannon', () => {
    const result = createPlasmaCannon('pc-1');
    if (!result.ok) throw new Error(result.error);

    expect(result.value.name).toBe('Plasma Cannon');
  });

  it('fires after charging for the full chargeTime', () => {
    const result = createPlasmaCannon('pc-1');
    if (!result.ok) throw new Error(result.error);
    const cannon = result.value;
    const map = makeContainerMap(200);

    // chargeTime = 2.0 — advance by 2s at full throttle
    cannon.produce(2.0, map);

    const packet = cannon.fire(map);

    expect(packet).toBeDefined();
    expect(packet?.amount).toBe(25);
  });

  it('does not fire before fully charged', () => {
    const result = createPlasmaCannon('pc-1');
    if (!result.ok) throw new Error(result.error);
    const cannon = result.value;
    const map = makeContainerMap(200);

    cannon.produce(0.5, map);

    expect(cannon.fire(map)).toBeUndefined();
  });

});
