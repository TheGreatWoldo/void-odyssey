import type { BackgroundActorArgs } from '@/infrastructure/background/actors/background-actor-args';
import type { IBackgroundSceneArgs } from '@/infrastructure/background/background-scene-args';
import type { RandomNumberGenerator } from '@/shared/random';

export function getSizeForArgs(
  sceneArgs: IBackgroundSceneArgs,
  _actorArgs?: BackgroundActorArgs,
  rng: RandomNumberGenerator = Math.random,
): number {
  return (
    sceneArgs.minSize + rng() * (sceneArgs.maxSize - sceneArgs.minSize)
  );
}
