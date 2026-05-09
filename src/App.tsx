import { GameService } from '@/application/services/GameService'
import { useGameStore } from '@/application/store/gameStore'
import { ExcaliburEngineFacade } from '@/infrastructure/engine/engine'
import { JsonMenuRepository } from '@/infrastructure/menu/JsonMenuRepository'
import { createAppRouter } from '@/infrastructure/router/router'
import { RouterProvider } from '@tanstack/react-router'

useGameStore.getState().setMenuConfig(new JsonMenuRepository().getMenuConfig())

async function onCanvasReady(canvas: HTMLCanvasElement): Promise<GameService> {
  const facade = new ExcaliburEngineFacade(canvas)
  const service = new GameService(facade)
  await service.start()
  return service
}

const router = createAppRouter({ onCanvasReady })

function App() {
  return <RouterProvider router={router} />
}

export default App

