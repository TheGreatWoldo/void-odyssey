import { RouteConnection, RouteNode } from '@/domain/navigation/route/route-node';

export interface NodeConnectionStrategy {
  buildConnections(nodes: RouteNode[]): RouteConnection[];
}
