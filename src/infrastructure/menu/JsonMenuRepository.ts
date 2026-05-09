import type { MenuConfig } from '@/domain/models/menu'
import type { IMenuRepository } from '@/domain/repositories/IMenuRepository'
import menuConfigJson from './menu-config.json'

export class JsonMenuRepository implements IMenuRepository {
  getMenuConfig(): MenuConfig {
    return menuConfigJson as MenuConfig
  }
}
