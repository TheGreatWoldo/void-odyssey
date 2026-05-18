import { useRouteNavigationStore } from '@/application/store/routeNavigationStore';
import type { IRouteActorState } from '@/domain/models/navigation/route/route-actor-state';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';

/**
 * Adapter that implements IRouteActorState by reading/writing to the
 * Zustand route navigation store.
 *
 * Lives in the application layer: it depends on domain (IRouteActorState, RouteNode)
 * and on the application store — never on infrastructure types.
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

  getRouteParams() {
    const { routeSteps, minBranches, maxBranches, routeSeed } =
      useRouteNavigationStore.getState();
    return { routeSteps, minBranches, maxBranches, routeSeed };
  }

  isDrawDebugEnabled(): boolean {
    return useRouteNavigationStore.getState().drawDebug;
  }

  getSelectedRouteIndex(): number {
    return useRouteNavigationStore.getState().selectedRouteIndex;
  }

  setSelectedRouteIndex(index: number): void {
    useRouteNavigationStore.getState().actions.setSelectedRouteIndex(index);
  }

  isRouteSelectionLocked(): boolean {
    return useRouteNavigationStore.getState().routeSelectionLocked;
  }

  getRouteRerollNonce(): number {
    return useRouteNavigationStore.getState().rerollNonce;
  }

  getRerollRouteIndex(): number | null {
    return useRouteNavigationStore.getState().rerollRouteIndex;
  }
}
