import type { ResourceType } from '@/domain/models/resources/resource'
import { ModuleId, ModuleSlotCosts } from './production-module-id'

export const ModuleCategory = {
  Power: 'Power',
  Propulsion: 'Propulsion',
  Defense: 'Defense',
  LifeSupport: 'Life Support',
  Weapons: 'Weapons',
  Navigation: 'Navigation',
  Crew: 'Crew',
  Utility: 'Utility',
} as const

export type ModuleCategory = typeof ModuleCategory[keyof typeof ModuleCategory]

export interface ModuleMeta {
  readonly displayName: string
  readonly description: string
  readonly slotCost: number
  readonly category: ModuleCategory
  readonly primaryOutput: ResourceType
}

export const ModuleCatalog: Record<ModuleId, ModuleMeta> = {
  // Power
  [ModuleId.ReactorCore]: {
    displayName: 'Reactor Core',
    description: 'Primary power generation unit. Converts fuel into electricity for all ship systems.',
    slotCost: ModuleSlotCosts[ModuleId.ReactorCore],
    category: ModuleCategory.Power,
    primaryOutput: 'Power',
  },
  [ModuleId.IonEngines]: {
    displayName: 'Ion Engines',
    description: 'High-efficiency plasma thrusters. Provide sustained thrust at low fuel consumption.',
    slotCost: ModuleSlotCosts[ModuleId.IonEngines],
    category: ModuleCategory.Propulsion,
    primaryOutput: 'Thrust',
  },
  [ModuleId.ShieldGenerator]: {
    displayName: 'Shield Generator',
    description: 'Projects an electromagnetic barrier around the hull to absorb incoming damage.',
    slotCost: ModuleSlotCosts[ModuleId.ShieldGenerator],
    category: ModuleCategory.Defense,
    primaryOutput: 'Shield',
  },
  [ModuleId.ArmorPlating]: {
    displayName: 'Armor Plating',
    description: 'Reinforced composite hull panels that reduce structural damage from impacts and weapons fire.',
    slotCost: ModuleSlotCosts[ModuleId.ArmorPlating],
    category: ModuleCategory.Defense,
    primaryOutput: 'Hull',
  },

  // Weapons
  [ModuleId.PlasmaCannon]: {
    displayName: 'Plasma Cannon',
    description: 'Heavy directed-energy weapon that fires superheated plasma bolts at hostile targets.',
    slotCost: ModuleSlotCosts[ModuleId.PlasmaCannon],
    category: ModuleCategory.Weapons,
    primaryOutput: 'Firepower',
  },

  // Navigation
  [ModuleId.SensorArray]: {
    displayName: 'Sensor Array',
    description: 'Long-range detection suite for navigation hazards, contacts, and resource deposits.',
    slotCost: ModuleSlotCosts[ModuleId.SensorArray],
    category: ModuleCategory.Navigation,
    primaryOutput: 'ScanRange',
  },
  [ModuleId.JumpDrive]: {
    displayName: 'Jump Drive',
    description: 'Folds space to enable faster-than-light transit between star systems.',
    slotCost: ModuleSlotCosts[ModuleId.JumpDrive],
    category: ModuleCategory.Navigation,
    primaryOutput: 'JumpRange',
  },
  [ModuleId.NavComputer]: {
    displayName: 'Nav Computer',
    description: 'Advanced navigation processor for route calculation, hazard avoidance, and jump targeting.',
    slotCost: ModuleSlotCosts[ModuleId.NavComputer],
    category: ModuleCategory.Navigation,
    primaryOutput: 'ScanRange',
  },

  // Life Support
  [ModuleId.LifeSupport]: {
    displayName: 'Life Support',
    description: 'Regulates atmosphere, temperature, and oxygen levels throughout the ship.',
    slotCost: ModuleSlotCosts[ModuleId.LifeSupport],
    category: ModuleCategory.LifeSupport,
    primaryOutput: 'Oxygen',
  },
  [ModuleId.WaterReclaimer]: {
    displayName: 'Water Reclaimer',
    description: 'Recovers and purifies water from waste streams, extending mission endurance.',
    slotCost: ModuleSlotCosts[ModuleId.WaterReclaimer],
    category: ModuleCategory.LifeSupport,
    primaryOutput: 'Water',
  },

  // Crew
  [ModuleId.CrewQuarters]: {
    displayName: 'Crew Quarters',
    description: 'Living and rest facilities for the crew, directly affecting morale and performance.',
    slotCost: ModuleSlotCosts[ModuleId.CrewQuarters],
    category: ModuleCategory.Crew,
    primaryOutput: 'CrewCapacity',
  },
  [ModuleId.Medbay]: {
    displayName: 'Medbay',
    description: 'Medical facility equipped for trauma treatment, surgery, and crew recovery.',
    slotCost: ModuleSlotCosts[ModuleId.Medbay],
    category: ModuleCategory.Crew,
    primaryOutput: 'CrewCapacity',
  },

  // Utility
  [ModuleId.RepairDrones]: {
    displayName: 'Repair Drones',
    description: 'Autonomous micro-drones that perform continuous hull and system maintenance.',
    slotCost: ModuleSlotCosts[ModuleId.RepairDrones],
    category: ModuleCategory.Utility,
    primaryOutput: 'Hull',
  },
  [ModuleId.FuelScoop]: {
    displayName: 'Fuel Scoop',
    description: 'Harvests hydrogen and helium from stellar atmospheres to replenish fuel reserves.',
    slotCost: ModuleSlotCosts[ModuleId.FuelScoop],
    category: ModuleCategory.Utility,
    primaryOutput: 'Fuel',
  },
  [ModuleId.CommsArray]: {
    displayName: 'Comms Array',
    description: 'Long-range communication system for inter-ship and station contact across vast distances.',
    slotCost: ModuleSlotCosts[ModuleId.CommsArray],
    category: ModuleCategory.Utility,
    primaryOutput: 'Comms',
  },
}
