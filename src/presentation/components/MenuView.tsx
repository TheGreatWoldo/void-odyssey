import { useMenuNavigation } from '@/application/hooks/useMenuNavigation'
import { MenuButton } from '@/presentation/components/MenuButton'
import type { IGameService } from '@/shared/game-service'
import type { MenuConfig } from '@/shared/menu'
import { MENU_ANIMATIONS_ENABLED, MENU_EXIT_BUFFER_MS, MENU_ITEM_DURATION_MS, MENU_ITEM_STAGGER_MS } from '@/shared/menu-animation'
import { useEffect, useRef, useState } from 'react'

interface MenuViewProps {
  config: MenuConfig
  service: IGameService
  onEvent: (event: string) => void
  initialMenuId?: string
  onMenuChange?: (menuId: string | undefined) => void
}

export function MenuView({ config, service, onEvent, initialMenuId, onMenuChange }: MenuViewProps) {
  const nav = useMenuNavigation(config, initialMenuId)

  // Increment animKey each time the item list changes so animations re-fire.
  const [animKey, setAnimKey] = useState(0)
  const prevItemsRef = useRef(nav.currentItems)
  useEffect(() => {
    if (nav.currentItems !== prevItemsRef.current) {
      prevItemsRef.current = nav.currentItems
      setAnimKey((k) => k + 1)
      setExiting(false)
    }
  }, [nav.currentItems])

  // Deferred navigation: play exit stagger then commit.
  const [exiting, setExiting] = useState(false)
  const pendingNavRef = useRef<(() => void) | null>(null)

  const navigateWithExit = (action: () => void) => {
    if (exiting) return
    if (!MENU_ANIMATIONS_ENABLED) { action(); return }
    const count = nav.currentItems.length
    const totalDelay = (count - 1) * MENU_ITEM_STAGGER_MS + MENU_ITEM_DURATION_MS + MENU_EXIT_BUFFER_MS
    pendingNavRef.current = action
    setExiting(true)
    setTimeout(() => {
      pendingNavRef.current?.()
      pendingNavRef.current = null
    }, totalDelay)
  }

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
          <h2 className="flex-1 text-center text-[2.5rem] font-bold tracking-widest text-white/80 uppercase">
            {nav.currentTitle}
          </h2>
        </div>
      )}

      {/* Centered menu items */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
      {/* Menu items */}
      <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-3">
        {nav.currentItems.map((item, i) => (
          <div
            key={`${animKey}-${item.id}`}
            style={{
              animation: exiting
                ? `fade-out-down ${MENU_ITEM_DURATION_MS}ms ease ${i * MENU_ITEM_STAGGER_MS}ms both`
                : `fade-in-up ${MENU_ITEM_DURATION_MS}ms ease ${i * MENU_ITEM_STAGGER_MS}ms both`,
            }}
          >
            <MenuButton
              label={item.label}
              leadingIcons={item.leadingIcons}
              trailingIcons={item.trailingIcons}
              onClick={() => {
                if (item.children?.length) {
                  navigateWithExit(() => { nav.pushItem(item); onMenuChange?.(item.id) })
                } else if (item.event) {
                  navigateWithExit(() => onEvent(item.event!))
                }
              }}
              onIconClick={onEvent}
            />
          </div>
        ))}


      </div>
      </div>

      {/* Bottom bar — same height as top bar */}
      <div className="pointer-events-none flex items-center justify-center border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        {nav.canGoBack ? (
          <button
            onClick={() => navigateWithExit(() => { nav.pop(); onMenuChange?.(undefined) })}
            className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
          >
            ← Back
          </button>
        ) : (
          <span className="text-xl">&nbsp;</span>
        )}
      </div>
    </div>
  )
}
