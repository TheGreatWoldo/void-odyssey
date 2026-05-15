import { useRouteNavigationStore } from '@/application/store/routeNavigationStore';
import { NODE_TYPE_META, type NodeTypeMeta } from '@/domain/models/navigation/node-type-meta';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';

/** Selects the node currently under the pointer (or null). */
export function useHoveredRouteNode(): RouteNode | null {
  return useRouteNavigationStore((state) => state.hoveredNode);
}

/** True when the hovered node's type has been revealed by scanners. */
export function useHoveredRouteNodeRevealed(): boolean {
  return useRouteNavigationStore((state) => state.hoveredNodeRevealed);
}

/** The pending system entry set when the ship arrives at a node. */
export function usePendingSystemEntry() {
  return useRouteNavigationStore((state) => state.pendingSystemEntry);
}

/** All route navigation store actions. */
export function useRouteNavigationActions() {
  return useRouteNavigationStore((state) => state.actions);
}

/** Current debug draw toggle. */
export function useRouteDrawDebug(): boolean {
  return useRouteNavigationStore((state) => state.drawDebug);
}

/** Current route generation parameters. */
export function useRouteGraphParams() {
  const routeSteps = useRouteNavigationStore((state) => state.routeSteps);
  const minBranches = useRouteNavigationStore((state) => state.minBranches);
  const maxBranches = useRouteNavigationStore((state) => state.maxBranches);

  return { routeSteps, minBranches, maxBranches };
}

/**
 * Returns the display metadata (label, description, icon) for the currently
 * hovered node, or null when nothing is hovered.
 */
export function useHoveredNodeMeta(): NodeTypeMeta | null {
  return useRouteNavigationStore((state) => {
    if (state.hoveredNode === null) return null;

    return NODE_TYPE_META[state.hoveredNode.type] ?? null;
  });
}
