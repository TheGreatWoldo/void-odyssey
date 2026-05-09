import { useGameStore } from '@/application/store/gameStore'

export function useMenuConfig() {
  return useGameStore((state) => state.menuConfig)
}
