import type { RouteConnection, RouteNode } from '@/domain/models/navigation/route/route-node';

export interface NodeConnectionStrategy {
  buildConnections(nodes: RouteNode[]): RouteConnection[];
}
