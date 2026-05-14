export interface PaletteRoomEntryRoom {
  index: number
  color: string
  sections: { position: { x: number; y: number } }[]
}

export interface PaletteRoomEntryProps {
  room: PaletteRoomEntryRoom
  onRemoveRoom: (index: number) => void
}

export function PaletteRoomEntry({ room, onRemoveRoom }: PaletteRoomEntryProps) {
  const hasNoSections = room.sections.length === 0

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded select-none">

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
}
