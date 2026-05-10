import { NodeType } from '@/domain/models/navigation/node-type';
import { PositionedNodeStub } from '@/domain/models/navigation/route/strategies/node-type-strategy';
import { fisherYatesShuffle } from '@/shared/math-utils';

/**
 * Base class for all type allocation strategies used by LayeredAllocationStrategy.
 *
 * Each subclass decides which nodes from the current unassigned pool it wants
 * to claim for its type. The returned array must be a subset of `unassigned`.
 */
export abstract class TypeAllocationStrategy {
  constructor(readonly type: NodeType) {}

  abstract select(
    unassigned: readonly PositionedNodeStub[],
    totalLayers: number
  ): PositionedNodeStub[];
}

export interface AbsoluteTypeAllocationOptions {
  type: NodeType;
  min: number;
  max: number;
  minLayerSpacing?: number;
  eligibleLayer?: (layer: number, totalLayers: number) => boolean;
}

/**
 * Claims a fixed number of nodes (between `min` and `max`), respecting an
 * optional minimum layer-index spacing and layer eligibility filter.
 *
 * The `min` guarantee is always honoured — if the spacing constraint prevents
 * enough placements, additional nodes are chosen without the spacing restriction.
 */
export class AbsoluteTypeAllocation extends TypeAllocationStrategy {
  private readonly min: number;
  private readonly max: number;
  private readonly minLayerSpacing: number;
  private readonly eligibleLayer?: (layer: number, totalLayers: number) => boolean;

  constructor({
    type,
    min,
    max,
    minLayerSpacing = 0,
    eligibleLayer,
  }: AbsoluteTypeAllocationOptions) {
    super(type);
    this.min = min;
    this.max = max;
    this.minLayerSpacing = minLayerSpacing;
    this.eligibleLayer = eligibleLayer;
  }

  select(
    unassigned: readonly PositionedNodeStub[],
    totalLayers: number
  ): PositionedNodeStub[] {
    const candidates = fisherYatesShuffle(
      unassigned.filter(
        (n) =>
          this.eligibleLayer === undefined ||
          this.eligibleLayer(n.layer, totalLayers)
      )
    );

    const placed: PositionedNodeStub[] = [];

    for (const node of candidates) {
      if (placed.length >= this.max) break;

      const tooClose = placed.some(
        (p) => Math.abs(p.layer - node.layer) < this.minLayerSpacing
      );

      if (!tooClose) placed.push(node);
    }

    // Min guarantee: relax spacing if needed, pulling from any unassigned node
    if (placed.length < this.min) {
      const placedIds = new Set(placed.map((n) => n.id));
      const overflow = fisherYatesShuffle(
        unassigned.filter((n) => !placedIds.has(n.id))
      );

      for (const node of overflow) {
        if (placed.length >= this.min) break;
        placed.push(node);
      }
    }

    return placed;
  }
}

export interface ProbabilisticTypeAllocationOptions {
  type: NodeType;
  /** Probability in [0, 1] that each eligible node is claimed. */
  chance: number;
  eligibleLayer?: (layer: number, totalLayers: number) => boolean;
}

/**
 * Claims each eligible unassigned node independently with a given probability.
 *
 * Use this for types that should appear at random frequency rather than at a
 * specific count. The probability is applied per node, so the actual count
 * varies each generation.
 */
export class ProbabilisticTypeAllocation extends TypeAllocationStrategy {
  private readonly chance: number;
  private readonly eligibleLayer?: (layer: number, totalLayers: number) => boolean;

  constructor({
    type,
    chance,
    eligibleLayer,
  }: ProbabilisticTypeAllocationOptions) {
    super(type);
    this.chance = chance;
    this.eligibleLayer = eligibleLayer;
  }

  select(
    unassigned: readonly PositionedNodeStub[],
    totalLayers: number
  ): PositionedNodeStub[] {
    return unassigned.filter(
      (n) =>
        (this.eligibleLayer === undefined ||
          this.eligibleLayer(n.layer, totalLayers)) &&
        Math.random() < this.chance
    );
  }
}
