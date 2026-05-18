import { produce } from 'immer'
import type { RoomsLayout, SectionSide } from '@/domain/models/ship/rooms-layout'
import { NEIGHBOR_OFFSET, OPPOSING, sectionAt } from '@/domain/services/rooms-layout-operations'

export function removeDoor(layout: RoomsLayout, x: number, y: number, side: SectionSide): RoomsLayout {
  if (!sectionAt(layout, x, y)) return layout

  return produce(layout, (draft) => {
    const hit = sectionAt(draft, x, y)
    if (!hit) return

    const { section } = hit
    const idx = section.doors.findIndex((d) => d.side === side)
    if (idx !== -1) section.doors.splice(idx, 1)

    const offset = NEIGHBOR_OFFSET[side]
    const neighbor = sectionAt(draft, x + offset.dx, y + offset.dy)

    if (neighbor) {
      const opposingSide = OPPOSING[side]
      const neighborIdx = neighbor.section.doors.findIndex((d) => d.side === opposingSide)
      if (neighborIdx !== -1) neighbor.section.doors.splice(neighborIdx, 1)
    }
  })
}
