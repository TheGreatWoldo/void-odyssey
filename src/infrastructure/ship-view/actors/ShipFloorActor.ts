import { type RoomsLayout } from '@/domain/models/ship/rooms-layout'
import { Actor, Canvas, vec } from 'excalibur'

const CELL = 60

const FILL_COLOR      = '#d4c4a0'
const BEVEL           = 2
const BEVEL_HIGHLIGHT = 'rgba(255, 245, 220, 0.45)'
const BEVEL_SHADOW    = 'rgba(0, 0, 0, 0.30)'

interface Args {
    layout: RoomsLayout
}

export class ShipFloorActor extends Actor {

    constructor({ layout }: Args) {
        const { width, height } = layout.mapSize

        const pixelWidth  = width  * CELL
        const pixelHeight = height * CELL

        super({
            pos:    vec(0, 0), // positioned by layout-loader
            width:  pixelWidth,
            height: pixelHeight,
            anchor: vec(0.5, 0.5),
            z:      0,
        })

        const canvas = new Canvas({
            width:  pixelWidth,
            height: pixelHeight,
            cache:  true,
            draw:   (ctx) => this._drawFloors(ctx, layout),
        })

        this.graphics.use(canvas)
    }

    private _drawFloors(ctx: CanvasRenderingContext2D, layout: RoomsLayout): void {
        for (const room of layout.rooms) {
            for (const section of room.sections) {
                const { x, y } = section.position
                const px = x * CELL
                const py = y * CELL

                ctx.fillStyle = FILL_COLOR
                ctx.fillRect(px, py, CELL, CELL)

                ctx.fillStyle = BEVEL_HIGHLIGHT
                ctx.fillRect(px, py, CELL, BEVEL)
                ctx.fillRect(px, py, BEVEL, CELL)

                ctx.fillStyle = BEVEL_SHADOW
                ctx.fillRect(px, py + CELL - BEVEL, CELL, BEVEL)
                ctx.fillRect(px + CELL - BEVEL, py, BEVEL, CELL)
            }
        }
    }
}
