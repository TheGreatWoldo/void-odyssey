import '@/presentation/styles/global.css'
import { initEngine, startEngine } from '@/infrastructure/engine/engine'
import { initI18n } from '@/infrastructure/lib/i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

await initI18n()

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

async function onCanvasReady(canvas: HTMLCanvasElement): Promise<void> {
  initEngine(canvas)
  await startEngine()
}

createRoot(root).render(
  <StrictMode>
    <App onCanvasReady={onCanvasReady} />
  </StrictMode>,
)
