import {
    getFactorFromRange,
    getFactorInRange,
    getRandomInRange,
} from '@/shared/math-utils';
import { Color } from 'excalibur';
import type { BackgroundActorArgs } from '../actors/background-actor-args';
import type { ColorArgs } from '../args/color-args';
import type { SizeArgs } from '../background-scene-args';

export const HueForSizeStrategy = (
  colorArgs: ColorArgs,
  sizeArgs: SizeArgs,
  actorArgs: BackgroundActorArgs
): Color => {
  const sizeFactor = getFactorFromRange(
    sizeArgs.minSize,
    sizeArgs.maxSize,
    actorArgs.size
  );
  const hue = getFactorInRange(colorArgs.minHue, colorArgs.maxHue, sizeFactor);
  const saturation = getRandomInRange(
    colorArgs.minSaturation,
    colorArgs.maxSaturation
  );
  const lightness = getRandomInRange(
    colorArgs.minLightness,
    colorArgs.maxLightness
  );
  const alpha = getRandomInRange(colorArgs.minAlpha, colorArgs.maxAlpha);

  return Color.fromHSL(hue, saturation, lightness, alpha);
};

export const RandomColorStrategy = (
  colorArgs: ColorArgs,
  _sizeArgs: SizeArgs,
  _actorArgs: BackgroundActorArgs
): Color => {
  const hue = getRandomInRange(colorArgs.minHue, colorArgs.maxHue);
  const saturation = getRandomInRange(
    colorArgs.minSaturation,
    colorArgs.maxSaturation
  );
  const lightness = getRandomInRange(
    colorArgs.minLightness,
    colorArgs.maxLightness
  );
  const alpha = getRandomInRange(colorArgs.minAlpha, colorArgs.maxAlpha);

  return Color.fromHSL(hue, saturation, lightness, alpha);
};
