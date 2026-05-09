import type { GamePhase } from '@/application/store/gameStore'
import { useGameStore } from '@/application/store/gameStore'

export function useSetPhase(): (phase: GamePhase) => void {
  return useGameStore((s) => s.setPhase)
}
