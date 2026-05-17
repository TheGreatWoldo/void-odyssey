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

export interface ShipEntry {
    id: string
    name: string
    description: string
    mapPng: string
    roomCount: number
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

export const SHIP_ENTRIES: readonly ShipEntry[] = [
    {
        id: 'donut',
        name: 'Donut',
        description: '',
        mapPng: donutPng,
        roomCount: donutRooms.rooms.length,
        ...naturalSize(donutRooms),
    },
    {
        id: 'lictor',
        name: 'Lictor',
        description: '',
        mapPng: lictorPng,
        roomCount: lictorRooms.rooms.length,
        ...naturalSize(lictorRooms),
    },
    {
        id: 'maledictus',
        name: 'Maledictus',
        description: '',
        mapPng: maledictusP,
        roomCount: maledictusRooms.rooms.length,
        ...naturalSize(maledictusRooms),
    },
    {
        id: 'vexillum',
        name: 'Vexillum',
        description: '',
        mapPng: vexillumPng,
        roomCount: vexillumRooms.rooms.length,
        ...naturalSize(vexillumRooms),
    },
    {
        id: 'zelotes',
        name: 'Zelotes',
        description: '',
        mapPng: zelotesPng,
        roomCount: zelotesRooms.rooms.length,
        ...naturalSize(zelotesRooms),
    },
]

/** Bounding box of the largest map — used to compute a uniform display scale */
export const SHIP_MAP_CANVAS = {
    width:  Math.max(...SHIP_ENTRIES.map(e => e.naturalWidth)),
    height: Math.max(...SHIP_ENTRIES.map(e => e.naturalHeight)),
}
