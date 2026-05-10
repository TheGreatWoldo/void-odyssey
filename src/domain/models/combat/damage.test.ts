import { describe, expect, it } from 'vitest';

import { AmmoType } from '@/domain/models/combat/ammo';
import { applyDamage, createDamagePacket, DamageType } from '@/domain/models/combat/damage';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { createResourceContainer } from '@/domain/models/resources/resource-container';

function makeResources(hull: number, shield: number) {
  const c = createResourceContainer();
  c.add(createResource(ResourceType.Hull, hull));
  c.add(createResource(ResourceType.Shield, shield));
  return c;
}

describe('applyDamage', () => {

  it('full shield absorbs all damage — hull unchanged', () => {
    const resources = makeResources(100, 50);

    applyDamage(createDamagePacket(DamageType.Energy, 30), resources);

    expect(resources.get(ResourceType.Shield)).toBe(20);
    expect(resources.get(ResourceType.Hull)).toBe(100);
  });

  it('partial shield absorbs some — remainder damages hull', () => {
    const resources = makeResources(100, 20);

    applyDamage(createDamagePacket(DamageType.Kinetic, 50, AmmoType.Standard), resources);

    expect(resources.get(ResourceType.Shield)).toBe(0);
    expect(resources.get(ResourceType.Hull)).toBe(70);
  });

  it('zero shield — all damage goes to hull', () => {
    const resources = makeResources(100, 0);

    applyDamage(createDamagePacket(DamageType.Energy, 40), resources);

    expect(resources.get(ResourceType.Shield)).toBe(0);
    expect(resources.get(ResourceType.Hull)).toBe(60);
  });

  it('depletes hull to zero when damage exceeds hull', () => {
    const resources = makeResources(10, 0);

    applyDamage(createDamagePacket(DamageType.Explosive, 50), resources);

    expect(resources.get(ResourceType.Hull)).toBe(0);
  });

  it('DamagePacket carries ammoType for kinetic, absent for energy', () => {
    const kinetic = createDamagePacket(DamageType.Kinetic, 10, AmmoType.Poison);
    const energy  = createDamagePacket(DamageType.Energy, 10);

    expect(kinetic.ammoType).toBe(AmmoType.Poison);
    expect(energy.ammoType).toBeUndefined();
  });

});
