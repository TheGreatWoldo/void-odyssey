import type { IBackgroundSceneArgs } from '../background-scene-args';

export function getSizeForArgs(sceneArgs: IBackgroundSceneArgs): number {
  return (
    sceneArgs.minSize + Math.random() * (sceneArgs.maxSize - sceneArgs.minSize)
  );
}
