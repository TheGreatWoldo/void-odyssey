interface MiniPreviewRoom {
  index: number
  color: string
  sections: { position: { x: number; y: number } }[]
}

export interface PaletteMiniPreviewProps {
  rooms: MiniPreviewRoom[]
  mapSize: { width: number; height: number }
}

export function PaletteMiniPreview({ rooms, mapSize }: PaletteMiniPreviewProps) {
  const PREVIEW_W = 176  // palette inner width (w-48 = 192px minus 2×p-2 = 8px each side)
  const PREVIEW_H = Math.round(PREVIEW_W * mapSize.height / mapSize.width)
  const cellW = PREVIEW_W / mapSize.width
  const cellH = PREVIEW_H / mapSize.height

  return (
    <div className="shrink-0 pt-2 border-t border-slate-700 mt-1">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1">
        Preview
      </div>

      <svg
        width={PREVIEW_W}
        height={PREVIEW_H}
        style={{ display: 'block' }}
        shapeRendering="crispEdges"
      >
        <rect width={PREVIEW_W} height={PREVIEW_H} fill="#172554" />

        {rooms.flatMap((room) =>
          room.sections.map((section, i) => (
            <rect
              key={`${room.index}-${i}`}
              x={section.position.x * cellW}
              y={section.position.y * cellH}
              width={cellW}
              height={cellH}
              fill={room.color}
            />
          ))
        )}
      </svg>
    </div>
  )
}
