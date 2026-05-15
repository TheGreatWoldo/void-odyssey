import { useRouteNavigationStore } from '@/application/store/routeNavigationStore';
import type { RouteGraphAggregate } from '@/domain/models/navigation/route/route-graph-aggregate';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';

/**
 * Infrastructure implementation of RouteGraphAggregate backed by the Zustand
 * route navigation store.
 */
export class ZustandRouteGraphAggregate implements RouteGraphAggregate {
  getCurrentNode(): RouteNode | null {
    const { currentNodeId, nodes } = useRouteNavigationStore.getState();

    if (currentNodeId === null) return null;

    return nodes.find((n) => n.id === currentNodeId) ?? null;
  }

  markNodeScanned(id: string): void {
    useRouteNavigationStore.getState().actions.markNodeScanned(id);
  }

  markNodeVisited(id: string): void {
    useRouteNavigationStore.getState().actions.markNodeVisited(id);
  }

  isNodeScanned(id: string): boolean {
    return useRouteNavigationStore.getState().scannedNodeIds.includes(id);
  }

  isNodeVisited(id: string): boolean {
    return useRouteNavigationStore.getState().visitedNodeIds.includes(id);
  }
}
