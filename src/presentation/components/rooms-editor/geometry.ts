import type { RoomDoors } from '@/shared/rooms-editor';
import { CELL, DOOR_THICKNESS, DOOR_WALL_STUB } from '@/shared/rooms-editor-geometry';

export function edgeLineCoords(
    cx: number,
    cy: number,
    side: string,
): { x1: number; y1: number; x2: number; y2: number } {
    const px = cx * CELL
    const py = cy * CELL
    switch (side) {
        case 'left': return { x1: px, y1: py, x2: px, y2: py + CELL }
        case 'right': return { x1: px + CELL, y1: py, x2: px + CELL, y2: py + CELL }
        case 'top': return { x1: px, y1: py, x2: px + CELL, y2: py }
        default: return { x1: px, y1: py + CELL, x2: px + CELL, y2: py + CELL }
    }
}

export function edgeDoorWallCoords(
    cx: number,
    cy: number,
    side: string,
): [
        { x1: number; y1: number; x2: number; y2: number },
        { x1: number; y1: number; x2: number; y2: number },
    ] {
    const px = cx * CELL
    const py = cy * CELL
    const stub = DOOR_WALL_STUB

    switch (side) {
        case 'left':
            return [
                { x1: px, y1: py, x2: px, y2: py + stub },
                { x1: px, y1: py + CELL - stub, x2: px, y2: py + CELL },
            ]
        case 'right':
            return [
                { x1: px + CELL, y1: py, x2: px + CELL, y2: py + stub },
                { x1: px + CELL, y1: py + CELL - stub, x2: px + CELL, y2: py + CELL },
            ]
        case 'top':
            return [
                { x1: px, y1: py, x2: px + stub, y2: py },
                { x1: px + CELL - stub, y1: py, x2: px + CELL, y2: py },
            ]
        default: // bottom
            return [
                { x1: px, y1: py + CELL, x2: px + stub, y2: py + CELL },
                { x1: px + CELL - stub, y1: py + CELL, x2: px + CELL, y2: py + CELL },
            ]
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
    const stub = DOOR_WALL_STUB + DOOR_THICKNESS

    switch (side) {
        case 'left':
            return { x1: px + inset, y1: py + stub, x2: px + inset, y2: py + CELL - stub }
        case 'right':
            return { x1: px + CELL - inset, y1: py + stub, x2: px + CELL - inset, y2: py + CELL - stub }
        case 'top':
            return { x1: px + stub, y1: py + inset, x2: px + CELL - stub, y2: py + inset }
        case 'bottom':
            return { x1: px + stub, y1: py + CELL - inset, x2: px + CELL - stub, y2: py + CELL - inset }
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
    const stub = DOOR_WALL_STUB + DOOR_THICKNESS
    const half = CELL / 2

    switch (side) {
        case 'left':
            return [
                { x1: px + inset, y1: py + stub, x2: px + inset, y2: py + half },
                { x1: px + inset, y1: py + half, x2: px + inset, y2: py + CELL - stub },
            ]
        case 'right':
            return [
                { x1: px + CELL - inset, y1: py + stub, x2: px + CELL - inset, y2: py + half },
                { x1: px + CELL - inset, y1: py + half, x2: px + CELL - inset, y2: py + CELL - stub },
            ]
        case 'top':
            return [
                { x1: px + stub, y1: py + inset, x2: px + half, y2: py + inset },
                { x1: px + half, y1: py + inset, x2: px + CELL - stub, y2: py + inset },
            ]
        case 'bottom':
            return [
                { x1: px + stub, y1: py + CELL - inset, x2: px + half, y2: py + CELL - inset },
                { x1: px + half, y1: py + CELL - inset, x2: px + CELL - stub, y2: py + CELL - inset },
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
    const stub = DOOR_WALL_STUB

    switch (side) {
        case 'left':
            return [
                { x1: px, y1: py, x2: px, y2: py + stub },
                { x1: px, y1: py + CELL - stub, x2: px, y2: py + CELL },
            ]
        case 'right':
            return [
                { x1: px + CELL, y1: py, x2: px + CELL, y2: py + stub },
                { x1: px + CELL, y1: py + CELL - stub, x2: px + CELL, y2: py + CELL },
            ]
        case 'top':
            return [
                { x1: px, y1: py, x2: px + stub, y2: py },
                { x1: px + CELL - stub, y1: py, x2: px + CELL, y2: py },
            ]
        case 'bottom':
            return [
                { x1: px, y1: py + CELL, x2: px + stub, y2: py + CELL },
                { x1: px + CELL - stub, y1: py + CELL, x2: px + CELL, y2: py + CELL },
            ]
    }
}
