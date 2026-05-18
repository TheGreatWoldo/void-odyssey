import { isForwardReachable } from '@/domain/models/navigation/route/route-graph-utils';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';
import { GraphContext } from '@/infrastructure/navigation-2d/graph-context';
import { Actor, CollisionType, vec, Vector } from 'excalibur';

import type { NodeDrawingStrategy } from '@/infrastructure/navigation-2d/rendering/strategies/node-drawing-strategy';
import { NodeVisualState } from '@/infrastructure/navigation-2d/rendering/strategies/node-drawing-strategy';

function buildHexColliderPoints(): Vector[] {
  const r = 28;
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return vec(r * Math.cos(angle), r * Math.sin(angle));
  });
}

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
  private currentGraphicRevision = 0;

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
    });
    this.routeNode = node;
    this.strategy = strategy;
    this.graphContext = graphContext;
    this.currentGraphicRevision = this.strategy.getRevision?.() ?? 0;
    this.pointer.useGraphicsBounds = false;
    this.pointer.useColliderShape = true;
    this.graphics.use(
      strategy.getGraphic(node.type, NodeVisualState.Unknown, false)
    );
  }

  override onInitialize(): void {
    this.collider.usePolygonCollider(buildHexColliderPoints());

    this.on('pointerenter', () => {
      const scannerRange = this.graphContext.statePort.getScannerRange();
      const currentActor = this.graphContext.currentNodeActor;
      const visualState = this._computeVisualState(currentActor, scannerRange);
      const scanned = this._computeScanned(scannerRange, currentActor);

      if (
        visualState === NodeVisualState.Reachable ||
        visualState === NodeVisualState.Known ||
        scanned
      ) {
        this.graphContext.statePort.setHovered(this.routeNode, scanned);
      }
    });

    this.on('pointerleave', () => {
      this.graphContext.statePort.setHovered(null);
    });

    this.on('pointerup', () => {
      if (this._isReachable()) {
        this.graphContext.onNodeClicked?.(this);
      }
    });
  }

  override onPreUpdate(): void {
    const scannerRange = this.graphContext.statePort.getScannerRange();
    const currentActor = this.graphContext.currentNodeActor;
    const next = this._computeVisualState(currentActor, scannerRange);
    const nextScanned = this._computeScanned(scannerRange, currentActor);
    const nextGraphicRevision = this.strategy.getRevision?.() ?? 0;

    if (
      next === this.currentVisualState &&
      nextScanned === this.currentScanned &&
      nextGraphicRevision === this.currentGraphicRevision
    ) {
      return;
    }

    this.currentVisualState = next;
    this.currentScanned = nextScanned;
    this.currentGraphicRevision = nextGraphicRevision;

    if (nextScanned && !this.scanned) {
      this.scanned = true;
      this.graphContext.statePort.markNodeScanned(this.routeNode.id);
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

    if (currentActor && this.routeNode.stopIndex <= currentActor.routeNode.stopIndex) {
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
    if (this.graphContext.statePort.getRevealAllNodes()) return true;

    if (this.scanned) return true;

    if (!currentActor) return false;

    if (this._isReachable() && scannerRange >= 1) return true;

    const stepsAhead = this.routeNode.stopIndex - currentActor.routeNode.stopIndex;

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
