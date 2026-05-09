import { useEffect, useRef } from 'react'
import { initI18n } from '@/infrastructure/lib/i18n'
import { initEngine, startEngine } from '@/infrastructure/engine/engine'
import { useGameStore } from '@/application/store/gameStore'

await initI18n()

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const setPhase = useGameStore((s) => s.setPhase)

  useEffect(() => {
    if (!canvasRef.current) return

    const engine = initEngine(canvasRef.current)

    startEngine().then(() => {
      setPhase('menu')
    })

    return () => {
      engine.stop()
    }
  }, [setPhase])

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
}

export default App

