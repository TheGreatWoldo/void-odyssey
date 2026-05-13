import type { MenuConfig } from '@/shared/menu'

export interface IMenuRepository {
  getMenuConfig(): Promise<MenuConfig>
}
