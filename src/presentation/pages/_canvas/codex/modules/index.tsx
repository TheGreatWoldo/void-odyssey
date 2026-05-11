import { useGameService } from '@/application/hooks/useGameService'
import { ModuleCatalog } from '@/domain/models/module/module-catalog'
import { ModuleId } from '@/domain/models/module/production-module-id'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'

const MODULE_ENTRIES = (Object.values(ModuleId) as ModuleId[]).sort((a, b) =>
  ModuleCatalog[a].displayName.localeCompare(ModuleCatalog[b].displayName),
)

function CodexModulesPage() {
  const service = useGameService()

  useEffect(() => {
    service.goToScene('greenOnBlack').catch((err: unknown) => {
      console.error('goToScene failed:', err)
    })
  }, [service])

  return (
    <div className="pointer-events-none absolute inset-0 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <div className="w-32">
          <Link
            to="/"
            search={{ menu: 'codex' }}
            className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-sm -m-3 p-3"
          >
            ← Back
          </Link>
        </div>

        <h1 className="flex-1 text-center text-[2.5rem] font-bold tracking-widest uppercase text-white/80">
          Modules
        </h1>

        <div className="w-32" />
      </div>

      {/* Content */}
      <div className="pointer-events-auto flex-1 flex items-center justify-center overflow-y-auto px-8 py-8">
        <div className="w-full max-w-5xl grid grid-cols-3 gap-4">
          {MODULE_ENTRIES.map((id) => (
            <Link
              key={id}
              to="/codex/modules/$moduleId"
              params={{ moduleId: id }}
              className="pointer-events-auto flex items-center border border-white/20 bg-black/90 px-5 py-4 uppercase tracking-wider transition-colors hover:border-white/40 hover:text-white cursor-pointer"
            >
              <span className="text-white/90 text-base">{ModuleCatalog[id].displayName}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <span className="text-[2.5rem]">&nbsp;</span>
      </div>

    </div>
  )
}

export const Route = createFileRoute('/_canvas/codex/modules/')({
  component: CodexModulesPage,
})
