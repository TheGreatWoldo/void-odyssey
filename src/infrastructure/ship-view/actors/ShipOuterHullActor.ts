import { SectionSide, type Section } from '@/domain/models/ship/rooms-layout'
import { Actor, Canvas, Color, vec } from 'excalibur'

import { SHIP_SECTION_CELL, SHIP_SECTION_GAP, SHIP_SECTION_WALL_THICKNESS } from './ShipSectionActor'

const CELL = SHIP_SECTION_CELL
const WALL_THICKNESS = SHIP_SECTION_WALL_THICKNESS
const DOOR_WALL_STUB = CELL / 5
const WALL_COLOR = Color.fromHex('#000000')

const SIDES = [SectionSide.Left, SectionSide.Right, SectionSide.Top, SectionSide.Bottom] as const

const NEIGHBOR_DELTA: Record<SectionSide, { dx: number; dy: number }> = {
    [SectionSide.Left]:   { dx: -1, dy:  0 },
    [SectionSide.Right]:  { dx:  1, dy:  0 },
    [SectionSide.Top]:    { dx:  0, dy: -1 },
    [SectionSide.Bottom]: { dx:  0, dy:  1 },
}

const OPPOSITE_SIDE: Record<SectionSide, SectionSide> = {
    [SectionSide.Left]:   SectionSide.Right,
    [SectionSide.Right]:  SectionSide.Left,
    [SectionSide.Top]:    SectionSide.Bottom,
    [SectionSide.Bottom]: SectionSide.Top,
}

export interface OuterHullPosition {
    x: number
    y: number
}

interface Args {
    position: OuterHullPosition
    allSections: Map<string, Section>
}

/**
 * A ghost cell placed one step outside each exposed ship section edge.
 *
 * Each ShipSectionActor draws its outer wall as an 8px stroke centred on its
 * canvas edge — only the inner 4px is visible (the outer 4px is clipped).
 * This actor draws the matching 4px from the other side so the outer hull
 * wall appears as thick as interior room walls.
 */
export class ShipOuterHullActor extends Actor {

    constructor({ position, allSections }: Args) {
        super({
            pos: vec(
                position.x * (CELL + SHIP_SECTION_GAP) + CELL / 2,
                position.y * (CELL + SHIP_SECTION_GAP) + CELL / 2,
            ),
            width:  CELL,
            height: CELL,
            anchor: vec(0.5, 0.5),
            z:      20,
        })

        const canvas = new Canvas({
            width: CELL,
            height: CELL,
            cache: true,
            draw: (ctx) => this.drawCell(ctx, position, allSections),
        })

        this.graphics.use(canvas)
    }

    private drawCell(
        ctx: CanvasRenderingContext2D,
        position: OuterHullPosition,
        allSections: Map<string, Section>,
    ): void {
        ctx.strokeStyle = WALL_COLOR.toHex()
        ctx.lineWidth = WALL_THICKNESS
        ctx.lineCap = 'square'

        const { x, y } = position

        for (const side of SIDES) {
            const { dx, dy } = NEIGHBOR_DELTA[side]
            const neighborSection = allSections.get(`${x + dx},${y + dy}`)

            if (!neighborSection) continue

            // The ship section's door side is the face looking toward this outer hull cell.
            const neighborDoorSide = OPPOSITE_SIDE[side]
            const hasDoor = neighborSection.doors.some((d) => d.side === neighborDoorSide)

            if (hasDoor) {
                const stub = DOOR_WALL_STUB
                ctx.beginPath()
                if (side === SectionSide.Left) {
                    ctx.moveTo(0, 0);         ctx.lineTo(0, stub)
                    ctx.moveTo(0, CELL - stub); ctx.lineTo(0, CELL)
                } else if (side === SectionSide.Right) {
                    ctx.moveTo(CELL, 0);         ctx.lineTo(CELL, stub)
                    ctx.moveTo(CELL, CELL - stub); ctx.lineTo(CELL, CELL)
                } else if (side === SectionSide.Top) {
                    ctx.moveTo(0, 0);         ctx.lineTo(stub, 0)
                    ctx.moveTo(CELL - stub, 0); ctx.lineTo(CELL, 0)
                } else {
                    ctx.moveTo(0, CELL);         ctx.lineTo(stub, CELL)
                    ctx.moveTo(CELL - stub, CELL); ctx.lineTo(CELL, CELL)
                }
                ctx.stroke()
            } else {
                ctx.beginPath()
                if (side === SectionSide.Left) {
                    ctx.moveTo(0, 0);    ctx.lineTo(0, CELL)
                } else if (side === SectionSide.Right) {
                    ctx.moveTo(CELL, 0); ctx.lineTo(CELL, CELL)
                } else if (side === SectionSide.Top) {
                    ctx.moveTo(0, 0);    ctx.lineTo(CELL, 0)
                } else {
                    ctx.moveTo(0, CELL); ctx.lineTo(CELL, CELL)
                }
                ctx.stroke()
            }
        }

        // Fill concave corners: where both perpendicular sides face empty space
        // but the diagonal neighbour is a ship section — this ghost owns that corner pixel.
        ctx.fillStyle = WALL_COLOR.toHex()

        type CornerDef = [SectionSide, SectionSide, number, number]
        const CORNERS: CornerDef[] = [
            [SectionSide.Top,    SectionSide.Left,  0,    0],
            [SectionSide.Top,    SectionSide.Right, CELL, 0],
            [SectionSide.Bottom, SectionSide.Left,  0,    CELL],
            [SectionSide.Bottom, SectionSide.Right, CELL, CELL],
        ]

        for (const [sideV, sideH, cx, cy] of CORNERS) {
            const { dx: dvx, dy: dvy } = NEIGHBOR_DELTA[sideV]
            const { dx: dhx, dy: dhy } = NEIGHBOR_DELTA[sideH]

            // Both perpendicular neighbours must be empty (no wall drawn on those sides)
            if (allSections.has(`${x + dvx},${y + dvy}`)) continue
            if (allSections.has(`${x + dhx},${y + dhy}`)) continue

            // Diagonal must be a ship section
            if (!allSections.has(`${x + dvx + dhx},${y + dvy + dhy}`)) continue

            ctx.fillRect(cx - WALL_THICKNESS / 2, cy - WALL_THICKNESS / 2, WALL_THICKNESS, WALL_THICKNESS)
        }
    }

}
