import { useGameStore } from '@/application/store/gameStore'
import { loadMenuConfig } from '@/application/useCases/LoadMenuConfigUseCase'
import { initI18n } from '@/infrastructure/lib/i18n'
import { JsonMenuRepository } from '@/infrastructure/menu/JsonMenuRepository'
import '@/presentation/styles/global.css'
import '@fontsource/audiowide'
import '@fontsource/exo-2'
import '@fontsource/orbitron'
import '@fontsource/oxanium'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

try {
  await initI18n()
} catch (err) {
  console.error('i18n failed to initialize, continuing with defaults:', err)
}

try {
  const config = await loadMenuConfig(new JsonMenuRepository())
  useGameStore.getState().setMenuConfig(config)
} catch (err) {
  console.error('Failed to load menu config:', err)
  throw err
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
