import { useRouteNavigationStore } from '@/application/store/routeNavigationStore';
import { isForwardReachable } from '@/domain/models/navigation/route/route-graph-utils';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';
import { GraphContext } from '@/infrastructure/navigation-2d/graph-context';
import { Actor, CollisionType, Vector } from 'excalibur';

import type { NodeDrawingStrategy } from '../strategies/node-drawing-strategy';
import { NodeVisualState } from '../strategies/node-drawing-strategy';

const HIT_RADIUS = 20;

export class RouteNodeActor extends Actor {
  readonly routeNode: RouteNode;
  /** True once this node's type has been revealed by scanners or by visiting. */
  scanned = false;
  /** True once the player's ship has landed on this node. */
  visited = false;

  private readonly strategy: NodeDrawingStrategy;
  private readonly graphContext: GraphContext;
  private currentVisualState: NodeVisualState = NodeVisualState.Unknown;
  private currentScanned = false;

  constructor(
    node: RouteNode,
    worldPos: Vector,
    strategy: NodeDrawingStrategy,
    graphContext: GraphContext
  ) {
    super({
      x: worldPos.x,
      y: worldPos.y,
      collisionType: CollisionType.Fixed,
      radius: HIT_RADIUS,
    });
    this.routeNode = node;
    this.strategy = strategy;
    this.graphContext = graphContext;
    this.graphics.use(
      strategy.getGraphic(node.type, NodeVisualState.Unknown, false)
    );
  }

  override onInitialize(): void {
    this.on('pointerenter', () => {
      const scannerRange = useRouteNavigationStore.getState().defaultScannerRange;
      const currentActor = this.graphContext.currentNodeActor;
      const visualState = this._computeVisualState(currentActor, scannerRange);
      const scanned = this._computeScanned(scannerRange, currentActor);

      if (
        visualState === NodeVisualState.Reachable ||
        visualState === NodeVisualState.Known ||
        scanned
      ) {
        useRouteNavigationStore
          .getState()
          .actions.setHovered(this.routeNode, scanned);
      }
    });

    this.on('pointerleave', () => {
      useRouteNavigationStore.getState().actions.setHovered(null);
    });

    this.on('pointerup', () => {
      if (this._isReachable()) {
        this.graphContext.onNodeClicked?.(this);
      }
    });
  }

  override onPreUpdate(): void {
    const scannerRange = useRouteNavigationStore.getState().defaultScannerRange;
    const currentActor = this.graphContext.currentNodeActor;
    const next = this._computeVisualState(currentActor, scannerRange);
    const nextScanned = this._computeScanned(scannerRange, currentActor);

    if (next === this.currentVisualState && nextScanned === this.currentScanned) {
      return;
    }

    this.currentVisualState = next;
    this.currentScanned = nextScanned;

    if (nextScanned && !this.scanned) {
      this.scanned = true;
      useRouteNavigationStore
        .getState()
        .actions.markNodeScanned(this.routeNode.id);
    }

    this.graphics.use(
      this.strategy.getGraphic(this.routeNode.type, next, nextScanned)
    );
  }

  private _isReachable(): boolean {
    const currentActor = this.graphContext.currentNodeActor;

    if (!currentActor) return false;

    return this.graphContext.isDirectlyReachable(
      currentActor.routeNode.id,
      this.routeNode.id
    );
  }

  private _computeVisualState(
    currentActor: RouteNodeActor | null,
    scannerRange: number
  ): NodeVisualState {
    if (this.graphContext.currentNodeActor === this) {
      return NodeVisualState.Current;
    }

    if (currentActor && this.routeNode.layer <= currentActor.routeNode.layer) {
      return this.scanned ? NodeVisualState.Past : NodeVisualState.Unknown;
    }

    if (this._isReachable()) {
      return scannerRange >= 1
        ? NodeVisualState.Reachable
        : NodeVisualState.Known;
    }

    return NodeVisualState.Unknown;
  }

  private _computeScanned(
    scannerRange: number,
    currentActor: RouteNodeActor | null
  ): boolean {
    if (useRouteNavigationStore.getState().revealAllNodes) return true;

    if (this.scanned) return true;

    if (!currentActor) return false;

    if (this._isReachable() && scannerRange >= 1) return true;

    const stepsAhead = this.routeNode.layer - currentActor.routeNode.layer;

    if (
      stepsAhead > 1 &&
      stepsAhead <= scannerRange &&
      isForwardReachable(
        currentActor.routeNode.id,
        this.routeNode.id,
        this.graphContext.allConnections(),
        stepsAhead
      )
    ) {
      return true;
    }

    return false;
  }
}
