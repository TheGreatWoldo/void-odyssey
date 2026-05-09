import { Color } from 'excalibur';

const BLEND_STEPS = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

export function blendFactorForSize(
  size: number,
  minSize: number,
  maxSize: number
): number {
  const range = maxSize - minSize;

  if (range <= 0) return 1;
  const normalized = Math.min(1, Math.max(0, (size - minSize) / range));
  const stepIndex = Math.min(
    BLEND_STEPS.length - 1,
    Math.floor(normalized * BLEND_STEPS.length)
  );

  return BLEND_STEPS[stepIndex];
}

export function blendWithBackground(
  fg: Color,
  bg: Color,
  factor: number
): Color {
  return new Color(
    Math.round(bg.r + (fg.r - bg.r) * factor),
    Math.round(bg.g + (fg.g - bg.g) * factor),
    Math.round(bg.b + (fg.b - bg.b) * factor)
  );
}
