import { useRouteNavigationStore } from '@/application/store/routeNavigationStore';
import type { RouteConnection, RouteNode } from '@/domain/models/navigation/route/route-node';
import { ROUTE_ALLOCATION_CATALOG } from '@/domain/models/navigation/route/strategies/route-allocation-catalog';
import {
    generateRouteGraph,
    LAYER_GRID_HEIGHT,
    LAYER_GRID_WIDTH,
} from '@/domain/services/route-graph-generator';
import { RandomBezierCurveProvider } from '@/infrastructure/navigation-2d/curve/random-bezier-curve-provider';
import { GraphContext } from '@/infrastructure/navigation-2d/graph-context';
import { BezierNodePositionStrategy } from '@/infrastructure/navigation-2d/positioning/bezier-node-position-strategy';
import { RouteConnectionActor } from '@/infrastructure/navigation-2d/rendering/actors/route-connection-actor';
import { RouteNodeActor } from '@/infrastructure/navigation-2d/rendering/actors/route-node-actor';
import { StarfieldActor } from '@/infrastructure/navigation-2d/rendering/actors/starfield-actor';
import { HexagonNodeDrawingStrategy } from '@/infrastructure/navigation-2d/rendering/strategies/hexagon-node-drawing-strategy';
import {
    Color,
    Engine,
    Keys,
    Scene,
    type SceneActivationContext,
    vec,
} from 'excalibur';

const BACKGROUND_COLOR = Color.fromRGB(6, 8, 20);
const ROUTE_COUNT = 3;
const ROUTE_GAP_WORLD = 10;
const SCROLL_TWEEN_DURATION_MS = 1200;

export class RouteNavigationScene extends Scene {
  private readonly drawingStrategy = new HexagonNodeDrawingStrategy();
  private readonly starfieldActor = new StarfieldActor();

  private readonly graphContexts: GraphContext[] = Array.from(
    { length: ROUTE_COUNT },
    () => new GraphContext()
  );

  private readonly bezierProviders: RandomBezierCurveProvider[] = Array.from(
    { length: ROUTE_COUNT },
    () => new RandomBezierCurveProvider(2, 0.06)
  );

  private nodeActorSets: RouteNodeActor[][] = Array.from(
    { length: ROUTE_COUNT },
    () => []
  );

  private connectionActorSets: RouteConnectionActor[][] = Array.from(
    { length: ROUTE_COUNT },
    () => []
  );

  private graphWidth = 0;
  private routeSlotHeight = 0;
  private activeRoute = 0;
  private _cameraY = 0;
  private _tweenFrom = 0;
  private _tweenTo = 0;
  private _tweenElapsed = 0;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private _preload: Promise<void> | null = null;

  override onInitialize(): void {
    this.backgroundColor = BACKGROUND_COLOR;
    this.camera.pos = vec(0, 0);
    this.camera.zoom = 1;

    this.add(this.starfieldActor);
    this.starfieldActor.generate();

    this._preload = this.drawingStrategy.preload?.() ?? Promise.resolve();
  }

  override onActivate(_ctx: SceneActivationContext<unknown>): void {
    if (this.wheelHandler) {
      this.engine.canvas?.removeEventListener('wheel', this.wheelHandler);
    }

    this.wheelHandler = (e: WheelEvent) => {
      e.preventDefault();

      if (e.deltaY > 0) {
        this.activeRoute = Math.min(ROUTE_COUNT - 1, this.activeRoute + 1);
      } else {
        this.activeRoute = Math.max(0, this.activeRoute - 1);
      }

      this._tweenFrom = this._cameraY;
      this._tweenTo = this.activeRoute * this.routeSlotHeight;
      this._tweenElapsed = 0;
    };

    this.engine.canvas?.addEventListener('wheel', this.wheelHandler, {
      passive: false,
    });

    void (this._preload ?? Promise.resolve()).then(() => {
      this.rebuildAllRoutes();
    });
  }

