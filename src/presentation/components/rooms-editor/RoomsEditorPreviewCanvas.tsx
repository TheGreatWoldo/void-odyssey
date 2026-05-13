import type { RoomsLayoutData } from '@/shared/rooms-editor'
import { CELL, DOOR_SIDES, DOOR_THICKNESS, NEIGHBOR_DELTA, doorFrameCoords, doorSeamCoords, splitDoorLineCoords } from './geometry'
import { RoomWalls } from './RoomWalls'

const PAD = 8

interface Props {
  layout: RoomsLayoutData
}

export function RoomsEditorPreviewCanvas({ layout }: Props) {
  const { width, height } = layout.mapSize
  const svgWidth = width * CELL
  const svgHeight = height * CELL

  return (
    <svg
      width={svgWidth + PAD * 2}
      height={svgHeight + PAD * 2}
      viewBox={`${-PAD} ${-PAD} ${svgWidth + PAD * 2} ${svgHeight + PAD * 2}`}
      shapeRendering="crispEdges"
      style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
    >
      {/* Background */}
      <rect x={-PAD} y={-PAD} width={svgWidth + PAD * 2} height={svgHeight + PAD * 2} fill="#111827" />

      {/* Room fills — white */}
      {layout.rooms.flatMap((room) =>
        room.sections.map((section) => (
          <rect
            key={`fill-${room.index}-${section.index}`}
            x={section.position.x * CELL}
            y={section.position.y * CELL}
            width={CELL}
            height={CELL}
            fill="white"
          />
        ))
      )}

      {/* Walls — black on inter-room and exterior edges, skipped where a door exists */}
      <RoomWalls
        layout={layout}
        getLineProps={(roomIndex, _sectionIndex, _side, neighborRoomIndex, hasDoor) => {
          if (neighborRoomIndex === roomIndex) return null
          if (hasDoor) return null
          return { stroke: 'black', strokeWidth: DOOR_THICKNESS * 2, strokeLinecap: 'square' }
        }}
      />

      {/* Doors — wall frame stubs + two closed panels meeting at centre with a seam.
          Each shared edge is rendered only once: right/bottom are canonical for interior doors. */}
      {layout.rooms.flatMap((room) =>
        room.sections.flatMap((section) =>
          DOOR_SIDES
            .filter((side) => section.doors[side])
            .filter((side) => {
              // For interior doors skip the non-canonical side so we don't draw twice.
              // left is non-canonical when right-neighbor exists; top when bottom-neighbor exists.
              if (side !== 'left' && side !== 'top') return true
              const { dx, dy } = NEIGHBOR_DELTA[side]
              const nx = section.position.x + dx
              const ny = section.position.y + dy
              const neighborSection = layout.rooms
                .flatMap((r) => r.sections)
                .find((s) => s.position.x === nx && s.position.y === ny)
              // If the neighbor also has the opposing door, skip — it will draw from its side.
              const opposing = side === 'left' ? 'right' : 'bottom'
              return !neighborSection?.doors[opposing]
            })
            .flatMap((side) => {
              const [frame1, frame2] = doorFrameCoords(section.position.x, section.position.y, side)
              const [seg1, seg2] = splitDoorLineCoords(section.position.x, section.position.y, side)
              const seam = doorSeamCoords(section.position.x, section.position.y, side)
              return [
                <line
                  key={`door-${room.index}-${section.index}-${side}-frame1`}
                  {...frame1}
                  stroke="black"
                  strokeWidth={DOOR_THICKNESS * 2}
                  strokeLinecap="square"
                />,
                <line
                  key={`door-${room.index}-${section.index}-${side}-frame2`}
                  {...frame2}
                  stroke="black"
                  strokeWidth={DOOR_THICKNESS * 2}
                  strokeLinecap="square"
                />,
                <line
                  key={`door-${room.index}-${section.index}-${side}-a`}
                  {...seg1}
                  stroke="#9ca3af"
                  strokeWidth={DOOR_THICKNESS}
                />,
                <line
                  key={`door-${room.index}-${section.index}-${side}-b`}
                  {...seg2}
                  stroke="#9ca3af"
                  strokeWidth={DOOR_THICKNESS}
                />,
                <line
                  key={`door-${room.index}-${section.index}-${side}-seam`}
                  {...seam}
                  stroke="#6b7280"
                  strokeWidth={1}
                />,
              ]
            })
        )
      )}
    </svg>
  )
}
