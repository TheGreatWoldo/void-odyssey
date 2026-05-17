import { NodeType } from '@/domain/models/navigation/node-type';
import type { NodePositionStrategy } from '@/domain/models/navigation/route/node-position-strategy';
import type { RouteConnection, RouteGraph, RouteNode, RouteStop } from '@/domain/models/navigation/route/route-node';
import { ClosestNeighboursConnectionStrategy } from '@/domain/models/navigation/route/strategies/closest-neighbours-connection-strategy';
import type { NodeConnectionStrategy } from '@/domain/models/navigation/route/strategies/node-connection-strategy';
import type { NodeTypeStrategy, PositionedNodeStub } from '@/domain/models/navigation/route/strategies/node-type-strategy';
import { WeightedRandomNodeTypeStrategy } from '@/domain/models/navigation/route/strategies/weighted-random-node-type-strategy';
import type { RandomNumberGenerator } from '@/shared/random';

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
  typeStrategy: NodeTypeStrategy = new WeightedRandomNodeTypeStrategy(),
  rng: RandomNumberGenerator = Math.random,
): RouteGraph {
  const steps = Math.max(0, Math.floor(routeSteps));
  const lo = Math.max(1, Math.floor(minBranches));
  const hi = Math.max(lo, Math.floor(maxBranches));

  const randBranches = () => lo + Math.floor(rng() * (hi - lo + 1));

  // Stop sizes: [1, <random>, <random>, …, 1]
  const totalStops = steps + 2; // start + intermediate stops + end
  const stopSizes: number[] = [
    1,
    ...Array.from({ length: steps }, randBranches),
    1,
  ];

  const graphWidth = totalStops * LAYER_GRID_WIDTH;
  const graphHeight = totalStops * LAYER_GRID_HEIGHT;

  const stops: RouteStop[] = [];
  const allNodes: RouteNode[] = [];

  const maxStopSize = Math.max(...stopSizes);

  // Add the start stop
  const startPos = positionStrategy.getPosition({
    layer: 0,
    indexInLayer: 0,
    totalLayers: totalStops,
    layerSize: 1,
    maxLayerSize: maxStopSize,
    graphWidth,
    graphHeight,
    rng,
  });
  const startNode: RouteNode = {
    id: 'node-l0-i0',
    stopIndex: 0,
    ...startPos,
    type: NodeType.Start,
  };
  allNodes.push(startNode);
  stops.push({ index: 0, nodes: [startNode] });

  // Position all intermediate nodes (type assignment comes after)
  const intermediateStubs: PositionedNodeStub[] = [];
  const intermediateNodesByStop: (RouteNode | null)[] = [];

  for (let stopIdx = 1; stopIdx < totalStops - 1; stopIdx++) {
    const stopSize = stopSizes[stopIdx];
    const stopNodes: RouteNode[] = [];

    for (let i = 0; i < stopSize; i++) {
      const { wx, wy, baseWx, baseWy } = positionStrategy.getPosition({
        layer: stopIdx,
        indexInLayer: i,
        totalLayers: totalStops,
        layerSize: stopSize,
        maxLayerSize: maxStopSize,
        graphWidth,
        graphHeight,
        rng,
      });

      const stub: PositionedNodeStub = {
        id: `node-l${stopIdx}-i${i}`,
        stopIndex: stopIdx,
        wx,
        wy,
        baseWx,
        baseWy,
      };
      intermediateStubs.push(stub);
      intermediateNodesByStop.push(null);
    }

    stops.push({ index: stopIdx, nodes: stopNodes });
  }

  // Assign types — bulk when supported, per-node otherwise
  let nodeIndex = 0;
  if (typeStrategy.assignAll) {
    const typeMap = typeStrategy.assignAll(intermediateStubs, totalStops, rng);

    for (let stopIdx = 1; stopIdx < totalStops - 1; stopIdx++) {
      const stopNodes = stops[stopIdx].nodes;
      const stopSize = stopSizes[stopIdx];

      for (let i = 0; i < stopSize; i++) {
        const stub = intermediateStubs[nodeIndex];
        const type = typeMap.get(stub.id) ?? NodeType.Empty;
        const node: RouteNode = { ...stub, stopIndex: stopIdx, type };

        stopNodes.push(node);
        allNodes.push(node);
        nodeIndex++;
      }
    }
  } else if (typeStrategy.resolveType) {
    for (let stopIdx = 1; stopIdx < totalStops - 1; stopIdx++) {
      const stopNodes = stops[stopIdx].nodes;
      const stopSize = stopSizes[stopIdx];

      for (let i = 0; i < stopSize; i++) {
        const stub = intermediateStubs[nodeIndex];
        const type = typeStrategy.resolveType({
          node: stub,
          assignedNodes: allNodes,
          totalLayers: totalStops,
          rng,
        });
        const node: RouteNode = { ...stub, stopIndex: stopIdx, type };

        stopNodes.push(node);
        allNodes.push(node);
        nodeIndex++;
      }
    }
  }

  // Add the end stop
  const endStopIdx = totalStops - 1;
  const endPos = positionStrategy.getPosition({
    layer: endStopIdx,
    indexInLayer: 0,
    totalLayers: totalStops,
    layerSize: 1,
    maxLayerSize: maxStopSize,
    graphWidth,
    graphHeight,
    rng,
  });
  const endNode: RouteNode = {
    id: `node-l${endStopIdx}-i0`,
    stopIndex: endStopIdx,
    ...endPos,
    type: NodeType.End,
  };
  allNodes.push(endNode);
  stops.push({ index: endStopIdx, nodes: [endNode] });

  const connections: RouteConnection[] = connectionStrategy.buildConnections(stops, rng);

  const minWx = Math.min(...allNodes.map((n) => n.wx));
  const maxWx = Math.max(...allNodes.map((n) => n.wx));
  const minWy = Math.min(...allNodes.map((n) => n.wy));
  const maxWy = Math.max(...allNodes.map((n) => n.wy));

  const boundingBox = {
    minWx,
    minWy,
    maxWx,
    maxWy,
    width: maxWx - minWx,
    height: maxWy - minWy,
  };

  return { stops, connections, totalStops, boundingBox };
}
