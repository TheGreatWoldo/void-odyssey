import type { IMenuRepository } from '@/domain/repositories/IMenuRepository'
import type { MenuConfig } from '@/shared/menu'
import menuConfigJson from './menu-config.json'

export class JsonMenuRepository implements IMenuRepository {
  getMenuConfig(): Promise<MenuConfig> {
    return Promise.resolve(menuConfigJson as MenuConfig)
  }
}
