import type { RandomNumberGenerator } from '@/shared/random';

export interface NodePositionContext {
  layer: number;
  indexInLayer: number;
  totalLayers: number;
  layerSize: number;
  /** Size of the largest layer — used for consistent spacing across all layers. */
  maxLayerSize: number;
  /** Total graph width in world pixels (centred at origin: x ∈ [-w/2, w/2]). */
  graphWidth: number;
  /** Total graph height in world pixels (centred at origin: y ∈ [-h/2, h/2]). */
  graphHeight: number;
  /** Deterministic RNG for positional jitter. */
  rng: RandomNumberGenerator;
}

export interface NodePositionStrategy {
  getPosition(ctx: NodePositionContext): {
    wx: number;
    wy: number;
    baseWx: number;
    baseWy: number;
  };
}
