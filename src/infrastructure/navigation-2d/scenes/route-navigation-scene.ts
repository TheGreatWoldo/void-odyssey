import type { IRouteActorState } from '@/domain/models/navigation/route/route-actor-state';
import type { RouteConnection, RouteStop } from '@/domain/models/navigation/route/route-node';
import { ROUTE_ALLOCATION_CATALOG } from '@/domain/models/navigation/route/strategies/route-allocation-catalog';
import {
    generateRouteGraph,
    LAYER_GRID_HEIGHT,
    LAYER_GRID_WIDTH,
} from '@/domain/services/route-graph-generator';
import { RandomBezierCurveProvider } from '@/infrastructure/navigation-2d/curve/random-bezier-curve-provider';
import { GraphContext } from '@/infrastructure/navigation-2d/graph-context';
import { BezierNodePositionStrategy, JITTER_RADIUS_PX } from '@/infrastructure/navigation-2d/positioning/bezier-node-position-strategy';
import { RouteConnectionActor } from '@/infrastructure/navigation-2d/rendering/actors/route-connection-actor';
import { RouteNodeActor } from '@/infrastructure/navigation-2d/rendering/actors/route-node-actor';
import { StarfieldActor } from '@/infrastructure/navigation-2d/rendering/actors/starfield-actor';
import { drawBezierCurve } from '@/infrastructure/navigation-2d/rendering/bezier-curve-renderer';
import { HexagonNodeDrawingStrategy } from '@/infrastructure/navigation-2d/rendering/strategies/hexagon-node-drawing-strategy';
import { createSeededRandom, hashStringToSeed } from '@/shared/random';
import { ROUTE_SCROLL_TWEEN_DURATION_MS } from '@/shared/route-navigation';
import {
    Color,
    EasingFunctions,
    Engine,
    type ExcaliburGraphicsContext,
    Keys,
    Scene,
    type SceneActivationContext,
    vec,
    Vector,
} from 'excalibur';

const BACKGROUND_COLOR = Color.fromRGB(6, 8, 20);
const DEBUG_CURVE_COLOR = new Color(255, 190, 50, 0.5);
const ROUTE_COUNT = 3;
const ROUTE_GAP_WORLD = 400;

export class RouteNavigationScene extends Scene {
  private readonly drawingStrategy = new HexagonNodeDrawingStrategy();
  private readonly starfieldActor = new StarfieldActor();
  private readonly stateAdapter: IRouteActorState;

  private readonly graphContexts: GraphContext[];

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

  constructor(stateAdapter: IRouteActorState) {
    super();
    this.stateAdapter = stateAdapter;
    this.graphContexts = Array.from(
      { length: ROUTE_COUNT },
      () => new GraphContext(stateAdapter)
    );
  }

  private graphWidth = 0;
  private routeSlotHeight = 0;
  private activeRoute = 0;
  private cameraY = 0;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;

  // Tween state for debounced wheel scrolling
  private tweenFrom = 0;
  private tweenTo = 0;
  private tweenElapsed = 0;
  private lastRerollNonce = 0;

  override onInitialize(): void {
    this.backgroundColor = BACKGROUND_COLOR;
    this.camera.pos = vec(0, 0);
    this.camera.zoom = 1;

    this.add(this.starfieldActor);
    this.starfieldActor.generate();

    void this.drawingStrategy.preload?.();
  }

  override onActivate(_ctx: SceneActivationContext<unknown>): void {
    if (this.wheelHandler && this.engine.canvas) {
      this.engine.canvas.removeEventListener('wheel', this.wheelHandler)
    }

    this.wheelHandler = null

    this.rebuildAllRoutes()
    this.applySelectedRouteFromState()
    this.lastRerollNonce = this.stateAdapter.getRouteRerollNonce()

    if (this.stateAdapter.isRouteSelectionLocked()) {
      return
    }

    this.wheelHandler = (e: WheelEvent) => {
      e.preventDefault()

      // Debounce: prevent scrolling while tween is animating
      if (this.tweenElapsed < ROUTE_SCROLL_TWEEN_DURATION_MS) return

      if (e.deltaY > 0) {
        this.activeRoute = Math.min(ROUTE_COUNT - 1, this.activeRoute + 1)
      } else {
        this.activeRoute = Math.max(0, this.activeRoute - 1)
      }

      this.stateAdapter.setSelectedRouteIndex(this.activeRoute)

      // Start new tween
      this.tweenFrom = this.cameraY
      this.tweenTo = this.activeRoute * this.routeSlotHeight
      this.tweenElapsed = 0
    }

    if (this.engine.canvas) {
      this.engine.canvas.addEventListener('wheel', this.wheelHandler, {
        passive: false,
      })
    }
  }

