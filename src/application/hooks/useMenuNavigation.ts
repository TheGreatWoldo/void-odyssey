import type { MenuConfig, MenuItem } from '@/shared/menu'
import type { SceneKey } from '@/shared/scene-key'
import { useCallback, useState } from 'react'

interface MenuFrame {
  items: MenuItem[]
  sceneKey: SceneKey
  title: string | null
}

export interface MenuNavigation {
  /** Items to display at the current level */
  currentItems: MenuItem[]
  /** Background scene for the current level */
  currentSceneKey: SceneKey
  /** Label of the parent item, or null at the root */
  currentTitle: string | null
  /** Whether the user can go back (depth > 0) */
  canGoBack: boolean
  /** Navigate into a submenu item's children */
  pushItem(item: MenuItem): void
  /** Go back one level */
  pop(): void
}

export function useMenuNavigation(config: MenuConfig): MenuNavigation {
  const [stack, setStack] = useState<MenuFrame[]>([
    { items: config.items, sceneKey: config.sceneKey, title: config.title },
  ])

  const current = stack[stack.length - 1]

  const pushItem = useCallback((item: MenuItem) => {
    if (!item.children?.length || !item.sceneKey) return
    setStack((prev) => [
      ...prev,
      { items: item.children!, sceneKey: item.sceneKey!, title: item.label },
    ])
  }, [])

  const pop = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  return {
    currentItems: current.items,
    currentSceneKey: current.sceneKey,
    currentTitle: current.title,
    canGoBack: stack.length > 1,
    pushItem,
    pop,
  }
}
