import type { RoomSection, RoomsLayoutData } from '@/shared/rooms-editor'
import { CELL, DOOR_THICKNESS, DOOR_WALL_STUB, NEIGHBOR_DELTA } from '@/shared/rooms-editor-geometry'
import { Actor, Canvas, Color, vec } from 'excalibur'

const WALL_WIDTH = DOOR_THICKNESS * 2
const FILL_COLOR = Color.fromHex('#ffffff')
const WALL_COLOR = Color.fromHex('#000000')
const DOOR_COLOR = Color.fromHex('#9ca3af')

interface Args {
  section: RoomSection
  layout: RoomsLayoutData
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
    section: RoomSection,
    layout: RoomsLayoutData,
  ): void {
    // Fill
    ctx.fillStyle = FILL_COLOR.toHex()
    ctx.fillRect(0, 0, CELL, CELL)

    ctx.strokeStyle = WALL_COLOR.toHex()
    ctx.lineWidth = WALL_WIDTH
    ctx.lineCap = 'square'

    const { x, y } = section.position

    for (const side of ['left', 'right', 'top', 'bottom'] as const) {
      const { dx, dy } = NEIGHBOR_DELTA[side]
      const nx = x + dx
      const ny = y + dy

      const neighborSection = layout.rooms
        .flatMap((r) => r.sections)
        .find((s) => s.position.x === nx && s.position.y === ny)

      // Same room neighbor — skip (interior seam, not a wall)
      if (neighborSection?.room === section.room) continue

      const hasDoor = section.doors[side]

      if (hasDoor) {
        // Two stub lines framing the door gap
        const stub = DOOR_WALL_STUB
        ctx.beginPath()
        if (side === 'left') {
          ctx.moveTo(0, 0);       ctx.lineTo(0, stub)
          ctx.moveTo(0, CELL - stub); ctx.lineTo(0, CELL)
        } else if (side === 'right') {
          ctx.moveTo(CELL, 0);       ctx.lineTo(CELL, stub)
          ctx.moveTo(CELL, CELL - stub); ctx.lineTo(CELL, CELL)
        } else if (side === 'top') {
          ctx.moveTo(0, 0);       ctx.lineTo(stub, 0)
          ctx.moveTo(CELL - stub, 0); ctx.lineTo(CELL, 0)
        } else {
          ctx.moveTo(0, CELL);       ctx.lineTo(stub, CELL)
          ctx.moveTo(CELL - stub, CELL); ctx.lineTo(CELL, CELL)
        }
        ctx.stroke()

        // Door panel lines (two halves meeting at center)
        const panelStart = stub + DOOR_THICKNESS
        const half = CELL / 2
        ctx.strokeStyle = DOOR_COLOR.toHex()
        ctx.lineWidth = DOOR_THICKNESS / 2
        ctx.beginPath()
        if (side === 'left') {
          const px = DOOR_THICKNESS / 2
          ctx.moveTo(px, panelStart); ctx.lineTo(px, half)
          ctx.moveTo(px, half);       ctx.lineTo(px, CELL - panelStart)
        } else if (side === 'right') {
          const px = CELL - DOOR_THICKNESS / 2
          ctx.moveTo(px, panelStart); ctx.lineTo(px, half)
          ctx.moveTo(px, half);       ctx.lineTo(px, CELL - panelStart)
        } else if (side === 'top') {
          const py = DOOR_THICKNESS / 2
          ctx.moveTo(panelStart, py); ctx.lineTo(half, py)
          ctx.moveTo(half, py);       ctx.lineTo(CELL - panelStart, py)
        } else {
          const py = CELL - DOOR_THICKNESS / 2
          ctx.moveTo(panelStart, py); ctx.lineTo(half, py)
          ctx.moveTo(half, py);       ctx.lineTo(CELL - panelStart, py)
        }
        ctx.stroke()

        // Reset for next wall
        ctx.strokeStyle = WALL_COLOR.toHex()
        ctx.lineWidth = WALL_WIDTH
        ctx.lineCap = 'square'
      } else {
        // Full wall line
        ctx.beginPath()
        if (side === 'left') {
          ctx.moveTo(0, 0); ctx.lineTo(0, CELL)
        } else if (side === 'right') {
          ctx.moveTo(CELL, 0); ctx.lineTo(CELL, CELL)
        } else if (side === 'top') {
          ctx.moveTo(0, 0); ctx.lineTo(CELL, 0)
        } else {
          ctx.moveTo(0, CELL); ctx.lineTo(CELL, CELL)
        }
        ctx.stroke()
      }
    }
  }
}
