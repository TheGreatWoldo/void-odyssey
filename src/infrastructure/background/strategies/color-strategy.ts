import {
    getFactorFromRange,
    getFactorInRange,
    getRandomInRange,
} from '@/shared/math-utils';
import { Color } from 'excalibur';
import type { BackgroundActorArgs } from '@/infrastructure/background/actors/background-actor-args';
import type { ColorArgs } from '@/infrastructure/background/args/color-args';
import type { SizeArgs } from '@/infrastructure/background/background-scene-args';

const RANGE_JITTER_FACTOR = 0.15;

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
  // Smaller actors are further away — map lightness and alpha from min→max by size.
  // A small random jitter keeps variation within the parallax band.
  const lightnessBase = getFactorInRange(colorArgs.minLightness, colorArgs.maxLightness, sizeFactor);
  const lightnessJitter = (colorArgs.maxLightness - colorArgs.minLightness) * RANGE_JITTER_FACTOR;
  const lightness = Math.max(colorArgs.minLightness,
    Math.min(colorArgs.maxLightness, lightnessBase + getRandomInRange(-lightnessJitter, lightnessJitter)));

  const alphaBase = getFactorInRange(colorArgs.minAlpha, colorArgs.maxAlpha, sizeFactor);
  const alphaJitter = (colorArgs.maxAlpha - colorArgs.minAlpha) * RANGE_JITTER_FACTOR;
  const alpha = Math.max(colorArgs.minAlpha,
    Math.min(colorArgs.maxAlpha, alphaBase + getRandomInRange(-alphaJitter, alphaJitter)));

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
