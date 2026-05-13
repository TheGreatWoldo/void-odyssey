import type { RoomDoors } from '@/shared/rooms-editor'

export const CELL = 60
export const DOOR_THICKNESS = 4
export const DOOR_WALL_STUB = CELL / 5
export const DOOR_SIDES: (keyof RoomDoors)[] = ['left', 'right', 'top', 'bottom']

export const NEIGHBOR_DELTA: Record<string, { dx: number; dy: number }> = {
    left:   { dx: -1, dy:  0 },
    right:  { dx:  1, dy:  0 },
    top:    { dx:  0, dy: -1 },
    bottom: { dx:  0, dy:  1 },
}
