import donutPng from '@/assets/ships/donut/donut.map.png'
import donutRooms from '@/assets/ships/donut/donut.rooms.json'
import lictorPng from '@/assets/ships/lictor/lictor.map.png'
import lictorRooms from '@/assets/ships/lictor/lictor.rooms.json'
import maledictusP from '@/assets/ships/maledictus/maledictus.map.png'
import maledictusRooms from '@/assets/ships/maledictus/maledictus.rooms.json'
import vexillumPng from '@/assets/ships/vexillum/vexillum.map.png'
import vexillumRooms from '@/assets/ships/vexillum/vexillum.rooms.json'
import zelotesPng from '@/assets/ships/zelotes/zelotes.map.png'
import zelotesRooms from '@/assets/ships/zelotes/zelotes.rooms.json'
import { DoorState, SectionSide, type Door, type RoomsLayout } from '@/domain/models/ship/rooms-layout'
import { ShipClass } from '@/domain/models/ship/ship-class'

export interface ShipEntry {
    id: string
    name: string
    description: string
    shipClass: ShipClass
    mapPng: string
    roomCount: number
    layout: RoomsLayout
    /** Natural pixel width of the generated map PNG */
    naturalWidth: number
    /** Natural pixel height of the generated map PNG */
    naturalHeight: number
}

// wall padding baked into every generated PNG = floor(wallSize / 2) * 2 = floor(6/2)*2 = 6px
const WALL_PX = 6

function naturalSize(rooms: { mapSize: { width: number; height: number }; mapSectionSize: number }) {
    return {
        naturalWidth:  rooms.mapSize.width  * rooms.mapSectionSize + WALL_PX,
        naturalHeight: rooms.mapSize.height * rooms.mapSectionSize + WALL_PX,
    }
}

/**
 * The .rooms.json files were generated with doors as {left, right, top, bottom: boolean}.
 * The domain and shared types expect doors as Door[] = {side, state}[].
 * Convert at import time.
 */
type RawDoors = { left: boolean; right: boolean; top: boolean; bottom: boolean }

function convertDoors(raw: RawDoors): Door[] {
    const doors: Door[] = []
    if (raw.left)   doors.push({ side: SectionSide.Left,   state: DoorState.Closed })
    if (raw.right)  doors.push({ side: SectionSide.Right,  state: DoorState.Closed })
    if (raw.top)    doors.push({ side: SectionSide.Top,    state: DoorState.Closed })
    if (raw.bottom) doors.push({ side: SectionSide.Bottom, state: DoorState.Closed })
    return doors
}

function convertRoomsJson(raw: typeof donutRooms): RoomsLayout {
    return {
        ...raw,
        rooms: raw.rooms.map((room) => ({
            ...room,
            sections: room.sections.map((section) => ({
                ...section,
                doors: convertDoors(section.doors as unknown as RawDoors),
            })),
        })),
    }
}

export const SHIP_ENTRIES: readonly ShipEntry[] = [
    {
        id: 'donut',
        name: 'Donut',
        description: '',
        shipClass: ShipClass.Shuttle,
        mapPng: donutPng,
        roomCount: donutRooms.rooms.length,
        layout: convertRoomsJson(donutRooms),
        ...naturalSize(donutRooms),
    },
    {
        id: 'lictor',
        name: 'Lictor',
        description: '',
        shipClass: ShipClass.Frigate,
        mapPng: lictorPng,
        roomCount: lictorRooms.rooms.length,
        layout: convertRoomsJson(lictorRooms as typeof donutRooms),
        ...naturalSize(lictorRooms),
    },
    {
        id: 'maledictus',
        name: 'Maledictus',
        description: '',
        shipClass: ShipClass.Destroyer,
        mapPng: maledictusP,
        roomCount: maledictusRooms.rooms.length,
        layout: convertRoomsJson(maledictusRooms as typeof donutRooms),
        ...naturalSize(maledictusRooms),
    },
    {
        id: 'vexillum',
        name: 'Vexillum',
        description: '',
        shipClass: ShipClass.Carrier,
        mapPng: vexillumPng,
        roomCount: vexillumRooms.rooms.length,
        layout: convertRoomsJson(vexillumRooms as typeof donutRooms),
        ...naturalSize(vexillumRooms),
    },
    {
        id: 'zelotes',
        name: 'Zelotes',
        description: '',
        shipClass: ShipClass.Corvette,
        mapPng: zelotesPng,
        roomCount: zelotesRooms.rooms.length,
        layout: convertRoomsJson(zelotesRooms as typeof donutRooms),
        ...naturalSize(zelotesRooms),
    },
]

/** Bounding box of the largest map — used to compute a uniform display scale */
export const SHIP_MAP_CANVAS = {
    width:  Math.max(...SHIP_ENTRIES.map(e => e.naturalWidth)),
    height: Math.max(...SHIP_ENTRIES.map(e => e.naturalHeight)),
}
