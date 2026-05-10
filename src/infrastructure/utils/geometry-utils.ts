import { vec, Vector } from 'excalibur';

export function lineThroughPointParallelToVector(
  point: Vector,
  direction: Vector
) {
  return (t: number): Vector =>
    vec(point.x + t * direction.x, point.y + t * direction.y);
}

export function intersectionOfLines2D(
  p1: Vector,
  p2: Vector,
  p3: Vector,
  p4: Vector
): Vector | null {
  const d1 = p2.sub(p1);
  const d2 = p4.sub(p3);
  const denom = d1.x * d2.y - d1.y * d2.x;

  if (Math.abs(denom) < 0.0001) return null;

  const t1 = ((p3.x - p1.x) * d2.y - (p3.y - p1.y) * d2.x) / denom;

  return vec(p1.x + t1 * d1.x, p1.y + t1 * d1.y);
}

export function perpendicularVector(v: Vector): Vector {
  return vec(-v.y, v.x);
}

export function randomPointOnLine(
  pointOne: Vector | null,
  pointTwo: Vector | null
): Vector | null {
  if (!pointOne || !pointTwo) return null;

  const t = Math.random();

  return vec(
    pointOne.x + t * (pointTwo.x - pointOne.x),
    pointOne.y + t * (pointTwo.y - pointOne.y)
  );
}
