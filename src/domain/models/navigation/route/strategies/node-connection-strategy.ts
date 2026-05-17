import type { RouteConnection, RouteStop } from '@/domain/models/navigation/route/route-node';
import type { RandomNumberGenerator } from '@/shared/random';

export interface NodeConnectionStrategy {
  buildConnections(stops: RouteStop[], rng?: RandomNumberGenerator): RouteConnection[];
}
