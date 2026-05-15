import type {
    NodePositionContext,
    NodePositionStrategy,
} from '@/domain/models/navigation/route/node-position-strategy';

/**
 * Distributes nodes evenly within each layer along the Y axis,
 * with a configurable margin from the top and bottom edges.
 * X positions are evenly spaced across the full graph width by layer index.
 * All returned coordinates are in world pixels, centred at the origin.
 */
export class UniformLayerPositionStrategy implements NodePositionStrategy {
  private readonly yMargin: number;

  constructor(yMargin = 0.05) {
    this.yMargin = yMargin;
  }

  getPosition({
    layer,
    indexInLayer,
    totalLayers,
    layerSize,
    graphWidth,
    graphHeight,
  }: NodePositionContext): {
    wx: number;
    wy: number;
    baseWx: number;
    baseWy: number;
  } {
    const nx = totalLayers === 1 ? 0.5 : layer / (totalLayers - 1);
    const ny =
      layerSize === 1
        ? 0.5
        : this.yMargin +
          (indexInLayer / (layerSize - 1)) * (1 - 2 * this.yMargin);
    const wx = nx * graphWidth - graphWidth / 2;
    const wy = ny * graphHeight - graphHeight / 2;

    return { wx, wy, baseWx: wx, baseWy: wy };
  }
}
