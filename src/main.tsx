import { GameService } from '@/application/services/GameService'
import { ExcaliburEngineFacade } from '@/infrastructure/engine/engine'
import { initI18n } from '@/infrastructure/lib/i18n'
import { createAppRouter } from '@/infrastructure/router/router'
import '@/presentation/styles/global.css'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

try {
  await initI18n()
} catch (err) {
  console.error('i18n failed to initialize, continuing with defaults:', err)
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

async function onCanvasReady(canvas: HTMLCanvasElement): Promise<GameService> {
  const facade = new ExcaliburEngineFacade(canvas)
  const service = new GameService(facade)
  await service.start()
  return service
}

const router = createAppRouter({ onCanvasReady })

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
