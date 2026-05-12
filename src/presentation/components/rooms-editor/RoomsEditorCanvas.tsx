import type { EditorTool, RoomDoors, RoomSection, RoomsLayoutData } from '@/shared/rooms-editor'
import { useMemo, useState } from 'react'

const CELL = 60
const DOOR_THICKNESS = 4
const DOOR_HIT = 10
const CROSS_ARM = 7
const PAD = CROSS_ARM + 2 // padding so edge crosses are fully visible

// Blueprint palette (Tailwind color values)
const BP_BG = '#172554'              // blue-950
const BP_LINE = 'rgba(231,229,228,0.18)'  // stone-200/18
const BP_CROSS = '#e7e5e4' // stone-200

const DOOR_SIDES: (keyof RoomDoors)[] = ['left', 'right', 'top', 'bottom']
const ROOM_COLORS_FALLBACK = '#fadea5'

function doorLineCoords(
  cx: number,
  cy: number,
  side: keyof RoomDoors,
): { x1: number; y1: number; x2: number; y2: number } {
  const px = cx * CELL
  const py = cy * CELL
  const inset = DOOR_THICKNESS / 2

  switch (side) {
    case 'left':
      return { x1: px + inset, y1: py + inset, x2: px + inset, y2: py + CELL - inset }
    case 'right':
      return {
        x1: px + CELL - inset,
        y1: py + inset,
        x2: px + CELL - inset,
        y2: py + CELL - inset,
      }
    case 'top':
      return { x1: px + inset, y1: py + inset, x2: px + CELL - inset, y2: py + inset }
    case 'bottom':
      return {
        x1: px + inset,
        y1: py + CELL - inset,
        x2: px + CELL - inset,
        y2: py + CELL - inset,
      }
  }
}

function doorHitRect(
  cx: number,
  cy: number,
  side: keyof RoomDoors,
): { x: number; y: number; w: number; h: number } {
  const px = cx * CELL
  const py = cy * CELL
  const half = DOOR_HIT / 2

  switch (side) {
    case 'left':
      return { x: px - half, y: py, w: DOOR_HIT, h: CELL }
    case 'right':
      return { x: px + CELL - half, y: py, w: DOOR_HIT, h: CELL }
    case 'top':
      return { x: px, y: py - half, w: CELL, h: DOOR_HIT }
    case 'bottom':
      return { x: px, y: py + CELL - half, w: CELL, h: DOOR_HIT }
  }
}

interface Props {
  layout: RoomsLayoutData
  tool: EditorTool
  selectedRoomIndex: number
  onPaint: (x: number, y: number) => void
  onErase: (x: number, y: number) => void
  onToggleDoor: (x: number, y: number, side: keyof RoomDoors) => void
}

