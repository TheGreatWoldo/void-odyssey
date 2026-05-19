import { ModuleCatalog } from '@/domain/models/module/module-catalog'
import { ModuleId, ModuleSlotCosts } from '@/domain/models/module/production-module-id'

const ModuleIconById: Record<ModuleId, string> = {
  [ModuleId.ReactorCore]: 'Zap',
  [ModuleId.IonEngines]: 'Gauge',
  [ModuleId.ShieldGenerator]: 'Shield',
  [ModuleId.SensorArray]: 'Radar',
  [ModuleId.LifeSupport]: 'Wind',
  [ModuleId.WaterReclaimer]: 'Droplets',
  [ModuleId.RepairDrones]: 'Wrench',
  [ModuleId.PlasmaCannon]: 'Crosshair',
  [ModuleId.JumpDrive]: 'Navigation',
  [ModuleId.ArmorPlating]: 'ShieldHalf',
  [ModuleId.NavComputer]: 'Radio',
  [ModuleId.CrewQuarters]: 'Users',
  [ModuleId.Medbay]: 'HeartPulse',
  [ModuleId.FuelScoop]: 'Flame',
  [ModuleId.CommsArray]: 'Radio',
}

export interface ModuleEntry {
  id: ModuleId
  displayName: string
  icon: string
  category: string
  slotCost: number
  primaryOutput: string
}

export interface ModuleMetaView {
  displayName: string
  icon: string
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
    icon: ModuleIconById[id],
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
    icon: ModuleIconById[typedId],
    description: meta.description,
    category: meta.category,
    slotCost: ModuleSlotCosts[typedId],
    primaryOutput: meta.primaryOutput,
  }
}

export function isValidModuleId(id: string): boolean {
  return VALID_MODULE_IDS.has(id)
}
