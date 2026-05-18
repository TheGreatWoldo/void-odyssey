import { describe, expect, it } from 'vitest'

import { JsonMenuRepository } from '@/infrastructure/menu/JsonMenuRepository'
import type { MenuConfig } from '@/shared/menu'
import { SceneKey } from '@/shared/scene-key'

describe('JsonMenuRepository', () => {

  it('returns typed config sections', async () => {
    const repo = new JsonMenuRepository()

    const title = await repo.getMenuSection('title')
    const items = await repo.getMenuSection('items')

    expect(typeof title).toBe('string')
    expect(Array.isArray(items)).toBe(true)
  })

  it('falls back to defaults when raw config is invalid', async () => {
    const fallback: MenuConfig = {
      sceneKey: SceneKey.OrangeOnBlack,
      title: 'Fallback Menu',
      items: [
        {
          id: 'play',
          label: 'Play',
          event: 'play:new-game',
        },
      ],
    }

    const repo = new JsonMenuRepository({
      rawConfig: { sceneKey: 'not-a-scene', title: 12, items: 'bad' },
      fallbackConfig: fallback,
    })

    const config = await repo.getMenuConfig()

    expect(config).toEqual(fallback)
  })

  it('uses cache by default and supports cache bypass', async () => {
    const repo = new JsonMenuRepository()

    const first = await repo.getMenuConfig()
    const second = await repo.getMenuConfig()
    const bypass = await repo.getMenuConfig({ useCache: false })

    expect(second).toBe(first)
    expect(bypass).toEqual(first)
  })

  it('invalidates cache on demand', async () => {
    const repo = new JsonMenuRepository()

    const first = await repo.getMenuConfig()
    repo.invalidateCache()
    const second = await repo.getMenuConfig()

    expect(second).toEqual(first)
  })

})
