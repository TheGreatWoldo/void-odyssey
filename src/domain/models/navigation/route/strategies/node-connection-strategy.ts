import type { RouteConnection, RouteStop } from '@/domain/models/navigation/route/route-node';

export interface NodeConnectionStrategy {
  buildConnections(stops: RouteStop[]): RouteConnection[];
}
