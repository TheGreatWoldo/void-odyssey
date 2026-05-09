import { useSetPhase } from '@/application/hooks/useSetPhase'
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
  const setPhase = useSetPhase()
  const [service, setService] = useState<IGameService | null>(null)
  const [engineError, setEngineError] = useState<string | null>(null)

  // onCanvasReady must be stable (defined outside any component). If it is
  // ever moved inside a component, wrap it with useCallback to prevent the
  // effect from re-running and creating a second engine instance.
  useEffect(() => {
    if (!canvasRef.current) return

    let cancelled = false
    let svc: IGameService | null = null

    onCanvasReady(canvasRef.current)
      .then(async (s) => {
        if (cancelled) {
          s.dispose()
          return
        }
        await s.goToScene(sceneKey)
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
      <canvas ref={canvasRef} className="block w-full h-full" />
      {service && children?.(service)}
    </>
  )
}

export default GameCanvas
