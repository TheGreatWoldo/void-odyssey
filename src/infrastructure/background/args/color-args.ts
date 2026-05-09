export interface ColorArgsOptions {
  minHue?: number;
  maxHue?: number;
  minSaturation?: number;
  maxSaturation?: number;
  minLightness?: number;
  maxLightness?: number;
  minAlpha?: number;
  maxAlpha?: number;
}

export class ColorArgs {
  minHue: number;
  maxHue: number;
  minSaturation: number;
  maxSaturation: number;
  minLightness: number;
  maxLightness: number;
  minAlpha: number;
  maxAlpha: number;

  constructor(options: ColorArgsOptions = {}) {
    this.minHue = options.minHue ?? 0;
    this.maxHue = options.maxHue ?? 1;
    this.minSaturation = options.minSaturation ?? 0;
    this.maxSaturation = options.maxSaturation ?? 1;
    this.minLightness = options.minLightness ?? 0;
    this.maxLightness = options.maxLightness ?? 1;
    this.minAlpha = options.minAlpha ?? 1;
    this.maxAlpha = options.maxAlpha ?? 1;
  }
}
