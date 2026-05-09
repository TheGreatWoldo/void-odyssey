import { BackgroundSceneKey, IGameEngineFacade } from '@/domain/repositories/IGameEngineFacade'

export class GameService {
  private started = false

  constructor(private readonly engine: IGameEngineFacade) {}

  get canvas(): HTMLCanvasElement {
    return this.engine.canvas
  }

  setBackground(key: BackgroundSceneKey): void {
    this.engine.setBackground(key)
  }

  goToShipConfiguration(shipId: string): void {
    this.engine.goToShipConfiguration(shipId)
  }

  goToNavigation(): void {
    this.engine.goToNavigation()
  }

  goToRouteNavigation(): void {
    this.engine.goToRouteNavigation()
  }

  goToBackground(): void {
    this.engine.goToBackground()
  }

  setCanvasInteractive(interactive: boolean): void {
    this.engine.setCanvasInteractive(interactive)
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.engine.startEngine()
  }

  dispose(): void {
    this.engine.dispose()
  }
}
