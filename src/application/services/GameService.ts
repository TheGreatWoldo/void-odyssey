import { IGameEngineFacade } from '@/domain/services/IGameEngineFacade'

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
    if (this.started || this.disposed) return
    this.started = true
    await this.engine.startEngine()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.started = false
    this.engine.dispose()
  }
}
