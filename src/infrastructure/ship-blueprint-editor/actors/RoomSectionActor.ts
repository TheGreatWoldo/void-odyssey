import { SectionSide, type Section, type RoomsLayout } from '@/domain/models/ship/rooms-layout'
import { CELL, DOOR_SIDES, DOOR_THICKNESS, DOOR_WALL_STUB, NEIGHBOR_DELTA } from '@/shared/ship-blueprint-editor-geometry'
import { Actor, Canvas, Color, vec } from 'excalibur'

const WALL_WIDTH = DOOR_THICKNESS * 2
const WALL_COLOR = Color.fromHex('#000000')
const DOOR_COLOR = Color.fromHex('#9ca3af')

interface Args {
  section: Section
  layout: RoomsLayout
}

export class RoomSectionActor extends Actor {
  constructor({ section, layout }: Args) {
    super({
      pos: vec(
        section.position.x * CELL + CELL / 2,
        section.position.y * CELL + CELL / 2,
      ),
      width: CELL,
      height: CELL,
      anchor: vec(0.5, 0.5),
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
    ctx.lineWidth = WALL_WIDTH
    ctx.lineCap = 'square'

    const { x, y } = section.position

    for (const side of DOOR_SIDES) {
      const { dx, dy } = NEIGHBOR_DELTA[side]
      const nx = x + dx
      const ny = y + dy

      const neighborSection = layout.rooms
        .flatMap((r) => r.sections)
        .find((s) => s.position.x === nx && s.position.y === ny)

      // Same room neighbor — skip (interior seam, not a wall)
      if (neighborSection?.room === section.room) continue

      const hasDoor = section.doors.some((d) => d.side === side)

      if (hasDoor) {
        const stub = DOOR_WALL_STUB
        ctx.beginPath()
        if (side === SectionSide.Left) {
          ctx.moveTo(0, 0);       ctx.lineTo(0, stub)
          ctx.moveTo(0, CELL - stub); ctx.lineTo(0, CELL)
        } else if (side === SectionSide.Right) {
          ctx.moveTo(CELL, 0);       ctx.lineTo(CELL, stub)
          ctx.moveTo(CELL, CELL - stub); ctx.lineTo(CELL, CELL)
        } else if (side === SectionSide.Top) {
          ctx.moveTo(0, 0);       ctx.lineTo(stub, 0)
          ctx.moveTo(CELL - stub, 0); ctx.lineTo(CELL, 0)
        } else {
          ctx.moveTo(0, CELL);       ctx.lineTo(stub, CELL)
          ctx.moveTo(CELL - stub, CELL); ctx.lineTo(CELL, CELL)
        }
        ctx.stroke()

        const panelStart = stub + DOOR_THICKNESS
        const half = CELL / 2
        ctx.strokeStyle = DOOR_COLOR.toHex()
        ctx.lineWidth = DOOR_THICKNESS / 2
        ctx.beginPath()
        if (side === SectionSide.Left) {
          const px = DOOR_THICKNESS / 2
          ctx.moveTo(px, panelStart); ctx.lineTo(px, half)
          ctx.moveTo(px, half);       ctx.lineTo(px, CELL - panelStart)
        } else if (side === SectionSide.Right) {
          const px = CELL - DOOR_THICKNESS / 2
          ctx.moveTo(px, panelStart); ctx.lineTo(px, half)
          ctx.moveTo(px, half);       ctx.lineTo(px, CELL - panelStart)
        } else if (side === SectionSide.Top) {
          const py = DOOR_THICKNESS / 2
          ctx.moveTo(panelStart, py); ctx.lineTo(half, py)
          ctx.moveTo(half, py);       ctx.lineTo(CELL - panelStart, py)
        } else {
          const py = CELL - DOOR_THICKNESS / 2
          ctx.moveTo(panelStart, py); ctx.lineTo(half, py)
          ctx.moveTo(half, py);       ctx.lineTo(CELL - panelStart, py)
        }
        ctx.stroke()

        ctx.strokeStyle = WALL_COLOR.toHex()
        ctx.lineWidth = WALL_WIDTH
        ctx.lineCap = 'square'
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
  }
}
