import type { ShipEntry } from '@/application/hooks/ship-catalog'
import { useActiveShipStore } from '@/application/store/activeShipStore'
import { useGameStore } from '@/application/store/gameStore'
import { initialiseShip } from '@/application/useCases/InitialiseShipUseCase'
import type { Ship } from '@/domain/models/ship/ship'

/**
 * Exposes the active runtime ship.
 *
 * `initialise(entry)` is idempotent — if a ship is already active it is
 * returned immediately without re-creating the domain object.
 */
export function useActiveShip(): {
    ship: Ship | null
    selectedShipId: string | null
    initialise: (entry: ShipEntry) => Ship
} {
    const ship = useActiveShipStore((s) => s.ship)
    const setShip = useActiveShipStore((s) => s.setShip)
    const selectedShipId = useGameStore((s) => s.selectedShipId)

    function initialise(entry: ShipEntry): Ship {
        const existing = useActiveShipStore.getState().ship

        if (existing) return existing

        const newShip = initialiseShip(entry)
        setShip(newShip)
        return newShip
    }

    return { ship, selectedShipId, initialise }
}
