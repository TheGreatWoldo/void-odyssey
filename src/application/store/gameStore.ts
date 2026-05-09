import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type GamePhase = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover'

interface GameState {
  phase: GamePhase
  setPhase: (phase: GamePhase) => void
}

export const useGameStore = create<GameState>()(
  immer((set) => ({
    phase: 'loading',
    setPhase: (phase) =>
      set((state) => {
        state.phase = phase
      }),
  }))
)
