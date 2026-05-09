export function getRandomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
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
