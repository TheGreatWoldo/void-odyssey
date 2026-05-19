import { ModuleId, ModuleSlotCosts } from '@/domain/models/module/production-module-id'
import { describe, expect, it } from 'vitest'
import { getModuleMeta, isValidModuleId, MODULE_ENTRIES } from './module-catalog'

const ALL_MODULE_IDS = Object.values(ModuleId) as ModuleId[]

describe('MODULE_ENTRIES', () => {
  it('contains an entry for every ModuleId', () => {
    const entryIds = MODULE_ENTRIES.map((e) => e.id)
    for (const id of ALL_MODULE_IDS) {
      expect(entryIds).toContain(id)
    }
  })

  it('is sorted alphabetically by displayName', () => {
    const names = MODULE_ENTRIES.map((e) => e.displayName)
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    expect(names).toEqual(sorted)
  })

  it('each entry has a positive slotCost matching ModuleSlotCosts', () => {
    for (const entry of MODULE_ENTRIES) {
      expect(entry.slotCost).toBeGreaterThan(0)
      expect(entry.slotCost).toBe(ModuleSlotCosts[entry.id])
    }
  })

  it('each entry has a non-empty displayName and category', () => {
    for (const entry of MODULE_ENTRIES) {
      expect(entry.displayName.trim().length).toBeGreaterThan(0)
      expect(entry.icon.trim().length).toBeGreaterThan(0)
      expect(entry.category.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('getModuleMeta', () => {
  it('returns null for an unknown id', () => {
    expect(getModuleMeta('unknown-module')).toBeNull()
    expect(getModuleMeta('')).toBeNull()
  })

  it('returns full metadata for a known id', () => {
    const meta = getModuleMeta(ModuleId.ReactorCore)
    expect(meta).not.toBeNull()
    expect(meta!.displayName).toBe('Reactor Core')
    expect(meta!.icon).toBe('Zap')
    expect(meta!.category).toBe('Power')
    expect(meta!.primaryOutput).toBe('Power')
    expect(meta!.slotCost).toBe(ModuleSlotCosts[ModuleId.ReactorCore])
    expect(meta!.description.length).toBeGreaterThan(0)
  })

  it('slotCost matches ModuleSlotCosts for every module', () => {
    for (const id of ALL_MODULE_IDS) {
      const meta = getModuleMeta(id)
      expect(meta!.slotCost).toBe(ModuleSlotCosts[id])
    }
  })
})

describe('isValidModuleId', () => {
  it('returns true for all known ModuleIds', () => {
    for (const id of ALL_MODULE_IDS) {
      expect(isValidModuleId(id)).toBe(true)
    }
  })

  it('returns false for unknown strings', () => {
    expect(isValidModuleId('not-a-module')).toBe(false)
    expect(isValidModuleId('')).toBe(false)
    expect(isValidModuleId('ReactorCore')).toBe(false) // wrong casing/format
  })
})

describe('ModuleSlotCosts', () => {
  it('ReactorCore occupies 9 slots', () => {
    expect(ModuleSlotCosts[ModuleId.ReactorCore]).toBe(9)
  })

  it('all slot costs are between 1 and 9', () => {
    for (const id of ALL_MODULE_IDS) {
      expect(ModuleSlotCosts[id]).toBeGreaterThanOrEqual(1)
      expect(ModuleSlotCosts[id]).toBeLessThanOrEqual(9)
    }
  })
})
