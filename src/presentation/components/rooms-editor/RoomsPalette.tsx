interface PaletteRoom {
  index: number
  color: string
  sections: unknown[]
}

interface Props {
  rooms: PaletteRoom[]
  selectedRoomIndex: number
  onSelectRoom: (index: number) => void
  onAddRoom: () => void
  onRemoveRoom: (index: number) => void
  onColorChange: (index: number, color: string) => void
}

export function RoomsPalette({
  rooms,
  selectedRoomIndex,
  onSelectRoom,
  onAddRoom,
  onRemoveRoom,
  onColorChange,
}: Props) {
  return (
    <div className="flex flex-col gap-1 w-56 shrink-0 bg-slate-900 border-r border-slate-700 p-2 overflow-y-auto">

      <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1">
        Rooms
      </div>

      {rooms.map((room) => {
        const isSelected = room.index === selectedRoomIndex
        const hasNoSections = room.sections.length === 0

        return (
          <div
            key={room.index}
            onClick={() => onSelectRoom(room.index)}
            className={[
              'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer select-none',
              isSelected
                ? 'bg-slate-700 ring-1 ring-slate-500'
                : 'hover:bg-slate-800',
            ].join(' ')}
          >

            <span className="text-xs font-mono text-slate-400 w-5 text-right shrink-0">
              {room.index}
            </span>

            <input
              type="color"
              value={room.color}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onColorChange(room.index, e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0"
              style={{ backgroundColor: room.color }}
            />

            <span className="text-xs text-slate-300 flex-1 truncate">
              {room.sections.length} section{room.sections.length !== 1 ? 's' : ''}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemoveRoom(room.index)
              }}
              disabled={!hasNoSections}
              title={hasNoSections ? 'Remove room' : 'Clear sections first'}
              className="text-slate-500 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed text-xs px-1"
            >
              ✕
            </button>

          </div>
        )
      })}

      <button
        onClick={() => onAddRoom()}
        className="mt-2 text-xs text-slate-400 hover:text-slate-200 border border-dashed border-slate-600 hover:border-slate-400 rounded py-1.5 transition-colors"
      >
        + Add room
      </button>

    </div>
  )
}
