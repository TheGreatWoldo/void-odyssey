import { useRouteNavigationStore } from '@/application/store/routeNavigationStore';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';
import type { IRouteActorState } from '@/infrastructure/navigation-2d/route-actor-state';

/**
 * Adapter that implements IRouteActorState by reading/writing to the
 * Zustand route navigation store.
 */
export class ZustandRouteActorStateAdapter implements IRouteActorState {
  getScannerRange(): number {
    return useRouteNavigationStore.getState().defaultScannerRange;
  }

  getRevealAllNodes(): boolean {
    return useRouteNavigationStore.getState().revealAllNodes;
  }

  setHovered(node: RouteNode | null, revealed?: boolean): void {
    useRouteNavigationStore.getState().actions.setHovered(node, revealed);
  }

  markNodeScanned(id: string): void {
    useRouteNavigationStore.getState().actions.markNodeScanned(id);
  }

  markNodeVisited(id: string): void {
    useRouteNavigationStore.getState().actions.markNodeVisited(id);
  }

  isNodeScanned(id: string): boolean {
    return useRouteNavigationStore.getState().actions.isNodeScanned(id);
  }

  isNodeVisited(id: string): boolean {
    return useRouteNavigationStore.getState().actions.isNodeVisited(id);
  }
}
