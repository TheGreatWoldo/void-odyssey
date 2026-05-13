import { RouteConnection, RouteNode } from '@/domain/models/navigation/route/route-node';
import { NodeConnectionStrategy } from '@/domain/models/navigation/route/strategies/node-connection-strategy';
import { fisherYatesShuffle } from '@/shared/math-utils';

function squaredDistance(a: RouteNode, b: RouteNode): number {
  const dx = a.wx - b.wx;
  const dy = a.wy - b.wy;

  return dx * dx + dy * dy;
}

function doesCross(
  newFrom: RouteNode,
  newTo: RouteNode,
  existingFrom: RouteNode,
  existingTo: RouteNode
): boolean {
  return (newFrom.wy - existingFrom.wy) * (newTo.wy - existingTo.wy) < 0;
}

/**
 * Encapsulates connection state and crossing detection logic.
 * Ensures consistency between connections array and tracking sets.
 */
class ConnectionBuilder {
  private readonly connections: RouteConnection[] = [];
  private readonly addedKeys = new Set<string>();
  private readonly byLayerPair = new Map<
    string,
    Array<{ from: RouteNode; to: RouteNode }>
  >();

  addConnection(from: RouteNode, to: RouteNode): boolean {
    const key = `${from.id}|${to.id}`;

    if (this.addedKeys.has(key)) return false;

    const pairKey = `${from.layer}>${to.layer}`;
    const existing = this.byLayerPair.get(pairKey) ?? [];
    const crosses = existing.some((e) => doesCross(from, to, e.from, e.to));

    if (crosses) return false;

    this.addedKeys.add(key);
    this.connections.push({ fromId: from.id, toId: to.id });
    existing.push({ from, to });
    this.byLayerPair.set(pairKey, existing);

    return true;
  }

  hasConnection(fromId: string, toId: string): boolean {
    return this.addedKeys.has(`${fromId}|${toId}`);
  }

  getConnections(): RouteConnection[] {
    return this.connections;
  }
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
    const builder = new ConnectionBuilder();
    const byLayer = this.groupNodesByLayer(nodes);

    this.linkClosestNeighbors(byLayer, builder);
    this.ensureIncomingConnections(nodes, byLayer, builder);

    return builder.getConnections();
  }

  private groupNodesByLayer(nodes: RouteNode[]): Map<number, RouteNode[]> {
    const byLayer = new Map<number, RouteNode[]>();

    for (const node of nodes) {
      const bucket = byLayer.get(node.layer);
      if (bucket) bucket.push(node);
      else byLayer.set(node.layer, [node]);
    }

    return byLayer;
  }

  private linkClosestNeighbors(
    byLayer: Map<number, RouteNode[]>,
    builder: ConnectionBuilder
  ): void {
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
          if (builder.addConnection(node, neighbour)) count++;
        }
      }
    }
  }

  private ensureIncomingConnections(
    nodes: RouteNode[],
    byLayer: Map<number, RouteNode[]>,
    builder: ConnectionBuilder
  ): void {
    const conns = builder.getConnections();
    const hasIncoming = new Set(conns.map(c => c.toId));

    for (const node of nodes) {
      if (hasIncoming.has(node.id)) continue;

      const prevLayer = byLayer.get(node.layer - 1);
      if (!prevLayer) continue;

      const candidates = this.findClosestNodes(node, prevLayer);

      for (const candidate of candidates) {
        if (builder.addConnection(candidate, node)) {
          hasIncoming.add(node.id);
          break;
        }
      }

      if (!hasIncoming.has(node.id)) {
        this.addFallbackConnection(builder, candidates, node);
        hasIncoming.add(node.id);
      }
    }
  }

  private findClosestNodes(node: RouteNode, candidates: RouteNode[]): RouteNode[] {
    return [...candidates].sort(
      (a, b) => squaredDistance(node, a) - squaredDistance(node, b)
    );
  }

  private addFallbackConnection(
    builder: ConnectionBuilder,
    candidates: RouteNode[],
    target: RouteNode
  ): void {
    if (candidates.length === 0) return;

    const fallback = candidates[0];
    if (!builder.hasConnection(fallback.id, target.id)) {
      builder.addConnection(fallback, target);
    }
  }
}
