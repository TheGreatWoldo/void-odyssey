import type { RoomsLayoutData } from '@/shared/rooms-editor'
import type { SceneKey } from '@/shared/scene-key'

export interface IGameService {
  goToScene(key: SceneKey): Promise<void>
  loadRoomsLayout(layout: RoomsLayoutData): void
  dispose(): void
  setCanvasInteractive(interactive: boolean): void
}
