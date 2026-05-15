import type { BezierCurveProvider } from '@/infrastructure/navigation-2d/curve/bezier-curve-provider';
import { Color, type ExcaliburGraphicsContext, Vector } from 'excalibur';

/** Maps a normalised (nx, ny) coordinate to a screen/world pixel position. */
export type CoordTransform = (nx: number, ny: number) => Vector;

/**
 * Draws all Bézier curve segments from a BezierCurveProvider onto the canvas.
 * Samples the curve via provider.sampleAt() at arc-length-uniform intervals.
 */
export function drawBezierCurve(
  ctx: ExcaliburGraphicsContext,
  provider: BezierCurveProvider,
  toScreen: CoordTransform,
  color: Color,
  lineWidth = 1.5,
  stepsPerSegment = 40
): void {
  const totalSteps = provider.segmentCount * stepsPerSegment;
  const { nx: nx0, ny: ny0 } = provider.sampleAt(0);
  let prev = toScreen(nx0, ny0);

  for (let i = 1; i <= totalSteps; i++) {
    const { nx, ny } = provider.sampleAt(i / totalSteps);
    const curr = toScreen(nx, ny);

    ctx.drawLine(prev, curr, color, lineWidth);
    prev = curr;
  }
}
