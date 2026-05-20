import type { IRouteActorState } from '@/domain/models/navigation/route/route-actor-state'
import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import type { IGameEngineFacade } from '@/domain/ports/IGameEngineFacade'
import { backgroundSceneArgsCatalog } from '@/infrastructure/background/catalogs/background-scene-args-catalog'
import { BackgroundScene } from '@/infrastructure/background/scenes/background-scene'
import { HueForSizeStrategy } from '@/infrastructure/background/strategies/color-strategy'
import { getPositionForArgs } from '@/infrastructure/background/strategies/position-strategy'
import { getSizeForArgs } from '@/infrastructure/background/strategies/size-strategy'
import { getVelocityForArgs } from '@/infrastructure/background/strategies/velocity-strategy'
import { ParallaxStarfield } from '@/infrastructure/navigation-2d/rendering/parallax-starfield'
import { RouteNavigationScene } from '@/infrastructure/navigation-2d/scenes/route-navigation-scene'
import { ShipViewScene } from '@/infrastructure/ship-view/scenes/ShipViewScene'
import { SceneKey } from '@/shared/scene-key'
import { Color, DisplayMode, Engine } from 'excalibur'

const VIRTUAL_WIDTH = 1600
const VIRTUAL_HEIGHT = 900

// Compile-time check: background SceneKeys must all be in SceneKey.
// 'shipBlueprintEditor' is intentionally excluded from the background catalog.
type BackgroundSceneKey = keyof typeof backgroundSceneArgsCatalog
export type _AssertBackgroundKeysInSceneKey = BackgroundSceneKey extends SceneKey ? true : never

// Set to false when audio unlock via the Excalibur play button is needed.
const SUPPRESS_PLAY_BUTTON = true
const MAX_PIXEL_RATIO = 2

const backgroundStrategies = {
  sizeStrategy: (scene: Parameters<typeof getSizeForArgs>[0]) => getSizeForArgs(scene),
  backgroundColorStrategy: HueForSizeStrategy,
  actorColorStrategy: HueForSizeStrategy,
  velocityStrategy: getVelocityForArgs,
  positionStrategy: getPositionForArgs,
}

export class ExcaliburEngineFacade implements IGameEngineFacade {
  private engine: Engine
  private readonly _canvas: HTMLCanvasElement
  private readonly shipViewScene: ShipViewScene
  private readonly routeNavigationScene: RouteNavigationScene
  private _targetSceneKey: SceneKey | null = null
  private _transitioningTo: SceneKey | null = null

  constructor(canvas: HTMLCanvasElement, routeActorState: IRouteActorState) {
    this._canvas = canvas
    ParallaxStarfield.warmCache()
    this.shipViewScene = new ShipViewScene()
    this.routeNavigationScene = new RouteNavigationScene(routeActorState)
    this.engine = this.buildEngine()
  }

  private buildEngine(): Engine {
    const engine = new Engine({
      canvasElement: this._canvas,
      width: VIRTUAL_WIDTH,
      height: VIRTUAL_HEIGHT,
      displayMode: DisplayMode.FitContainer,
      pixelRatio: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
      backgroundColor: Color.fromHex('#000000'),
      suppressPlayButton: SUPPRESS_PLAY_BUTTON,
      maxFps: 60,
    })

    for (const [key, args] of Object.entries(backgroundSceneArgsCatalog)) {
      engine.addScene(key, new BackgroundScene(args, backgroundStrategies))
    }

    engine.addScene(SceneKey.ShipView, this.shipViewScene)
    engine.addScene(SceneKey.RouteNavigation, this.routeNavigationScene)

    return engine
  }

  get canvas(): HTMLCanvasElement {
    return this._canvas
  }

  setCanvasInteractive(interactive: boolean): void {
    this._canvas.style.pointerEvents = interactive ? 'auto' : 'none'
  }

  async startEngine(): Promise<void> {
    await this.engine.start()
  }

  goToScene(key: SceneKey): Promise<void> {
    this._targetSceneKey = key

    // If a transition is already in-flight, don't start a competing engine transition.
    // The current transition's .then() will redirect to _targetSceneKey when it lands.
    if (this._transitioningTo !== null) return Promise.resolve()

    if (this.engine.currentSceneName === key) return Promise.resolve()

    this._transitioningTo = key
    return this.engine.goToScene(key).then(() => {
      this._transitioningTo = null
      // If a later call changed the target while this transition was in-flight,
      // transition to the latest target now (last-write-wins).
      if (this._targetSceneKey !== null && this._targetSceneKey !== key) {
        void this.goToScene(this._targetSceneKey)
      }
    })
  }

  loadShipView(layout: RoomsLayout): void {
    this.shipViewScene.loadLayout(layout)
  }

  dispose(): void {
    // Excalibur's dispose() calls toggleEnabled(false) but never calls detach() on
    // any PointerEventReceiver — neither the engine-level one nor each scene's own.
    // In React StrictMode's double-mount, the first engine is disposed (screen._canvas
    // → null) while its listeners stay on the canvas. The next mouse event fires
    // _handle against the disposed engine and crashes in _viewportToPixels.
    // Fix: explicitly detach every registered pointer receiver before disposing.
    this.engine.input.pointers.detach()

    for (const key of Object.keys(this.engine.director.scenes)) {
      const scene = this.engine.director.getSceneInstance(key)

      if (scene?.isInitialized) {
        scene.input.pointers.detach()
      }
    }

    this.engine.dispose()
  }
}
