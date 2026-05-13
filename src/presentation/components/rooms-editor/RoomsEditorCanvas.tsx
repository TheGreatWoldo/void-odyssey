import type { EditorTool, RoomDoors, RoomSection, RoomsLayoutData } from '@/shared/rooms-editor'
import { CELL, DOOR_THICKNESS, NEIGHBOR_DELTA } from '@/shared/rooms-editor-geometry'
import { useEffect, useMemo, useRef, useState } from 'react'
import { doorLineCoords } from './geometry'
import { RoomDoorLines } from './RoomDoorLines'
import { RoomWalls } from './RoomWalls'

const CROSS_ARM = 7
const PAD = CROSS_ARM + 2 // padding so edge crosses are fully visible

// Blueprint palette (Tailwind color values)
const BP_BG = '#172554'              // blue-950
const BP_LINE = 'rgba(231,229,228,0.18)'  // stone-200/18
const BP_CROSS = '#e7e5e4' // stone-200

const SECTION_BORDER = '#1e293b'

const OPPOSITE: Record<keyof RoomDoors, keyof RoomDoors> = {
  left: 'right', right: 'left', top: 'bottom', bottom: 'top',
}

interface Props {
  layout: RoomsLayoutData
  tool: EditorTool
  selectedColor: string
  onPaint: (x: number, y: number) => void
  onErase: (x: number, y: number) => void
  onToggleDoor: (x: number, y: number, side: keyof RoomDoors) => void
  onRemoveDoor: (x: number, y: number, side: keyof RoomDoors) => void
}

