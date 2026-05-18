import { produce } from 'immer'
import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'

export function removeRoom(layout: RoomsLayout, index: number): RoomsLayout {
  if (!layout.rooms.some((r) => r.index === index)) return layout

  return produce(layout, (draft) => {
    const roomIdx = draft.rooms.findIndex((r) => r.index === index)
    if (roomIdx !== -1) draft.rooms.splice(roomIdx, 1)
  })
}
