import { GameService } from '@/application/services/GameService'
import { GameContext } from '@/presentation/components/GameContext'
import { useContext } from 'react'

export function useGameService(): GameService {
  const service = useContext(GameContext)

  if (!service)
    throw new Error('useGameService must be used within a GameProvider')

  return service
}
