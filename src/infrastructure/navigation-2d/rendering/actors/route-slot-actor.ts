import { ROUTE_ALLOCATION_CATALOG } from '@/domain/models/navigation/route/strategies/route-allocation-catalog';
import { generateRouteGraph } from '@/domain/services/route-graph-generator';
import { RandomBezierCurveProvider } from '@/infrastructure/navigation-2d/curve/random-bezier-curve-provider';
import { GraphContext } from '@/infrastructure/navigation-2d/graph-context';
import { BezierNodePositionStrategy } from '@/infrastructure/navigation-2d/positioning/bezier-node-position-strategy';
import type { NodeDrawingStrategy } from '@/infrastructure/navigation-2d/rendering/strategies/node-drawing-strategy';
import type { IRouteActorState } from '@/infrastructure/navigation-2d/route-actor-state';
import { Actor, CollisionType, vec } from 'excalibur';

import { RouteConnectionActor } from './route-connection-actor';
import { RouteNodeActor } from './route-node-actor';

/**
 * Encapsulates one route option in the selection screen.
 *
 * The actor owns its GraphContext, a Bézier curve provider, and all the node
 * and connection actors that make up the route graph. The scene holds one
 * instance per route slot and simply calls rebuild() when it needs new graphs.
 */
export class RouteSlotActor extends Actor {
  readonly graphContext: GraphContext;

  private readonly bezierProvider = new RandomBezierCurveProvider(2, 0.06);
  private readonly drawingStrategy: NodeDrawingStrategy;
  private _nodeActors: RouteNodeActor[] = [];
  private _connectionActors: RouteConnectionActor[] = [];

  /**
   * @param drawingStrategy Strategy for rendering node graphics
   * @param statePort Adapter implementing IRouteActorState for reading/writing game logic state
   */
  constructor(drawingStrategy: NodeDrawingStrategy, statePort: IRouteActorState) {
    super({ collisionType: CollisionType.PreventCollision });
    this.drawingStrategy = drawingStrategy;
    this.graphContext = new GraphContext(statePort);
  }

  /**
   * Clears any existing node/connection actors, generates a new route graph,
   * and adds fresh actors to the scene. The slot actor must already be in the
   * scene before this is called.
   */
  rebuild(
    routeSteps: number,
    minBranches: number,
    maxBranches: number,
    yOffset: number
  ): void {
    this._clear();

    this.pos = vec(0, yOffset);

    this.bezierProvider.generate();

    const result = generateRouteGraph(
      routeSteps,
      minBranches,
      maxBranches,
      new BezierNodePositionStrategy(this.bezierProvider),
      undefined,
      ROUTE_ALLOCATION_CATALOG.standard.strategy
    );

    this.graphContext.setTopology(result.connections);

    const allNodes = result.stops.flatMap((s) => s.nodes);
    const nodeById = new Map(allNodes.map((n) => [n.id, n]));
    const offset = vec(0, yOffset);

    for (const conn of result.connections) {
      const from = nodeById.get(conn.fromId);
      const to = nodeById.get(conn.toId);

      if (!from || !to) continue;

      const actor = RouteConnectionActor.fromNodes(
        conn,
        from,
        to,
        this.graphContext,
        offset
      );

      this.graphContext.registerConnection(actor);
      this._connectionActors.push(actor);
      this.scene?.add(actor);
    }

    for (const node of allNodes) {
      const actor = new RouteNodeActor(
        node,
        vec(node.wx, node.wy + yOffset),
        this.drawingStrategy,
        this.graphContext
      );

      this.graphContext.registerNode(actor);
      this._nodeActors.push(actor);
      this.scene?.add(actor);
    }
  }

  private _clear(): void {
    for (const a of this._connectionActors) a.kill();
    this._connectionActors = [];

    for (const a of this._nodeActors) a.kill();
    this._nodeActors = [];

    this.graphContext.clear();
  }
}
