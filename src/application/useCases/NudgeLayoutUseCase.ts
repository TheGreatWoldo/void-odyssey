import { produce } from 'immer'
import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import { recalcRoomBounds } from '@/domain/services/rooms-layout-operations'

export function nudgeLayout(layout: RoomsLayout, dx: number, dy: number): RoomsLayout {
  if (dx === 0 && dy === 0) return layout

  return produce(layout, (draft) => {
    for (const room of draft.rooms) {
      for (const section of room.sections) {
        section.position.x += dx
        section.position.y += dy
      }
      recalcRoomBounds(room)
    }
  })
}
