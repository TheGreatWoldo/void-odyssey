import { GameService } from '@/application/services/GameService'
import { createContext } from 'react'

export const GameContext = createContext<GameService | null>(null)
