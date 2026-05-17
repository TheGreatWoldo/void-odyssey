import { isForwardReachable } from '@/domain/models/navigation/route/route-graph-utils';
import type { RouteConnection, RouteNode } from '@/domain/models/navigation/route/route-node';
import { GraphContext } from '@/infrastructure/navigation-2d/graph-context';
import { Actor, Canvas, CollisionType, vec, Vector } from 'excalibur';

const LINE_COLOR_NORMAL = 'rgba(160, 200, 255, 0.25)';
const LINE_COLOR_FROM_CURRENT = 'rgba(80, 255, 180, 0.75)';
const LINE_COLOR_SCANNED = 'rgba(80, 255, 180, 0.35)';
const LINE_COLOR_TRAVELLED = 'rgba(160, 200, 255, 0.7)';
const LINE_THICKNESS = 1.5;
const LINE_THICKNESS_HIGHLIGHTED = 2.5;
const LINE_THICKNESS_TRAVELLED = 2.0;

const HIGHLIGHT_ANIMATE_PX_PER_MS = 0.5;

/** Pointer hit area half-height in world pixels. */
const HIT_HALF_HEIGHT = 8;

type ConnectionVisualState = 'normal' | 'highlighted' | 'scanned' | 'travelled';

/**
 * Actor for a connection edge. Handles both rendering and pointer hit-testing.
 *
 * The actor sits at the midpoint of the two endpoints, rotated to the correct
 * angle. The Canvas graphic draws a horizontal line through the centre of the
 * raster — after the actor's rotation is applied this becomes the edge line.
 */
export class RouteConnectionActor extends Actor {
  readonly connection: RouteConnection;
  /** True once the player has travelled along this connection. */
  travelled = false;

  private readonly fromStopIndex: number;
  private readonly graphContext: GraphContext;
  private readonly canvasNormal: Canvas;
  private readonly canvasHighlighted: Canvas;
  private readonly canvasScanned: Canvas;
  private readonly canvasTravelled: Canvas;
  private _visualState: ConnectionVisualState = 'normal';
  private _highlightProgress = 0;
  private _scannedProgress = 0;
  private _wasScanned = false;
  private readonly _lineWidth: number;

  get sweepComplete(): boolean {
    if (this._visualState === 'highlighted') return this._highlightProgress >= 1;

    if (this._visualState === 'scanned') return this._scannedProgress >= 1;

    return true;
  }

  constructor(
    connection: RouteConnection,
    fromNode: RouteNode,
    fromWorld: Vector,
    toWorld: Vector,
    graphContext: GraphContext
  ) {
    const mid = vec(
      (fromWorld.x + toWorld.x) / 2,
      (fromWorld.y + toWorld.y) / 2
    );
    const dx = toWorld.x - fromWorld.x;
    const dy = toWorld.y - fromWorld.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const w = Math.ceil(length);
    const h = HIT_HALF_HEIGHT * 2;

    super({
      x: mid.x,
      y: mid.y,
      rotation: angle,
      collisionType: CollisionType.Fixed,
      width: w,
      height: h,
      z: -1,
    });
    this.connection = connection;
    this.fromStopIndex = fromNode.stopIndex;
    this.graphContext = graphContext;
    this._lineWidth = w;

    this.canvasNormal = new Canvas({
      width: w,
      height: h,
      cache: true,
      draw(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = LINE_COLOR_NORMAL;
        ctx.lineWidth = LINE_THICKNESS;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      },
    });

    this.canvasHighlighted = new Canvas({
      width: w,
      height: h,
      cache: false,
      draw: (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, w, h);
        const filled = Math.round(w * this._highlightProgress);

        if (this._wasScanned) {
          ctx.strokeStyle = 'rgba(80, 255, 180, 0.08)';
          ctx.lineWidth = LINE_THICKNESS_HIGHLIGHTED * 3;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();
          ctx.strokeStyle = LINE_COLOR_SCANNED;
        } else {
          ctx.strokeStyle = LINE_COLOR_NORMAL;
        }

        ctx.lineWidth = LINE_THICKNESS;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        if (filled > 0) {
          ctx.strokeStyle = 'rgba(80, 255, 180, 0.25)';
          ctx.lineWidth = LINE_THICKNESS_HIGHLIGHTED * 3;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(filled, h / 2);
          ctx.stroke();

          ctx.strokeStyle = LINE_COLOR_FROM_CURRENT;
          ctx.lineWidth = LINE_THICKNESS_HIGHLIGHTED;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(filled, h / 2);
          ctx.stroke();
        }
      },
    });

