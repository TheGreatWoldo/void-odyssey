import { SectionSide, type RoomsLayout, type Section } from '@/domain/models/ship/rooms-layout'
import { Actor, Canvas, Color, vec } from 'excalibur'

const CELL = 60
const SECTION_GAP = 0
const WALL_THICKNESS = 8
const DOOR_WALL_STUB = CELL / 5
const WALL_COLOR = Color.fromHex('#000000')

const SIDES = [SectionSide.Left, SectionSide.Right, SectionSide.Top, SectionSide.Bottom] as const

const NEIGHBOR_DELTA: Record<SectionSide, { dx: number; dy: number }> = {
    [SectionSide.Left]:   { dx: -1, dy:  0 },
    [SectionSide.Right]:  { dx:  1, dy:  0 },
    [SectionSide.Top]:    { dx:  0, dy: -1 },
    [SectionSide.Bottom]: { dx:  0, dy:  1 },
}

export const SHIP_SECTION_CELL = CELL
export const SHIP_SECTION_GAP = SECTION_GAP
export const SHIP_SECTION_WALL_THICKNESS = WALL_THICKNESS

interface Args {
    section: Section
    layout: RoomsLayout
}

export class ShipSectionActor extends Actor {
    constructor({ section, layout }: Args) {
        super({
            pos: vec(
                section.position.x * (CELL + SECTION_GAP) + CELL / 2,
                section.position.y * (CELL + SECTION_GAP) + CELL / 2,
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
            draw: (ctx) => this.drawCell(ctx, section, layout),
        })

        this.graphics.use(canvas)
    }

    private drawCell(
        ctx: CanvasRenderingContext2D,
        section: Section,
        layout: RoomsLayout,
    ): void {
        ctx.strokeStyle = WALL_COLOR.toHex()
        ctx.lineWidth = WALL_THICKNESS
        ctx.lineCap = 'square'

        const { x, y } = section.position
        const doorSides = section.doors.map((d) => d.side)

        for (const side of SIDES) {
            const { dx, dy } = NEIGHBOR_DELTA[side]
            const nx = x + dx
            const ny = y + dy

            const neighbor = layout.rooms
                .flatMap((r) => r.sections)
                .find((s) => s.position.x === nx && s.position.y === ny)

            // Same room neighbor — skip (interior seam, not a wall)
            if (neighbor?.room === section.room) continue

            if (doorSides.includes(side)) {
                const stub = DOOR_WALL_STUB
                ctx.beginPath()
                if (side === SectionSide.Left) {
                    ctx.moveTo(0, 0); ctx.lineTo(0, stub)
                    ctx.moveTo(0, CELL - stub); ctx.lineTo(0, CELL)
                } else if (side === SectionSide.Right) {
                    ctx.moveTo(CELL, 0); ctx.lineTo(CELL, stub)
                    ctx.moveTo(CELL, CELL - stub); ctx.lineTo(CELL, CELL)
                } else if (side === SectionSide.Top) {
                    ctx.moveTo(0, 0); ctx.lineTo(stub, 0)
                    ctx.moveTo(CELL - stub, 0); ctx.lineTo(CELL, 0)
                } else {
                    ctx.moveTo(0, CELL); ctx.lineTo(stub, CELL)
                    ctx.moveTo(CELL - stub, CELL); ctx.lineTo(CELL, CELL)
                }
                ctx.stroke()
            } else {
                ctx.beginPath()
                if (side === SectionSide.Left) {
                    ctx.moveTo(0, 0); ctx.lineTo(0, CELL)
                } else if (side === SectionSide.Right) {
                    ctx.moveTo(CELL, 0); ctx.lineTo(CELL, CELL)
                } else if (side === SectionSide.Top) {
                    ctx.moveTo(0, 0); ctx.lineTo(CELL, 0)
                } else {
                    ctx.moveTo(0, CELL); ctx.lineTo(CELL, CELL)
                }
                ctx.stroke()
            }
        }

        // Fill concave corners: where two perpendicular sides are both interior
        // but the diagonal neighbour is exterior — this section owns that corner pixel.
        const allSections = layout.rooms.flatMap((r) => r.sections)

        ctx.fillStyle = WALL_COLOR.toHex()

        type CornerDef = [SectionSide, SectionSide, number, number]
        const CORNERS: CornerDef[] = [
            [SectionSide.Top,    SectionSide.Left,  0,    0],
            [SectionSide.Top,    SectionSide.Right, CELL, 0],
            [SectionSide.Bottom, SectionSide.Left,  0,    CELL],
            [SectionSide.Bottom, SectionSide.Right, CELL, CELL],
        ]

        for (const [sideV, sideH, cx, cy] of CORNERS) {
            const vNeighbor = allSections.find((s) => {
                const { dx, dy } = NEIGHBOR_DELTA[sideV]
                return s.position.x === x + dx && s.position.y === y + dy
            })
            const hNeighbor = allSections.find((s) => {
                const { dx, dy } = NEIGHBOR_DELTA[sideH]
                return s.position.x === x + dx && s.position.y === y + dy
            })

            if (vNeighbor?.room !== section.room || hNeighbor?.room !== section.room) continue

            const { dx: dvx, dy: dvy } = NEIGHBOR_DELTA[sideV]
            const { dx: dhx, dy: dhy } = NEIGHBOR_DELTA[sideH]
            const diagSection = allSections.find(
                (s) => s.position.x === x + dvx + dhx && s.position.y === y + dvy + dhy,
            )

            if (diagSection?.room === section.room) continue

            ctx.fillRect(cx - WALL_THICKNESS / 2, cy - WALL_THICKNESS / 2, WALL_THICKNESS, WALL_THICKNESS)
        }
    }
}
