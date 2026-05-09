import { BoundingBox, Vector } from 'excalibur';

export enum Quadrant {
  NONE = 'NONE',
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
  FOURTH = 'FOURTH',
}

export function getQuadrantForVelocity(velocity: Vector): Quadrant {
  if (velocity.x >= 0 && velocity.y <= 0) return Quadrant.FIRST;
  if (velocity.x < 0 && velocity.y <= 0) return Quadrant.SECOND;
  if (velocity.x < 0 && velocity.y > 0) return Quadrant.THIRD;

  return Quadrant.FOURTH;
}

export function getCornerForQuadrant(
  quadrant: Quadrant,
  viewport: BoundingBox
): Vector {
  switch (quadrant) {
    case Quadrant.NONE:
      return new Vector(0, 0);
    case Quadrant.FIRST:
      return viewport.topRight;
    case Quadrant.SECOND:
      return viewport.topLeft;
    case Quadrant.THIRD:
      return viewport.bottomLeft;
    case Quadrant.FOURTH:
      return viewport.bottomRight;
  }
}

export function getAdjacentQuadrantCornerPoints(
  quadrant: Quadrant,
  viewport: BoundingBox
): Vector[] {
  switch (quadrant) {
    case Quadrant.FIRST:
    case Quadrant.THIRD:
      return [viewport.topLeft, viewport.bottomRight];
    case Quadrant.SECOND:
    case Quadrant.FOURTH:
      return [viewport.topRight, viewport.bottomLeft];
    default:
      return [];
  }
}

export function getOppositeQuadrant(quadrant: Quadrant): Quadrant {
  switch (quadrant) {
    case Quadrant.NONE:
      return Quadrant.NONE;
    case Quadrant.FIRST:
      return Quadrant.THIRD;
    case Quadrant.SECOND:
      return Quadrant.FOURTH;
    case Quadrant.THIRD:
      return Quadrant.FIRST;
    case Quadrant.FOURTH:
      return Quadrant.SECOND;
  }
}
