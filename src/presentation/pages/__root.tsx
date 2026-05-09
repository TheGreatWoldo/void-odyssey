import type { RouterContext } from '@/shared/router-context'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
})
