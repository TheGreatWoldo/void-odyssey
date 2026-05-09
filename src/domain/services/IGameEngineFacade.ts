/**
 * Port: engine-level scene navigation and lifecycle, consumed by the application
 * layer. Implemented in the infrastructure layer.
 */
export interface IGameEngineFacade {
  readonly canvas: HTMLCanvasElement
  setCanvasInteractive(interactive: boolean): void
  startEngine(): Promise<void>
  dispose(): void
}
