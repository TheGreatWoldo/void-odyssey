import { produce } from 'immer'
import type { Room, RoomsLayout } from '@/domain/models/ship/rooms-layout'
import {
  createSection,
  findAdjacentSameColorRooms,
  inheritDoorsFromNeighbors,
  mergeAdjacentRoomsIntoCheapest,
  nextSectionIndex,
  recalcRoomBounds,
  sectionAt,
} from '@/domain/services/rooms-layout-operations'

export function paintSection(layout: RoomsLayout, x: number, y: number, selectedColor: string): RoomsLayout {
  if (sectionAt(layout, x, y)) return layout

  return produce(layout, (draft) => {
    const adjacentIndices = findAdjacentSameColorRooms(draft, x, y, selectedColor)

    let targetRoom: Room

    if (adjacentIndices.size === 0) {
      const nextIndex =
        draft.rooms.length === 0
          ? 0
          : Math.max(...draft.rooms.map((r) => r.index)) + 1

      const newRoom: Room = {
        index: nextIndex,
        color: selectedColor,
        position: { x, y },
        size: { width: 1, height: 1 },
        sections: [],
      }
      draft.rooms.push(newRoom)
      targetRoom = newRoom
    } else {
      const adjacentRooms = draft.rooms
        .filter((r) => adjacentIndices.has(r.index))
        .sort((a, b) => a.index - b.index)
      targetRoom = mergeAdjacentRoomsIntoCheapest(adjacentRooms, draft)
    }

    const doors = inheritDoorsFromNeighbors(draft, x, y)
    const section = createSection({ x, y }, doors, targetRoom.index, nextSectionIndex(targetRoom))
    targetRoom.sections.push(section)
    recalcRoomBounds(targetRoom)
  })
}
