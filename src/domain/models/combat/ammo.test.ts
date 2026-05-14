import { describe, expect, it } from 'vitest';

import { AmmoResourceType, AmmoType } from '@/domain/models/combat/ammo';
import { ResourceType } from '@/domain/models/resources/resource';

describe('AmmoType', () => {

  it('has the expected variant values', () => {
    expect(AmmoType.Standard).toBe('Standard');
    expect(AmmoType.Poison).toBe('Poison');
    expect(AmmoType.Fire).toBe('Fire');
    expect(AmmoType.Cold).toBe('Cold');
  });

});

describe('AmmoResourceType', () => {

  it('maps Standard to AmmoStandard', () => {
    expect(AmmoResourceType[AmmoType.Standard]).toBe(ResourceType.AmmoStandard);
  });

  it('maps Poison to AmmoPoison', () => {
    expect(AmmoResourceType[AmmoType.Poison]).toBe(ResourceType.AmmoPoison);
  });

  it('maps Fire to AmmoFire', () => {
    expect(AmmoResourceType[AmmoType.Fire]).toBe(ResourceType.AmmoFire);
  });

  it('maps Cold to AmmoCold', () => {
    expect(AmmoResourceType[AmmoType.Cold]).toBe(ResourceType.AmmoCold);
  });

  it('covers every AmmoType variant', () => {
    for (const ammoType of Object.values(AmmoType)) {
      expect(AmmoResourceType[ammoType]).toBeDefined();
    }
  });

});
