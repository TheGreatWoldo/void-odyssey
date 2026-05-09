import type { MenuConfig } from '@/domain/models/menu'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type GamePhase = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover'

interface GameState {
  phase: GamePhase
  setPhase: (phase: GamePhase) => void
  menuConfig: MenuConfig | null
  setMenuConfig: (config: MenuConfig) => void
}

export const useGameStore = create<GameState>()(
  immer((set) => ({
    phase: 'loading',
    setPhase: (phase) =>
      set((state) => {
        state.phase = phase
      }),
    menuConfig: null,
    setMenuConfig: (config) =>
      set((state) => {
        state.menuConfig = config
      }),
  }))
)
