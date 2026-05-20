import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import type { IGameEngineFacade } from '@/domain/ports/IGameEngineFacade'
import type { IGameService } from '@/shared/game-service'
import { err, ok, type Result } from '@/shared/result'
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

  async start(): Promise<Result<void, Error>> {
    if (this.disposed) {
      console.warn('GameService.start() called after dispose — ignoring')
      return ok(undefined)
    }
    if (this.started) return ok(undefined)
    this.started = true
    try {
      await this.engine.startEngine()
      return ok(undefined)
    } catch (e) {
      this.started = false
      return err(e instanceof Error ? e : new Error(String(e)))
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

  loadShipView(layout: RoomsLayout): void {
    this.engine.loadShipView(layout)
  }
}
