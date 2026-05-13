import type { RoomDoors, RoomsLayoutData } from '@/shared/rooms-editor'
import type { SVGProps } from 'react'
import { NEIGHBOR_DELTA, edgeLineCoords } from './geometry'

interface Props {
  layout: RoomsLayoutData
  /**
   * Called for every section edge. Return SVGProps to draw the wall line,
   * or null to skip it entirely.
   * neighborRoomIndex is undefined when the neighbor cell is unoccupied.
   * hasDoor is true when the section has a door on this side.
   */
  getLineProps: (
    roomIndex: number,
    sectionIndex: number,
    side: string,
    neighborRoomIndex: number | undefined,
    hasDoor: boolean,
  ) => SVGProps<SVGLineElement> | null
}

export function RoomWalls({ layout, getLineProps }: Props) {
  return (
    <>
      {layout.rooms.flatMap((room) =>
        room.sections.flatMap((section) =>
          ['left', 'right', 'top', 'bottom'].flatMap((side) => {
            const { dx, dy } = NEIGHBOR_DELTA[side]
            const nx = section.position.x + dx
            const ny = section.position.y + dy

            const neighborRoom = layout.rooms.find((r) =>
              r.sections.some((s) => s.position.x === nx && s.position.y === ny)
            )

            const hasDoor = section.doors[side as keyof RoomDoors] === true

            const lineProps = getLineProps(
              room.index,
              section.index,
              side,
              neighborRoom?.index,
              hasDoor,
            )

            if (!lineProps) return []

            const { x1, y1, x2, y2 } = edgeLineCoords(section.position.x, section.position.y, side)

            return [
              <line
                key={`wall-${room.index}-${section.index}-${side}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                {...lineProps}
              />,
            ]
          })
        )
      )}
    </>
  )
}
