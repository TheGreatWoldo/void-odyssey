import { describe, expect, it } from 'vitest';

import {
    combatEligibleLayer,
    eventEligibleLayer,
    hiddenCacheEligibleLayer,
    relicEligibleLayer,
    shipyardEligibleLayer,
    storeEligibleLayer,
} from '@/domain/models/navigation/route/strategies/eligible-layer-rules';

// total = 10 for all tests unless otherwise noted

describe('shipyardEligibleLayer — l >= 2 && l < total - 1', () => {

  it('accepts layer 2', () => {
    expect(shipyardEligibleLayer(2, 10)).toBe(true);
  });

  it('accepts layer in the middle', () => {
    expect(shipyardEligibleLayer(5, 10)).toBe(true);
  });

  it('accepts last eligible layer (total - 2)', () => {
    expect(shipyardEligibleLayer(8, 10)).toBe(true);
  });

  it('rejects layer 0', () => {
    expect(shipyardEligibleLayer(0, 10)).toBe(false);
  });

  it('rejects layer 1', () => {
    expect(shipyardEligibleLayer(1, 10)).toBe(false);
  });

  it('rejects last layer (total - 1)', () => {
    expect(shipyardEligibleLayer(9, 10)).toBe(false);
  });

});

describe('storeEligibleLayer — l > 2 && l < total - 1', () => {

  it('accepts layer 3', () => {
    expect(storeEligibleLayer(3, 10)).toBe(true);
  });

  it('rejects layer 2', () => {
    expect(storeEligibleLayer(2, 10)).toBe(false);
  });

  it('rejects last layer (total - 1)', () => {
    expect(storeEligibleLayer(9, 10)).toBe(false);
  });

});

describe('eventEligibleLayer — l >= 1 && l < total - 1', () => {

  it('accepts layer 1', () => {
    expect(eventEligibleLayer(1, 10)).toBe(true);
  });

  it('accepts layer in the middle', () => {
    expect(eventEligibleLayer(5, 10)).toBe(true);
  });

  it('rejects layer 0', () => {
    expect(eventEligibleLayer(0, 10)).toBe(false);
  });

  it('rejects last layer (total - 1)', () => {
    expect(eventEligibleLayer(9, 10)).toBe(false);
  });

});

describe('combatEligibleLayer — l >= 1 && l < total - 1', () => {

  it('accepts layer 1', () => {
    expect(combatEligibleLayer(1, 10)).toBe(true);
  });

  it('rejects layer 0', () => {
    expect(combatEligibleLayer(0, 10)).toBe(false);
  });

  it('rejects last layer (total - 1)', () => {
    expect(combatEligibleLayer(9, 10)).toBe(false);
  });

});

describe('relicEligibleLayer — l >= 2 && l < total - 1', () => {

  it('accepts layer 2', () => {
    expect(relicEligibleLayer(2, 10)).toBe(true);
  });

  it('rejects layer 1', () => {
    expect(relicEligibleLayer(1, 10)).toBe(false);
  });

  it('rejects last layer (total - 1)', () => {
    expect(relicEligibleLayer(9, 10)).toBe(false);
  });

});

describe('hiddenCacheEligibleLayer — l >= 2 && l < total - 1', () => {

  it('accepts layer 2', () => {
    expect(hiddenCacheEligibleLayer(2, 10)).toBe(true);
  });

  it('rejects layer 1', () => {
    expect(hiddenCacheEligibleLayer(1, 10)).toBe(false);
  });

  it('rejects last layer (total - 1)', () => {
    expect(hiddenCacheEligibleLayer(9, 10)).toBe(false);
  });

});
