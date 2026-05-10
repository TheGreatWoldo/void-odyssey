import { NodeType } from '@/domain/models/navigation/node-type';
import { NodePositionStrategy } from '@/domain/models/navigation/route/node-position-strategy';
import { RouteConnection, RouteGraph, RouteNode } from '@/domain/models/navigation/route/route-node';
import { ClosestNeighboursConnectionStrategy } from '@/domain/models/navigation/route/strategies/closest-neighbours-connection-strategy';
import { NodeConnectionStrategy } from '@/domain/models/navigation/route/strategies/node-connection-strategy';
import { NodeTypeStrategy, PositionedNodeStub } from '@/domain/models/navigation/route/strategies/node-type-strategy';
import { WeightedRandomNodeTypeStrategy } from '@/domain/models/navigation/route/strategies/weighted-random-node-type-strategy';

/**
 * Generates a neural-network-style directed graph:
 *   - 1 start node (layer 0)
 *   - `routeSteps` intermediate layers each with a random number of nodes
 *     between `minBranches` and `maxBranches`
 *   - 1 end node (final layer)
 *
 * Connections between adjacent layers are determined by the supplied
 * NodeConnectionStrategy (default: ClosestNeighboursConnectionStrategy).
 *
 * Node positions are in world pixels, centred at the world origin.
 *
 * @param routeSteps   Number of intermediate layers between start and end (≥ 0)
 * @param minBranches  Minimum nodes in an intermediate layer (≥ 1)
 * @param maxBranches  Maximum nodes in an intermediate layer (≥ minBranches)
 */

/** World-pixel distance between adjacent layers along X. */
export const LAYER_GRID_WIDTH = 200;
/** World-pixel span for the graph along Y. */
export const LAYER_GRID_HEIGHT = 200;

export function generateRouteGraph(
  routeSteps: number,
  minBranches: number,
  maxBranches: number,
  positionStrategy: NodePositionStrategy,
  connectionStrategy: NodeConnectionStrategy = new ClosestNeighboursConnectionStrategy(),
  typeStrategy: NodeTypeStrategy = new WeightedRandomNodeTypeStrategy()
): RouteGraph {
  const steps = Math.max(0, Math.floor(routeSteps));
  const lo = Math.max(1, Math.floor(minBranches));
  const hi = Math.max(lo, Math.floor(maxBranches));

  const randBranches = () => lo + Math.floor(Math.random() * (hi - lo + 1));

  // Layer sizes: [1, <random>, <random>, …, 1]
  const totalLayers = steps + 2; // start + intermediate layers + end
  const layerSizes: number[] = [
    1,
    ...Array.from({ length: steps }, randBranches),
    1,
  ];

  const graphWidth = totalLayers * LAYER_GRID_WIDTH;
  const graphHeight = totalLayers * LAYER_GRID_HEIGHT;

  const nodes: RouteNode[] = [];
  const layerMap = new Map<number, RouteNode[]>();

  const addNode = (node: RouteNode) => {
    nodes.push(node);
    const bucket = layerMap.get(node.layer);

    if (bucket) bucket.push(node);
    else layerMap.set(node.layer, [node]);
  };

  const maxLayerSize = Math.max(...layerSizes);

  // Add the start node
  const startPos = positionStrategy.getPosition({
    layer: 0,
    indexInLayer: 0,
    totalLayers,
    layerSize: 1,
    maxLayerSize,
    graphWidth,
    graphHeight,
  });
  addNode({
    id: 'node-l0-i0',
    layer: 0,
    indexInLayer: 0,
    ...startPos,
    type: NodeType.Start,
  });

  // Position all intermediate nodes (type assignment comes after)
  const intermediateStubs: PositionedNodeStub[] = [];

  for (let l = 1; l < totalLayers - 1; l++) {
    const size = layerSizes[l];

    for (let i = 0; i < size; i++) {
      const { wx, wy, baseWx, baseWy } = positionStrategy.getPosition({
        layer: l,
        indexInLayer: i,
        totalLayers,
        layerSize: size,
        maxLayerSize,
        graphWidth,
        graphHeight,
      });

      intermediateStubs.push({
        id: `node-l${l}-i${i}`,
        layer: l,
        indexInLayer: i,
        wx,
        wy,
        baseWx,
        baseWy,
      });
    }
  }

  // Assign types — bulk when supported, per-node otherwise
  if (typeStrategy.assignAll) {
    const typeMap = typeStrategy.assignAll(intermediateStubs, totalLayers);

    for (const stub of intermediateStubs) {
      const type = typeMap.get(stub.id) ?? NodeType.Empty;

      addNode({ ...stub, type });
    }
  } else if (typeStrategy.resolveType) {
    for (const stub of intermediateStubs) {
      const type = typeStrategy.resolveType({
        node: stub,
        assignedNodes: nodes,
        totalLayers,
      });

      addNode({ ...stub, type });
    }
  }

  // Add the end node
  const endLayer = totalLayers - 1;
  const endPos = positionStrategy.getPosition({
    layer: endLayer,
    indexInLayer: 0,
    totalLayers,
    layerSize: 1,
    maxLayerSize,
    graphWidth,
    graphHeight,
  });

  addNode({
    id: `node-l${endLayer}-i0`,
    layer: endLayer,
    indexInLayer: 0,
    ...endPos,
    type: NodeType.End,
  });

  const connections: RouteConnection[] = connectionStrategy.buildConnections(nodes);

  const minWx = Math.min(...nodes.map((n) => n.wx));
  const maxWx = Math.max(...nodes.map((n) => n.wx));
  const minWy = Math.min(...nodes.map((n) => n.wy));
  const maxWy = Math.max(...nodes.map((n) => n.wy));

  const boundingBox = {
    minWx,
    minWy,
    maxWx,
    maxWy,
    width: maxWx - minWx,
    height: maxWy - minWy,
  };

  return { nodes, connections, totalLayers, boundingBox };
}
