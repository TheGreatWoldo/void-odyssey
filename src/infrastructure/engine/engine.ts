import type { IGameEngineFacade } from '@/domain/services/IGameEngineFacade'
import { Color, DisplayMode, Engine } from 'excalibur'

// Set to false when audio unlock via the Excalibur play button is needed.
const SUPPRESS_PLAY_BUTTON = true

export class ExcaliburEngineFacade implements IGameEngineFacade {
  private readonly engine: Engine

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine({
      canvasElement: canvas,
      displayMode: DisplayMode.FitContainerAndFill,
      backgroundColor: Color.fromHex('#000000'),
      suppressPlayButton: SUPPRESS_PLAY_BUTTON,
    })
  }

  get canvas(): HTMLCanvasElement {
    return this.engine.canvas
  }

  setCanvasInteractive(interactive: boolean): void {
    this.engine.canvas.style.pointerEvents = interactive ? 'auto' : 'none'
  }

  startEngine(): Promise<void> {
    return this.engine.start()
  }

  dispose(): void {
    this.engine.dispose()
  }
}
