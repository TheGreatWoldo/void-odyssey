import { produce } from 'immer'
import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import { recalcRoomBounds, sectionAt } from '@/domain/services/rooms-layout-operations'

export function eraseSection(layout: RoomsLayout, x: number, y: number): RoomsLayout {
  if (!sectionAt(layout, x, y)) return layout

  return produce(layout, (draft) => {
    for (const room of draft.rooms) {
      const idx = room.sections.findIndex((s) => s.position.x === x && s.position.y === y)

      if (idx !== -1) {
        room.sections.splice(idx, 1)
        if (room.sections.length === 0) {
          const roomIdx = draft.rooms.indexOf(room)
          draft.rooms.splice(roomIdx, 1)
        } else {
          recalcRoomBounds(room)
        }
        return
      }
    }
  })
}
