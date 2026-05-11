import { useStartEngine } from '@/application/hooks/useStartEngine'
import type { IGameService } from '@/shared/game-service'
import type { SceneKey } from '@/shared/scene-key'
import { useRouteContext } from '@tanstack/react-router'
import { type ReactNode, useEffect, useRef, useState } from 'react'

interface GameCanvasProps {
  sceneKey: SceneKey
  children?: (service: IGameService) => ReactNode
}

function GameCanvas({ sceneKey, children }: GameCanvasProps) {
  const { onCanvasReady } = useRouteContext({ from: '__root__' })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [service, setService] = useState<IGameService | null>(null)
  const [engineError, setEngineError] = useState<string | null>(null)
  const startEngine = useStartEngine(onCanvasReady)

  // onCanvasReady must be stable (defined outside any component). If it is
  // ever moved inside a component, wrap it with useCallback to prevent the
  // effect from re-running and creating a second engine instance.
  useEffect(() => {
    if (!canvasRef.current) return

    let cancelled = false
    let svc: IGameService | null = null

    // sceneKey is intentionally omitted from deps — the engine is started once.
    // Scene navigation after startup is handled by MenuView via service.goToScene().
    startEngine(canvasRef.current, sceneKey)
      .then((s) => {
        if (cancelled) {
          s.dispose()
          return
        }
        svc = s
        setService(s)
      })
      .catch((err: unknown) => {
        console.error('Engine failed to start:', err)
        setEngineError(err instanceof Error ? err.message : 'Engine failed to start')
      })

    return () => {
      cancelled = true
      svc?.dispose()
    }
  }, [startEngine]) // eslint-disable-line react-hooks/exhaustive-deps

  if (engineError) {
    return (
      <div style={{ color: 'white', background: '#000', padding: '2rem', fontFamily: 'monospace' }}>
        <strong>Engine failed to start:</strong> {engineError}
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {service && children?.(service)}
    </div>
  )
}

export default GameCanvas
