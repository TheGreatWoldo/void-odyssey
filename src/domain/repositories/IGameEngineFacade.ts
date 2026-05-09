/**
 * Keys matching the entries in the infrastructure background scene catalog.
 * Defined here so the application layer has no dependency on the catalog.
 */
export type BackgroundSceneKey =
  | 'mainBackground'
  | 'startNew'
  | 'selectShip'
  | 'configureShip'
  | 'settingsMenu'
  | 'pickTemplate'
  | 'buildShip'

/**
 * Port: engine-level scene navigation and lifecycle, consumed by the application
 * layer. Implemented in the infrastructure layer.
 */
export interface IGameEngineFacade {
  readonly canvas: HTMLCanvasElement
  setBackground(key: BackgroundSceneKey): void
  goToShipConfiguration(shipId: string): void
  goToNavigation(): void
  goToRouteNavigation(): void
  goToBackground(): void
  setCanvasInteractive(interactive: boolean): void
  startEngine(): void
  dispose(): void
}