export function RoomsEditorCanvas({
  layout,
  tool,
  selectedRoomIndex,
  onPaint,
  onErase,
  onToggleDoor,
}: Props) {
  const { width, height } = layout.mapSize
  const svgWidth = width * CELL
  const svgHeight = height * CELL

  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null)

  const occupiedMap = useMemo(() => {
    const map = new Map<string, RoomSection>()
    for (const room of layout.rooms) {
      for (const section of room.sections) {
        map.set(`${section.position.x},${section.position.y}`, section)
      }
    }
    return map
  }, [layout.rooms])

  const selectedRoom = layout.rooms.find((r) => r.index === selectedRoomIndex)
  const selectedColor = selectedRoom?.color ?? ROOM_COLORS_FALLBACK

  const handleCellClick = (x: number, y: number) => {
    if (tool === 'paint') onPaint(x, y)
    else if (tool === 'erase') onErase(x, y)
  }

  return (
    <svg
      width={svgWidth + PAD * 2}
      height={svgHeight + PAD * 2}
      viewBox={`${-PAD} ${-PAD} ${svgWidth + PAD * 2} ${svgHeight + PAD * 2}`}
      shapeRendering="crispEdges"
      style={{ display: 'block', userSelect: 'none', maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
    >
      {/* Blueprint background — covers full viewBox including padding */}
      <rect x={-PAD} y={-PAD} width={svgWidth + PAD * 2} height={svgHeight + PAD * 2} fill={BP_BG} />

      {/* Vertical grid lines */}
      {Array.from({ length: width + 1 }, (_, col) => (
        <line
          key={`vline-${col}`}
          x1={col * CELL}
          y1={0}
          x2={col * CELL}
          y2={svgHeight}
          stroke={BP_LINE}
          strokeWidth={1}
        />
      ))}

      {/* Horizontal grid lines */}
      {Array.from({ length: height + 1 }, (_, row) => (
        <line
          key={`hline-${row}`}
          x1={0}
          y1={row * CELL}
          x2={svgWidth}
          y2={row * CELL}
          stroke={BP_LINE}
          strokeWidth={1}
        />
      ))}

      {/* Cross marks at each grid intersection */}
      {Array.from({ length: height + 1 }, (_, row) =>
        Array.from({ length: width + 1 }, (_, col) => {
          const cx = col * CELL
          const cy = row * CELL
          return (
            <g key={`cross-${col}-${row}`}>
              <line x1={cx - CROSS_ARM} y1={cy} x2={cx + CROSS_ARM} y2={cy} stroke={BP_CROSS} strokeWidth={3} />
              <line x1={cx} y1={cy - CROSS_ARM} x2={cx} y2={cy + CROSS_ARM} stroke={BP_CROSS} strokeWidth={3} />
            </g>
          )
        })
      )}

      {/* Invisible hit rects for paint/erase interaction */}
      {Array.from({ length: height }, (_, row) =>
        Array.from({ length: width }, (_, col) => (
          <rect
            key={`cell-${col}-${row}`}
            x={col * CELL}
            y={row * CELL}
            width={CELL}
            height={CELL}
            fill="transparent"
            stroke="none"
            onClick={() => handleCellClick(col, row)}
            onMouseEnter={() => setHovered({ x: col, y: row })}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: tool === 'paint' || tool === 'erase' ? 'crosshair' : 'default' }}
          />
        ))
      )}

      {/* Hover highlight for paint/erase (only on empty or occupied cells respectively) */}
      {hovered &&
        tool !== 'door' &&
        (() => {
          const isOccupied = occupiedMap.has(`${hovered.x},${hovered.y}`)
          const showHover =
            (tool === 'paint' && !isOccupied) || (tool === 'erase' && isOccupied)

          if (!showHover) return null

          return (
            <rect
              x={hovered.x * CELL + 1}
              y={hovered.y * CELL + 1}
              width={CELL - 2}
              height={CELL - 2}
              fill={tool === 'erase' ? 'rgba(186,5,2,0.4)' : `${selectedColor}88`}
              style={{ pointerEvents: 'none' }}
            />
          )
        })()}

      {/* Occupied sections */}
      {layout.rooms.flatMap((room) =>
        room.sections.map((section) => (
          <rect
            key={`section-${room.index}-${section.index}`}
            x={section.position.x * CELL + 1}
            y={section.position.y * CELL + 1}
            width={CELL - 2}
            height={CELL - 2}
            fill={room.color}
            stroke="#1e293b"
            strokeWidth={2}
            onClick={() => handleCellClick(section.position.x, section.position.y)}
            onMouseEnter={() => setHovered({ x: section.position.x, y: section.position.y })}
            onMouseLeave={() => setHovered(null)}
            style={{
              cursor:
                tool === 'paint' || tool === 'erase' ? 'crosshair' : 'default',
            }}
          />
        ))
      )}

      {/* Door lines */}
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
              return (
                <line
                  key={`door-${room.index}-${section.index}-${side}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#facc15"
                  strokeWidth={DOOR_THICKNESS}
                  strokeLinecap="round"
                  style={{ pointerEvents: 'none' }}
                />
              )
            })
        )
      )}

      {/* Door hit targets (only in door tool) */}
      {tool === 'door' &&
        layout.rooms.flatMap((room) =>
          room.sections.flatMap((section) =>
            DOOR_SIDES.map((side) => {
              const { x, y, w, h } = doorHitRect(
                section.position.x,
                section.position.y,
                side,
              )
              return (
                <rect
                  key={`hit-${room.index}-${section.index}-${side}`}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="transparent"
                  stroke="rgba(250,204,21,0.3)"
                  strokeWidth={1}
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    onToggleDoor(section.position.x, section.position.y, side)
                  }
                />
              )
            })
          )
        )}
    </svg>
  )
}
