import { Vector } from 'excalibur';
import type { BackgroundActorArgs } from '../actors/background-actor-args';
import { BackgroundSceneArgs } from '../background-scene-args';

const SIZE_TO_SPEED_SCALE = 2;

export function getVelocityForArgs(
  sceneArgs: BackgroundSceneArgs,
  actorArgs: BackgroundActorArgs
): Vector {
  const sizeRange = sceneArgs.maxSize - sceneArgs.minSize;
  const sizeNormalized = actorArgs.size - sceneArgs.minSize;
  const sizeFactor = sizeNormalized / sizeRange;
  const speedRange = sceneArgs.maxSpeed - sceneArgs.minSpeed;
  const speed = sceneArgs.minSpeed + sizeFactor * speedRange;
  const angleVariation = (Math.random() - 0.5) * sceneArgs.angleTolerance;
  const angle = (sceneArgs.angleBase + angleVariation) * (Math.PI / 180);

  return new Vector(
    Math.cos(angle) * speed * SIZE_TO_SPEED_SCALE,
    Math.sin(angle) * speed * SIZE_TO_SPEED_SCALE
  );
}
