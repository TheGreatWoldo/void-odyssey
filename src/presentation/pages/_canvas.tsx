import { useMenuConfig } from '@/application/hooks/useMenuConfig'
import GameCanvas from '@/presentation/components/GameCanvas'
import { GameProvider } from '@/presentation/components/GameProvider'
import { createFileRoute, Outlet } from '@tanstack/react-router'

function CanvasLayout() {
  const menuConfig = useMenuConfig()

  if (!menuConfig) return null

  return (
    <GameCanvas sceneKey={menuConfig.sceneKey}>
      {(service) => (
        <GameProvider service={service}>
          <Outlet />
        </GameProvider>
      )}
    </GameCanvas>
  )
}

export const Route = createFileRoute('/_canvas')({
  component: CanvasLayout,
})
