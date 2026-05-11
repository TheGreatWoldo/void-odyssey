import { useMenuNavigation } from '@/application/hooks/useMenuNavigation'
import { MenuButton } from '@/presentation/components/MenuButton'
import type { IGameService } from '@/shared/game-service'
import type { MenuConfig } from '@/shared/menu'
import { useEffect } from 'react'

interface MenuViewProps {
  config: MenuConfig
  service: IGameService
  onEvent: (event: string) => void
  initialMenuId?: string
}

export function MenuView({ config, service, onEvent, initialMenuId }: MenuViewProps) {
  const nav = useMenuNavigation(config, initialMenuId)

  // Switch background scene when the level changes.
  useEffect(() => {
    service.goToScene(nav.currentSceneKey).catch((err: unknown) => {
      console.error('goToScene failed:', err)
    })
  }, [service, nav.currentSceneKey])

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      {/* Top title bar */}
      {nav.currentTitle && (
        <div className="pointer-events-none flex items-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
          <div className="w-32">
            {nav.canGoBack && (
              <button
                onClick={nav.pop}
                className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-sm -m-3 p-3"
              >
                ← Back
              </button>
            )}
          </div>

          <h2 className="flex-1 text-center text-[2.5rem] font-bold tracking-widest text-white/80 uppercase">
            {nav.currentTitle}
          </h2>

          <div className="w-32" />
        </div>
      )}

      {/* Centered menu items */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
      {/* Menu items */}
      <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-3">
        {nav.currentItems.map((item) => (
          <MenuButton
            key={item.id}
            label={item.label}
            leadingIcons={item.leadingIcons}
            trailingIcons={item.trailingIcons}
            onClick={() => {
              if (item.children?.length) {
                nav.pushItem(item)
              } else if (item.event) {
                onEvent(item.event)
              }
            }}
            onIconClick={onEvent}
          />
        ))}


      </div>
      </div>

      {/* Bottom bar — same height as top bar */}
      <div className="pointer-events-none flex items-center justify-center border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <span className="text-[2.5rem]">&nbsp;</span>
      </div>
    </div>
  )
}
