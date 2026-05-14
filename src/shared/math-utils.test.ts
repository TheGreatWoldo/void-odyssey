import { describe, expect, it } from 'vitest';

import { fisherYatesShuffle, getFactorFromRange, getFactorInRange, getRandomInRange } from '@/shared/math-utils';

describe('getRandomInRange', () => {

  it('returns a value >= min', () => {
    for (let i = 0; i < 50; i++) {
      expect(getRandomInRange(5, 10)).toBeGreaterThanOrEqual(5);
    }
  });

  it('returns a value < max', () => {
    for (let i = 0; i < 50; i++) {
      expect(getRandomInRange(5, 10)).toBeLessThan(10);
    }
  });

  it('returns min when min === max', () => {
    expect(getRandomInRange(7, 7)).toBe(7);
  });

});

describe('fisherYatesShuffle', () => {

  it('returns the same array reference', () => {
    const arr = [1, 2, 3];
    const result = fisherYatesShuffle(arr);

    expect(result).toBe(arr);
  });

  it('preserves all elements (same multiset)', () => {
    const original = [1, 2, 3, 4, 5];
    const arr = [...original];

    fisherYatesShuffle(arr);

    expect(arr.slice().sort((a, b) => a - b)).toEqual(original);
  });

  it('handles an empty array', () => {
    expect(fisherYatesShuffle([])).toEqual([]);
  });

  it('handles a single-element array', () => {
    expect(fisherYatesShuffle([42])).toEqual([42]);
  });

  it('shuffles a large array (smoke test — no infinite loop)', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    fisherYatesShuffle(arr);

    expect(arr).toHaveLength(1000);
  });

});

describe('getFactorInRange', () => {

  it('returns min when t === 0', () => {
    expect(getFactorInRange(10, 20, 0)).toBe(10);
  });

  it('returns max when t === 1', () => {
    expect(getFactorInRange(10, 20, 1)).toBe(20);
  });

  it('returns midpoint when t === 0.5', () => {
    expect(getFactorInRange(0, 100, 0.5)).toBeCloseTo(50);
  });

  it('works with negative range', () => {
    expect(getFactorInRange(-10, -2, 0.5)).toBeCloseTo(-6);
  });

});

describe('getFactorFromRange', () => {

  it('returns 0 when value === min', () => {
    expect(getFactorFromRange(0, 100, 0)).toBe(0);
  });

  it('returns 1 when value === max', () => {
    expect(getFactorFromRange(0, 100, 100)).toBe(1);
  });

  it('returns 0.5 for the midpoint', () => {
    expect(getFactorFromRange(0, 100, 50)).toBeCloseTo(0.5);
  });

  it('returns 0 when min === max (zero range guard)', () => {
    expect(getFactorFromRange(5, 5, 5)).toBe(0);
  });

});
