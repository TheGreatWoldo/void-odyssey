import type { MenuConfig } from '@/domain/models/menu'

/**
 * Repository port for loading the menu configuration.
 * Implemented in the infrastructure layer.
 */
export interface IMenuRepository {
  getMenuConfig(): MenuConfig
}
