import type { RouteGraphAggregate } from '@/domain/models/navigation/route/route-graph-aggregate';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';
import type { GraphContext } from '@/infrastructure/navigation-2d/graph-context';

/**
 * Infrastructure implementation of RouteGraphAggregate backed by a per-slot
 * GraphContext. The context adapts a Zustand store to the IRouteActorState
 * interface, keeping application dependencies isolated from actor code.
 */
export class ZustandRouteGraphAggregate implements RouteGraphAggregate {
  private readonly graphContext: GraphContext;

  constructor(graphContext: GraphContext) {
    this.graphContext = graphContext;
  }

  getCurrentNode(): RouteNode | null {
    return this.graphContext.currentNodeActor?.routeNode ?? null;
  }

  markNodeScanned(id: string): void {
    this.graphContext.statePort.markNodeScanned(id);
  }

  markNodeVisited(id: string): void {
    this.graphContext.statePort.markNodeVisited(id);
  }

  isNodeScanned(id: string): boolean {
    return this.graphContext.statePort.isNodeScanned(id);
  }

  isNodeVisited(id: string): boolean {
    return this.graphContext.statePort.isNodeVisited(id);
  }
}
