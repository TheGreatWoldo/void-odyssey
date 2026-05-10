import type { IMenuRepository } from '@/domain/repositories/IMenuRepository'
import type { MenuConfig } from '@/shared/menu'

/**
 * Loads the menu configuration from the given repository.
 * The caller is responsible for storing the result (e.g. in the application store).
 */
export async function loadMenuConfig(repository: IMenuRepository): Promise<MenuConfig> {
  return repository.getMenuConfig()
}
