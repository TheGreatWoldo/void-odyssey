import { backgroundSceneArgsCatalog } from '@/infrastructure/background/catalogs/background-scene-args-catalog'
import { BackgroundScene } from '@/infrastructure/background/scenes/background-scene'
import { HueForSizeStrategy } from '@/infrastructure/background/strategies/color-strategy'
import { getPositionForArgs } from '@/infrastructure/background/strategies/position-strategy'
import { getSizeForArgs } from '@/infrastructure/background/strategies/size-strategy'
import { getVelocityForArgs } from '@/infrastructure/background/strategies/velocity-strategy'
import type { IGameEngineFacade } from '@/shared/game-engine-facade'
import type { SceneKey } from '@/shared/scene-key'
import { Color, DisplayMode, Engine } from 'excalibur'

// Compile-time check: SceneKey must match backgroundSceneArgsCatalog keys exactly.
export type _AssertSceneKeyMatchesCatalog =
  keyof typeof backgroundSceneArgsCatalog extends SceneKey
    ? SceneKey extends keyof typeof backgroundSceneArgsCatalog
      ? true
      : never
    : never

// Set to false when audio unlock via the Excalibur play button is needed.
const SUPPRESS_PLAY_BUTTON = true

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

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas
    this.engine = this.buildEngine()
  }

  private buildEngine(): Engine {
    const engine = new Engine({
      canvasElement: this._canvas,
      displayMode: DisplayMode.FillContainer,
      backgroundColor: Color.fromHex('#000000'),
      suppressPlayButton: SUPPRESS_PLAY_BUTTON,
    })

    for (const [key, args] of Object.entries(backgroundSceneArgsCatalog)) {
      engine.addScene(key, new BackgroundScene(args, backgroundStrategies))
    }

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
    return this.engine.goToScene(key)
  }

  dispose(): void {
    this.engine.dispose()
  }
}
