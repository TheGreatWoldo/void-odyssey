import { useRouteNavigationStore } from '@/application/store/routeNavigationStore';
import { NODE_TYPE_META, type NodeTypeMeta } from '@/domain/models/navigation/node-type-meta';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';

/** Selects the node currently under the pointer (or null). */
export function useHoveredRouteNode(): RouteNode | null {
  return useRouteNavigationStore(state => state.hoveredNode);
}

/** True when the hovered node's type has been revealed by scanners. */
export function useHoveredRouteNodeRevealed(): boolean {
  return useRouteNavigationStore(state => state.hoveredNodeRevealed);
}

/** The pending system entry set when the ship arrives at a node. */
export function usePendingSystemEntry() {
  return useRouteNavigationStore(state => state.pendingSystemEntry);
}

/** All route navigation store actions. */
export function useRouteNavigationActions() {
  return useRouteNavigationStore(state => state.actions);
}

/** Current debug draw toggle. */
export function useRouteDrawDebug(): boolean {
  return useRouteNavigationStore(state => state.drawDebug);
}

/** Currently selected route slot index in the route picker. */
export function useSelectedRouteIndex(): number {
  return useRouteNavigationStore(state => state.selectedRouteIndex);
}

/** True when route picker scrolling is locked to the selected route. */
export function useRouteSelectionLocked(): boolean {
  return useRouteNavigationStore(state => state.routeSelectionLocked);
}

/** Incrementing token used to request route graph rerolls. */
export function useRouteRerollNonce(): number {
  return useRouteNavigationStore(state => state.rerollNonce);
}

/** Remaining rerolls for a given route slot index. */
export function useRouteRerollsRemaining(routeIndex: number): number {
  return useRouteNavigationStore(state => {
    const used = state.rerollsByRouteIndex[routeIndex] ?? 0;

    return Math.max(0, state.maxRerollsPerRoute - used);
  });
}

/** True when the route slot can still be rerolled. */
export function useCanRerollRoute(routeIndex: number): boolean {
  return useRouteRerollsRemaining(routeIndex) > 0;
}

/** Current route generation parameters. */
export function useRouteGraphParams() {
  const routeSteps = useRouteNavigationStore(state => state.routeSteps);
  const minBranches = useRouteNavigationStore(state => state.minBranches);
  const maxBranches = useRouteNavigationStore(state => state.maxBranches);
  const routeSeed = useRouteNavigationStore(state => state.routeSeed);

  return { routeSteps, minBranches, maxBranches, routeSeed };
}

/**
 * Returns the display metadata (label, description, icon) for the currently
 * hovered node, or null when nothing is hovered.
 */
export function useHoveredNodeMeta(): NodeTypeMeta | null {
  return useRouteNavigationStore(state => {
    if (state.hoveredNode === null) return null;

    return NODE_TYPE_META[state.hoveredNode.type] ?? null;
  });
}
