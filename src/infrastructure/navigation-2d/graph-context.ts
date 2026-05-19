import type { RouteConnection } from '@/domain/models/navigation/route/route-node';
import type { RouteConnectionActor } from '@/infrastructure/navigation-2d/rendering/actors/route-connection-actor';
import type { RouteNodeActor } from '@/infrastructure/navigation-2d/rendering/actors/route-node-actor';
import type { IRouteActorState } from '@/domain/models/navigation/route/route-actor-state';

/**
 * Shared graph state owned by the scene and passed to actors.
 * Actors read from this context and the state port for game-logic state.
 */
export class GraphContext {
  readonly statePort: IRouteActorState;

  currentNodeActor: RouteNodeActor | null = null;

  /** Called by the scene when the player moves to a node. */
  onNodeClicked: ((actor: RouteNodeActor) => void) | null = null;

  private nodeActors = new Map<string, RouteNodeActor>();
  private connectionActorsByFromId = new Map<string, RouteConnectionActor[]>();
  private connectionActorsByToId = new Map<string, RouteConnectionActor[]>();
  private connections: RouteConnection[] = [];

  constructor(statePort: IRouteActorState) {
    this.statePort = statePort;
  }

  registerNode(actor: RouteNodeActor): void {
    this.nodeActors.set(actor.routeNode.id, actor);
  }

  registerConnection(actor: RouteConnectionActor): void {
    const { fromId, toId } = actor.connection;

    const fromList = this.connectionActorsByFromId.get(fromId) ?? [];

    fromList.push(actor);
    this.connectionActorsByFromId.set(fromId, fromList);

    const toList = this.connectionActorsByToId.get(toId) ?? [];

    toList.push(actor);
    this.connectionActorsByToId.set(toId, toList);
  }

  setTopology(connections: RouteConnection[]): void {
    this.connections = connections;
  }

  getNodeActor(id: string): RouteNodeActor | null {
    return this.nodeActors.get(id) ?? null;
  }

  allConnections(): RouteConnection[] {
    return this.connections;
  }

  connectionActorsFrom(nodeId: string): RouteConnectionActor[] {
    return this.connectionActorsByFromId.get(nodeId) ?? [];
  }

  connectionActorsTo(nodeId: string): RouteConnectionActor[] {
    return this.connectionActorsByToId.get(nodeId) ?? [];
  }

  isDirectlyReachable(fromId: string, toId: string): boolean {
    return this.connections.some(
      (c) => c.fromId === fromId && c.toId === toId
    );
  }

  clear(): void {
    this.nodeActors.clear();
    this.connectionActorsByFromId.clear();
    this.connectionActorsByToId.clear();
    this.connections = [];
    this.currentNodeActor = null;
  }
}
