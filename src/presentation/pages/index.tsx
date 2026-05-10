import { useMenuConfig } from '@/application/hooks/useMenuConfig'
import GameCanvas from '@/presentation/components/GameCanvas'
import { MenuView } from '@/presentation/components/MenuView'
import { createFileRoute } from '@tanstack/react-router'

function handleMenuEvent(event: string) {
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
