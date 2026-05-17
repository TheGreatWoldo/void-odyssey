import { useUiScale } from '@/application/hooks/useUiScale'
import { GameContext } from '@/shared/game-context'
import type { IGameService } from '@/shared/game-service'
import { type ReactNode, useEffect, useRef, useState } from 'react'

const VIRTUAL_WIDTH = 1600
const VIRTUAL_HEIGHT = 900

interface GameCanvasAndProviderProps {
  createService: (canvas: HTMLCanvasElement) => Promise<IGameService>
  children: ReactNode
}

export function GameCanvasAndProvider({ createService, children }: GameCanvasAndProviderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [service, setService] = useState<IGameService | null>(null)
  const [engineError, setEngineError] = useState<string | null>(null)
  const scale = useUiScale()

  const canvasWidth = Math.round(VIRTUAL_WIDTH * scale)
  const canvasHeight = Math.round(VIRTUAL_HEIGHT * scale)

  useEffect(() => {
    if (!canvasRef.current) return

    let cancelled = false
    let svc: IGameService | null = null

    createService(canvasRef.current)
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
  }, [createService])

  if (engineError) {
    return (
      <div style={{ color: 'white', background: '#000', padding: '2rem', fontFamily: 'monospace' }}>
        <strong>Engine failed to start:</strong> {engineError}
      </div>
    )
  }

  return (
    <>
      {/* Full-viewport black background — covers letterbox areas outside the design space */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: 'black',
        }}
      />

      {/* Canvas sized exactly to the scaled design space — no CSS transform, so pointer events are never distorted */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: canvasWidth,
          height: canvasHeight,
          zIndex: 1,
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {service ? (
        <GameContext.Provider value={service}>
          {children}
        </GameContext.Provider>
      ) : (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2,
            background: 'black',
          }}
        />
      )}
    </>
  )
}

