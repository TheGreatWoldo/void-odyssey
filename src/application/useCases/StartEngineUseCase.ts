import type { IGameService } from '@/shared/game-service'
import type { SceneKey } from '@/shared/scene-key'

import { GamePhase } from '@/application/store/gameStore'

/**
 * Starts the engine on the given canvas, navigates to the initial scene,
 * and transitions the game phase to 'menu'.
 *
 * The caller is responsible for providing the engine factory and the
 * phase-setter from the application store.
 */
export async function startEngine(
  canvas: HTMLCanvasElement,
  sceneKey: SceneKey,
  onCanvasReady: (canvas: HTMLCanvasElement) => Promise<IGameService>,
  setPhase: (phase: GamePhase) => void,
): Promise<IGameService> {
  const service = await onCanvasReady(canvas)

  await service.goToScene(sceneKey)

  setPhase(GamePhase.Menu)

  return service
}
