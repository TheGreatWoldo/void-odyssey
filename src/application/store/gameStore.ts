import type { GameFont } from '@/shared/font'
import type { MenuConfig } from '@/shared/menu'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type GamePhase = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover'

interface GameState {
  phase: GamePhase
  setPhase: (phase: GamePhase) => void

  menuConfig: MenuConfig | null
  setMenuConfig: (config: MenuConfig) => void

  font: GameFont
  setFont: (font: GameFont) => void
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

    font: (localStorage.getItem('game-font') as GameFont) ?? 'orbitron',
    setFont: (font) =>
      set((state) => {
        state.font = font
        localStorage.setItem('game-font', font)
      }),
  }))
)
