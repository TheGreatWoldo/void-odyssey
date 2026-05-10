import { GameService } from '@/application/services/GameService'
import { ExcaliburEngineFacade } from '@/infrastructure/engine/engine'
import { createAppRouter } from '@/infrastructure/router/router'
import { RouterProvider } from '@tanstack/react-router'

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

