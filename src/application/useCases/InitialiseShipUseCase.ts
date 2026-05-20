import type { ShipEntry } from '@/application/hooks/ship-catalog'
import { createInventory } from '@/domain/models/inventory/inventory'
import { createProductionModule } from '@/domain/models/module/production-module'
import { ModuleId } from '@/domain/models/module/production-module-id'
import { createRecipe } from '@/domain/models/production/recipe'
import { createResource, ResourceType } from '@/domain/models/resources/resource'
import { createResourceContainer } from '@/domain/models/resources/resource-container'
import { createShip, type Ship } from '@/domain/models/ship/ship'
import { createProductionSystem } from '@/domain/models/systems/production-system'
import { err, type Result } from '@/shared/result'

/**
 * Creates a fully-equipped Ship from a ShipEntry for the start of a run.
 *
 * Installs all 14 compatible modules (FuelScoop excluded — conflicts with ArmorPlating),
 * pre-loads starting resources, and connects the battery to the power system.
 */
export function initialiseShip(entry: ShipEntry): Result<Ship, string> {
    const inventory = createInventory({
        items: { capacity: 100 },
        resources: { capacity: 2000 },
    })

    const productionSystem = createProductionSystem({
        modules: { capacity: 100 },
        resources: inventory.resources,
    })

    const battery = createResourceContainer({
        labelKey: 'main-battery',
        capacity: 200,
        perTypeCapacity: { [ResourceType.Power]: 200 },
    })

    productionSystem.addBattery(battery)

    // Pre-load starting resources so modules can begin running immediately
    inventory.resources.add(createResource(ResourceType.Fuel, 500))
    inventory.resources.add(createResource(ResourceType.Food, 100))
    inventory.resources.add(createResource(ResourceType.Water, 100))
    inventory.resources.add(createResource(ResourceType.Oxygen, 100))
    inventory.resources.add(createResource(ResourceType.HullPlating, 20))

    // Build all modules in dependency-safe install order.
    // ReactorCore and NavComputer first — others depend on them.
    const moduleDefs: Array<{ id: string; name: string; type: ModuleId; primaryOutput: ResourceType; costs: Array<{ id: ResourceType; amount: number }>; maxOutput: number }> = [
        { id: 'reactor-1',       name: 'Reactor Core',     type: ModuleId.ReactorCore,      primaryOutput: ResourceType.Power,        costs: [{ id: ResourceType.Fuel,    amount: 2   }], maxOutput: 50  },
        { id: 'nav-1',           name: 'Nav Computer',     type: ModuleId.NavComputer,      primaryOutput: ResourceType.ScanRange,    costs: [{ id: ResourceType.Power,   amount: 1   }], maxOutput: 1   },
        { id: 'life-1',         name: 'Life Support',     type: ModuleId.LifeSupport,      primaryOutput: ResourceType.Oxygen,       costs: [{ id: ResourceType.Power,   amount: 2   }], maxOutput: 2   },
        { id: 'water-1',         name: 'Water Reclaimer',  type: ModuleId.WaterReclaimer,   primaryOutput: ResourceType.Water,        costs: [{ id: ResourceType.Power,   amount: 1   }], maxOutput: 1   },
        { id: 'crew-1',          name: 'Crew Quarters',    type: ModuleId.CrewQuarters,     primaryOutput: ResourceType.CrewCapacity, costs: [{ id: ResourceType.Power,   amount: 1   }, { id: ResourceType.Food, amount: 0.5 }], maxOutput: 10  },
        { id: 'medbay-1',        name: 'Medbay',           type: ModuleId.Medbay,           primaryOutput: ResourceType.Hull,         costs: [{ id: ResourceType.Power,   amount: 2   }, { id: ResourceType.Water, amount: 0.1 }], maxOutput: 1   },
        { id: 'repair-1',        name: 'Repair Drones',    type: ModuleId.RepairDrones,     primaryOutput: ResourceType.HullPlating,  costs: [{ id: ResourceType.Power,   amount: 3   }], maxOutput: 1   },
        { id: 'comms-1',         name: 'Comms Array',      type: ModuleId.CommsArray,       primaryOutput: ResourceType.Comms,        costs: [{ id: ResourceType.Power,   amount: 1   }], maxOutput: 5   },
        { id: 'armor-1',         name: 'Armor Plating',    type: ModuleId.ArmorPlating,     primaryOutput: ResourceType.Hull,         costs: [],                                           maxOutput: 10  },
        { id: 'shield-1',        name: 'Shield Generator', type: ModuleId.ShieldGenerator,  primaryOutput: ResourceType.Shield,       costs: [{ id: ResourceType.Power,   amount: 5   }], maxOutput: 50  },
        { id: 'sensor-1',        name: 'Sensor Array',     type: ModuleId.SensorArray,      primaryOutput: ResourceType.ScanRange,    costs: [{ id: ResourceType.Power,   amount: 2   }], maxOutput: 5   },
        { id: 'engines-1',       name: 'Ion Engines',      type: ModuleId.IonEngines,       primaryOutput: ResourceType.Thrust,       costs: [{ id: ResourceType.Power,   amount: 10  }], maxOutput: 100 },
        { id: 'jump-1',          name: 'Jump Drive',       type: ModuleId.JumpDrive,        primaryOutput: ResourceType.JumpRange,    costs: [{ id: ResourceType.Power,   amount: 6   }], maxOutput: 3   },
        { id: 'cannon-1',        name: 'Plasma Cannon',    type: ModuleId.PlasmaCannon,     primaryOutput: ResourceType.Firepower,    costs: [{ id: ResourceType.Power,   amount: 8   }], maxOutput: 30  },
    ]

    const modules = []
    for (const def of moduleDefs) {
        const recipe = createRecipe({
            name: def.name,
            primaryOutput: def.primaryOutput,
            costsPerSecond: def.costs.map(c => createResource(c.id, c.amount)),
        })

        const result = createProductionModule(def.id, def.name, recipe, {
            type: def.type,
            maxOutput: def.maxOutput,
        })

        if (!result.ok) {
            return err(`Failed to create module ${def.name}: ${result.error}`)
        }

        modules.push(result.value)
    }

    const installResult = productionSystem.installModules(modules)

    if (!installResult.ok) {
        return err(`Failed to install modules: ${installResult.error}`)
    }

    return createShip({
        name: entry.name,
        class: entry.shipClass,
        productionSystem,
        inventory,
        layout: entry.layout,
    })
}
