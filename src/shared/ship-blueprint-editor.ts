export const EditorTool = {
  Room: 'room',
  Erase: 'erase',
  Door: 'door',
} as const

export type EditorTool = typeof EditorTool[keyof typeof EditorTool]

export const AUTO_COLORS = [
  '#c2763a', // burnt sienna
  '#6b8e4e', // olive green
  '#4a7c8f', // slate teal
  '#9e4f3a', // terracotta
]

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

export interface RoomSection {
  room: number
  index: number
  position: { x: number; y: number }
  doors: Door[]
}

export interface RoomData {
  index: number
  color: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  sections: RoomSection[]
}

export interface RoomsLayoutData {
  version: string
  name: string
  layoutSectionSize: number
  mapSectionSize: number
  mapSize: { width: number; height: number }
  rooms: RoomData[]
}
