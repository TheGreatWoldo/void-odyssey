import { useGameStore } from '@/application/store/gameStore'
import type { IGameService } from '@/shared/game-service'
import type { SceneKey } from '@/shared/scene-key'
import { useCallback } from 'react'

/**
 * Returns a stable callback that starts the engine on a given canvas, navigates
 * to the initial scene, and transitions the game phase to 'menu'.
 *
 * Encapsulates the phase transition in the application layer so that presentation
 * components (GameCanvas) do not make application-state decisions.
 */
export function useStartEngine(
  onCanvasReady: (canvas: HTMLCanvasElement) => Promise<IGameService>
): (canvas: HTMLCanvasElement, sceneKey: SceneKey) => Promise<IGameService> {
  const setPhase = useGameStore((s) => s.setPhase)

  return useCallback(
    async (canvas: HTMLCanvasElement, sceneKey: SceneKey): Promise<IGameService> => {
      const service = await onCanvasReady(canvas)
      await service.goToScene(sceneKey)
      setPhase('menu')
      return service
    },
    [onCanvasReady, setPhase]
  )
}
