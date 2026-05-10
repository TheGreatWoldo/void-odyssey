import { RouteConnection, RouteNode } from '@/domain/navigation/route/route-node';
import { NodeConnectionStrategy } from '@/domain/navigation/route/strategies/node-connection-strategy';
import { fisherYatesShuffle } from '@/shared/math-utils';

function squaredDistance(a: RouteNode, b: RouteNode): number {
  const dx = a.wx - b.wx;
  const dy = a.wy - b.wy;

  return dx * dx + dy * dy;
}

/**
 * Returns true when adding edge (newFrom → newTo) would cross an existing
 * edge (existingFrom → existingTo) between the same pair of adjacent layers.
 * Two edges cross when their endpoint orderings are opposite:
 *   (newFrom.wy - existingFrom.wy) and (newTo.wy - existingTo.wy) have
 *   opposite signs.
 */
function doesCross(
  newFrom: RouteNode,
  newTo: RouteNode,
  existingFrom: RouteNode,
  existingTo: RouteNode
): boolean {
  return (newFrom.wy - existingFrom.wy) * (newTo.wy - existingTo.wy) < 0;
}

/**
 * Connects each node to its N spatially closest nodes in the immediately
 * next layer. Connections are directed from lower to higher layer;
 * duplicate pairs are deduplicated. Crossing edges within the same layer
 * pair are rejected to keep the graph visually clean.
 */
export class ClosestNeighboursConnectionStrategy implements NodeConnectionStrategy {
  constructor(private readonly neighbourCount = 2) {}

  buildConnections(nodes: RouteNode[]): RouteConnection[] {
    const connections: RouteConnection[] = [];
    const addedKeys = new Set<string>();

    // Track added connections per layer-pair so crossing checks stay local
    const byLayerPair = new Map<
      string,
      Array<{ from: RouteNode; to: RouteNode }>
    >();

    const addConnection = (from: RouteNode, to: RouteNode): boolean => {
      const key = `${from.id}|${to.id}`;

      if (addedKeys.has(key)) return false;

      const pairKey = `${from.layer}>${to.layer}`;
      const existing = byLayerPair.get(pairKey) ?? [];
      const crosses = existing.some((e) => doesCross(from, to, e.from, e.to));

      if (crosses) return false;

      addedKeys.add(key);
      connections.push({ fromId: from.id, toId: to.id });
      existing.push({ from, to });
      byLayerPair.set(pairKey, existing);

      return true;
    };

    // Group nodes by layer for O(1) lookup
    const byLayer = new Map<number, RouteNode[]>();

    for (const node of nodes) {
      const bucket = byLayer.get(node.layer);

      if (bucket) bucket.push(node);
      else byLayer.set(node.layer, [node]);
    }

    // Process layers in random order within each layer so no positional
    // bias accumulates (e.g. top nodes always claiming top targets first).
    for (const layerNodes of byLayer.values()) {
      const shuffled = fisherYatesShuffle([...layerNodes]);

      for (const node of shuffled) {
        const nextLayer = byLayer.get(node.layer + 1);

        if (!nextLayer) continue;

        const sorted = [...nextLayer].sort(
          (a, b) => squaredDistance(node, a) - squaredDistance(node, b)
        );
        let count = 0;

        for (const neighbour of sorted) {
          if (count >= this.neighbourCount) break;

          if (addConnection(node, neighbour)) count++;
        }
      }
    }

    // Guarantee every non-start node has at least one incoming connection.
    const hasIncoming = new Set<string>();

    for (const conn of connections) hasIncoming.add(conn.toId);

    for (const node of nodes) {
      if (hasIncoming.has(node.id)) continue;

      const prevLayer = byLayer.get(node.layer - 1);

      if (!prevLayer) continue; // start node — no previous layer

      // Try candidates closest-first, pick the first non-crossing one
      const candidates = [...prevLayer].sort(
        (a, b) => squaredDistance(node, a) - squaredDistance(node, b)
      );

      for (const candidate of candidates) {
        if (addConnection(candidate, node)) {
          hasIncoming.add(node.id);
          break;
        }
      }

      // If every candidate crosses, fall back to the closest regardless
      if (!hasIncoming.has(node.id)) {
        const fallback = candidates[0];
        const key = `${fallback.id}|${node.id}`;

        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          connections.push({ fromId: fallback.id, toId: node.id });
          hasIncoming.add(node.id);
        }
      }
    }

    return connections;
  }
}
