import { produce } from 'immer'
import type { RoomsLayout, SectionSide } from '@/domain/models/ship/rooms-layout'
import { DoorState } from '@/domain/models/ship/rooms-layout'
import { NEIGHBOR_OFFSET, OPPOSING, sectionAt } from '@/domain/services/rooms-layout-operations'

export function toggleDoor(layout: RoomsLayout, x: number, y: number, side: SectionSide): RoomsLayout {
  if (!sectionAt(layout, x, y)) return layout

  return produce(layout, (draft) => {
    const hit = sectionAt(draft, x, y)
    if (!hit) return

    const { section } = hit
    const existingIdx = section.doors.findIndex((d) => d.side === side)

    if (existingIdx === -1) {
      section.doors.push({ side, state: DoorState.Closed })
    } else {
      section.doors.splice(existingIdx, 1)
    }

    const doorNowPresent = existingIdx === -1
    const offset = NEIGHBOR_OFFSET[side]
    const neighbor = sectionAt(draft, x + offset.dx, y + offset.dy)

    if (neighbor) {
      const opposingSide = OPPOSING[side]
      const neighborIdx = neighbor.section.doors.findIndex((d) => d.side === opposingSide)

      if (doorNowPresent && neighborIdx === -1) {
        neighbor.section.doors.push({ side: opposingSide, state: DoorState.Closed })
      } else if (!doorNowPresent && neighborIdx !== -1) {
        neighbor.section.doors.splice(neighborIdx, 1)
      }
    }
  })
}