export function RoomsEditorCanvas({
  layout,
  tool,
  selectedColor,
  onPaint,
  onErase,
  onToggleDoor,
  onRemoveDoor,
}: Props) {
  const { width, height } = layout.mapSize
  const svgWidth = width * CELL
  const svgHeight = height * CELL

  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null)
  const [hoveredDoor, setHoveredDoor] = useState<{ x: number; y: number; side: keyof RoomDoors } | null>(null)
  const isMouseDown = useRef(false)
  const isRightMouseDown = useRef(false)

  useEffect(() => {
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) isRightMouseDown.current = false
      else isMouseDown.current = false
    }
    window.addEventListener('mouseup', onMouseUp)
    return () => window.removeEventListener('mouseup', onMouseUp)
  }, [])

  const occupiedMap = useMemo(() => {
    const map = new Map<string, RoomSection>()
    for (const room of layout.rooms) {
      for (const section of room.sections) {
        map.set(`${section.position.x},${section.position.y}`, section)
      }
    }
    return map
  }, [layout.rooms])

  const roomIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const room of layout.rooms) {
      for (const section of room.sections) {
        map.set(`${section.position.x},${section.position.y}`, room.index)
      }
    }
    return map
  }, [layout.rooms])

  const sectionMap = useMemo(() => {
    const map = new Map<string, RoomSection>()
    for (const room of layout.rooms) {
      for (const section of room.sections) {
        map.set(`${room.index}-${section.index}`, section)
      }
    }
    return map
  }, [layout.rooms])

  const handleCellAction = (x: number, y: number) => {
    if (tool === 'room') onPaint(x, y)
    else if (tool === 'erase') onErase(x, y)
  }

  const handleMouseDown = (x: number, y: number, button: number) => {
    if (tool === 'door') return
    if (button === 2) {
      isRightMouseDown.current = true
      onErase(x, y)
    } else {
      isMouseDown.current = true
      handleCellAction(x, y)
    }
  }

  const handleMouseEnter = (x: number, y: number) => {
    setHovered({ x, y })
    if (tool === 'door') return
    if (isRightMouseDown.current) onErase(x, y)
    else if (isMouseDown.current) handleCellAction(x, y)
  }

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool !== 'door') return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = (svgWidth + PAD * 2) / rect.width
    const scaleY = (svgHeight + PAD * 2) / rect.height
    const svgX = (e.clientX - rect.left) * scaleX - PAD
    const svgY = (e.clientY - rect.top) * scaleY - PAD
    const col = Math.floor(svgX / CELL)
    const row = Math.floor(svgY / CELL)
    if (col < 0 || col >= width || row < 0 || row >= height || !occupiedMap.has(`${col},${row}`)) {
      setHoveredDoor(null)
      return
    }
    const cellX = svgX - col * CELL
    const cellY = svgY - row * CELL
    const dLeft = cellX
    const dRight = CELL - cellX
    const dTop = cellY
    const dBottom = CELL - cellY
    const minDist = Math.min(dLeft, dRight, dTop, dBottom)
    let side: keyof RoomDoors
    if (minDist === dLeft) side = 'left'
    else if (minDist === dRight) side = 'right'
    else if (minDist === dTop) side = 'top'
    else side = 'bottom'
    const { dx, dy } = NEIGHBOR_DELTA[side]
    const nx = col + dx
    const ny = row + dy
    const thisRoom = roomIndexMap.get(`${col},${row}`)
    const neighborRoom = roomIndexMap.get(`${nx},${ny}`)
    if (thisRoom !== undefined && neighborRoom !== undefined && thisRoom === neighborRoom) {
      setHoveredDoor(null)
      return
    }
    setHoveredDoor({ x: col, y: row, side })
  }

  const handleSvgClick = (_e: React.MouseEvent<SVGSVGElement>) => {
    if (tool !== 'door' || !hoveredDoor) return
    const alreadySet = occupiedMap.get(`${hoveredDoor.x},${hoveredDoor.y}`)?.doors[hoveredDoor.side]
    if (!alreadySet) onToggleDoor(hoveredDoor.x, hoveredDoor.y, hoveredDoor.side)
  }

  const handleSvgContextMenu = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault()
    if (tool !== 'door' || !hoveredDoor) return
    onRemoveDoor(hoveredDoor.x, hoveredDoor.y, hoveredDoor.side)
  }

  return (
    <svg
      width={svgWidth + PAD * 2}
      height={svgHeight + PAD * 2}
      viewBox={`${-PAD} ${-PAD} ${svgWidth + PAD * 2} ${svgHeight + PAD * 2}`}
      shapeRendering="crispEdges"
      onContextMenu={handleSvgContextMenu}
      onMouseMove={handleSvgMouseMove}
      onMouseLeave={() => setHoveredDoor(null)}
      onClick={handleSvgClick}
      style={{ display: 'block', userSelect: 'none', maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', cursor: tool === 'door' ? 'pointer' : undefined }}
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
            onMouseDown={(e) => handleMouseDown(col, row, e.button)}
            onMouseEnter={() => handleMouseEnter(col, row)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: tool === 'room' || tool === 'erase' ? 'crosshair' : 'default' }}
          />
        ))
      )}

      {/* Hover highlight for paint/erase (only on empty or occupied cells respectively) */}
      {hovered &&
        tool !== 'door' &&
        (() => {
          const isOccupied = occupiedMap.has(`${hovered.x},${hovered.y}`)
          const showHover =
            (tool === 'room' && !isOccupied) ||
            (tool === 'erase' && isOccupied) ||
            (isRightMouseDown.current && isOccupied)

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

      {/* Occupied sections — fill only, borders drawn separately */}
      {layout.rooms.flatMap((room) =>
        room.sections.map((section) => (
          <rect
            key={`section-${room.index}-${section.index}`}
            x={section.position.x * CELL}
            y={section.position.y * CELL}
            width={CELL}
            height={CELL}
            fill={room.color}
            stroke="none"
            onMouseDown={(e) => handleMouseDown(section.position.x, section.position.y, e.button)}
            onMouseEnter={() => handleMouseEnter(section.position.x, section.position.y)}
            onMouseLeave={() => setHovered(null)}
            style={{
              cursor:
                tool === 'room' || tool === 'erase' ? 'crosshair' : 'default',
            }}
          />
        ))
      )}

      {/* Section borders */}
      <RoomWalls
        layout={layout}
        getLineProps={(roomIndex, _sectionIndex, _side, neighborRoomIndex) => {
          const sameRoom = neighborRoomIndex === roomIndex
          return {
            stroke: sameRoom ? 'rgba(30,41,59,0.05)' : SECTION_BORDER,
            strokeWidth: 2,
            strokeLinecap: 'square',
            style: { pointerEvents: 'none' },
          }
        }}
      />

      {/* Door lines */}
      <RoomDoorLines
        layout={layout}
        getLineProps={(roomIndex, sectionIndex, side) => {
          const section = sectionMap.get(`${roomIndex}-${sectionIndex}`)
          const { dx, dy } = NEIGHBOR_DELTA[side]
          const isHovered = tool === 'door' && hoveredDoor !== null && section !== undefined && (
            (hoveredDoor.x === section.position.x && hoveredDoor.y === section.position.y && hoveredDoor.side === side) ||
            (hoveredDoor.x === section.position.x + dx && hoveredDoor.y === section.position.y + dy && hoveredDoor.side === OPPOSITE[side])
          )
          return {
            stroke: isHovered ? '#fde68a' : '#facc15',
            strokeWidth: isHovered ? DOOR_THICKNESS + 2 : DOOR_THICKNESS,
            style: { pointerEvents: 'none' },
          }
        }}
      />

      {/* Door snap preview */}
      {tool === 'door' && hoveredDoor && (() => {
        const { x, y, side } = hoveredDoor
        const { dx, dy } = NEIGHBOR_DELTA[side]
        const nx = x + dx
        const ny = y + dy
        const neighborOccupied = occupiedMap.has(`${nx},${ny}`)
        const isExisting = occupiedMap.get(`${x},${y}`)?.doors[side]
        if (isExisting) return null
        const { x1, y1, x2, y2 } = doorLineCoords(x, y, side)
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(250,204,21,0.85)" strokeWidth={DOOR_THICKNESS} />
            {neighborOccupied && (() => {
              const { x1: nx1, y1: ny1, x2: nx2, y2: ny2 } = doorLineCoords(nx, ny, OPPOSITE[side])
              return <line x1={nx1} y1={ny1} x2={nx2} y2={ny2} stroke="rgba(250,204,21,0.85)" strokeWidth={DOOR_THICKNESS} />
            })()}
          </g>
        )
      })()}
    </svg>
  )
}
