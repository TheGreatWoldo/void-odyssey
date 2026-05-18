import type {
    MenuConfig,
    MenuConfigSection,
    MenuConfigSectionValue,
} from '@/shared/menu'

export interface MenuConfigReadOptions {
  readonly useCache?: boolean
}

export interface IMenuRepository {
  getMenuConfig(options?: MenuConfigReadOptions): Promise<MenuConfig>

  getMenuSection<S extends MenuConfigSection>(
    section: S,
    options?: MenuConfigReadOptions
  ): Promise<MenuConfigSectionValue<S>>

  invalidateCache(): void
}
