import type { MenuConfig } from '@/shared/menu'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export const GamePhase = {
  Loading: 'loading',
  Menu: 'menu',
  Playing: 'playing',
  Paused: 'paused',
  GameOver: 'gameover',
} as const

export type GamePhase = typeof GamePhase[keyof typeof GamePhase]

interface GameState {
  phase: GamePhase
  setPhase: (phase: GamePhase) => void

  menuConfig: MenuConfig | null
  setMenuConfig: (config: MenuConfig) => void

  selectedShipId: string | null
  setSelectedShipId: (id: string) => void
}

export const useGameStore = create<GameState>()(
  immer((set) => ({
    phase: GamePhase.Loading,
    setPhase: (phase) =>
      set((state) => {
        state.phase = phase
      }),

    menuConfig: null,
    setMenuConfig: (config) =>
      set((state) => {
        state.menuConfig = config
      }),
    selectedShipId: null,
    setSelectedShipId: (id) =>
      set((state) => {
        state.selectedShipId = id
      }),  }))
)
