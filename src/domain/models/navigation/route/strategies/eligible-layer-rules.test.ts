import { describe, expect, it } from 'vitest';

import {
    combatEligibleStopIndex,
    eventEligibleStopIndex,
    hiddenCacheEligibleStopIndex,
    relicEligibleStopIndex,
    shipyardEligibleStopIndex,
    storeEligibleStopIndex,
} from '@/domain/models/navigation/route/strategies/eligible-layer-rules';

// total = 10 for all tests unless otherwise noted

describe('shipyardEligibleStopIndex — s >= 2 && s < total - 1', () => {

  it('accepts stopIndex 2', () => {
    expect(shipyardEligibleStopIndex(2, 10)).toBe(true);
  });

  it('accepts stopIndex in the middle', () => {
    expect(shipyardEligibleStopIndex(5, 10)).toBe(true);
  });

  it('accepts last eligible stopIndex (total - 2)', () => {
    expect(shipyardEligibleStopIndex(8, 10)).toBe(true);
  });

  it('rejects stopIndex 0', () => {
    expect(shipyardEligibleStopIndex(0, 10)).toBe(false);
  });

  it('rejects stopIndex 1', () => {
    expect(shipyardEligibleStopIndex(1, 10)).toBe(false);
  });

  it('rejects last stopIndex (total - 1)', () => {
    expect(shipyardEligibleStopIndex(9, 10)).toBe(false);
  });

});

describe('storeEligibleStopIndex — s > 2 && s < total - 1', () => {

  it('accepts stopIndex 3', () => {
    expect(storeEligibleStopIndex(3, 10)).toBe(true);
  });

  it('rejects stopIndex 2', () => {
    expect(storeEligibleStopIndex(2, 10)).toBe(false);
  });

  it('rejects last stopIndex (total - 1)', () => {
    expect(storeEligibleStopIndex(9, 10)).toBe(false);
  });

});

describe('eventEligibleStopIndex — s >= 1 && s < total - 1', () => {

  it('accepts stopIndex 1', () => {
    expect(eventEligibleStopIndex(1, 10)).toBe(true);
  });

  it('accepts stopIndex in the middle', () => {
    expect(eventEligibleStopIndex(5, 10)).toBe(true);
  });

  it('rejects stopIndex 0', () => {
    expect(eventEligibleStopIndex(0, 10)).toBe(false);
  });

  it('rejects last stopIndex (total - 1)', () => {
    expect(eventEligibleStopIndex(9, 10)).toBe(false);
  });

});

describe('combatEligibleStopIndex — s >= 1 && s < total - 1', () => {

  it('accepts stopIndex 1', () => {
    expect(combatEligibleStopIndex(1, 10)).toBe(true);
  });

  it('rejects stopIndex 0', () => {
    expect(combatEligibleStopIndex(0, 10)).toBe(false);
  });

  it('rejects last stopIndex (total - 1)', () => {
    expect(combatEligibleStopIndex(9, 10)).toBe(false);
  });

});

describe('relicEligibleStopIndex — s >= 2 && s < total - 1', () => {

  it('accepts stopIndex 2', () => {
    expect(relicEligibleStopIndex(2, 10)).toBe(true);
  });

  it('rejects stopIndex 1', () => {
    expect(relicEligibleStopIndex(1, 10)).toBe(false);
  });

  it('rejects last stopIndex (total - 1)', () => {
    expect(relicEligibleStopIndex(9, 10)).toBe(false);
  });

});

describe('hiddenCacheEligibleStopIndex — s >= 2 && s < total - 1', () => {

  it('accepts stopIndex 2', () => {
    expect(hiddenCacheEligibleStopIndex(2, 10)).toBe(true);
  });

  it('rejects stopIndex 1', () => {
    expect(hiddenCacheEligibleStopIndex(1, 10)).toBe(false);
  });

  it('rejects last stopIndex (total - 1)', () => {
    expect(hiddenCacheEligibleStopIndex(9, 10)).toBe(false);
  });

});
