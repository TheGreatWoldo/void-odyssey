import type { RoomsLayoutData } from '@/shared/rooms-editor'
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
  loadRoomsLayout(layout: RoomsLayoutData): void
  dispose(): void
}
