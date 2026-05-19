import type { Ship } from '@/domain/models/ship/ship'
import { create } from 'zustand'

/**
 * Holds the active runtime Ship instance for the current run.
 *
 * Plain Zustand — no Immer. Ship is a mutable closure-based domain object;
 * Immer would freeze it, breaking all internal state mutations.
 */
interface ActiveShipState {
  ship: Ship | null
  setShip: (ship: Ship) => void
  clearShip: () => void
}

export const useActiveShipStore = create<ActiveShipState>()((set) => ({
  ship: null,

  setShip: (ship) => set({ ship }),

  clearShip: () => set({ ship: null }),
}))
