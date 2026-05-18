import type { NodeType } from '@/domain/models/navigation/node-type';
import type { RouteGraphAggregate } from '@/domain/models/navigation/route/route-graph-aggregate';
import type { NavigationConstraints } from '@/domain/models/navigation/route/route-graph-utils';
import {
  canNavigateTo,
  findShortestPath,
  getConnectionStrength,
  getReachableNodeIds,
} from '@/domain/models/navigation/route/route-graph-utils';
import type { RouteGraph, RouteNode } from '@/domain/models/navigation/route/route-node';
import type { GraphContext } from '@/infrastructure/navigation-2d/graph-context';

export class ZustandRouteGraphAggregate implements RouteGraphAggregate {
  private readonly graphContext: GraphContext;
  private readonly nodeById: Map<string, RouteNode>;
  private readonly nodesByType: Map<NodeType, RouteNode[]>;
  private readonly nodesByStop: Map<number, RouteNode[]>;

  constructor(graphContext: GraphContext, graph: RouteGraph) {
    this.graphContext = graphContext;

    this.nodeById = new Map();
    this.nodesByType = new Map();
    this.nodesByStop = new Map();

    for (const stop of graph.stops) {
      for (const node of stop.nodes) {
        this.nodeById.set(node.id, node);

        const byType = this.nodesByType.get(node.type) ?? [];
        byType.push(node);
        this.nodesByType.set(node.type, byType);

        const byStop = this.nodesByStop.get(node.stopIndex) ?? [];
        byStop.push(node);
        this.nodesByStop.set(node.stopIndex, byStop);
      }
    }
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

  canNavigateTo(targetId: string, constraints?: NavigationConstraints): boolean {
    return canNavigateTo(
      this.getCurrentNode()?.id ?? null,
      targetId,
      this.graphContext.allConnections(),
      constraints
    );
  }

  findPathTo(targetId: string, constraints?: NavigationConstraints): readonly string[] {
    return findShortestPath(
      this.getCurrentNode()?.id ?? null,
      targetId,
      this.graphContext.allConnections(),
      constraints
    );
  }

  getReachableNodeIds(constraints?: NavigationConstraints): readonly string[] {
    return getReachableNodeIds(
      this.getCurrentNode()?.id ?? null,
      this.graphContext.allConnections(),
      constraints
    );
  }

  getConnectionStrength(fromId: string, toId: string): number | undefined {
    return getConnectionStrength(fromId, toId, this.graphContext.allConnections());
  }

  getNodesByType(nodeType: NodeType): readonly RouteNode[] {
    return this.nodesByType.get(nodeType) ?? [];
  }

  getNodesInStop(stopIndex: number): readonly RouteNode[] {
    return this.nodesByStop.get(stopIndex) ?? [];
  }

  getNodeById(id: string): RouteNode | undefined {
    return this.nodeById.get(id);
  }
}
