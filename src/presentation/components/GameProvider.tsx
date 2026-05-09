import { GameService } from '@/application/services/GameService'
import { GameContext } from '@/presentation/components/GameContext'
import type { ReactNode } from 'react'

export function GameProvider({ children, service }: {
  children: ReactNode
  service: GameService
}) {
  return (
    <GameContext.Provider value={service}>
      {children}
    </GameContext.Provider>
  )
}
