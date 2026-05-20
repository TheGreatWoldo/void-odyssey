export const ShipClass = {
  Shuttle: 'Shuttle',
  Frigate: 'Frigate',
  Destroyer: 'Destroyer',
  Carrier: 'Carrier',
  Corvette: 'Corvette',
} as const

export type ShipClass = typeof ShipClass[keyof typeof ShipClass]