  override onDeactivate(_ctx: SceneActivationContext): void {
    if (this.wheelHandler) {
      this.engine.canvas?.removeEventListener('wheel', this.wheelHandler);
      this.wheelHandler = null;
    }
  }

  override onPreUpdate(engine: Engine, delta: number): void {
    if (engine.input.keyboard.wasPressed(Keys.KeyR)) {
      this.rebuildAllRoutes();
    }

    this.updateCameraGlide(delta);
    this.updateCameraTransform(engine);
  }

  // ---- Private helpers --------------------------------------------------

  private rebuildAllRoutes(): void {
    this.clearAllActors();

    const { routeSteps, minBranches, maxBranches } =
      useRouteNavigationStore.getState();

    const totalLayers = routeSteps + 2;

    this.graphWidth = totalLayers * LAYER_GRID_WIDTH;
    this.routeSlotHeight = totalLayers * LAYER_GRID_HEIGHT + ROUTE_GAP_WORLD;

    for (let i = 0; i < ROUTE_COUNT; i++) {
      this.bezierProviders[i].generate();

      const result = generateRouteGraph(
        routeSteps,
        minBranches,
        maxBranches,
        new BezierNodePositionStrategy(this.bezierProviders[i]),
        undefined,
        ROUTE_ALLOCATION_CATALOG.standard.strategy
      );

      this.buildSlot(i, result.nodes, result.connections, i * this.routeSlotHeight);
    }

    this.activeRoute = 0;
    this._cameraY = 0;
    this._tweenFrom = 0;
    this._tweenTo = 0;
    this._tweenElapsed = SCROLL_TWEEN_DURATION_MS;
  }

  private buildSlot(
    slotIndex: number,
    nodes: RouteNode[],
    connections: RouteConnection[],
    yOffset: number
  ): void {
    const graphContext = this.graphContexts[slotIndex];

    graphContext.setTopology(connections);

    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const offset = vec(0, yOffset);

    for (const conn of connections) {
      const from = nodeById.get(conn.fromId);
      const to = nodeById.get(conn.toId);

      if (!from || !to) continue;

      const actor = RouteConnectionActor.fromNodes(
        conn,
        from,
        to,
        graphContext,
        offset
      );

      this.connectionActorSets[slotIndex].push(actor);
      graphContext.registerConnection(actor);
      this.add(actor);
    }

    for (const node of nodes) {
      const actor = new RouteNodeActor(
        node,
        vec(node.wx, node.wy + yOffset),
        this.drawingStrategy,
        graphContext,        
      );

      this.nodeActorSets[slotIndex].push(actor);
      graphContext.registerNode(actor);
      this.add(actor);
    }
  }

  private clearAllActors(): void {
    for (let i = 0; i < ROUTE_COUNT; i++) {
      for (const actor of this.connectionActorSets[i]) actor.kill();
      this.connectionActorSets[i] = [];

      for (const actor of this.nodeActorSets[i]) actor.kill();
      this.nodeActorSets[i] = [];

      this.graphContexts[i].clear();
    }
  }

  private updateCameraGlide(delta: number): void {
    this._tweenElapsed = Math.min(this._tweenElapsed + delta, SCROLL_TWEEN_DURATION_MS);
    const t = this._tweenElapsed / SCROLL_TWEEN_DURATION_MS;
    const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

    this._cameraY = this._tweenFrom + (this._tweenTo - this._tweenFrom) * eased;
  }

  private updateCameraTransform(engine: Engine): void {
    if (this.graphWidth === 0) return;

    // Use canvas.clientWidth (CSS pixels) — NOT engine.drawWidth.
    // engine.drawWidth = clientWidth / zoom, so computing zoom from it
    // creates a feedback loop that oscillates every frame.
    this.camera.zoom = engine.canvas.clientWidth / this.graphWidth;
    this.camera.pos = vec(0, this._cameraY);
  }

}

