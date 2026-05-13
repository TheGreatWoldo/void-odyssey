import type { RoomDoors } from '@/shared/rooms-editor'

export const CELL = 60
export const DOOR_THICKNESS = 4
export const DOOR_SIDES: (keyof RoomDoors)[] = ['left', 'right', 'top', 'bottom']

export const NEIGHBOR_DELTA: Record<string, { dx: number; dy: number }> = {
  left:   { dx: -1, dy:  0 },
  right:  { dx:  1, dy:  0 },
  top:    { dx:  0, dy: -1 },
  bottom: { dx:  0, dy:  1 },
}

export function edgeLineCoords(
  cx: number,
  cy: number,
  side: string,
): { x1: number; y1: number; x2: number; y2: number } {
  const px = cx * CELL
  const py = cy * CELL
  switch (side) {
    case 'left':   return { x1: px,        y1: py,        x2: px,        y2: py + CELL }
    case 'right':  return { x1: px + CELL,  y1: py,        x2: px + CELL,  y2: py + CELL }
    case 'top':    return { x1: px,        y1: py,        x2: px + CELL,  y2: py }
    default:       return { x1: px,        y1: py + CELL,  x2: px + CELL,  y2: py + CELL }
  }
}

export function doorLineCoords(
  cx: number,
  cy: number,
  side: keyof RoomDoors,
): { x1: number; y1: number; x2: number; y2: number } {
  const px = cx * CELL
  const py = cy * CELL
  const inset = DOOR_THICKNESS / 2
  const quarter = CELL / 4

  switch (side) {
    case 'left':
      return { x1: px + inset, y1: py + quarter, x2: px + inset, y2: py + CELL - quarter }
    case 'right':
      return { x1: px + CELL - inset, y1: py + quarter, x2: px + CELL - inset, y2: py + CELL - quarter }
    case 'top':
      return { x1: px + quarter, y1: py + inset, x2: px + CELL - quarter, y2: py + inset }
    case 'bottom':
      return { x1: px + quarter, y1: py + CELL - inset, x2: px + CELL - quarter, y2: py + CELL - inset }
  }
}

/** A short perpendicular tick at the seam where the two door panels meet. */
export function splitDoorLineCoords(
  cx: number,
  cy: number,
  side: keyof RoomDoors,
): [
  { x1: number; y1: number; x2: number; y2: number },
  { x1: number; y1: number; x2: number; y2: number },
] {
  const px = cx * CELL
  const py = cy * CELL
  const inset = DOOR_THICKNESS / 2
  const quarter = CELL / 4
  const half = CELL / 2

  switch (side) {
    case 'left':
      return [
        { x1: px + inset, y1: py + quarter, x2: px + inset, y2: py + half },
        { x1: px + inset, y1: py + half,    x2: px + inset, y2: py + CELL - quarter },
      ]
    case 'right':
      return [
        { x1: px + CELL - inset, y1: py + quarter, x2: px + CELL - inset, y2: py + half },
        { x1: px + CELL - inset, y1: py + half,    x2: px + CELL - inset, y2: py + CELL - quarter },
      ]
    case 'top':
      return [
        { x1: px + quarter, y1: py + inset, x2: px + half,           y2: py + inset },
        { x1: px + half,    y1: py + inset, x2: px + CELL - quarter,  y2: py + inset },
      ]
    case 'bottom':
      return [
        { x1: px + quarter, y1: py + CELL - inset, x2: px + half,           y2: py + CELL - inset },
        { x1: px + half,    y1: py + CELL - inset, x2: px + CELL - quarter,  y2: py + CELL - inset },
      ]
  }
}

/** A short perpendicular tick at the seam where the two door panels meet. */
export function doorSeamCoords(
  cx: number,
  cy: number,
  side: keyof RoomDoors,
): { x1: number; y1: number; x2: number; y2: number } {
  const px = cx * CELL
  const py = cy * CELL
  const inset = DOOR_THICKNESS / 2
  const half = CELL / 2

  switch (side) {
    case 'left':
      return { x1: px + inset - inset, y1: py + half, x2: px + inset + inset, y2: py + half }
    case 'right':
      return { x1: px + CELL - inset - inset, y1: py + half, x2: px + CELL - inset + inset, y2: py + half }
    case 'top':
      return { x1: px + half, y1: py + inset - inset, x2: px + half, y2: py + inset + inset }
    case 'bottom':
      return { x1: px + half, y1: py + CELL - inset - inset, x2: px + half, y2: py + CELL - inset + inset }
  }
}

/** Two wall stubs (one quarter each) that frame the door opening on a cell edge. */
export function doorFrameCoords(
  cx: number,
  cy: number,
  side: keyof RoomDoors,
): [
  { x1: number; y1: number; x2: number; y2: number },
  { x1: number; y1: number; x2: number; y2: number },
] {
  const px = cx * CELL
  const py = cy * CELL
  const quarter = CELL / 4

  switch (side) {
    case 'left':
      return [
        { x1: px, y1: py,                   x2: px, y2: py + quarter },
        { x1: px, y1: py + CELL - quarter,   x2: px, y2: py + CELL },
      ]
    case 'right':
      return [
        { x1: px + CELL, y1: py,                   x2: px + CELL, y2: py + quarter },
        { x1: px + CELL, y1: py + CELL - quarter,   x2: px + CELL, y2: py + CELL },
      ]
    case 'top':
      return [
        { x1: px,                  y1: py, x2: px + quarter,         y2: py },
        { x1: px + CELL - quarter, y1: py, x2: px + CELL,            y2: py },
      ]
    case 'bottom':
      return [
        { x1: px,                  y1: py + CELL, x2: px + quarter,         y2: py + CELL },
        { x1: px + CELL - quarter, y1: py + CELL, x2: px + CELL,            y2: py + CELL },
      ]
  }
}
