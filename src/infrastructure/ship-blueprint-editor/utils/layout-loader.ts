import { RoomSectionActor } from '@/infrastructure/ship-blueprint-editor/actors/RoomSectionActor'
import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import { CELL } from '@/shared/ship-blueprint-editor-geometry'
import { Scene, vec } from 'excalibur'

export function loadRoomsLayoutIntoScene(scene: Scene, layout: RoomsLayout): void {
  for (const actor of [...scene.actors]) {
    if (actor instanceof RoomSectionActor) {
      actor.kill()
    }
  }

  const { width, height } = layout.mapSize
  const gridPixelWidth = width * CELL
  const gridPixelHeight = height * CELL

  const cx = scene.engine.drawWidth / 2
  const cy = scene.engine.drawHeight / 2

  const offsetX = cx - gridPixelWidth / 2
  const offsetY = cy - gridPixelHeight / 2

  for (const room of layout.rooms) {
    for (const section of room.sections) {
      const actor = new RoomSectionActor({ section, layout })

      actor.pos = vec(
        offsetX + section.position.x * CELL + CELL / 2,
        offsetY + section.position.y * CELL + CELL / 2,
      )

      scene.add(actor)
    }
  }

  scene.camera.pos = vec(cx, cy)
}
