import type { MenuConfig } from '@/domain/models/menu/menu'
import type { IMenuRepository } from '@/domain/repositories/IMenuRepository'

/**
 * Loads the menu configuration from the given repository.
 * The caller is responsible for storing the result (e.g. in the application store).
 */
export async function loadMenuConfig(repository: IMenuRepository): Promise<MenuConfig> {
  return repository.getMenuConfig()
}
