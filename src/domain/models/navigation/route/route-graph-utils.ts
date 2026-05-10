import { RouteConnection } from '@/domain/models/navigation/route/route-node';

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
