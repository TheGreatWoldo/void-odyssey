import { useMenuNavigation } from '@/application/hooks/useMenuNavigation'
import type { MenuConfig } from '@/domain/models/menu/menu'
import { MenuButton } from '@/presentation/components/MenuButton'
import type { IGameService } from '@/shared/game-service'
import { useEffect } from 'react'

interface MenuViewProps {
  config: MenuConfig
  service: IGameService
  onEvent: (event: string) => void
}

export function MenuView({ config, service, onEvent }: MenuViewProps) {
  const nav = useMenuNavigation(config)

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
        <div className="pointer-events-none flex items-center justify-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
          <h2 className="text-[2.5rem] font-bold tracking-widest text-white/80 uppercase">
            {nav.currentTitle}
          </h2>
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

        {/* Back button — same style as menu buttons, at the bottom */}
        {nav.canGoBack && (
          <MenuButton
            label="Back"
            leadingIcons={[{ icon: 'ChevronLeft' }]}
            onClick={nav.pop}
          />
        )}
      </div>
      </div>

      {/* Bottom bar — same height as top bar */}
      <div className="pointer-events-none flex items-center justify-center border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <span className="text-[2.5rem]">&nbsp;</span>
      </div>
    </div>
  )
}
