import { useGameStore } from '@/application/store/gameStore'
import { startEngine } from '@/application/useCases/StartEngineUseCase'
import type { IGameService } from '@/shared/game-service'
import type { SceneKey } from '@/shared/scene-key'
import { useCallback } from 'react'

/**
 * Returns a stable callback that delegates to {@link startEngine} and keeps the
 * hook free of orchestration logic.
 */
export function useStartEngine(
  onCanvasReady: (canvas: HTMLCanvasElement) => Promise<IGameService>
): (canvas: HTMLCanvasElement, sceneKey: SceneKey) => Promise<IGameService> {
  const setPhase = useGameStore((s) => s.setPhase)

  return useCallback(
    (canvas: HTMLCanvasElement, sceneKey: SceneKey) =>
      startEngine(canvas, sceneKey, onCanvasReady, setPhase),
    [onCanvasReady, setPhase]
  )
}
