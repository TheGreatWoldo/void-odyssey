import type { RoomsLayoutData } from '@/shared/rooms-editor'
import { CELL, DOOR_SIDES, DOOR_THICKNESS, NEIGHBOR_DELTA } from '@/shared/rooms-editor-geometry'
import { doorSeamCoords, splitDoorLineCoords } from './geometry'
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
        getLineProps={(roomIndex, _sectionIndex, _side, neighborRoomIndex, _hasDoor) => {
          if (neighborRoomIndex === roomIndex) return null
          return { stroke: 'black', strokeWidth: DOOR_THICKNESS * 2, strokeLinecap: 'square' }
        }}
      />

      {/* Doors — two panels that animate open/closed, with a seam that fades out.
          Each shared edge is rendered only once: right/bottom are canonical for interior doors. */}
      {layout.rooms.flatMap((room) =>
        room.sections.flatMap((section) =>
          DOOR_SIDES
            .filter((side) => {
              if (!section.doors[side]) return false
              const { dx, dy } = NEIGHBOR_DELTA[side]
              const nx = section.position.x + dx
              const ny = section.position.y + dy
              const hasNeighbor = layout.rooms.some((r) =>
                r.sections.some((s) => s.position.x === nx && s.position.y === ny)
              )
              // skip left/top for interior doors — the neighbor's right/bottom will render it
              if (hasNeighbor && (side === 'left' || side === 'top')) return false
              return true
            })
            .flatMap((side) => {
              const [seg1, seg2] = splitDoorLineCoords(section.position.x, section.position.y, side)
              const seam = doorSeamCoords(section.position.x, section.position.y, side)

              const isVertical = side === 'left' || side === 'right'
              const animAttr1 = isVertical ? 'y2' : 'x2'
              const animAttr2 = isVertical ? 'y1' : 'x1'

              // closed = inner (half) end; open = outer (stub) end — panel retracts into wall
              const closedVal1 = isVertical ? seg1.y2 : seg1.x2
              const openVal1   = isVertical ? seg1.y1 : seg1.x1
              const closedVal2 = isVertical ? seg2.y1 : seg2.x1
              const openVal2   = isVertical ? seg2.y2 : seg2.x2

              const dur = '4s'
              // 0→0.1 closed, 0.1→0.4 opening, 0.4→0.6 open, 0.6→0.9 closing, 0.9→1 closed
              const keyTimes = '0;0.1;0.4;0.6;0.9;1'
              const calcMode = 'spline' as const
              const keySplines = '0 0 1 1;0.4 0 0.6 1;0 0 1 1;0.4 0 0.6 1;0 0 1 1'

              return [
                <line
                  key={`door-${room.index}-${section.index}-${side}-a`}
                  {...seg1}
                  stroke="#9ca3af"
                  strokeWidth={DOOR_THICKNESS / 2}
                >
                  <animate
                    attributeName={animAttr1}
                    values={`${closedVal1};${closedVal1};${openVal1};${openVal1};${closedVal1};${closedVal1}`}
                    keyTimes={keyTimes}
                    calcMode={calcMode}
                    keySplines={keySplines}
                    dur={dur}
                    repeatCount="indefinite"
                  />
                </line>,
                <line
                  key={`door-${room.index}-${section.index}-${side}-b`}
                  {...seg2}
                  stroke="#9ca3af"
                  strokeWidth={DOOR_THICKNESS / 2}
                >
                  <animate
                    attributeName={animAttr2}
                    values={`${closedVal2};${closedVal2};${openVal2};${openVal2};${closedVal2};${closedVal2}`}
                    keyTimes={keyTimes}
                    calcMode={calcMode}
                    keySplines={keySplines}
                    dur={dur}
                    repeatCount="indefinite"
                  />
                </line>,
                <line
                  key={`door-${room.index}-${section.index}-${side}-seam`}
                  {...seam}
                  stroke="#6b7280"
                  strokeWidth={1}
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="1;0;0;0;1;1"
                    keyTimes={keyTimes}
                    calcMode="discrete"
                    dur={dur}
                    repeatCount="indefinite"
                  />
                </line>,
              ]
            })
        )
      )}

    </svg>
  )
}
