import { GameService } from '@/application/services/GameService'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

export interface RouterContext {
  onCanvasReady: (canvas: HTMLCanvasElement) => Promise<GameService>
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
})
