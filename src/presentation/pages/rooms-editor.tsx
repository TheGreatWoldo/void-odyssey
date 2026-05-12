import { useRoomsEditor } from '@/application/hooks/useRoomsEditor'
import { RoomsEditorCanvas } from '@/presentation/components/rooms-editor/RoomsEditorCanvas'
import { RoomsEditorToolbar } from '@/presentation/components/rooms-editor/RoomsEditorToolbar'
import { RoomsPalette } from '@/presentation/components/rooms-editor/RoomsPalette'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rooms-editor')({
  component: RoomsEditorPage,
})

const DEFAULT_MAP_WIDTH = 8
const DEFAULT_MAP_HEIGHT = 8

function RoomsEditorPage() {
  const {
    data,
    tool,
    selectedColor,
    lastError,
    dismissError,
    newLayout,
    paintSection,
    eraseSection,
    toggleDoor,
    removeDoor,
    removeRoom,
    setMapSize,
    setName,
    setTool,
    setSelectedColor,
    openFile,
    save,
  } = useRoomsEditor()

  const handleNew = () => {
    newLayout('untitled', DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT)
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">

      <RoomsEditorToolbar
        name={data?.name ?? ''}
        mapSize={data?.mapSize ?? { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT }}
        onNewLayout={handleNew}
        onOpenFile={openFile}
        onSave={save}
        onNameChange={setName}
        onMapSizeChange={setMapSize}
      />

      {lastError && (
        <div className="flex items-center gap-3 px-4 py-2 bg-red-900 border-b border-red-700 text-sm text-red-200 shrink-0">
          <span className="flex-1">{lastError}</span>
          <button
            onClick={dismissError}
            className="text-red-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-row flex-1 overflow-hidden">

        <RoomsPalette
          rooms={data?.rooms ?? []}
          selectedColor={selectedColor}
          tool={tool}
          mapSize={data?.mapSize ?? { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT }}
          onSelectColor={(color) => {
            setSelectedColor(color)
            if (tool !== 'room') setTool('room')
          }}
          onRemoveRoom={removeRoom}
          onToolChange={setTool}
        />

        <div className="flex-1 overflow-hidden bg-blue-950 flex items-center justify-center p-4">
          {data ? (
            <RoomsEditorCanvas
              layout={data}
              tool={tool}
              selectedColor={selectedColor}
              onPaint={paintSection}
              onErase={eraseSection}
              onToggleDoor={toggleDoor}
              onRemoveDoor={removeDoor}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
              <p className="text-sm">No layout loaded.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleNew}
                  className="text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded transition-colors"
                >
                  New layout
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
