import type { IMenuRepository, MenuConfigReadOptions } from '@/domain/repositories/IMenuRepository'
import { defaultMenuConfig } from '@/infrastructure/menu/default-menu-config'
import { validateMenuConfig } from '@/infrastructure/menu/menu-config-validation'
import type {
    MenuConfig,
    MenuConfigSection,
    MenuConfigSectionValue,
} from '@/shared/menu'
import menuConfigJson from './menu-config.json'

export class JsonMenuRepository implements IMenuRepository {
  private readonly rawConfig: unknown

  private readonly fallbackConfig: MenuConfig

  private cachedConfig: MenuConfig | undefined

  constructor(params?: { readonly rawConfig?: unknown; readonly fallbackConfig?: MenuConfig }) {
    this.rawConfig = params?.rawConfig ?? menuConfigJson
    this.fallbackConfig = params?.fallbackConfig ?? defaultMenuConfig
  }

  async getMenuConfig(options?: MenuConfigReadOptions): Promise<MenuConfig> {
    const useCache = options?.useCache ?? true
    if (useCache && this.cachedConfig) return this.cachedConfig

    const validation = validateMenuConfig(this.rawConfig)
    const config = validation.ok ? validation.value : this.fallbackConfig

    this.cachedConfig = config
    return config
  }

  async getMenuSection<S extends MenuConfigSection>(
    section: S,
    options?: MenuConfigReadOptions
  ): Promise<MenuConfigSectionValue<S>> {
    const config = await this.getMenuConfig(options)
    return config[section]
  }

  invalidateCache(): void {
    this.cachedConfig = undefined
  }
}
