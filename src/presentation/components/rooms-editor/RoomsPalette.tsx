import type { EditorTool } from '@/shared/rooms-editor';

const AUTO_COLORS = ['#f59e0b', '#3b82f6', '#ef4444', '#10b981']

const TOOLS: { key: EditorTool; label: string; title: string }[] = [
  { key: 'room', label: 'Room', title: 'Paint sections onto a room' },
  { key: 'door', label: 'Door', title: 'Toggle door edges between sections' },
]

interface PaletteRoom {
  index: number
  color: string
  sections: { position: { x: number; y: number } }[]
}

interface Props {
  rooms: PaletteRoom[]
  selectedColor: string
  tool: EditorTool
  mapSize: { width: number; height: number }
  onSelectColor: (color: string) => void
  onRemoveRoom: (index: number) => void
  onToolChange: (tool: EditorTool) => void
}

export function RoomsPalette({
  rooms,
  selectedColor,
  tool,
  mapSize,
  onSelectColor,
  onRemoveRoom,
  onToolChange,
}: Props) {
  const PREVIEW_W = 176  // palette inner width (w-48 = 192px minus 2×p-2 = 8px each side)
  const PREVIEW_H = Math.round(PREVIEW_W * mapSize.height / mapSize.width)
  const cellW = PREVIEW_W / mapSize.width
  const cellH = PREVIEW_H / mapSize.height

  return (
    <div className="flex flex-col w-48 shrink-0 bg-slate-900 border-r border-slate-700 p-2 overflow-hidden">

      {/* Tool */}
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1 shrink-0">
        Tool
      </div>

      <div className="flex gap-1 px-1 pb-3 shrink-0">
        {TOOLS.map((t) => (
          <button
            key={t.key}
            title={t.title}
            onClick={() => onToolChange(t.key)}
            className={[
              'text-xs px-3 py-1.5 rounded transition-colors flex-1',
              tool === t.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Color */}
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1 shrink-0">
        Color
      </div>

      <div className="flex gap-2 px-1 pb-3 shrink-0">
        {AUTO_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onSelectColor(color)}
            className="w-8 h-8 rounded transition-transform"
            style={{
              backgroundColor: color,
              outline: color === selectedColor ? '2px solid white' : '2px solid transparent',
              outlineOffset: '2px',
            }}
          />
        ))}
      </div>

      {/* Rooms — scrollable */}
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1 shrink-0">
        Rooms
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {rooms.map((room) => {
          const hasNoSections = room.sections.length === 0

          return (
            <div
              key={room.index}
              className="flex items-center gap-2 px-2 py-1.5 rounded select-none"
            >

              <span
                className="w-3 h-3 rounded-sm shrink-0 border border-black/20"
                style={{ backgroundColor: room.color }}
              />

              <span className="text-xs font-mono text-slate-400 w-5 text-right shrink-0">
                {room.index}
              </span>

              <span className="text-xs text-slate-300 flex-1 truncate">
                {room.sections.length} section{room.sections.length !== 1 ? 's' : ''}
              </span>

              <button
                onClick={() => onRemoveRoom(room.index)}
                disabled={!hasNoSections}
                title={hasNoSections ? 'Remove room' : 'Clear sections first'}
                className="text-slate-500 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed text-xs px-1"
              >
                ✕
              </button>

            </div>
          )
        })}
      </div>

      {/* Mini preview */}
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

    </div>
  )
}
