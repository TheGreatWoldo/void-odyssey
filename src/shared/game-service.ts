import type { SceneKey } from '@/shared/scene-key'
import type { RoomsLayoutData } from '@/shared/ship-blueprint-editor'

export interface IGameService {
  goToScene(key: SceneKey): Promise<void>
  loadRoomsLayout(layout: RoomsLayoutData): void
  loadShipView(layout: RoomsLayoutData): void
  dispose(): void
  setCanvasInteractive(interactive: boolean): void
}
