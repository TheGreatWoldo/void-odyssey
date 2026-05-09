import {
    intersectionOfLines2D,
    lineThroughPointParallelToVector,
    perpendicularVector,
    randomPointOnLine,
} from '@/infrastructure/utils/geometry-utils';
import {
    getAdjacentQuadrantCornerPoints,
    getCornerForQuadrant,
    getOppositeQuadrant,
    getQuadrantForVelocity,
    Quadrant,
} from '@/infrastructure/utils/quadrant-utils';
import { Vector } from 'excalibur';
import type { BackgroundActorArgs } from '../actors/background-actor-args';
import type { BackgroundSceneArgs } from '../background-scene-args';

export type PositionResult = {
  startingPosition: Vector;
};

export class PositionStrategyDebugResult implements PositionResult {
  velocity: Vector = new Vector(0, 0);
  velocityQuadrant: Quadrant = Quadrant.NONE;
  cornerPoints: Vector[] = [];
  startOfLineOne: Vector = new Vector(0, 0);
  endOfLineOne: Vector = new Vector(0, 0);
  startOfLineTwo: Vector = new Vector(0, 0);
  endOfLineTwo: Vector = new Vector(0, 0);
  oppositeQuadrant: Quadrant = Quadrant.NONE;
  cornerPoint: Vector = new Vector(0, 0);
  perpendicularStart: Vector = new Vector(0, 0);
  perpendicularEnd: Vector = new Vector(0, 0);
  intersection1: Vector | null = null;
  intersection2: Vector | null = null;
  length: number = 0;
  startingPosition: Vector = new Vector(0, 0);
}

function computePosition(
  sceneArgs: BackgroundSceneArgs,
  actorArgs: BackgroundActorArgs
): PositionStrategyDebugResult {
  const result = new PositionStrategyDebugResult();
  const angle = sceneArgs.angleBase * (Math.PI / 180);

  result.velocity = new Vector(Math.cos(angle), Math.sin(angle));
  result.velocityQuadrant = getQuadrantForVelocity(result.velocity);
  result.cornerPoints = getAdjacentQuadrantCornerPoints(
    result.velocityQuadrant,
    actorArgs.viewport
  );

  if (result.cornerPoints.length < 2) {
    return result;
  }

  const lineOne = lineThroughPointParallelToVector(
    result.cornerPoints[0],
    result.velocity
  );

  result.startOfLineOne = lineOne(-1000);
  result.endOfLineOne = lineOne(1000);

  const lineTwo = lineThroughPointParallelToVector(
    result.cornerPoints[1],
    result.velocity
  );

  result.startOfLineTwo = lineTwo(-1000);
  result.endOfLineTwo = lineTwo(1000);

  result.oppositeQuadrant = getOppositeQuadrant(result.velocityQuadrant);
  result.cornerPoint = getCornerForQuadrant(
    result.oppositeQuadrant,
    actorArgs.viewport
  );

  const perpendicularVelocity = perpendicularVector(result.velocity);
  const perpendicularLine = lineThroughPointParallelToVector(
    result.cornerPoint,
    perpendicularVelocity
  );

  result.perpendicularStart = perpendicularLine(-1000);
  result.perpendicularEnd = perpendicularLine(1000);

  result.intersection1 = intersectionOfLines2D(
    result.startOfLineOne,
    result.endOfLineOne,
    result.perpendicularStart,
    result.perpendicularEnd
  );
  result.intersection2 = intersectionOfLines2D(
    result.startOfLineTwo,
    result.endOfLineTwo,
    result.perpendicularStart,
    result.perpendicularEnd
  );
  result.length =
    result.intersection1 && result.intersection2
      ? result.intersection1.distance(result.intersection2)
      : 0;
  result.startingPosition = randomPointOnLine(
    result.intersection1,
    result.intersection2
  );

  return result;
}

export function getPositionForArgs(
  sceneArgs: BackgroundSceneArgs,
  actorArgs: BackgroundActorArgs
): PositionResult {
  return computePosition(sceneArgs, actorArgs);
}

export function getPositionDebugInfoForArgs(
  sceneArgs: BackgroundSceneArgs,
  actorArgs: BackgroundActorArgs
): PositionStrategyDebugResult {
  return computePosition(sceneArgs, actorArgs);
}
