import { GameService } from '@/application/services/GameService'
import { useGameStore } from '@/application/store/gameStore'
import { ExcaliburEngineFacade } from '@/infrastructure/engine/engine'
import { createAppRouter } from '@/infrastructure/router/router'
import { FONT_FAMILIES } from '@/shared/font'
import { RouterProvider } from '@tanstack/react-router'
import { useEffect } from 'react'

async function onCanvasReady(canvas: HTMLCanvasElement): Promise<GameService> {
  const facade = new ExcaliburEngineFacade(canvas)
  const service = new GameService(facade)
  await service.start()
  return service
}

const router = createAppRouter({ onCanvasReady })

function App() {
  const font = useGameStore((state) => state.font)

  useEffect(() => {
    document.documentElement.style.fontFamily = FONT_FAMILIES[font]
  }, [font])

  return <RouterProvider router={router} />
}

export default App

