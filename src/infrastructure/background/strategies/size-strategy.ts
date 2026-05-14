import type { IBackgroundSceneArgs } from '@/infrastructure/background/background-scene-args';

export function getSizeForArgs(sceneArgs: IBackgroundSceneArgs): number {
  return (
    sceneArgs.minSize + Math.random() * (sceneArgs.maxSize - sceneArgs.minSize)
  );
}
