import type { IGameService } from '@/shared/game-service'

export interface RouterContext {
  onCanvasReady: (canvas: HTMLCanvasElement) => Promise<IGameService>
}
