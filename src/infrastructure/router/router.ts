import type { RouterContext } from '@/presentation/pages/__root'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
  })
}

export type AppRouter = ReturnType<typeof createAppRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
