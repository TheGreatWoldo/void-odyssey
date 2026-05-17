import type { BackgroundActorArgs } from '@/infrastructure/background/actors/background-actor-args';
import type { IBackgroundSceneArgs } from '@/infrastructure/background/background-scene-args';
import type { RandomNumberGenerator } from '@/shared/random';
import { Vector } from 'excalibur';

const SIZE_TO_SPEED_SCALE = 2;

export function getVelocityForArgs(
  sceneArgs: IBackgroundSceneArgs,
  actorArgs: BackgroundActorArgs,
  rng: RandomNumberGenerator = Math.random,
): Vector {
  const sizeRange = sceneArgs.maxSize - sceneArgs.minSize;
  const sizeNormalized = actorArgs.size - sceneArgs.minSize;
  const sizeFactor = sizeNormalized / sizeRange;
  const speedRange = sceneArgs.maxSpeed - sceneArgs.minSpeed;
  const speed = sceneArgs.minSpeed + sizeFactor * speedRange;
  const angleVariation = (rng() - 0.5) * sceneArgs.angleTolerance;
  const angle = (sceneArgs.angleBase + angleVariation) * (Math.PI / 180);

  return new Vector(
    Math.cos(angle) * speed * SIZE_TO_SPEED_SCALE,
    Math.sin(angle) * speed * SIZE_TO_SPEED_SCALE
  );
}
