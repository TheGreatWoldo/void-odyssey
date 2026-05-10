import { describe, expect, it } from 'vitest';

import { DamageType } from '@/domain/models/combat/damage';
import { ModuleId } from '@/domain/models/module/production-module-id';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { createResourceContainer } from '@/domain/models/resources/resource-container';
import { createEnergyWeaponModule, isEnergyWeaponModule } from '@/domain/models/weapon/energy-weapon-module';
import { isWeaponModule } from '@/domain/models/weapon/weapon-module';

function makeCannon(overrides: Partial<Parameters<typeof createEnergyWeaponModule>[2]> = {}) {
  const r = createEnergyWeaponModule('w-1', 'Test Cannon', {
    type: ModuleId.PlasmaCannon,
    damageType: DamageType.Energy,
    maxOutput: 25,
    chargeTime: 2,
    powerCostPerSecond: 10,
    ...overrides,
  });
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function makeContainerMap(power = 0) {
  const c = createResourceContainer();
  if (power > 0) c.add(createResource(ResourceType.Power, power));
  return new Map([[ResourceType.Power, c]]) as ReadonlyMap<typeof ResourceType.Power, typeof c>;
}

describe('createEnergyWeaponModule', () => {

  it('rejects blank id', () => {
    const result = makeCannon({ type: ModuleId.PlasmaCannon });
    // Override with blank id via direct call
    const r = createEnergyWeaponModule('  ', 'name', {
      type: ModuleId.PlasmaCannon,
      damageType: DamageType.Energy,
      chargeTime: 2,
      powerCostPerSecond: 10,
    });
    expect(r.ok).toBe(false);
  });

  it('rejects chargeTime <= 0', () => {
    const r = createEnergyWeaponModule('w-1', 'name', {
      type: ModuleId.PlasmaCannon,
      damageType: DamageType.Energy,
      chargeTime: 0,
      powerCostPerSecond: 10,
    });
    expect(r.ok).toBe(false);
  });

  it('rejects negative powerCostPerSecond', () => {
    const r = createEnergyWeaponModule('w-1', 'name', {
      type: ModuleId.PlasmaCannon,
      damageType: DamageType.Energy,
      chargeTime: 2,
      powerCostPerSecond: -1,
    });
    expect(r.ok).toBe(false);
  });

  it('creates successfully with valid options', () => {
    expect(() => makeCannon()).not.toThrow();
  });

  it('satisfies isWeaponModule and isEnergyWeaponModule guards', () => {
    const module = makeCannon();
    expect(isWeaponModule(module)).toBe(true);
    expect(isEnergyWeaponModule(module)).toBe(true);
  });

});

describe('EnergyWeaponModule — charging', () => {

  it('chargeProgress starts at 0', () => {
    const module = makeCannon();
    expect(module.chargeProgress).toBe(0);
  });

  it('isCharged() is false before full charge', () => {
    const module = makeCannon();
    expect(module.isCharged()).toBe(false);
  });

  it('chargeProgress advances proportionally to deltaTime and actualThrottle', () => {
    const module = makeCannon();
    const map = makeContainerMap(100);

    // 1s at full throttle with chargeTime=2 should advance by 0.5
    module.produce(1, map);

    expect(module.chargeProgress).toBeCloseTo(0.5);
  });

  it('chargeProgress clamps to 1 and isCharged() becomes true', () => {
    const module = makeCannon();
    const map = makeContainerMap(100);

    module.produce(10, map); // way more than chargeTime=2

    expect(module.chargeProgress).toBe(1);
    expect(module.isCharged()).toBe(true);
  });

  it('chargeProgress respects actualThrottle (half throttle = half speed)', () => {
    const module = makeCannon();
    module.setThrottle(0.5);
    module.stepRamp(0); // instant ramp
    const map = makeContainerMap(100);

    module.produce(2, map); // 2s at 0.5 throttle, chargeTime=2 → 0.5

    expect(module.chargeProgress).toBeCloseTo(0.5);
  });

  it('reset() clears chargeProgress to 0', () => {
    const module = makeCannon();
    const map = makeContainerMap(100);

    module.produce(5, map);
    expect(module.chargeProgress).toBe(1);

    module.reset();
    expect(module.chargeProgress).toBe(0);
    expect(module.isCharged()).toBe(false);
  });

});

describe('EnergyWeaponModule — power consumption', () => {

  it('consumes power proportionally during produce()', () => {
    const module = makeCannon(); // powerCostPerSecond=10
    const power = createResourceContainer();
    power.add(createResource(ResourceType.Power, 100));
    const map = new Map([[ResourceType.Power, power]]);

    module.produce(1, map); // 1s at full throttle = 10 power

    expect(power.get(ResourceType.Power)).toBeCloseTo(90);
  });

  it('does not over-consume when power is limited', () => {
    const module = makeCannon();
    const power = createResourceContainer();
    power.add(createResource(ResourceType.Power, 5));
    const map = new Map([[ResourceType.Power, power]]);

    module.produce(1, map); // wants 10, only 5 available

    // destroy() clamps to available — no negative values
    expect(power.get(ResourceType.Power)).toBe(0);
  });

  it('skips power consumption when powerCostPerSecond is 0', () => {
    const r = createEnergyWeaponModule('w-1', 'Silent Cannon', {
      type: ModuleId.PlasmaCannon,
      damageType: DamageType.Energy,
      chargeTime: 2,
      powerCostPerSecond: 0,
      maxOutput: 10,
    });
    if (!r.ok) throw new Error(r.error);
    const module = r.value;

    const power = createResourceContainer();
    power.add(createResource(ResourceType.Power, 50));
    const map = new Map([[ResourceType.Power, power]]);

    module.produce(1, map);

    expect(power.get(ResourceType.Power)).toBe(50);
  });

});

describe('EnergyWeaponModule — fire()', () => {

  it('returns undefined when not charged', () => {
    const module = makeCannon();
    const map = makeContainerMap(100);

    expect(module.fire(map)).toBeUndefined();
  });

  it('returns a DamagePacket when charged', () => {
    const module = makeCannon();
    const map = makeContainerMap(100);

    module.produce(10, map);
    const packet = module.fire(map);

    expect(packet).toBeDefined();
    expect(packet!.type).toBe(DamageType.Energy);
    expect(packet!.amount).toBe(25);
    expect(packet!.ammoType).toBeUndefined();
  });

  it('resets chargeProgress to 0 after firing', () => {
    const module = makeCannon();
    const map = makeContainerMap(100);

    module.produce(10, map);
    module.fire(map);

    expect(module.chargeProgress).toBe(0);
    expect(module.isCharged()).toBe(false);
  });

  it('returns undefined on second fire before recharging', () => {
    const module = makeCannon();
    const map = makeContainerMap(100);

    module.produce(10, map);
    module.fire(map);

    expect(module.fire(map)).toBeUndefined();
  });

});
