import { useMenuNavigation } from '@/application/hooks/useMenuNavigation'
import { MenuButton } from '@/presentation/components/MenuButton'
import type { IGameService } from '@/shared/game-service'
import type { SceneKey } from '@/shared/scene-key'
import { useEffect } from 'react'

interface MenuViewIconSlot {
  icon: string
  event?: string
}

interface MenuViewItem {
  id: string
  label: string
  leadingIcons?: MenuViewIconSlot[]
  trailingIcons?: MenuViewIconSlot[]
  event?: string
  sceneKey?: SceneKey
  children?: MenuViewItem[]
}

interface MenuViewConfig {
  sceneKey: SceneKey
  items: MenuViewItem[]
}

interface MenuViewProps {
  config: MenuViewConfig
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
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4">
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
  )
}
