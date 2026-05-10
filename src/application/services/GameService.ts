import type { IGameEngineFacade } from '@/shared/game-engine-facade'
import type { IGameService } from '@/shared/game-service'
import type { SceneKey } from '@/shared/scene-key'

export class GameService implements IGameService {
  private started = false
  private disposed = false
  private readonly engine: IGameEngineFacade

  constructor(engine: IGameEngineFacade) {
    this.engine = engine
  }

  get canvas(): HTMLCanvasElement {
    return this.engine.canvas
  }

  setCanvasInteractive(interactive: boolean): void {
    this.engine.setCanvasInteractive(interactive)
  }

  async start(): Promise<void> {
    if (this.disposed) {
      console.warn('GameService.start() called after dispose — ignoring')
      return
    }
    if (this.started) return
    this.started = true
    try {
      await this.engine.startEngine()
    } catch (e) {
      this.started = false
      throw e
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.engine.dispose()
  }

  goToScene(key: SceneKey): Promise<void> {
    return this.engine.goToScene(key)
  }
}
