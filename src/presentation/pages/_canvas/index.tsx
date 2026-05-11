import { useGameService } from '@/application/hooks/useGameService'
import { useMenuConfig } from '@/application/hooks/useMenuConfig'
import { MenuView } from '@/presentation/components/MenuView'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

const CODEX_ROUTES: Partial<Record<string, '/codex/modules' | '/codex/upgrades'>> = {
  'codex:modules':  '/codex/modules',
  'codex:upgrades': '/codex/upgrades',
}

function IndexPage() {
  const menuConfig = useMenuConfig()
  const service = useGameService()
  const navigate = useNavigate()
  const { menu } = Route.useSearch()

  function handleMenuEvent(event: string) {
    const route = CODEX_ROUTES[event]
    if (route) {
      navigate({ to: route }).catch((err: unknown) => {
        console.error('[nav]', err)
      })
      return
    }
    console.log('[menu event]', event)
  }

  if (!menuConfig) return null

  return (
    <MenuView
      config={menuConfig}
      service={service}
      onEvent={handleMenuEvent}
      initialMenuId={menu}
    />
  )
}

export const Route = createFileRoute('/_canvas/')({
  component: IndexPage,
  validateSearch: (search: Record<string, unknown>) => ({
    menu: typeof search.menu === 'string' ? search.menu : undefined,
  }),
})
