import { useGameStore } from '@/application/store/gameStore'
import { useEffect, useRef } from 'react'

interface AppProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => Promise<void>
}

function App({ onCanvasReady }: AppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const setPhase = useGameStore((s) => s.setPhase)

  useEffect(() => {
    if (!canvasRef.current) return

    onCanvasReady(canvasRef.current)
      .then(() => setPhase('menu'))
      .catch((err) => console.error('Engine failed to start:', err))
  }, [onCanvasReady, setPhase])

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
}

export default App

