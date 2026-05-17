import { GameContext } from '@/shared/game-context'
import type { IGameService } from '@/shared/game-service'
import type { ReactNode } from 'react'

export function GameProvider({ children, service }: {
  children: ReactNode
  service: IGameService
}) {
  return (
    <GameContext.Provider value={service}>
      {children}
    </GameContext.Provider>
  )
}
