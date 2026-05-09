import { initI18n } from '@/infrastructure/lib/i18n'
import '@/presentation/styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

try {
  await initI18n()
} catch (err) {
  console.error('i18n failed to initialize, continuing with defaults:', err)
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
