import { RootLayout } from '@/presentation/components/RootLayout'
import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
})
