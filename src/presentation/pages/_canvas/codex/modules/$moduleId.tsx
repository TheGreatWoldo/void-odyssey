import { useGameService } from '@/application/hooks/useGameService'
import { ModuleCatalog } from '@/domain/models/module/module-catalog'
import { ModuleId, ModuleSlotCosts } from '@/domain/models/module/production-module-id'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useEffect } from 'react'

function CodexModuleDetailPage() {
  const service = useGameService()
  const { moduleId } = Route.useParams()

  const meta = ModuleCatalog[moduleId as ModuleId]

  useEffect(() => {
    service.goToScene('greenOnBlack').catch((err: unknown) => {
      console.error('goToScene failed:', err)
    })
  }, [service])

  return (
    <div className="pointer-events-none absolute inset-0 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <h1 className="flex-1 text-center text-[2.5rem] font-bold tracking-widest uppercase text-white/80">
          {meta.displayName}
        </h1>
      </div>

      {/* Content */}
      <div className="pointer-events-auto flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-2xl flex flex-col gap-6">

          {/* Description */}
          <div className="border border-white/20 bg-black/90 px-6 py-5">
            <p className="text-white/70 text-base leading-relaxed tracking-wide">
              {meta.description}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-white/20 bg-black/90 px-5 py-4 flex flex-col gap-1">
              <span className="text-white/40 text-xs uppercase tracking-widest">Category</span>
              <span className="text-white/90 text-base uppercase tracking-wider">{meta.category}</span>
            </div>

            <div className="border border-white/20 bg-black/90 px-5 py-4 flex flex-col gap-1">
              <span className="text-white/40 text-xs uppercase tracking-widest">Slot Cost</span>
              <span className="text-white/90 text-base uppercase tracking-wider">{ModuleSlotCosts[moduleId as ModuleId]}</span>
            </div>

            <div className="border border-white/20 bg-black/90 px-5 py-4 flex flex-col gap-1 col-span-2">
              <span className="text-white/40 text-xs uppercase tracking-widest">Primary Output</span>
              <span className="text-white/90 text-base uppercase tracking-wider">{meta.primaryOutput}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <Link
          to="/codex/modules"
          className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
        >
          ← Back
        </Link>
      </div>

    </div>
  )
}

export const Route = createFileRoute('/_canvas/codex/modules/$moduleId')({
  component: CodexModuleDetailPage,
  beforeLoad: ({ params }) => {
    const valid = Object.values(ModuleId) as string[]
    if (!valid.includes(params.moduleId)) throw notFound()
  },
})
