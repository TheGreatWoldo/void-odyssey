import { useGameStore } from '@/application/store/gameStore'

/**
 * Exposes the player's current ship selection for the play flow.
 */
export function useShipSelection(): {
    selectedShipId: string | null
    setSelectedShipId: (id: string) => void
} {
    const selectedShipId = useGameStore((s) => s.selectedShipId)
    const setSelectedShipId = useGameStore((s) => s.setSelectedShipId)

    return { selectedShipId, setSelectedShipId }
}
