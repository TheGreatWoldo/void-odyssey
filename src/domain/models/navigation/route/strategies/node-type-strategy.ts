import { NodeType } from '@/domain/models/navigation/node-type';
import { RouteNode } from '@/domain/models/navigation/route/route-node';

/** A node stub that has been positioned but not yet assigned a type. */
export type PositionedNodeStub = Omit<RouteNode, 'type'>;

/**
 * Context provided to a NodeTypeStrategy when determining the type of a
 * newly positioned node. All nodes that have already been assigned a type
 * are available so that rules like "at most N shipyards" can be evaluated.
 */
export interface NodeTypeContext {
  /** The partially-built node (id, layer, indexInLayer, wx, wy already set; type not yet assigned). */
  node: PositionedNodeStub;
  /** All nodes that have already been fully created (type assigned). */
  assignedNodes: readonly RouteNode[];
  /** Total number of layers in the graph (including start and end). */
  totalLayers: number;
}

/**
 * Strategy that decides the NodeType for intermediate nodes.
 *
 * Two modes are supported (implement exactly one):
 * - Per-node: implement `resolveType` — called once per intermediate node in layer order.
 * - Bulk: implement `assignAll` — called once with all positioned stubs; the returned
 *   map is used directly, bypassing `resolveType`.
 */
export interface NodeTypeStrategy {
  /**
   * Per-node type resolution. Called for each intermediate node in layer order.
   * Not called when `assignAll` is implemented.
   */
  resolveType?(ctx: NodeTypeContext): NodeType;
  /**
   * Bulk type assignment. When present, the generator calls this once with all
   * intermediate node stubs and uses the returned map instead of `resolveType`.
   */
  assignAll?(
    nodes: readonly PositionedNodeStub[],
    totalLayers: number
  ): ReadonlyMap<string, NodeType>;
}
