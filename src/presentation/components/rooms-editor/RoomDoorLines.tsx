import type { RoomDoors, RoomsLayoutData } from '@/shared/rooms-editor'
import type { SVGProps } from 'react'
import { DOOR_SIDES, doorLineCoords } from './geometry'

interface Props {
  layout: RoomsLayoutData
  /**
   * Called for every active door. Return SVGProps for the line element.
   */
  getLineProps: (
    roomIndex: number,
    sectionIndex: number,
    side: keyof RoomDoors,
  ) => SVGProps<SVGLineElement>
}

export function RoomDoorLines({ layout, getLineProps }: Props) {
  return (
    <>
      {layout.rooms.flatMap((room) =>
        room.sections.flatMap((section) =>
          DOOR_SIDES
            .filter((side) => section.doors[side])
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
