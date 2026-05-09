import { GameProvider } from '@/application/components/GameProvider'
import { useSetPhase } from '@/application/hooks/useSetPhase'
import { GameService } from '@/application/services/GameService'
import { useEffect, useRef, useState } from 'react'

interface AppProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => Promise<GameService>
}

function App({ onCanvasReady }: AppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const setPhase = useSetPhase()
  const [service, setService] = useState<GameService | null>(null)
  const [engineError, setEngineError] = useState<string | null>(null)

  // onCanvasReady must be stable (defined outside any component). If it is
  // ever moved inside a component, wrap it with useCallback to prevent the
  // effect from re-running and creating a second engine instance.
  useEffect(() => {
    if (!canvasRef.current) return

    let cancelled = false
    let svc: GameService | null = null

    onCanvasReady(canvasRef.current)
      .then((s) => {
        if (cancelled) {
          s.dispose()
          return
        }
        svc = s
        setService(s)
        setPhase('menu')
      })
      .catch((err: unknown) => {
        console.error('Engine failed to start:', err)
        setEngineError(err instanceof Error ? err.message : 'Engine failed to start')
      })

    return () => {
      cancelled = true
      svc?.dispose()
    }
  }, [onCanvasReady, setPhase])

  if (engineError) {
    return (
      <div style={{ color: 'white', background: '#000', padding: '2rem', fontFamily: 'monospace' }}>
        <strong>Engine failed to start:</strong> {engineError}
      </div>
    )
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      {service && (
        <GameProvider service={service}>
          {null}
        </GameProvider>
      )}
    </>
  )
}

export default App

