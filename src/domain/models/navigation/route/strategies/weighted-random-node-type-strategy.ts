import { NodeType } from '@/domain/models/navigation/node-type';
import type { NodeTypeContext, NodeTypeStrategy } from '@/domain/models/navigation/route/strategies/node-type-strategy';

/**
 * The default weighted pool used when no custom pool is supplied.
 * Exported so cap rules and other strategies can derive filtered variants
 * without hardcoding their own copy.
 */
export const DEFAULT_NODE_POOL: readonly NodeType[] = [
  NodeType.Empty,
  NodeType.Empty,
  NodeType.Empty,
  NodeType.Combat,
  NodeType.Combat,
  NodeType.Shipyard,
  NodeType.Shipyard,
  NodeType.Store,
  NodeType.Store,
  NodeType.Event,
  NodeType.Event,
  NodeType.Event,
];

/**
 * Default NodeTypeStrategy.
 *
 * Picks an intermediate node type by drawing uniformly from a weighted pool.
 * The pool can be overridden via the constructor.
 *
 * Default weights:
 *   Empty    ×3
 *   Combat   ×2
 *   Shipyard ×2
 *   Store    ×2
 *   Event    ×3
 */
export class WeightedRandomNodeTypeStrategy implements NodeTypeStrategy {
  private readonly pool: readonly NodeType[];

  constructor(pool: readonly NodeType[] = DEFAULT_NODE_POOL) {
    this.pool = pool;
  }

  resolveType(_ctx: NodeTypeContext): NodeType {
    return this.pool[Math.floor(Math.random() * this.pool.length)];
  }
}
