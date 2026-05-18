import { produce } from 'immer'
import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import { recalcRoomBounds } from '@/domain/services/rooms-layout-operations'

export function resizeLayout(
  layout: RoomsLayout,
  width: number,
  height: number,
  autoRecenter: boolean,
): RoomsLayout {
  return produce(layout, (draft) => {
    const allSections = draft.rooms.flatMap((r) => r.sections)

    if (autoRecenter && allSections.length > 0) {
      const minX = Math.min(...allSections.map((s) => s.position.x))
      const minY = Math.min(...allSections.map((s) => s.position.y))
      const maxX = Math.max(...allSections.map((s) => s.position.x))
      const maxY = Math.max(...allSections.map((s) => s.position.y))

      const layoutW = maxX - minX + 1
      const layoutH = maxY - minY + 1

      const dx = width !== draft.mapSize.width ? Math.floor((width - layoutW) / 2) - minX : 0
      const dy = height !== draft.mapSize.height ? Math.floor((height - layoutH) / 2) - minY : 0

      if (dx !== 0 || dy !== 0) {
        for (const room of draft.rooms) {
          for (const section of room.sections) {
            section.position.x += dx
            section.position.y += dy
          }
          recalcRoomBounds(room)
        }
      }
    }

    draft.mapSize = { width, height }
  })
}
