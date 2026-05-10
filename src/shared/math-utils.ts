export function getRandomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Fisher-Yates in-place shuffle. Mutates and returns the array. */
export function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

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
