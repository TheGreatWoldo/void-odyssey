import { useGameService } from '@/application/hooks/useGameService'
import { useMenuConfig } from '@/application/hooks/useMenuConfig'
import { useShipBlueprintEditor } from '@/application/hooks/useShipBlueprintEditor'
import { ShipBlueprintEditorCanvas } from '@/presentation/components/ship-blueprint-editor/canvas/ShipBlueprintEditorCanvas'
import { ShipBlueprintEditorPalette } from '@/presentation/components/ship-blueprint-editor/palette/ShipBlueprintEditorPalette'
import { ShipBlueprintEditorPreviewCanvas } from '@/presentation/components/ship-blueprint-editor/preview/ShipBlueprintEditorPreviewCanvas'
import { ShipBlueprintEditorToolbar } from '@/presentation/components/ship-blueprint-editor/toolbar/ShipBlueprintEditorToolbar'
import { SceneKey } from '@/shared/scene-key'
import { EditorTool } from '@/shared/ship-blueprint-editor'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/_canvas/edit/ships')({
  component: ShipBlueprintEditorPage,
})

const DEFAULT_MAP_WIDTH = 25
const DEFAULT_MAP_HEIGHT = 13

function ShipBlueprintEditorPage() {
  const service = useGameService()
  const menuConfig = useMenuConfig()

  const {
    data,
    tool,
    selectedColor,
    autoRecenter,
    lastError,
    dismissError,
    newLayout,
    paintSection,
    eraseSection,
    toggleDoor,
    removeDoor,
    removeRoom,
    nudgeLayout,
    setMapSize,
    setName,
    setTool,
    setSelectedColor,
    setAutoRecenter,
    openFile,
    save,
  } = useShipBlueprintEditor()

  const handleNew = () => {
    newLayout('untitled', DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT)
  }

  const [view, setView] = useState<'edit' | 'preview'>('edit')

  function handleViewChange(next: 'edit' | 'preview') {
    if (next === view) return
    setView(next)

    if (next === 'preview' && data) {
      service.goToScene(SceneKey.ShipBlueprintEditor)
        .then(() => service.loadRoomsLayout(data))
        .catch((err: unknown) => console.error('[rooms preview]', err))
    } else if (next === 'edit' && menuConfig) {
      service.goToScene(menuConfig.sceneKey).catch((err: unknown) => {
        console.error('[rooms preview]', err)
      })
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">

      <ShipBlueprintEditorToolbar
        name={data?.name ?? ''}
        mapSize={data?.mapSize ?? { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT }}
        autoRecenter={autoRecenter}
        onNewLayout={handleNew}
        onOpenFile={openFile}
        onSave={save}
        onNameChange={setName}
        onMapSizeChange={setMapSize}
        onNudge={nudgeLayout}
        onAutoRecenterChange={setAutoRecenter}
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

        <ShipBlueprintEditorPalette
          rooms={data?.rooms ?? []}
          selectedColor={selectedColor}
          tool={tool}
          mapSize={data?.mapSize ?? { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT }}
          onSelectColor={(color) => {
            setSelectedColor(color)
            if (tool !== EditorTool.Room) setTool(EditorTool.Room)
          }}
          onRemoveRoom={removeRoom}
          onToolChange={setTool}
        />

        <div className="flex-1 overflow-hidden bg-blue-950 flex flex-col">

          {/* View toggle */}
          {data && (
            <div className="flex gap-1 px-4 pt-3 shrink-0">
              {(['edit', 'preview'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  className={[
                    'text-xs px-3 py-1 rounded transition-colors capitalize',
                    view === v
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
            {data ? (
              view === 'edit' ? (
                <ShipBlueprintEditorCanvas
                  layout={data}
                  tool={tool}
                  selectedColor={selectedColor}
                  onPaint={paintSection}
                  onErase={eraseSection}
                  onToggleDoor={toggleDoor}
                  onRemoveDoor={removeDoor}
                />
              ) : (
                <ShipBlueprintEditorPreviewCanvas layout={data} />
              )
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

    </div>
  )
}
