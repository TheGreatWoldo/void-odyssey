import { GameService } from '@/application/services/GameService'
import { ExcaliburEngineFacade } from '@/infrastructure/engine/engine'
import { initI18n } from '@/infrastructure/lib/i18n'
import '@/presentation/styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

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

createRoot(root).render(
  <StrictMode>
    <App onCanvasReady={onCanvasReady} />
  </StrictMode>,
)
