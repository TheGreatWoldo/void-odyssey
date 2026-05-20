import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import type { SceneKey } from '@/shared/scene-key'

/**
 * Port: engine-level scene navigation and lifecycle, consumed by the application
 * layer. Implemented in the infrastructure layer.
 */
export interface IGameEngineFacade {
  readonly canvas: HTMLCanvasElement

  setCanvasInteractive(interactive: boolean): void

  startEngine(): Promise<void>

  goToScene(key: SceneKey): Promise<void>

  loadShipView(layout: RoomsLayout): void

  dispose(): void
}
