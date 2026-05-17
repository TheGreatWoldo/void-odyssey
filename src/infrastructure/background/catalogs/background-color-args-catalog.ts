import { ColorArgs } from '@/infrastructure/background/args/color-args';
import type { RandomNumberGenerator } from '@/shared/random';

export type ColorArgsKey = keyof typeof backgroundColorArgsCatalog;

export function getRandomColorArgs(
  rng: RandomNumberGenerator = Math.random,
): ColorArgs {
  const keys = Object.keys(backgroundColorArgsCatalog) as ColorArgsKey[];
  const randomKey = keys[Math.floor(rng() * keys.length)];

  return backgroundColorArgsCatalog[randomKey];
}

// HSL values (hue 0–1) derived from Tailwind v4's OKLCH palette.
// Hue conversions: red≈0, orange≈0.07, amber≈0.10, yellow≈0.13,
// emerald≈0.45, cyan≈0.53, blue≈0.63, violet≈0.73, fuchsia≈0.81, rose≈0.97
export const backgroundColorArgsCatalog = {
  // ── Foreground / particle colors ──────────────────────────────────────────

  // amber-400 → amber-500  warm golden glow
  twAmber: new ColorArgs({ minHue: 0.094, maxHue: 0.108, minSaturation: 0.90, maxSaturation: 0.97, minLightness: 0.52, maxLightness: 0.65, minAlpha: 0.75, maxAlpha: 1.0 }),

  // yellow-300 → yellow-400
  twYellow: new ColorArgs({ minHue: 0.127, maxHue: 0.140, minSaturation: 0.92, maxSaturation: 0.97, minLightness: 0.55, maxLightness: 0.67, minAlpha: 0.75, maxAlpha: 1.0 }),

  // orange-400 → orange-500
  twOrange: new ColorArgs({ minHue: 0.061, maxHue: 0.075, minSaturation: 0.90, maxSaturation: 0.97, minLightness: 0.48, maxLightness: 0.60, minAlpha: 0.75, maxAlpha: 1.0 }),

  // rose-400 → rose-500  (hue wraps near 1.0)
  twRose: new ColorArgs({ minHue: 0.960, maxHue: 0.985, minSaturation: 0.85, maxSaturation: 0.95, minLightness: 0.54, maxLightness: 0.67, minAlpha: 0.75, maxAlpha: 1.0 }),

  // cyan-300 → cyan-400
  twCyan: new ColorArgs({ minHue: 0.522, maxHue: 0.540, minSaturation: 0.78, maxSaturation: 0.88, minLightness: 0.52, maxLightness: 0.65, minAlpha: 0.75, maxAlpha: 1.0 }),

  // fuchsia-400 → fuchsia-500
  twFuchsia: new ColorArgs({ minHue: 0.806, maxHue: 0.819, minSaturation: 0.82, maxSaturation: 0.92, minLightness: 0.54, maxLightness: 0.67, minAlpha: 0.75, maxAlpha: 1.0 }),

  // emerald-300 → emerald-400
  twEmerald: new ColorArgs({ minHue: 0.445, maxHue: 0.456, minSaturation: 0.60, maxSaturation: 0.76, minLightness: 0.50, maxLightness: 0.64, minAlpha: 0.75, maxAlpha: 1.0 }),

  // violet-400 → violet-500
  twViolet: new ColorArgs({ minHue: 0.719, maxHue: 0.733, minSaturation: 0.68, maxSaturation: 0.82, minLightness: 0.50, maxLightness: 0.62, minAlpha: 0.75, maxAlpha: 1.0 }),

  // slate-300 → slate-400  cool silvery debris
  twSlate: new ColorArgs({ minHue: 0.614, maxHue: 0.622, minSaturation: 0.10, maxSaturation: 0.18, minLightness: 0.55, maxLightness: 0.72, minAlpha: 0.70, maxAlpha: 0.95 }),

  // ── Background / fill colors ───────────────────────────────────────────────

  // slate-950  near-black with blue tint
  twSlate950: new ColorArgs({ minHue: 0.614, maxHue: 0.620, minSaturation: 0.40, maxSaturation: 0.48, minLightness: 0.04, maxLightness: 0.06, minAlpha: 1.0, maxAlpha: 1.0 }),

  // violet-950  deep purple-black
  twViolet950: new ColorArgs({ minHue: 0.726, maxHue: 0.733, minSaturation: 0.58, maxSaturation: 0.70, minLightness: 0.10, maxLightness: 0.16, minAlpha: 1.0, maxAlpha: 1.0 }),

  // rose-950  deep crimson-black
  twRose950: new ColorArgs({ minHue: 0.969, maxHue: 0.978, minSaturation: 0.58, maxSaturation: 0.70, minLightness: 0.10, maxLightness: 0.16, minAlpha: 1.0, maxAlpha: 1.0 }),

  // blue-950  deep navy
  twBlue950: new ColorArgs({ minHue: 0.625, maxHue: 0.636, minSaturation: 0.52, maxSaturation: 0.65, minLightness: 0.10, maxLightness: 0.16, minAlpha: 1.0, maxAlpha: 1.0 }),

  // orange-900 → orange-950  burnt dark orange
  twOrange950: new ColorArgs({ minHue: 0.069, maxHue: 0.078, minSaturation: 0.78, maxSaturation: 0.88, minLightness: 0.12, maxLightness: 0.20, minAlpha: 1.0, maxAlpha: 1.0 }),

  // emerald-950  deep forest
  twEmerald950: new ColorArgs({ minHue: 0.445, maxHue: 0.456, minSaturation: 0.55, maxSaturation: 0.68, minLightness: 0.09, maxLightness: 0.15, minAlpha: 1.0, maxAlpha: 1.0 }),

  // fuchsia-950  deep magenta-black
  twFuchsia950: new ColorArgs({ minHue: 0.806, maxHue: 0.814, minSaturation: 0.60, maxSaturation: 0.72, minLightness: 0.10, maxLightness: 0.16, minAlpha: 1.0, maxAlpha: 1.0 }),
};
