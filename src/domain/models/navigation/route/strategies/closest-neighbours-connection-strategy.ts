import type { RouteConnection, RouteNode, RouteStop } from '@/domain/models/navigation/route/route-node';
import type { NodeConnectionStrategy } from '@/domain/models/navigation/route/strategies/node-connection-strategy';
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
  private readonly byStopPair = new Map<
    string,
    Array<{ from: RouteNode; to: RouteNode }>
  >();

  addConnection(from: RouteNode, to: RouteNode, fromStopIdx: number, toStopIdx: number): boolean {
    const key = `${from.id}|${to.id}`;

    if (this.addedKeys.has(key)) return false;

    const pairKey = `${fromStopIdx}>${toStopIdx}`;
    const existing = this.byStopPair.get(pairKey) ?? [];
    const crosses = existing.some((e) => doesCross(from, to, e.from, e.to));

    if (crosses) return false;

    this.addedKeys.add(key);
    this.connections.push({ fromId: from.id, toId: to.id });
    existing.push({ from, to });
    this.byStopPair.set(pairKey, existing);

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
 * next stop. Connections are directed from lower to higher stop index;
 * duplicate pairs are deduplicated. Crossing edges within the same stop
 * pair are rejected to keep the graph visually clean.
 */
export class ClosestNeighboursConnectionStrategy implements NodeConnectionStrategy {
  private readonly neighbourCount: number

  constructor(neighbourCount = 2) {
    this.neighbourCount = neighbourCount
  }

  buildConnections(stops: RouteStop[]): RouteConnection[] {
    const builder = new ConnectionBuilder();

    this.linkClosestNeighbors(stops, builder);
    this.ensureIncomingConnections(stops, builder);

    return builder.getConnections();
  }

  private linkClosestNeighbors(
    stops: RouteStop[],
    builder: ConnectionBuilder
  ): void {
    for (let stopIdx = 0; stopIdx < stops.length - 1; stopIdx++) {
      const currentStopNodes = stops[stopIdx].nodes;
      const nextStopNodes = stops[stopIdx + 1].nodes;

      const shuffled = fisherYatesShuffle([...currentStopNodes]);

      for (const node of shuffled) {
        const sorted = [...nextStopNodes].sort(
          (a, b) => squaredDistance(node, a) - squaredDistance(node, b)
        );

        let count = 0;
        for (const neighbour of sorted) {
          if (count >= this.neighbourCount) break;
          if (builder.addConnection(node, neighbour, stopIdx, stopIdx + 1)) count++;
        }
      }
    }
  }

  private ensureIncomingConnections(
    stops: RouteStop[],
    builder: ConnectionBuilder
  ): void {
    const conns = builder.getConnections();
    const hasIncoming = new Set(conns.map(c => c.toId));

    for (let stopIdx = 1; stopIdx < stops.length; stopIdx++) {
      const currentStop = stops[stopIdx];
      const prevStop = stops[stopIdx - 1];

      for (const node of currentStop.nodes) {
        if (hasIncoming.has(node.id)) continue;

        const candidates = this.findClosestNodes(node, prevStop.nodes);

        for (const candidate of candidates) {
          if (builder.addConnection(candidate, node, stopIdx - 1, stopIdx)) {
            hasIncoming.add(node.id);
            break;
          }
        }

        if (!hasIncoming.has(node.id)) {
          this.addFallbackConnection(builder, candidates, node, stopIdx - 1, stopIdx);
          hasIncoming.add(node.id);
        }
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
    target: RouteNode,
    fromStopIdx: number,
    toStopIdx: number
  ): void {
    if (candidates.length === 0) return;

    const fallback = candidates[0];
    if (!builder.hasConnection(fallback.id, target.id)) {
      builder.addConnection(fallback, target, fromStopIdx, toStopIdx);
    }
  }
}
