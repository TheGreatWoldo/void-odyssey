/**
 * Port: engine-level scene navigation and lifecycle, consumed by the application
 * layer. Implemented in the infrastructure layer.
 */
import type { SceneKey } from '@/shared/scene-key'

export interface IGameEngineFacade {
  readonly canvas: HTMLCanvasElement
  setCanvasInteractive(interactive: boolean): void
  startEngine(): Promise<void>
  goToScene(key: SceneKey): Promise<void>
  dispose(): void
}
