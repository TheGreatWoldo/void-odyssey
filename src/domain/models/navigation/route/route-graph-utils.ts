import type { RouteConnection } from '@/domain/models/navigation/route/route-node';

export interface NavigationConstraints {
  /** Max hops allowed from start to target. Omit for unlimited. */
  maxHops?: number;
  /** Target must be in this revealed set when provided. */
  scannedNodeIds?: readonly string[];
  /** When false, visited nodes are excluded from traversal except the start node. */
  allowRevisit?: boolean;
  /** Used with allowRevisit=false to filter traversal. */
  visitedNodeIds?: readonly string[];
}

function buildAdjacency(connections: readonly RouteConnection[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  for (const c of connections) {
    const list = adjacency.get(c.fromId) ?? [];
    list.push(c.toId);
    adjacency.set(c.fromId, list);
  }

  return adjacency;
}

function isBlockedByConstraints(
  nodeId: string,
  start: string,
  constraints?: NavigationConstraints
): boolean {
  if (!constraints) return false;

  const allowRevisit = constraints.allowRevisit ?? true;
  if (allowRevisit) return false;

  const visited = new Set(constraints.visitedNodeIds ?? []);

  return nodeId !== start && visited.has(nodeId);
}

export function getConnectionStrength(
  fromId: string,
  toId: string,
  connections: readonly RouteConnection[]
): number | undefined {
  const edge = connections.find(c => c.fromId === fromId && c.toId === toId);
  if (!edge) return undefined;
  return edge.strength ?? 1;
}

export function getReachableNodeIds(
  start: string | null,
  connections: readonly RouteConnection[],
  constraints?: NavigationConstraints
): readonly string[] {
  if (!start) return [];

  const maxHops = constraints?.maxHops ?? Number.POSITIVE_INFINITY;
  const adjacency = buildAdjacency(connections);
  const seen = new Set<string>([start]);
  const frontier: Array<{ id: string; hops: number }> = [{ id: start, hops: 0 }];

  while (frontier.length > 0) {
    const { id, hops } = frontier.shift()!;

    if (hops >= maxHops) continue;

    for (const next of adjacency.get(id) ?? []) {
      if (seen.has(next)) continue;
      if (isBlockedByConstraints(next, start, constraints)) continue;

      seen.add(next);
      frontier.push({ id: next, hops: hops + 1 });
    }
  }

  seen.delete(start);

  return Array.from(seen);
}

export function findShortestPath(
  start: string | null,
  target: string,
  connections: readonly RouteConnection[],
  constraints?: NavigationConstraints
): readonly string[] {
  if (!start) return [];
  if (start === target) return [start];

  const scanned = constraints?.scannedNodeIds ? new Set(constraints.scannedNodeIds) : null;
  if (scanned && !scanned.has(target)) return [];

  const maxHops = constraints?.maxHops ?? Number.POSITIVE_INFINITY;
  const adjacency = buildAdjacency(connections);
  const visited = new Set<string>([start]);
  const parent = new Map<string, string>();
  const queue: Array<{ id: string; hops: number }> = [{ id: start, hops: 0 }];

  while (queue.length > 0) {
    const { id, hops } = queue.shift()!;

    if (hops >= maxHops) continue;

    for (const next of adjacency.get(id) ?? []) {
      if (visited.has(next)) continue;
      if (isBlockedByConstraints(next, start, constraints)) continue;

      visited.add(next);
      parent.set(next, id);

      if (next === target) {
        const path: string[] = [target];
        let current = target;

        while (current !== start) {
          const p = parent.get(current);
          if (!p) return [];
          path.push(p);
          current = p;
        }

        path.reverse();

        return path;
      }

      queue.push({ id: next, hops: hops + 1 });
    }
  }

  return [];
}

export function canNavigateTo(
  start: string | null,
  target: string,
  connections: readonly RouteConnection[],
  constraints?: NavigationConstraints
): boolean {
  return findShortestPath(start, target, connections, constraints).length > 0;
}

/**
 * Returns true if `target` is reachable from `start` in at most `steps`
 * forward hops through the given connections.
 */
export function isForwardReachable(
  start: string | null,
  target: string,
  connections: RouteConnection[],
  steps: number
): boolean {
  if (!start) return false;

  let frontier = new Set([start]);

  for (let i = 0; i < steps; i++) {
    if (frontier.has(target)) return true;

    const next = new Set<string>();

    for (const c of connections) {
      if (frontier.has(c.fromId)) next.add(c.toId);
    }

    frontier = next;

    if (frontier.size === 0) return false;
  }

  return frontier.has(target);
}
