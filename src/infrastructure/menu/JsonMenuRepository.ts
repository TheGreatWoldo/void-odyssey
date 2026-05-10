import type { MenuConfig } from '@/domain/models/menu/menu'
import type { IMenuRepository } from '@/domain/repositories/IMenuRepository'
import menuConfigJson from './menu-config.json'

export class JsonMenuRepository implements IMenuRepository {
  getMenuConfig(): Promise<MenuConfig> {
    return Promise.resolve(menuConfigJson as MenuConfig)
  }
}
