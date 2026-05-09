import { ColorArgs } from '../args/color-args';

export type ColorArgsKey = keyof typeof backgroundColorArgsCatalog;

export function getRandomColorArgs(): ColorArgs {
  const keys = Object.keys(backgroundColorArgsCatalog) as ColorArgsKey[];
  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  return backgroundColorArgsCatalog[randomKey];
}

export const backgroundColorArgsCatalog = {
  red: new ColorArgs({ minHue: 0.0, maxHue: 0.0, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  redOrange: new ColorArgs({ minHue: 0.05, maxHue: 0.05, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  orange: new ColorArgs({ minHue: 0.1, maxHue: 0.1, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  yellowOrange: new ColorArgs({ minHue: 0.15, maxHue: 0.15, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  yellow: new ColorArgs({ minHue: 0.16, maxHue: 0.16, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  yellowGreen: new ColorArgs({ minHue: 0.23, maxHue: 0.23, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  green: new ColorArgs({ minHue: 0.33, maxHue: 0.33, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  greenCyan: new ColorArgs({ minHue: 0.43, maxHue: 0.43, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  cyan: new ColorArgs({ minHue: 0.5, maxHue: 0.5, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  cyanBlue: new ColorArgs({ minHue: 0.56, maxHue: 0.56, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  blue: new ColorArgs({ minHue: 0.66, maxHue: 0.66, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  bluePurple: new ColorArgs({ minHue: 0.72, maxHue: 0.72, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  purple: new ColorArgs({ minHue: 0.77, maxHue: 0.77, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  purpleMagenta: new ColorArgs({ minHue: 0.8, maxHue: 0.8, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  magenta: new ColorArgs({ minHue: 0.83, maxHue: 0.83, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  magentaPink: new ColorArgs({ minHue: 0.87, maxHue: 0.87, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  pink: new ColorArgs({ minHue: 0.9, maxHue: 0.9, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  pinkRed: new ColorArgs({ minHue: 0.95, maxHue: 0.95, minSaturation: 1, maxSaturation: 1, minLightness: 0.5, maxLightness: 0.5 }),
  white: new ColorArgs({ minHue: 0.0, maxHue: 1.0, minSaturation: 0, maxSaturation: 0, minLightness: 1, maxLightness: 1 }),
  black: new ColorArgs({ minHue: 0.0, maxHue: 1.0, minSaturation: 0, maxSaturation: 0, minLightness: 0, maxLightness: 0 }),
  grayDark: new ColorArgs({ minHue: 0.0, maxHue: 1.0, minSaturation: 0, maxSaturation: 0, minLightness: 0.2, maxLightness: 0.3 }),
  gray: new ColorArgs({ minHue: 0.0, maxHue: 1.0, minSaturation: 0, maxSaturation: 0, minLightness: 0.5, maxLightness: 0.5 }),
  grayLight: new ColorArgs({ minHue: 0.0, maxHue: 1.0, minSaturation: 0, maxSaturation: 0, minLightness: 0.7, maxLightness: 0.8 }),
  mainRed: new ColorArgs({ minHue: 0.97, maxHue: 0.03, minSaturation: 0.9, maxSaturation: 1, minLightness: 0.45, maxLightness: 0.55 }),
  mainYellow: new ColorArgs({ minHue: 0.13, maxHue: 0.19, minSaturation: 0.9, maxSaturation: 1, minLightness: 0.45, maxLightness: 0.55 }),
  mainGreen: new ColorArgs({ minHue: 0.3, maxHue: 0.36, minSaturation: 0.9, maxSaturation: 1, minLightness: 0.15, maxLightness: 0.85 }),
  mainCyan: new ColorArgs({ minHue: 0.47, maxHue: 0.53, minSaturation: 0.9, maxSaturation: 1, minLightness: 0.45, maxLightness: 0.55 }),
  mainBlue: new ColorArgs({ minHue: 0.63, maxHue: 0.69, minSaturation: 0.9, maxSaturation: 1, minLightness: 0.25, maxLightness: 0.75 }),
  mainMagenta: new ColorArgs({ minHue: 0.8, maxHue: 0.86, minSaturation: 0.9, maxSaturation: 1, minLightness: 0.45, maxLightness: 0.55 }),
};
