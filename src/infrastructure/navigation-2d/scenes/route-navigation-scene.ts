import { createRouteNavigationStore, type RouteNavigationStore } from '@/application/store/routeNavigationStore';
import {
    LAYER_GRID_HEIGHT,
    LAYER_GRID_WIDTH,
} from '@/domain/services/route-graph-generator';
import { RouteSlotActor } from '@/infrastructure/navigation-2d/rendering/actors/route-slot-actor';
import { StarfieldActor } from '@/infrastructure/navigation-2d/rendering/actors/starfield-actor';
import { HexagonNodeDrawingStrategy } from '@/infrastructure/navigation-2d/rendering/strategies/hexagon-node-drawing-strategy';
import type { IRouteActorState } from '@/shared/route-actor-state';
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
const ROUTE_GAP_WORLD = -1300;
const SCROLL_TWEEN_DURATION_MS = 1200;

export class RouteNavigationScene extends Scene {
  private readonly drawingStrategy = new HexagonNodeDrawingStrategy();
  private readonly starfieldActor = new StarfieldActor();

  private readonly slots: RouteSlotActor[] = [];
  private _graphParamsStore: RouteNavigationStore | null = null;

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

    // Create one slot per route, each with its own store and state port adapter
    for (let i = 0; i < ROUTE_COUNT; i++) {
      const store = createRouteNavigationStore();

      if (i === 0) this._graphParamsStore = store;

      // Adapter: present store API as IRouteActorState to isolate actors from application
      const statePort: IRouteActorState = {
        getScannerRange: () => store.getState().defaultScannerRange,
        getRevealAllNodes: () => store.getState().revealAllNodes,
        setHovered: (node, revealed) => store.getState().actions.setHovered(node, revealed),
        markNodeScanned: (id) => store.getState().actions.markNodeScanned(id),
        markNodeVisited: (id) => store.getState().actions.markNodeVisited(id),
        isNodeScanned: (id) => store.getState().scannedNodeIds.includes(id),
        isNodeVisited: (id) => store.getState().visitedNodeIds.includes(id),
      };

      const slot = new RouteSlotActor(this.drawingStrategy, statePort);
      this.slots.push(slot);
      this.add(slot);
    }

    this._preload = this.drawingStrategy.preload?.() ?? Promise.resolve();
  }

  override onActivate(_ctx: SceneActivationContext<unknown>): void {
    if (this.wheelHandler) {
      this.engine.canvas?.removeEventListener('wheel', this.wheelHandler);
    }

    this.wheelHandler = (e: WheelEvent) => {
      e.preventDefault();

      if (this._tweenElapsed < SCROLL_TWEEN_DURATION_MS) return;

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
    const { routeSteps, minBranches, maxBranches } =
      this._graphParamsStore!.getState();

    const totalLayers = routeSteps + 2;

    this.graphWidth = totalLayers * LAYER_GRID_WIDTH;
    this.routeSlotHeight = totalLayers * LAYER_GRID_HEIGHT + ROUTE_GAP_WORLD;

    for (let i = 0; i < ROUTE_COUNT; i++) {
      this.slots[i].rebuild(routeSteps, minBranches, maxBranches, i * this.routeSlotHeight);
    }

    this.activeRoute = 0;
    this._cameraY = 0;
    this._tweenFrom = 0;
    this._tweenTo = 0;
    this._tweenElapsed = SCROLL_TWEEN_DURATION_MS;
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
