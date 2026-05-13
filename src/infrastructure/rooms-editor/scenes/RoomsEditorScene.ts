import type { RoomsLayoutData } from '@/shared/rooms-editor'
import { CELL } from '@/shared/rooms-editor-geometry'
import { Color, Scene, vec } from 'excalibur'
import { RoomSectionActor } from '../actors/RoomSectionActor'

export class RoomsEditorScene extends Scene {
  private layout: RoomsLayoutData | null = null

  override onInitialize(): void {
    this.backgroundColor = Color.fromHex('#111827')
  }

  loadLayout(layout: RoomsLayoutData): void {
    this.layout = layout

    // Remove all existing section actors
    for (const actor of [...this.actors]) {
      if (actor instanceof RoomSectionActor) {
        actor.kill()
      }
    }

    const { width, height } = layout.mapSize
    const gridPixelWidth = width * CELL
    const gridPixelHeight = height * CELL

    // Centre of the engine viewport
    const cx = this.engine.drawWidth / 2
    const cy = this.engine.drawHeight / 2

    // Offset so the grid is centered on screen
    const offsetX = cx - gridPixelWidth / 2
    const offsetY = cy - gridPixelHeight / 2

    for (const room of layout.rooms) {
      for (const section of room.sections) {
        const actor = new RoomSectionActor({ section, layout })

        // Shift actor position by the centering offset
        actor.pos = vec(
          offsetX + section.position.x * CELL + CELL / 2,
          offsetY + section.position.y * CELL + CELL / 2,
        )

        this.add(actor)
      }
    }

    this.camera.pos = vec(cx, cy)
  }
}
