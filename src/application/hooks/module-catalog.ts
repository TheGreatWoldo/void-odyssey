import { ModuleCatalog } from '@/domain/models/module/module-catalog'
import { ModuleId, ModuleSlotCosts } from '@/domain/models/module/production-module-id'

export interface ModuleEntry {
  id: ModuleId
  displayName: string
  category: string
  slotCost: number
  primaryOutput: string
}

export interface ModuleMetaView {
  displayName: string
  description: string
  category: string
  slotCost: number
  primaryOutput: string
}

export const MODULE_ENTRIES: readonly ModuleEntry[] = (Object.values(ModuleId) as ModuleId[])
  .sort((a, b) => ModuleCatalog[a].displayName.localeCompare(ModuleCatalog[b].displayName))
  .map((id) => ({
    id,
    displayName: ModuleCatalog[id].displayName,
    category: ModuleCatalog[id].category,
    slotCost: ModuleSlotCosts[id],
    primaryOutput: ModuleCatalog[id].primaryOutput,
  }))

const VALID_MODULE_IDS = new Set<string>(Object.values(ModuleId))

export function getModuleMeta(id: string): ModuleMetaView | null {
  if (!VALID_MODULE_IDS.has(id)) return null
  const typedId = id as ModuleId
  const meta = ModuleCatalog[typedId]
  return {
    displayName: meta.displayName,
    description: meta.description,
    category: meta.category,
    slotCost: ModuleSlotCosts[typedId],
    primaryOutput: meta.primaryOutput,
  }
}

export function isValidModuleId(id: string): boolean {
  return VALID_MODULE_IDS.has(id)
}
