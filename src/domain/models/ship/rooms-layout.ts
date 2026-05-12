export interface Doors {
  left: boolean
  right: boolean
  top: boolean
  bottom: boolean
}

export interface Section {
  room: number
  index: number
  position: { x: number; y: number }
  doors: Doors
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
