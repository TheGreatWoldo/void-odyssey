import { Color } from 'excalibur';

export const StarSpectralClass = {
  O: 'O',
  B: 'B',
  A: 'A',
  F: 'F',
  G: 'G',
  K: 'K',
  M: 'M',
} as const;

export type StarSpectralClass = typeof StarSpectralClass[keyof typeof StarSpectralClass];

export const STAR_COLORS: Record<StarSpectralClass, Color> = {
  [StarSpectralClass.O]: Color.fromRGB(100, 112, 250),
  [StarSpectralClass.B]: Color.fromRGB(141, 149, 255),
  [StarSpectralClass.A]: Color.fromRGB(202, 205, 255),
  [StarSpectralClass.F]: Color.fromRGB(255, 255, 255),
  [StarSpectralClass.G]: Color.fromRGB(254, 246, 99),
  [StarSpectralClass.K]: Color.fromRGB(255, 169, 82),
  [StarSpectralClass.M]: Color.fromRGB(255, 98, 66),
};

export const STAR_SIZE_MULTIPLIERS: Record<StarSpectralClass, number> = {
  [StarSpectralClass.O]: 4.0,
  [StarSpectralClass.B]: 3.0,
  [StarSpectralClass.A]: 1.8,
  [StarSpectralClass.F]: 1.3,
  [StarSpectralClass.G]: 1.0,
  [StarSpectralClass.K]: 0.8,
  [StarSpectralClass.M]: 0.45,
};

// M-class dominant weight pool (artistic realism).
const SPECTRAL_WEIGHTS: { cls: StarSpectralClass; weight: number }[] = [
  { cls: StarSpectralClass.M, weight: 50 },
  { cls: StarSpectralClass.K, weight: 20 },
  { cls: StarSpectralClass.G, weight: 12 },
  { cls: StarSpectralClass.F, weight: 8 },
  { cls: StarSpectralClass.A, weight: 6 },
  { cls: StarSpectralClass.B, weight: 3 },
  { cls: StarSpectralClass.O, weight: 1 },
];

const TOTAL_WEIGHT = SPECTRAL_WEIGHTS.reduce((sum, e) => sum + e.weight, 0);

export function getStarWithRng(rng: () => number): {
  color: Color;
  sizeMultiplier: number;
} {
  let roll = rng() * TOTAL_WEIGHT;

  for (const entry of SPECTRAL_WEIGHTS) {
    roll -= entry.weight;

    if (roll <= 0) {
      return {
        color: STAR_COLORS[entry.cls],
        sizeMultiplier: STAR_SIZE_MULTIPLIERS[entry.cls],
      };
    }
  }

  return {
    color: STAR_COLORS[StarSpectralClass.M],
    sizeMultiplier: STAR_SIZE_MULTIPLIERS[StarSpectralClass.M],
  };
}
