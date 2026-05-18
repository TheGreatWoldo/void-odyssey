import { useGameService } from '@/application/hooks/useGameService'
import { useMenuConfig } from '@/application/hooks/useMenuConfig'
import { useRouteNavigationActions } from '@/application/hooks/useRouteNavigation'
import { MenuView } from '@/presentation/components/MenuView'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

const CODEX_ROUTES: Partial<Record<string, '/codex/modules' | '/codex/upgrades' | '/edit/ships' | '/play/select-ship'>> = {
  'play:new-game':  '/play/select-ship',
  'play:start-from-seed': '/play/select-ship',
  'codex:modules':  '/codex/modules',
  'codex:upgrades': '/codex/upgrades',
  'edit:ships':     '/edit/ships',
}

function createNewGameSeed(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`
}

function IndexPage() {
  const menuConfig = useMenuConfig()
  const service = useGameService()
  const navigate = useNavigate()
  const { resetRouteRerolls, setRouteSeed } = useRouteNavigationActions()
  const { menu } = Route.useSearch()

  function handleMenuChange(menuId: string | undefined) {
    navigate({ to: '/', search: { menu: menuId ?? undefined } }).catch((err: unknown) => {
      console.error('[nav]', err)
    })
  }

  function handleMenuEvent(event: string) {
    if (event === 'play:new-game') {
      resetRouteRerolls()
      setRouteSeed(createNewGameSeed())
    }

    if (event === 'play:start-from-seed') {
      const enteredSeed = window.prompt('Enter seed')

      if (enteredSeed === null) {
        return
      }

      const normalizedSeed = enteredSeed.trim()

      if (!normalizedSeed) {
        return
      }

      resetRouteRerolls()
      setRouteSeed(normalizedSeed)
    }

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
