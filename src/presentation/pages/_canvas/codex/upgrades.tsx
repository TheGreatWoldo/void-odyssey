import { useGameService } from '@/application/hooks/useGameService'
import { SceneKey } from '@/shared/scene-key'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'

function CodexUpgradesPage() {
  const service = useGameService()

  useEffect(() => {
    service.goToScene(SceneKey.GreenOnBlack).catch((err: unknown) => {
      console.error('goToScene failed:', err)
    })
  }, [service])

  return (
    <div className="pointer-events-none absolute inset-0 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <h1 className="flex-1 text-center text-[2.5rem] font-bold tracking-widest uppercase text-white/80">
          Upgrades
        </h1>
      </div>

      {/* Content */}
      <div className="pointer-events-auto flex-1 flex items-center justify-center">
        <p className="text-white/40 uppercase tracking-widest text-sm">
          No upgrade catalog available
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <Link
          to="/"
          search={{ menu: 'codex' }}
          className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
        >
          ← Back
        </Link>
      </div>

    </div>
  )
}

export const Route = createFileRoute('/_canvas/codex/upgrades')({
  component: CodexUpgradesPage,
})