  override onDeactivate(_ctx: SceneActivationContext): void {
    if (this.wheelHandler && this.engine.canvas) {
      this.engine.canvas.removeEventListener('wheel', this.wheelHandler)
    }
    this.wheelHandler = null

    this.stateAdapter.setHovered(null)
  }

  override onPreUpdate(engine: Engine, delta: number): void {
    const rerollNonce = this.stateAdapter.getRouteRerollNonce()

    if (rerollNonce !== this.lastRerollNonce) {
      this.lastRerollNonce = rerollNonce

      const rerollRouteIndex = this.stateAdapter.getRerollRouteIndex()

      if (rerollRouteIndex === null) {
        this.rebuildAllRoutes()
      } else {
        this.rebuildRouteSlot(this.clampRouteIndex(rerollRouteIndex), rerollNonce)
      }

      this.applySelectedRouteFromState()
    }

    if (engine.input.keyboard.wasPressed(Keys.KeyR)) {
      this.rebuildAllRoutes();
    }

    this.updateCameraGlide(delta);
    this.updateCameraTransform(engine);
  }

  override onPreDraw(ctx: ExcaliburGraphicsContext, _elapsedMs: number): void {
    if (!this.stateAdapter.isDrawDebugEnabled()) return;

    const { routeSteps } = this.stateAdapter.getRouteParams();
    const totalLayers = routeSteps + 2;
    const worldToScreen = this.buildToScreenTransform();

    for (let i = 0; i < ROUTE_COUNT; i++) {
      const yOffset = i * this.routeSlotHeight;
      const provider = this.bezierProviders[i];
      const bezierToScreen = (nx: number, ny: number) => {
        const w = this.bezierToWorld(nx, ny, totalLayers, yOffset);

        return worldToScreen(w.x, w.y);
      };

      this.drawJitterCircles(ctx, worldToScreen, i, yOffset);
      drawBezierCurve(ctx, provider, bezierToScreen, DEBUG_CURVE_COLOR, 1.5);
    }
  }

  private rebuildAllRoutes(): void {
    this.clearAllActors();

    const { routeSteps, minBranches, maxBranches, routeSeed } =
      this.stateAdapter.getRouteParams();
    const baseSeed = routeSeed || `${routeSteps}|${minBranches}|${maxBranches}`;

    const totalStops = routeSteps + 2;

    this.graphWidth = totalStops * LAYER_GRID_WIDTH;
    this.routeSlotHeight = totalStops * LAYER_GRID_HEIGHT + ROUTE_GAP_WORLD;

    for (let i = 0; i < ROUTE_COUNT; i++) {
      this.buildRouteSlot(i, `${baseSeed}|slot:${i}`);
    }
  }

  private rebuildRouteSlot(slotIndex: number, rerollNonce: number): void {
    const { routeSeed, routeSteps, minBranches, maxBranches } =
      this.stateAdapter.getRouteParams();
    const baseSeed = routeSeed || `${routeSteps}|${minBranches}|${maxBranches}`;

    this.clearSlotActors(slotIndex);
    this.buildRouteSlot(slotIndex, `${baseSeed}|slot:${slotIndex}|reroll:${rerollNonce}`);
  }

  private buildRouteSlot(slotIndex: number, seed: string): void {
    const { routeSteps, minBranches, maxBranches } = this.stateAdapter.getRouteParams();
    const rng = createSeededRandom(hashStringToSeed(seed));

    this.bezierProviders[slotIndex].generate(rng);

    const result = generateRouteGraph(
      routeSteps,
      minBranches,
      maxBranches,
      new BezierNodePositionStrategy(this.bezierProviders[slotIndex]),
      undefined,
      ROUTE_ALLOCATION_CATALOG.standard.strategy,
      rng,
      { seed }
    );

    this.buildSlot(slotIndex, result.stops, result.connections, slotIndex * this.routeSlotHeight);
  }

  private applySelectedRouteFromState(): void {
    const selectedRoute = this.clampRouteIndex(this.stateAdapter.getSelectedRouteIndex())

    this.activeRoute = selectedRoute
    this.cameraY = selectedRoute * this.routeSlotHeight
    this.tweenFrom = this.cameraY;
    this.tweenTo = this.cameraY;
    this.tweenElapsed = ROUTE_SCROLL_TWEEN_DURATION_MS

    this.stateAdapter.setSelectedRouteIndex(selectedRoute)
  }

