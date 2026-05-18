import { GameContext } from '@/application/hooks/game-context'
import type { IGameService } from '@/shared/game-service'
import { useContext } from 'react'

export function useGameService(): IGameService {
  const service = useContext(GameContext)

  if (!service)
    throw new Error('useGameService must be used within a GameProvider')

  return service
}
