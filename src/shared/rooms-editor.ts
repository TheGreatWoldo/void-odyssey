export type EditorTool = 'paint' | 'erase' | 'door'

export interface RoomDoors {
  left: boolean
  right: boolean
  top: boolean
  bottom: boolean
}

export interface RoomSection {
  room: number
  index: number
  position: { x: number; y: number }
  doors: RoomDoors
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
