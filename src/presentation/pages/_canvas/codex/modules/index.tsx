import { useGameService } from '@/application/hooks/useGameService'
import { MODULE_ENTRIES } from '@/application/hooks/useModuleCatalog'
import { ModuleSlotGrid } from '@/presentation/components/ui/ModuleSlotGrid'
import { MENU_ANIMATIONS_ENABLED, MENU_EXIT_BUFFER_MS, MENU_ITEM_DURATION_MS, MENU_ITEM_STAGGER_MS } from '@/shared/menu-animation'
import { SceneKey } from '@/shared/scene-key'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

const EXIT_STAGGER_MS = MENU_ITEM_STAGGER_MS
const EXIT_DURATION_MS = MENU_ITEM_DURATION_MS

function CodexModulesPage() {
  const service = useGameService()
  const navigate = useNavigate()
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    service.goToScene(SceneKey.GreenOnBlack).catch((err: unknown) => {
      console.error('goToScene failed:', err)
    })
  }, [service])

  const navigateWithExit = (action: () => void) => {
    if (exiting) return
    if (!MENU_ANIMATIONS_ENABLED) { action(); return }
    setExiting(true)
    const totalDelay = (MODULE_ENTRIES.length - 1) * EXIT_STAGGER_MS + EXIT_DURATION_MS + MENU_EXIT_BUFFER_MS
    setTimeout(action, totalDelay)
  }

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault()
    navigateWithExit(() => {
      navigate({ to: '/', search: { menu: 'codex' } }).catch(() => {})
    })
  }

  return (
    <div className="pointer-events-none absolute inset-0 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <h1 className="flex-1 text-center text-[2.5rem] font-bold tracking-widest uppercase text-white/80">
          Modules
        </h1>
      </div>

      {/* Content */}
      <div className="pointer-events-auto flex-1 flex items-center justify-center overflow-y-auto px-8 py-8">
        <div className="w-full max-w-5xl grid grid-cols-3 gap-4">
          {MODULE_ENTRIES.map((entry, i) => {
            const reverseIndex = MODULE_ENTRIES.length - 1 - i
            return (
            <Link
              key={entry.id}
              to="/codex/modules/$moduleId"
              params={{ moduleId: entry.id }}
              className="pointer-events-auto flex flex-col border border-white/20 bg-black/90 px-5 py-4 uppercase tracking-wider transition-colors hover:border-white/40 hover:text-white cursor-pointer"
              style={{
                animation: !MENU_ANIMATIONS_ENABLED ? undefined : exiting
                  ? `fade-out-down ${EXIT_DURATION_MS}ms ease ${reverseIndex * EXIT_STAGGER_MS}ms both`
                  : `fade-in-up ${MENU_ITEM_DURATION_MS}ms ease ${reverseIndex * MENU_ITEM_STAGGER_MS}ms both`,
              }}
              onClick={(e) => {
                e.preventDefault()
                navigateWithExit(() => {
                  navigate({ to: '/codex/modules/$moduleId', params: { moduleId: entry.id } }).catch(() => {})
                })
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-white/90 text-xl">{entry.displayName}</span>
                <ModuleSlotGrid filled={entry.slotCost} />
              </div>
              <span className="text-white/30 text-xs mt-1">{entry.category}</span>
            </Link>
          )})}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <a
          href="/"
          onClick={handleBack}
          className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
        >
          ← Back
        </a>
      </div>

    </div>
  )
}

export const Route = createFileRoute('/_canvas/codex/modules/')({
  component: CodexModulesPage,
})
