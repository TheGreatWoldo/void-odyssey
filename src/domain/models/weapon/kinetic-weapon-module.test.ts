import { describe, expect, it } from 'vitest';

import { AmmoResourceType, AmmoType } from '@/domain/models/combat/ammo';
import { DamageType } from '@/domain/models/combat/damage';
import { ModuleId } from '@/domain/models/module/production-module-id';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { createResourceContainer } from '@/domain/models/resources/resource-container';
import { createKineticWeaponModule, isKineticWeaponModule } from '@/domain/models/weapon/kinetic-weapon-module';
import { isWeaponModule } from '@/domain/models/weapon/weapon-module';

function makeRailgun(overrides: Partial<Parameters<typeof createKineticWeaponModule>[2]> = {}) {
  const r = createKineticWeaponModule('k-1', 'Test Railgun', {
    type: ModuleId.PlasmaCannon,
    damageType: DamageType.Kinetic,
    loadedAmmoType: AmmoType.Standard,
    maxOutput: 30,
    ...overrides,
  });
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function makeContainerMapWithAmmo(ammoType: AmmoType, amount: number) {
  const c = createResourceContainer();
  if (amount > 0) c.add(createResource(AmmoResourceType[ammoType], amount));
  return new Map(
    Object.values(ResourceType).map(rt => {
      if (rt === AmmoResourceType[ammoType]) return [rt, c];
      const empty = createResourceContainer();
      return [rt, empty];
    })
  ) as ReadonlyMap<ResourceType, ReturnType<typeof createResourceContainer>>;
}

describe('createKineticWeaponModule', () => {

  it('rejects blank id', () => {
    const r = createKineticWeaponModule('', 'name', {
      type: ModuleId.PlasmaCannon,
      damageType: DamageType.Kinetic,
      loadedAmmoType: AmmoType.Standard,
    });
    expect(r.ok).toBe(false);
  });

  it('creates successfully with valid options', () => {
    expect(() => makeRailgun()).not.toThrow();
  });

  it('satisfies isWeaponModule and isKineticWeaponModule guards', () => {
    const module = makeRailgun();
    expect(isWeaponModule(module)).toBe(true);
    expect(isKineticWeaponModule(module)).toBe(true);
  });

});

describe('KineticWeaponModule — fire()', () => {

  it('returns undefined when no ammo in containerMap', () => {
    const module = makeRailgun();
    const map = makeContainerMapWithAmmo(AmmoType.Standard, 0);

    expect(module.fire(map)).toBeUndefined();
  });

  it('returns a DamagePacket with correct type, amount, and ammoType when ammo present', () => {
    const module = makeRailgun();
    const map = makeContainerMapWithAmmo(AmmoType.Standard, 5);

    const packet = module.fire(map);

    expect(packet).toBeDefined();
    expect(packet!.type).toBe(DamageType.Kinetic);
    expect(packet!.amount).toBe(30);
    expect(packet!.ammoType).toBe(AmmoType.Standard);
  });

  it('consumes exactly 1 ammo unit on successful fire', () => {
    const module = makeRailgun();
    const ammoContainer = createResourceContainer();
    ammoContainer.add(createResource(ResourceType.AmmoStandard, 5));

    const map = new Map(
      Object.values(ResourceType).map(rt => [rt, rt === ResourceType.AmmoStandard ? ammoContainer : createResourceContainer()])
    );

    module.fire(map);

    expect(ammoContainer.get(ResourceType.AmmoStandard)).toBe(4);
  });

  it('returns undefined on second fire when only 1 ammo was present', () => {
    const module = makeRailgun();
    const map = makeContainerMapWithAmmo(AmmoType.Standard, 1);

    module.fire(map);

    expect(module.fire(map)).toBeUndefined();
  });

});

describe('KineticWeaponModule — loadAmmo()', () => {

  it('changes which ResourceType is consumed on fire', () => {
    const module = makeRailgun();

    const poisonContainer = createResourceContainer();
    poisonContainer.add(createResource(ResourceType.AmmoPoison, 3));

    const standardContainer = createResourceContainer();
    standardContainer.add(createResource(ResourceType.AmmoStandard, 3));

    const map = new Map(
      Object.values(ResourceType).map(rt => {
        if (rt === ResourceType.AmmoPoison) return [rt, poisonContainer];
        if (rt === ResourceType.AmmoStandard) return [rt, standardContainer];
        return [rt, createResourceContainer()];
      })
    );

    module.loadAmmo(AmmoType.Poison);
    const packet = module.fire(map);

    expect(packet!.ammoType).toBe(AmmoType.Poison);
    expect(poisonContainer.get(ResourceType.AmmoPoison)).toBe(2);
    expect(standardContainer.get(ResourceType.AmmoStandard)).toBe(3);
  });

});

describe('KineticWeaponModule — no-ops', () => {

  it('produce() is a no-op — no power consumed', () => {
    const module = makeRailgun();
    const power = createResourceContainer();
    power.add(createResource(ResourceType.Power, 100));
    const map = new Map([[ResourceType.Power, power]]);

    module.produce(1, map);

    expect(power.get(ResourceType.Power)).toBe(100);
  });

  it('reset() has no effect', () => {
    const module = makeRailgun();
    const map = makeContainerMapWithAmmo(AmmoType.Standard, 5);

    module.reset();

    // Still fires normally after reset
    expect(module.fire(map)).toBeDefined();
  });

});
