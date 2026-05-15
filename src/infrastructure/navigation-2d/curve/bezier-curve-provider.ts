/**
 * Provides an N-segment C1-continuous cubic Bézier curve in normalised [0,1] space.
 *
 * All coordinates are resolution-independent — multiply by canvas dimensions at draw time.
 */
export interface BezierCurveProvider {
  /** Number of cubic Bézier segments in the compound curve. */
  readonly segmentCount: number;

  /** Regenerate the curve with new random control points. */
  generate(): void;

  /**
   * Sample the curve at arc-length fraction t ∈ [0,1].
   * Returns normalised {nx, ny}, ready to be scaled by canvas dimensions.
   */
  sampleAt(t: number): { nx: number; ny: number };
}
