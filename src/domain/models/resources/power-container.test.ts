import { describe, expect, it } from 'vitest';

import { createBatteryContainer, createPowerContainer } from '@/domain/models/resources/power-container';
import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { createResourceContainer } from '@/domain/models/resources/resource-container';

function expectOkNumber(result: { ok: boolean; value?: number; error?: unknown }): number {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected Ok result but got Err: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

function makeChargedPower(amount: number) {
  const pc = createPowerContainer();
  const battery = createBatteryContainer({ capacity: amount });
  pc.addContainer(battery);
  expectOkNumber(pc.add(createResource(ResourceType.Power, amount)));
  return pc;
}

describe('createPowerContainer — basics', () => {

  it('starts with zero stored power and zero capacity when no batteries', () => {
    const pc = createPowerContainer();

    expect(pc.get(ResourceType.Power)).toBe(0);
    expect(pc.capacity).toBe(0);
    expect(pc.freeSpace()).toBe(0);
  });

  it('only accepts Power — other types are fully refused', () => {
    const pc = createPowerContainer();
    const battery = createBatteryContainer({ capacity: 10 });
    pc.addContainer(battery);

    const addResult = pc.add(createResource(ResourceType.Food, 5));

    expect(addResult.ok).toBe(false);
    if (!addResult.ok) {
      expect(addResult.error.kind).toBe('type-not-accepted');
    }
    expect(pc.get(ResourceType.Food)).toBe(0);
  });

  it('accepts returns true for Power and false for other types', () => {
    const pc = createPowerContainer();

    expect(pc.accepts(ResourceType.Power)).toBe(true);
    expect(pc.accepts(ResourceType.Fuel)).toBe(false);
  });

});

describe('createPowerContainer — battery management', () => {

  it('reflects battery capacity after addContainer', () => {
    const pc = createPowerContainer();
    const battery = createBatteryContainer({ capacity: 20 });

    pc.addContainer(battery);

    expect(pc.capacity).toBe(20);
  });

  it('sums capacity across multiple batteries', () => {
    const pc = createPowerContainer();
    pc.addContainer(createBatteryContainer({ capacity: 10 }));
    pc.addContainer(createBatteryContainer({ capacity: 15 }));

    expect(pc.capacity).toBe(25);
  });

  it('removes battery capacity after removeContainer', () => {
    const pc = createPowerContainer();
    const battery = createBatteryContainer({ capacity: 10 });
    pc.addContainer(battery);

    pc.removeContainer(battery);

    expect(pc.capacity).toBe(0);
  });

});

describe('createPowerContainer — add / get / destroy', () => {

  it('fills batteries left-to-right', () => {
    const pc = createPowerContainer();
    pc.addContainer(createBatteryContainer({ capacity: 5 }));
    pc.addContainer(createBatteryContainer({ capacity: 5 }));

    expectOkNumber(pc.add(createResource(ResourceType.Power, 7)));

    expect(pc.get(ResourceType.Power)).toBe(7);
  });

  it('refuses excess when all batteries are full', () => {
    const pc = createPowerContainer();
    pc.addContainer(createBatteryContainer({ capacity: 4 }));

    const refused = expectOkNumber(pc.add(createResource(ResourceType.Power, 10)));

    expect(refused).toBe(6);
    expect(pc.get(ResourceType.Power)).toBe(4);
  });

  it('destroy drains power across batteries', () => {
    const pc = makeChargedPower(10);

    pc.destroy(createResource(ResourceType.Power, 3));

    expect(pc.get(ResourceType.Power)).toBe(7);
  });

  it('destroy of non-Power is a no-op', () => {
    const pc = makeChargedPower(10);

    pc.destroy(createResource(ResourceType.Fuel, 5));

    expect(pc.get(ResourceType.Power)).toBe(10);
  });

  it('freeSpace returns remaining capacity', () => {
    const pc = createPowerContainer();
    pc.addContainer(createBatteryContainer({ capacity: 10 }));
    expectOkNumber(pc.add(createResource(ResourceType.Power, 3)));

    expect(pc.freeSpace()).toBe(7);
  });

});

describe('createPowerContainer — has / hasAll', () => {

  it('has returns true when sufficient power is stored', () => {
    const pc = makeChargedPower(10);

    expect(pc.has({ id: ResourceType.Power, amount: 5 })).toBe(true);
    expect(pc.has({ id: ResourceType.Power, amount: 10 })).toBe(true);
    expect(pc.has({ id: ResourceType.Power, amount: 11 })).toBe(false);
  });

  it('has returns false for non-Power with amount > 0', () => {
    const pc = makeChargedPower(10);

    expect(pc.has({ id: ResourceType.Fuel, amount: 1 })).toBe(false);
  });

  it('has returns true for non-Power with amount === 0', () => {
    const pc = makeChargedPower(10);

    expect(pc.has({ id: ResourceType.Fuel, amount: 0 })).toBe(true);
  });

  it('hasAll returns true when all resources are satisfied', () => {
    const pc = makeChargedPower(10);

    expect(pc.hasAll([{ id: ResourceType.Power, amount: 5 }])).toBe(true);
  });

  it('hasAll returns false when any resource is not satisfied', () => {
    const pc = makeChargedPower(10);

    expect(pc.hasAll([{ id: ResourceType.Power, amount: 20 }])).toBe(false);
  });

});

describe('createPowerContainer — moveAll', () => {

  it('moves all power into a target container', () => {
    const source = makeChargedPower(5);
    const target = createResourceContainer({ capacity: 100 });

    source.moveAll(target);

    expect(source.get(ResourceType.Power)).toBe(0);
    expect(target.get(ResourceType.Power)).toBe(5);
  });

  it('returns 0 when nothing is stored', () => {
    const pc = createPowerContainer();
    pc.addContainer(createBatteryContainer({ capacity: 10 }));
    const target = createResourceContainer({ capacity: 100 });

    const refused = pc.moveAll(target);

    expect(refused).toBe(0);
  });

});

describe('createBatteryContainer', () => {

  it('accepts Power', () => {
    const battery = createBatteryContainer({ capacity: 10 });

    const refused = expectOkNumber(battery.add(createResource(ResourceType.Power, 5)));

    expect(refused).toBe(0);
    expect(battery.get(ResourceType.Power)).toBe(5);
  });

  it('rejects non-Power resources', () => {
    const battery = createBatteryContainer({ capacity: 10 });

    const addResult = battery.add(createResource(ResourceType.Food, 5));

    expect(addResult.ok).toBe(false);
    if (!addResult.ok) {
      expect(addResult.error.kind).toBe('type-not-accepted');
    }
  });

});
