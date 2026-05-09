import { Color, DisplayMode, Engine } from 'excalibur'

let engine: Engine | null = null

export function getEngine(): Engine {
  if (!engine) {
    throw new Error('Engine has not been initialized. Call initEngine() first.')
  }
  return engine
}

export function initEngine(canvas: HTMLCanvasElement): Engine {
  engine = new Engine({
    canvasElement: canvas,
    displayMode: DisplayMode.FitContainerAndFill,
    backgroundColor: Color.fromHex('#000000'),
    suppressPlayButton: true,
  })

  return engine
}

export function startEngine(): Promise<void> {
  return getEngine().start()
}
