import type { IGameService } from '@/shared/game-service'
import { createContext } from 'react'

export const GameContext = createContext<IGameService | null>(null)
