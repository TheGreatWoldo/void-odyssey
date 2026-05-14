import { SectionSide } from '@/shared/ship-blueprint-editor'

export const CELL = 60
export const DOOR_THICKNESS = 4
export const DOOR_WALL_STUB = CELL / 5
export const DOOR_SIDES: SectionSide[] = [SectionSide.Left, SectionSide.Right, SectionSide.Top, SectionSide.Bottom]

export const NEIGHBOR_DELTA: Record<SectionSide, { dx: number; dy: number }> = {
    [SectionSide.Left]:   { dx: -1, dy:  0 },
    [SectionSide.Right]:  { dx:  1, dy:  0 },
    [SectionSide.Top]:    { dx:  0, dy: -1 },
    [SectionSide.Bottom]: { dx:  0, dy:  1 },
}