    this.canvasScanned = new Canvas({
      width: w,
      height: h,
      cache: false,
      draw: (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, w, h);
        const filled = Math.round(w * this._scannedProgress);

        ctx.strokeStyle = LINE_COLOR_NORMAL;
        ctx.lineWidth = LINE_THICKNESS;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        if (filled > 0) {
          ctx.strokeStyle = 'rgba(80, 255, 180, 0.08)';
          ctx.lineWidth = LINE_THICKNESS_HIGHLIGHTED * 3;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(filled, h / 2);
          ctx.stroke();

          ctx.strokeStyle = LINE_COLOR_SCANNED;
          ctx.lineWidth = LINE_THICKNESS;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(filled, h / 2);
          ctx.stroke();
        }
      },
    });

    this.canvasTravelled = new Canvas({
      width: w,
      height: h,
      cache: true,
      draw(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = LINE_COLOR_TRAVELLED;
        ctx.lineWidth = LINE_THICKNESS_TRAVELLED;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      },
    });

    this.graphics.use(this.canvasNormal);
  }

  override onPreUpdate(_engine: unknown, delta: number): void {
    const currentActor = this.graphContext.currentNodeActor;
    const currentNodeId = currentActor?.routeNode.id ?? null;
    const scannerRange = this.graphContext.statePort.getScannerRange();
    const connections = this.graphContext.allConnections();

    let next: ConnectionVisualState = 'normal';

    if (this.connection.fromId === currentNodeId) {
      next = 'highlighted';
    } else if (this.travelled) {
      next = 'travelled';
    } else if (scannerRange >= 2) {
      const currentStopIndex = currentActor?.routeNode.stopIndex ?? -1;

      if (this.fromStopIndex > currentStopIndex) {
        const stepsAhead = this.fromStopIndex - currentStopIndex;

        if (
          stepsAhead >= 1 &&
          stepsAhead < scannerRange &&
          currentNodeId &&
          isForwardReachable(
            currentNodeId,
            this.connection.fromId,
            connections,
            stepsAhead
          )
        ) {
          next = 'scanned';
        }
      }
    }

    if (next !== this._visualState) {
      if (next === 'highlighted') {
        this._wasScanned = this._visualState === 'scanned';
        this._highlightProgress = 0;
      }

      if (next === 'scanned') {
        this._scannedProgress = 0;
      }

      this._visualState = next;
      this.graphics.use(
        next === 'highlighted'
          ? this.canvasHighlighted
          : next === 'travelled'
            ? this.canvasTravelled
            : next === 'scanned'
              ? this.canvasScanned
              : this.canvasNormal
      );
    }

    if (this._visualState === 'highlighted' && this._highlightProgress < 1) {
      this._highlightProgress = Math.min(
        1,
        this._highlightProgress +
          (HIGHLIGHT_ANIMATE_PX_PER_MS * delta) / this._lineWidth
      );
      this.canvasHighlighted.flagDirty();
    }

    if (this._visualState === 'scanned' && this._scannedProgress < 1) {
      const predecessorsDone = this.graphContext
        .connectionActorsTo(this.connection.fromId)
        .every((a) => a.sweepComplete);

      if (predecessorsDone) {
        this._scannedProgress = Math.min(
          1,
          this._scannedProgress +
            (HIGHLIGHT_ANIMATE_PX_PER_MS * delta) / this._lineWidth
        );
        this.canvasScanned.flagDirty();
      }
    }
  }

  static fromNodes(
    connection: RouteConnection,
    fromNode: RouteNode,
    toNode: RouteNode,
    graphContext: GraphContext,
    worldOffset: Vector = Vector.Zero
  ): RouteConnectionActor {
    return new RouteConnectionActor(
      connection,
      fromNode,
      vec(fromNode.wx + worldOffset.x, fromNode.wy + worldOffset.y),
      vec(toNode.wx + worldOffset.x, toNode.wy + worldOffset.y),
      graphContext
    );
  }
}
