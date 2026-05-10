import { useMenuConfig } from '@/application/hooks/useMenuConfig'
import { useGameStore } from '@/application/store/gameStore'
import GameCanvas from '@/presentation/components/GameCanvas'
import { MenuView } from '@/presentation/components/MenuView'
import type { GameFont } from '@/shared/font'
import { createFileRoute } from '@tanstack/react-router'

function handleMenuEvent(event: string) {
  if (event.startsWith('settings:font:')) {
    const font = event.slice('settings:font:'.length) as GameFont
    useGameStore.getState().setFont(font)
    return
  }
  console.log('[menu event]', event)
}

function IndexPage() {
  const menuConfig = useMenuConfig()
  if (!menuConfig) return null
  return (
    <GameCanvas sceneKey={menuConfig.sceneKey}>
      {(service) => (
        <MenuView
          config={menuConfig}
          service={service}
          onEvent={handleMenuEvent}
        />
      )}
    </GameCanvas>
  )
}

export const Route = createFileRoute('/')({
  component: IndexPage,
})
