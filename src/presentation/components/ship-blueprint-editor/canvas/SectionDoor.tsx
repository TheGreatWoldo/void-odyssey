import type { RoomsLayoutData, SectionSide } from '@/shared/ship-blueprint-editor'
import { DOOR_SIDES } from '@/shared/ship-blueprint-editor-geometry'
import type { SVGProps } from 'react'
import { doorLineCoords } from '../shared/geometry'

interface Props {
  layout: RoomsLayoutData
  /**
   * Called for every active door. Return SVGProps for the line element.
   */
  getLineProps: (
    roomIndex: number,
    sectionIndex: number,
    side: SectionSide,
  ) => SVGProps<SVGLineElement>
}

export function SectionDoor({ layout, getLineProps }: Props) {
  return (
    <>
      {layout.rooms.flatMap((room) =>
        room.sections.flatMap((section) =>
          DOOR_SIDES
            .filter((side) => section.doors.some((d) => d.side === side))
            .map((side) => {
              const { x1, y1, x2, y2 } = doorLineCoords(
                section.position.x,
                section.position.y,
                side,
              )
              const lineProps = getLineProps(room.index, section.index, side)
              return (
                <line
                  key={`door-${room.index}-${section.index}-${side}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  {...lineProps}
                />
              )
            })
        )
      )}
    </>
  )
}
