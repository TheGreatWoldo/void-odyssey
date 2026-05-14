import { useShipBlueprintEditorStore } from '@/application/store/shipBlueprintEditorStore'
import { exportRoomsLayout } from '@/application/useCases/ExportRoomsLayoutUseCase'
import { loadRoomsLayoutFromFile } from '@/application/useCases/LoadRoomsLayoutFromFileUseCase'
import { useState } from 'react'

export function useShipBlueprintEditor() {
  const data = useShipBlueprintEditorStore((s) => s.data)
  const tool = useShipBlueprintEditorStore((s) => s.tool)
  const selectedColor = useShipBlueprintEditorStore((s) => s.selectedColor)
  const autoRecenter = useShipBlueprintEditorStore((s) => s.autoRecenter)

  const loadLayout = useShipBlueprintEditorStore((s) => s.loadLayout)
  const newLayout = useShipBlueprintEditorStore((s) => s.newLayout)
  const paintSection = useShipBlueprintEditorStore((s) => s.paintSection)
  const eraseSection = useShipBlueprintEditorStore((s) => s.eraseSection)
  const toggleDoor = useShipBlueprintEditorStore((s) => s.toggleDoor)
  const removeDoor = useShipBlueprintEditorStore((s) => s.removeDoor)
  const removeRoom = useShipBlueprintEditorStore((s) => s.removeRoom)
  const nudgeLayout = useShipBlueprintEditorStore((s) => s.nudgeLayout)
  const setMapSize = useShipBlueprintEditorStore((s) => s.setMapSize)
  const setName = useShipBlueprintEditorStore((s) => s.setName)
  const setTool = useShipBlueprintEditorStore((s) => s.setTool)
  const setSelectedColor = useShipBlueprintEditorStore((s) => s.setSelectedColor)
  const setAutoRecenter = useShipBlueprintEditorStore((s) => s.setAutoRecenter)

  const [lastError, setLastError] = useState<string | null>(null)

  const openFile = async (file: File) => {
    const result = await loadRoomsLayoutFromFile(file, loadLayout)

    if (!result.ok) {
      setLastError(result.error.message)
    } else {
      setLastError(null)
    }
  }

  const save = () => {
    if (!data) return

    const result = exportRoomsLayout(data)

    if (!result.ok) {
      setLastError(result.error.message)
    } else {
      setLastError(null)
    }
  }

  return {
    data,
    tool,
    selectedColor,
    autoRecenter,
    lastError,
    dismissError: () => setLastError(null),
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
  }
}
