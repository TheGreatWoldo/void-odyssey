import { BackgroundSceneArgs } from '../background-scene-args';

export function getSizeForArgs(sceneArgs: BackgroundSceneArgs): number {
  return (
    sceneArgs.minSize + Math.random() * (sceneArgs.maxSize - sceneArgs.minSize)
  );
}