  private clampRouteIndex(index: number): number {
    return Math.min(ROUTE_COUNT - 1, Math.max(0, index))
  }

  private buildSlot(
    slotIndex: number,
    stops: RouteStop[],
    connections: RouteConnection[],
    yOffset: number
  ): void {
    const allNodes = stops.flatMap((s) => s.nodes);

    const graphContext = this.graphContexts[slotIndex];

    graphContext.setTopology(connections);

    const nodeById = new Map(allNodes.map((n) => [n.id, n]));
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
        offset,
        this.engine.pixelRatio
      );

      this.connectionActorSets[slotIndex].push(actor);
      graphContext.registerConnection(actor);
      this.add(actor);
    }

    for (const node of allNodes) {
      const actor = new RouteNodeActor(
        node,
        vec(node.wx, node.wy + yOffset),
        this.drawingStrategy,
        graphContext
      );

      this.nodeActorSets[slotIndex].push(actor);
      graphContext.registerNode(actor);
      this.add(actor);
    }
  }

  private clearAllActors(): void {
    for (let i = 0; i < ROUTE_COUNT; i++) {
      this.clearSlotActors(i)
    }
  }

  private clearSlotActors(slotIndex: number): void {
    for (const actor of this.connectionActorSets[slotIndex]) actor.kill();
    this.connectionActorSets[slotIndex] = [];

    for (const actor of this.nodeActorSets[slotIndex]) actor.kill();
    this.nodeActorSets[slotIndex] = [];

    this.graphContexts[slotIndex].clear();
  }

  private updateCameraGlide(delta: number): void {
    this.tweenElapsed += delta;

    if (this.tweenElapsed >= ROUTE_SCROLL_TWEEN_DURATION_MS) {
      // Tween finished
      this.cameraY = this.tweenTo;
      this.tweenElapsed = ROUTE_SCROLL_TWEEN_DURATION_MS;
    } else {
      this.cameraY = EasingFunctions.EaseInOutCubic(
        this.tweenElapsed,
        this.tweenFrom,
        this.tweenTo,
        ROUTE_SCROLL_TWEEN_DURATION_MS
      );
    }
  }

  private updateCameraTransform(engine: Engine): void {
    if (this.graphWidth === 0) return;

    // Fit against the engine's logical canvas width.
    // canvas.width is the physical pixel buffer (= logicalWidth * pixelRatio),
    // so divide by pixelRatio to get the stable 1600 logical width, ensuring
    // identical zoom on every browser regardless of devicePixelRatio.
    const newZoom = (engine.canvas.width / engine.pixelRatio) / this.graphWidth;

    this.camera.zoom = newZoom;
    this.camera.pos = vec(0, this.cameraY);
  }

  private buildToScreenTransform(): (wx: number, wy: number) => Vector {
    const { zoom, pos } = this.camera;
    const hw = this.engine.halfDrawWidth;
    const hh = this.engine.halfDrawHeight;

    return (wx, wy) =>
      vec((wx - pos.x) * zoom + hw, (wy - pos.y) * zoom + hh);
  }

  private bezierToWorld(
    nx: number,
    ny: number,
    totalLayers: number,
    yOffset: number
  ): Vector {
    const graphWidth = totalLayers * LAYER_GRID_WIDTH;
    const graphHeight = totalLayers * LAYER_GRID_HEIGHT;

    return vec(
      nx * graphWidth - graphWidth / 2,
      ny * graphHeight - graphHeight / 2 + yOffset
    );
  }

  private drawJitterCircles(
    ctx: ExcaliburGraphicsContext,
    toScreen: (wx: number, wy: number) => Vector,
    slotIndex: number,
    yOffset: number
  ): void {
    const color = new Color(255, 255, 255, 0.45);
    const radiusPx = JITTER_RADIUS_PX * this.camera.zoom;

    for (const actor of this.nodeActorSets[slotIndex]) {
      const node = actor.routeNode;
      const center = toScreen(node.baseWx, node.baseWy + yOffset);
      let prev = vec(center.x + radiusPx, center.y);

      for (let i = 1; i <= 32; i++) {
        const angle = (i / 32) * 2 * Math.PI;
        const curr = vec(
          center.x + radiusPx * Math.cos(angle),
          center.y + radiusPx * Math.sin(angle)
        );

        ctx.drawLine(prev, curr, color, 0.5);
        prev = curr;
      }
    }
  }
}
