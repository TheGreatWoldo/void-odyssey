import type { RandomNumberGenerator } from '@/shared/random';

export function getRandomInRange(
  min: number,
  max: number,
  rng: RandomNumberGenerator = Math.random,
): number {
  return min + rng() * (max - min);
}

/** Fisher-Yates in-place shuffle. Mutates and returns the array. */
export function fisherYatesShuffle<T>(
  arr: T[],
  rng: RandomNumberGenerator = Math.random,
): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function getFactorInRange(min: number, max: number, t: number): number {
  return min + t * (max - min);
}

export function getFactorFromRange(
  min: number,
  max: number,
  value: number
): number {
  if (max - min === 0) return 0;

  return (value - min) / (max - min);
}
