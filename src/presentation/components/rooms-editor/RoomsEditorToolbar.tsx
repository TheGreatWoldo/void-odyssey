import { useRef } from 'react';

interface Props {
  name: string
  mapSize: { width: number; height: number }
  onNewLayout: () => void
  onOpenFile: (file: File) => void
  onSave: () => void
  onNameChange: (name: string) => void
  onMapSizeChange: (width: number, height: number) => void
}

export function RoomsEditorToolbar({
  name,
  mapSize,
  onNewLayout,
  onOpenFile,
  onSave,
  onNameChange,
  onMapSizeChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onOpenFile(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0 flex-wrap">

      {/* File actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewLayout}
          className="text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors"
        >
          New
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors"
        >
          Open
        </button>

        <button
          onClick={onSave}
          className="text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors"
        >
          Save
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="w-px h-6 bg-slate-700" />

      {/* Ship name */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="text-xs bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 w-32 focus:outline-none focus:border-slate-400"
        />
      </div>

      {/* Map size */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400">Map</label>
        <input
          type="number"
          min={1}
          max={32}
          value={mapSize.width}
          onChange={(e) => onMapSizeChange(Number(e.target.value), mapSize.height)}
          className="text-xs bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 w-14 focus:outline-none focus:border-slate-400"
        />
        <span className="text-xs text-slate-500">×</span>
        <input
          type="number"
          min={1}
          max={32}
          value={mapSize.height}
          onChange={(e) => onMapSizeChange(mapSize.width, Number(e.target.value))}
          className="text-xs bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 w-14 focus:outline-none focus:border-slate-400"
        />
      </div>

    </div>
  )
}
