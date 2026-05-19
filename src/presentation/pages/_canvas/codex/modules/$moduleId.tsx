import { getModuleMeta, isValidModuleId } from '@/application/hooks/module-catalog'
import { useGameService } from '@/application/hooks/useGameService'
import { MENU_ANIMATIONS_ENABLED, MENU_EXIT_BUFFER_MS, MENU_ITEM_DURATION_MS, MENU_ITEM_STAGGER_MS } from '@/shared/menu-animation'
import { SceneKey } from '@/shared/scene-key'
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { MODULE_ICON_BY_ID, resolveModuleIcon } from './module-icons'

const EXIT_STAGGER_MS = MENU_ITEM_STAGGER_MS
const EXIT_DURATION_MS = MENU_ITEM_DURATION_MS

function CodexModuleDetailPage() {
  const service = useGameService()
  const navigate = useNavigate()
  const { moduleId } = Route.useParams()
  const [exiting, setExiting] = useState(false)

  const meta = getModuleMeta(moduleId)!
  const Icon = resolveModuleIcon(MODULE_ICON_BY_ID[moduleId])

  useEffect(() => {
    service.goToScene(SceneKey.GreenOnBlack).catch((err: unknown) => {
      console.error('goToScene failed:', err)
    })
  }, [service])

  const navigateWithExit = (action: () => void) => {
    if (exiting) return
    if (!MENU_ANIMATIONS_ENABLED) { action(); return }
    setExiting(true)
    const totalDelay = (2 * EXIT_STAGGER_MS) + EXIT_DURATION_MS + MENU_EXIT_BUFFER_MS
    setTimeout(action, totalDelay)
  }

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault()
    navigateWithExit(() => {
      navigate({ to: '/codex/modules' }).catch(() => {})
    })
  }

  return (
    <div className="pointer-events-none absolute inset-0 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <h1 className="text-center text-[2.5rem] font-bold tracking-widest uppercase text-white/80">
          Module details
        </h1>
      </div>

      {/* Content */}
      <div className="pointer-events-auto flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-2xl flex flex-col gap-6">

          {/* Description */}
          <div
            className="border border-white/20 bg-black/90 px-6 py-5"
            style={{
              animation: !MENU_ANIMATIONS_ENABLED ? undefined : exiting
                ? `fade-out-down ${EXIT_DURATION_MS}ms ease ${EXIT_STAGGER_MS}ms both`
                : `fade-in-up ${MENU_ITEM_DURATION_MS}ms ease ${MENU_ITEM_STAGGER_MS}ms both`,
            }}
          >
            <div className="mb-4 flex items-center gap-3">
              {Icon ? <Icon className="size-7 shrink-0 text-white/80" /> : null}
              <h2 className="text-white/90 text-2xl uppercase tracking-wider">{meta.displayName}</h2>
            </div>
            <p className="text-white/70 text-base leading-relaxed tracking-wide">
              {meta.description}
            </p>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-4"
            style={{
              animation: !MENU_ANIMATIONS_ENABLED ? undefined : exiting
                ? `fade-out-down ${EXIT_DURATION_MS}ms ease 0ms both`
                : `fade-in-up ${MENU_ITEM_DURATION_MS}ms ease 0ms both`,
            }}
          >
            <div className="border border-white/20 bg-black/90 px-5 py-4 flex flex-col gap-1">
              <span className="text-white/40 text-xs uppercase tracking-widest">Category</span>
              <span className="text-white/90 text-base uppercase tracking-wider">{meta.category}</span>
            </div>

            <div className="border border-white/20 bg-black/90 px-5 py-4 flex flex-col gap-1">
              <span className="text-white/40 text-xs uppercase tracking-widest">Primary Output</span>
              <span className="text-white/90 text-base uppercase tracking-wider">{meta.primaryOutput}</span>
            </div>

            <div className="border border-white/20 bg-black/90 px-5 py-4 flex flex-col gap-1">
              <span className="text-white/40 text-xs uppercase tracking-widest">Slot Cost</span>
              <span className="text-white/90 text-base uppercase tracking-wider">{meta.slotCost}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <a
          href="/codex/modules"
          onClick={handleBack}
          className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
        >
          ← Back
        </a>
      </div>

    </div>
  )
}

export const Route = createFileRoute('/_canvas/codex/modules/$moduleId')({
  component: CodexModuleDetailPage,
  beforeLoad: ({ params }) => {
    if (!isValidModuleId(params.moduleId)) throw notFound()
  },
})
