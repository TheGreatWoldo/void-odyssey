import { ZustandRouteActorStateAdapter } from '@/application/adapters/zustand-route-actor-state-adapter'
import { GameService } from '@/application/services/GameService'
import { GamePhase, useGameStore } from '@/application/store/gameStore'
import { ExcaliburEngineFacade } from '@/infrastructure/engine/engine'
import { GameCanvasAndProvider } from '@/presentation/components/GameCanvasAndProvider'
import { createAppRouter } from '@/presentation/router/router'
import { SceneKey } from '@/shared/scene-key'
import { RouterProvider } from '@tanstack/react-router'
import { useCallback } from 'react'

const router = createAppRouter()

function App() {
  const setPhase = useGameStore((state) => state.setPhase)

  const createService = useCallback(
    async (canvas: HTMLCanvasElement): Promise<GameService> => {
      const facade = new ExcaliburEngineFacade(canvas, new ZustandRouteActorStateAdapter())
      const service = new GameService(facade)

      const startResult = await service.start()
      if (!startResult.ok) {
        console.error('Engine failed to start:', startResult.error)
        return service
      }

      await service.goToScene(SceneKey.OrangeOnBlack)

      setPhase(GamePhase.Menu)

      return service
    },
    [setPhase],
  )

  return (
    <GameCanvasAndProvider createService={createService}>
      <RouterProvider router={router} />
    </GameCanvasAndProvider>
  )
}

export default App

