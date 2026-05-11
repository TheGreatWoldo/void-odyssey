import { ModuleId, ModuleSlotCosts } from './production-module-id'

export interface ModuleMeta {
  readonly displayName: string
  readonly description: string
  readonly slotCost: number
  readonly category: 'Power' | 'Propulsion' | 'Defense' | 'Life Support' | 'Weapons' | 'Navigation' | 'Crew' | 'Utility'
}

export const ModuleCatalog: Record<ModuleId, ModuleMeta> = {
  [ModuleId.ReactorCore]: {
    displayName: 'Reactor Core',
    description: 'Primary power generation unit. Converts fuel into electricity for all ship systems.',
    slotCost: ModuleSlotCosts[ModuleId.ReactorCore],
    category: 'Power',
  },
  [ModuleId.IonEngines]: {
    displayName: 'Ion Engines',
    description: 'High-efficiency plasma thrusters. Provide sustained thrust at low fuel consumption.',
    slotCost: ModuleSlotCosts[ModuleId.IonEngines],
    category: 'Propulsion',
  },
  [ModuleId.ShieldGenerator]: {
    displayName: 'Shield Generator',
    description: 'Projects an electromagnetic barrier around the hull to absorb incoming damage.',
    slotCost: ModuleSlotCosts[ModuleId.ShieldGenerator],
    category: 'Defense',
  },
  [ModuleId.LifeSupport]: {
    displayName: 'Life Support',
    description: 'Regulates atmosphere, temperature, and oxygen levels throughout the ship.',
    slotCost: ModuleSlotCosts[ModuleId.LifeSupport],
    category: 'Life Support',
  },
  [ModuleId.WaterReclaimer]: {
    displayName: 'Water Reclaimer',
    description: 'Recovers and purifies water from waste streams, extending mission endurance.',
    slotCost: ModuleSlotCosts[ModuleId.WaterReclaimer],
    category: 'Life Support',
  },
  [ModuleId.SensorArray]: {
    displayName: 'Sensor Array',
    description: 'Long-range detection suite for navigation hazards, contacts, and resource deposits.',
    slotCost: ModuleSlotCosts[ModuleId.SensorArray],
    category: 'Navigation',
  },
  [ModuleId.RepairDrones]: {
    displayName: 'Repair Drones',
    description: 'Autonomous micro-drones that perform continuous hull and system maintenance.',
    slotCost: ModuleSlotCosts[ModuleId.RepairDrones],
    category: 'Utility',
  },
  [ModuleId.PlasmaCannon]: {
    displayName: 'Plasma Cannon',
    description: 'Heavy directed-energy weapon that fires superheated plasma bolts at hostile targets.',
    slotCost: ModuleSlotCosts[ModuleId.PlasmaCannon],
    category: 'Weapons',
  },
  [ModuleId.JumpDrive]: {
    displayName: 'Jump Drive',
    description: 'Folds space to enable faster-than-light transit between star systems.',
    slotCost: ModuleSlotCosts[ModuleId.JumpDrive],
    category: 'Navigation',
  },
  [ModuleId.ArmorPlating]: {
    displayName: 'Armor Plating',
    description: 'Reinforced composite hull panels that reduce structural damage from impacts and weapons fire.',
    slotCost: ModuleSlotCosts[ModuleId.ArmorPlating],
    category: 'Defense',
  },
  [ModuleId.NavComputer]: {
    displayName: 'Nav Computer',
    description: 'Advanced navigation processor for route calculation, hazard avoidance, and jump targeting.',
    slotCost: ModuleSlotCosts[ModuleId.NavComputer],
    category: 'Navigation',
  },
  [ModuleId.CrewQuarters]: {
    displayName: 'Crew Quarters',
    description: 'Living and rest facilities for the crew, directly affecting morale and performance.',
    slotCost: ModuleSlotCosts[ModuleId.CrewQuarters],
    category: 'Crew',
  },
  [ModuleId.Medbay]: {
    displayName: 'Medbay',
    description: 'Medical facility equipped for trauma treatment, surgery, and crew recovery.',
    slotCost: ModuleSlotCosts[ModuleId.Medbay],
    category: 'Crew',
  },
  [ModuleId.FuelScoop]: {
    displayName: 'Fuel Scoop',
    description: 'Harvests hydrogen and helium from stellar atmospheres to replenish fuel reserves.',
    slotCost: ModuleSlotCosts[ModuleId.FuelScoop],
    category: 'Utility',
  },
  [ModuleId.CommsArray]: {
    displayName: 'Comms Array',
    description: 'Long-range communication system for inter-ship and station contact across vast distances.',
    slotCost: ModuleSlotCosts[ModuleId.CommsArray],
    category: 'Utility',
  },
}
