import { EditorTool } from '@/shared/ship-blueprint-editor';

import { PaletteColorPicker } from './PaletteColorPicker';
import { PaletteMiniPreview } from './PaletteMiniPreview';
import { PaletteRoomEntry } from './PaletteRoomEntry';
import { PaletteToolSelector } from './PaletteToolSelector';

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

export function ShipBlueprintEditorPalette({
  rooms,
  selectedColor,
  tool,
  mapSize,
  onSelectColor,
  onRemoveRoom,
  onToolChange,
}: Props) {
  return (
    <div className="flex flex-col w-48 shrink-0 bg-slate-900 border-r border-slate-700 p-2 overflow-hidden">

      <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1 shrink-0">
        Tool
      </div>

      <PaletteToolSelector tool={tool} onToolChange={onToolChange} />

      <div className="h-px bg-slate-700 my-2 shrink-0" />

      <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1 shrink-0">
        Color
      </div>

      <PaletteColorPicker selectedColor={selectedColor} onSelectColor={onSelectColor} />

      <div className="h-px bg-slate-700 my-2 shrink-0" />

      <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1 shrink-0">
        Rooms
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {rooms.map((room) => (
          <PaletteRoomEntry key={room.index} room={room} onRemoveRoom={onRemoveRoom} />
        ))}
      </div>

      <PaletteMiniPreview rooms={rooms} mapSize={mapSize} />

    </div>
  )
}
