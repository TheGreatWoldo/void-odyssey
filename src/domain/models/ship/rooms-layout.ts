export const SectionSide = {
  Left: 'left',
  Right: 'right',
  Top: 'top',
  Bottom: 'bottom',
} as const

export type SectionSide = typeof SectionSide[keyof typeof SectionSide]

export const DoorState = {
  Open: 'open',
  Closed: 'closed',
  Locked: 'locked',
} as const

export type DoorState = typeof DoorState[keyof typeof DoorState]

export interface Door {
  side: SectionSide
  state: DoorState
}

export interface Section {
  room: number
  index: number
  position: { x: number; y: number }
  doors: Door[]
}

export interface Room {
  index: number
  color: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  sections: Section[]
}

export interface MapSize {
  width: number
  height: number
}

export interface RoomsLayout {
  version: string
  name: string
  layoutSectionSize: number
  mapSectionSize: number
  mapSize: MapSize
  rooms: Room[]
}
