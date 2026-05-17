import type {
    NodePositionContext,
    NodePositionStrategy,
} from '@/domain/models/navigation/route/node-position-strategy';
import type { BezierCurveProvider } from '@/infrastructure/navigation-2d/curve/bezier-curve-provider';

const EPS = 0.001;
/** Node-to-node gap within a layer, in world pixels. */
const DEFAULT_SPREAD_PX = 115;

/** Jitter radius in world pixels. */
export const JITTER_RADIUS_PX = 31;
/** Margin as a fraction of graph extent — converted to world pixels at generation time. */
const DEFAULT_MARGIN_FRACTION = 0.05;

/**
 * Places nodes at evenly arc-length-spaced positions along a Bézier curve.
 *
 * - Each layer maps to one point on the curve via arc-length fraction t.
 * - Multiple nodes in a layer are spread along the line perpendicular to the
 *   curve tangent at that point, with a fixed pixel gap.
 * - All returned coordinates are in world pixels, centred at the origin.
 */
export class BezierNodePositionStrategy implements NodePositionStrategy {
  private readonly provider: BezierCurveProvider;
  private readonly spreadPx: number;
  private readonly marginFraction: number;

  constructor(
    provider: BezierCurveProvider,
    options: { spreadPx?: number; marginFraction?: number } = {}
  ) {
    this.provider = provider;
    this.spreadPx = options.spreadPx ?? DEFAULT_SPREAD_PX;
    this.marginFraction = options.marginFraction ?? DEFAULT_MARGIN_FRACTION;
  }

  getPosition({
    layer,
    indexInLayer,
    totalLayers,
    layerSize,
    maxLayerSize,
    graphWidth,
    graphHeight,
    rng,
  }: NodePositionContext): {
    wx: number;
    wy: number;
    baseWx: number;
    baseWy: number;
  } {
    const t = totalLayers <= 1 ? 0.5 : layer / (totalLayers - 1);
    const { nx, ny } = this.provider.sampleAt(t);

    const cwx = nx * graphWidth - graphWidth / 2;
    const cwy = ny * graphHeight - graphHeight / 2;

    const marginX = this.marginFraction * graphWidth;
    const marginY = this.marginFraction * graphHeight;
    const clampX = (v: number) =>
      Math.max(
        -graphWidth / 2 + marginX,
        Math.min(graphWidth / 2 - marginX, v)
      );
    const clampY = (v: number) =>
      Math.max(
        -graphHeight / 2 + marginY,
        Math.min(graphHeight / 2 - marginY, v)
      );

    if (maxLayerSize === 1) {
      const bx = clampX(cwx);
      const by = clampY(cwy);

      return { ...this._withJitter(bx, by, rng), baseWx: bx, baseWy: by };
    }

    const a = this.provider.sampleAt(Math.max(0, t - EPS));
    const b = this.provider.sampleAt(Math.min(1, t + EPS));
    const dx = (b.nx - a.nx) * graphWidth;
    const dy = (b.ny - a.ny) * graphHeight;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;

    const offset =
      layerSize === 1
        ? 0
        : (indexInLayer - (layerSize - 1) / 2) * this.spreadPx;

    const baseWx = clampX(cwx + offset * perpX);
    const baseWy = clampY(cwy + offset * perpY);

    return { ...this._withJitter(baseWx, baseWy, rng), baseWx, baseWy };
  }

  private _withJitter(
    wx: number,
    wy: number,
    rng: NodePositionContext['rng']
  ): { wx: number; wy: number } {
    const angle = rng() * 2 * Math.PI;
    const r = JITTER_RADIUS_PX * Math.sqrt(rng());

    return { wx: wx + r * Math.cos(angle), wy: wy + r * Math.sin(angle) };
  }
}
