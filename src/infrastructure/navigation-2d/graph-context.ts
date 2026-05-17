import type { RouteConnection } from '@/domain/models/navigation/route/route-node';
import type { RouteConnectionActor } from '@/infrastructure/navigation-2d/rendering/actors/route-connection-actor';
import type { RouteNodeActor } from '@/infrastructure/navigation-2d/rendering/actors/route-node-actor';
import type { IRouteActorState } from '@/infrastructure/navigation-2d/route-actor-state';

/**
 * Shared graph state owned by the scene and passed to actors.
 * Actors read from this context and the state port for game-logic state.
 */
export class GraphContext {
  readonly statePort: IRouteActorState;

  currentNodeActor: RouteNodeActor | null = null;

  /** Called by the scene when the player moves to a node. */
  onNodeClicked: ((actor: RouteNodeActor) => void) | null = null;

  private _nodeActors = new Map<string, RouteNodeActor>();
  private _connectionActorsFrom = new Map<string, RouteConnectionActor[]>();
  private _connectionActorsTo = new Map<string, RouteConnectionActor[]>();
  private _connections: RouteConnection[] = [];

  constructor(statePort: IRouteActorState) {
    this.statePort = statePort;
  }

  registerNode(actor: RouteNodeActor): void {
    this._nodeActors.set(actor.routeNode.id, actor);
  }

  registerConnection(actor: RouteConnectionActor): void {
    const { fromId, toId } = actor.connection;

    const fromList = this._connectionActorsFrom.get(fromId) ?? [];

    fromList.push(actor);
    this._connectionActorsFrom.set(fromId, fromList);

    const toList = this._connectionActorsTo.get(toId) ?? [];

    toList.push(actor);
    this._connectionActorsTo.set(toId, toList);
  }

  setTopology(connections: RouteConnection[]): void {
    this._connections = connections;
  }

  getNodeActor(id: string): RouteNodeActor | null {
    return this._nodeActors.get(id) ?? null;
  }

  allConnections(): RouteConnection[] {
    return this._connections;
  }

  connectionActorsFrom(nodeId: string): RouteConnectionActor[] {
    return this._connectionActorsFrom.get(nodeId) ?? [];
  }

  connectionActorsTo(nodeId: string): RouteConnectionActor[] {
    return this._connectionActorsTo.get(nodeId) ?? [];
  }

  isDirectlyReachable(fromId: string, toId: string): boolean {
    return this._connections.some(
      (c) => c.fromId === fromId && c.toId === toId
    );
  }

  clear(): void {
    this._nodeActors.clear();
    this._connectionActorsFrom.clear();
    this._connectionActorsTo.clear();
    this._connections = [];
    this.currentNodeActor = null;
  }
}
