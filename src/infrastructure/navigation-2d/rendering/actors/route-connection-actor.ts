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

const ConnectionVisualState = {
  Normal: 'normal',
  Highlighted: 'highlighted',
  Scanned: 'scanned',
  Travelled: 'travelled',
} as const;
type ConnectionVisualState = typeof ConnectionVisualState[keyof typeof ConnectionVisualState];

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
  private visualState: ConnectionVisualState = ConnectionVisualState.Normal;
  private highlightProgress = 0;
  private scannedProgress = 0;
  private wasScanned = false;
  private readonly lineWidth: number;

  get sweepComplete(): boolean {
    if (this.visualState === ConnectionVisualState.Highlighted) return this.highlightProgress >= 1;

    if (this.visualState === ConnectionVisualState.Scanned) return this.scannedProgress >= 1;

    return true;
  }

  constructor(
    connection: RouteConnection,
    fromNode: RouteNode,
    fromWorld: Vector,
    toWorld: Vector,
    graphContext: GraphContext,
    quality = 1
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
    this.lineWidth = w;

    this.canvasNormal = this.buildNormalCanvas(w, h, quality);
    this.canvasHighlighted = this.buildHighlightedCanvas(w, h, quality);
    this.canvasScanned = this.buildScannedCanvas(w, h, quality);
    this.canvasTravelled = this.buildTravelledCanvas(w, h, quality);

    this.graphics.use(this.canvasNormal);
  }

  private buildNormalCanvas(w: number, h: number, quality: number): Canvas {
    return new Canvas({
      width: w,
      height: h,
      cache: true,
      quality,
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
  }

  private buildHighlightedCanvas(w: number, h: number, quality: number): Canvas {
    return new Canvas({
      width: w,
      height: h,
      cache: false,
      quality,
      draw: (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, w, h);
        const filled = Math.round(w * this.highlightProgress);

        if (this.wasScanned) {
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
  }

  private buildScannedCanvas(w: number, h: number, quality: number): Canvas {
    return new Canvas({
      width: w,
      height: h,
      cache: false,
      quality,
      draw: (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, w, h);
        const filled = Math.round(w * this.scannedProgress);

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
  }

  private buildTravelledCanvas(w: number, h: number, quality: number): Canvas {
    return new Canvas({
      width: w,
      height: h,
      cache: true,
      quality,
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
  }

  private canvasForState(state: ConnectionVisualState): Canvas {
    switch (state) {
      case ConnectionVisualState.Highlighted: return this.canvasHighlighted;
      case ConnectionVisualState.Travelled:   return this.canvasTravelled;
      case ConnectionVisualState.Scanned:     return this.canvasScanned;
      default:                                return this.canvasNormal;
    }
  }

  override onPreUpdate(_engine: unknown, delta: number): void {
    const currentActor = this.graphContext.currentNodeActor;
    const currentNodeId = currentActor?.routeNode.id ?? null;
    const scannerRange = this.graphContext.statePort.getScannerRange();
    const connections = this.graphContext.allConnections();

    let next: ConnectionVisualState = ConnectionVisualState.Normal;

    if (this.connection.fromId === currentNodeId) {
      next = ConnectionVisualState.Highlighted;
    } else if (this.travelled) {
      next = ConnectionVisualState.Travelled;
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
          next = ConnectionVisualState.Scanned;
        }
      }
    }

    if (next !== this.visualState) {
      if (next === ConnectionVisualState.Highlighted) {
        this.wasScanned = this.visualState === ConnectionVisualState.Scanned;
        this.highlightProgress = 0;
      }

      if (next === ConnectionVisualState.Scanned) {
        this.scannedProgress = 0;
      }

      this.visualState = next;
      this.graphics.use(this.canvasForState(next));
    }

    if (this.visualState === ConnectionVisualState.Highlighted && this.highlightProgress < 1) {
      this.highlightProgress = Math.min(
        1,
        this.highlightProgress +
          (HIGHLIGHT_ANIMATE_PX_PER_MS * delta) / this.lineWidth
      );
      this.canvasHighlighted.flagDirty();
    }

    if (this.visualState === ConnectionVisualState.Scanned && this.scannedProgress < 1) {
      const predecessorsDone = this.graphContext
        .connectionActorsTo(this.connection.fromId)
        .every((a) => a.sweepComplete);

      if (predecessorsDone) {
        this.scannedProgress = Math.min(
          1,
          this.scannedProgress +
            (HIGHLIGHT_ANIMATE_PX_PER_MS * delta) / this.lineWidth
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
    worldOffset: Vector = Vector.Zero,
    quality = 1
  ): RouteConnectionActor {
    return new RouteConnectionActor(
      connection,
      fromNode,
      vec(fromNode.wx + worldOffset.x, fromNode.wy + worldOffset.y),
      vec(toNode.wx + worldOffset.x, toNode.wy + worldOffset.y),
      graphContext,
      quality
    );
  }
}
