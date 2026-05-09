import type { IGameEngineFacade } from '@/domain/services/IGameEngineFacade'

export class GameService {
  private started = false
  private disposed = false

  constructor(private readonly engine: IGameEngineFacade) {}

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
}
