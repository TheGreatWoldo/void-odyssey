import { useGameService } from '@/application/hooks/useGameService'
import { useMenuConfig } from '@/application/hooks/useMenuConfig'
import { MenuView } from '@/presentation/components/MenuView'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

const CODEX_ROUTES: Partial<Record<string, '/codex/modules' | '/codex/upgrades' | '/edit/ships'>> = {
  'codex:modules':  '/codex/modules',
  'codex:upgrades': '/codex/upgrades',
  'edit:ships': '/edit/ships',
}

function IndexPage() {
  const menuConfig = useMenuConfig()
  const service = useGameService()
  const navigate = useNavigate()
  const { menu } = Route.useSearch()

  function handleMenuChange(menuId: string | undefined) {
    navigate({ to: '/', search: { menu: menuId ?? undefined } }).catch((err: unknown) => {
      console.error('[nav]', err)
    })
  }

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
      onMenuChange={handleMenuChange}
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
