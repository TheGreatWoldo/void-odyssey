import type { Color, Vector } from 'excalibur';
import type { BackgroundActorArgs } from '../actors/background-actor-args';
import type { ColorArgs } from '../args/color-args';
import type { IBackgroundSceneArgs, SizeArgs } from '../background-scene-args';
import type { PositionResult } from './position-strategy';

export type SizeStrategy = (
  scene: IBackgroundSceneArgs,
  actor: BackgroundActorArgs
) => number;

export type ActorColorStrategy = (
  colorArgs: ColorArgs,
  sizeArgs: SizeArgs,
  actor: BackgroundActorArgs
) => Color;

export type VelocityStrategy = (
  scene: IBackgroundSceneArgs,
  actor: BackgroundActorArgs
) => Vector;

export type PositionStrategy = (
  scene: IBackgroundSceneArgs,
  actor: BackgroundActorArgs
) => PositionResult;

export type BackgroundStrategies = {
  sizeStrategy: SizeStrategy;
  actorColorStrategy: ActorColorStrategy;
  backgroundColorStrategy: ActorColorStrategy;
  velocityStrategy: VelocityStrategy;
  positionStrategy: PositionStrategy;
};
