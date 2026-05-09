import type { SceneKey } from '@/shared/scene-key'

export interface IGameService {
  goToScene(key: SceneKey): Promise<void>
  dispose(): void
  setCanvasInteractive(interactive: boolean): void
}
