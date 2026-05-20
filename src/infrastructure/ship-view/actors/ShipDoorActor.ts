import { DoorState } from '@/domain/models/ship/rooms-layout'
import { Actor, Canvas, Engine, PointerButton, vec } from 'excalibur'

const CELL = 60
const WALL_THICKNESS    = 8
const HIT_AREA_THICKNESS = 20
const DOOR_THICKNESS = 4

// Must match ShipSectionActor
const DOOR_WALL_STUB = CELL / 5      // 12 px
const DOOR_SPAN      = CELL - 2 * DOOR_WALL_STUB  // 36 px
const PANEL_LEN      = DOOR_SPAN / 2               // 18 px

const DOOR_SPEED = 3   // 0→1 progress per second (~330 ms full travel)

const PANEL_FILL = '#9ca3af'   // metal grey
const PANEL_SEAM = '#6b7280'   // darker seam at the inner edge of each panel

export type DoorOrientation = 'horizontal' | 'vertical'

export interface ShipDoorActorArgs {
    orientation: DoorOrientation
    initialState: DoorState
}

export class ShipDoorActor extends Actor {

    private _open: boolean
    private _progress: number   // 0 = closed, 1 = fully open

    constructor({ orientation, initialState }: ShipDoorActorArgs) {
        const isH = orientation === 'horizontal'

        super({
            width:  isH ? CELL : HIT_AREA_THICKNESS,
            height: isH ? HIT_AREA_THICKNESS : CELL,
            anchor: vec(0.5, 0.5),
            z:      10,
        })

        this._open     = initialState === DoorState.Open
        this._progress = this._open ? 1 : 0

        const canvas = new Canvas({
            width:  isH ? CELL : HIT_AREA_THICKNESS,
            height: isH ? HIT_AREA_THICKNESS : CELL,
            cache: false,
            draw: (ctx) => this._drawPanels(ctx, isH),
        })

        this.graphics.use(canvas)

        this.on('pointerup', (evt) => {
            if (evt.button === PointerButton.Left) {
                this._open = !this._open
            }
        })
    }

    override onPreUpdate(_engine: Engine, delta: number): void {
        const target = this._open ? 1 : 0
        const diff   = target - this._progress

        if (Math.abs(diff) < 0.001) {
            this._progress = target
            return
        }

        this._progress += Math.sign(diff) * Math.min(Math.abs(diff), DOOR_SPEED * delta / 1000)
    }

    private _drawPanels(ctx: CanvasRenderingContext2D, isH: boolean): void {
        const w = isH ? CELL : HIT_AREA_THICKNESS
        const h = isH ? HIT_AREA_THICKNESS : CELL

        const t = Math.min(this._progress, (PANEL_LEN - 0.5) / PANEL_LEN)
        const o = (HIT_AREA_THICKNESS - DOOR_THICKNESS) / 2   // centre panels within hit area canvas

        // Each panel is a fixed PANEL_LEN rectangle that translates behind its
        // wall stub as the door opens.
        //
        // t=0 (closed): aStart=stub=12 → A=[12..30], bStart=30 → B=[30..48]
        //               panels meet in the middle, covering the full 36px gap
        // t=1 (open):   panels fully retracted behind the wall stubs (early-returned)
        const aStart = DOOR_WALL_STUB * (1 - t)
        const bStart = CELL - PANEL_LEN - DOOR_WALL_STUB * (1 - t)

        ctx.fillStyle = PANEL_FILL

        if (isH) {
            ctx.fillRect(aStart, o, PANEL_LEN, DOOR_THICKNESS)
            ctx.fillRect(bStart, o, PANEL_LEN, DOOR_THICKNESS)

            ctx.fillStyle = PANEL_SEAM
            ctx.fillRect(aStart + PANEL_LEN - 1, o, 1, DOOR_THICKNESS)
            ctx.fillRect(bStart,                 o, 1, DOOR_THICKNESS)
        } else {
            ctx.fillRect(o, aStart, DOOR_THICKNESS, PANEL_LEN)
            ctx.fillRect(o, bStart, DOOR_THICKNESS, PANEL_LEN)

            ctx.fillStyle = PANEL_SEAM
            ctx.fillRect(o, aStart + PANEL_LEN - 1, DOOR_THICKNESS, 1)
            ctx.fillRect(o, bStart,                 DOOR_THICKNESS, 1)
        }
    }
}
