import { useRoomsEditorStore } from '@/application/store/roomsEditorStore'
import { exportRoomsLayout } from '@/application/useCases/ExportRoomsLayoutUseCase'
import { loadRoomsLayoutFromFile } from '@/application/useCases/LoadRoomsLayoutFromFileUseCase'
import { useState } from 'react'

export function useRoomsEditor() {
  const data = useRoomsEditorStore((s) => s.data)
  const tool = useRoomsEditorStore((s) => s.tool)
  const selectedColor = useRoomsEditorStore((s) => s.selectedColor)

  const loadLayout = useRoomsEditorStore((s) => s.loadLayout)
  const newLayout = useRoomsEditorStore((s) => s.newLayout)
  const paintSection = useRoomsEditorStore((s) => s.paintSection)
  const eraseSection = useRoomsEditorStore((s) => s.eraseSection)
  const toggleDoor = useRoomsEditorStore((s) => s.toggleDoor)
  const removeDoor = useRoomsEditorStore((s) => s.removeDoor)
  const removeRoom = useRoomsEditorStore((s) => s.removeRoom)
  const setMapSize = useRoomsEditorStore((s) => s.setMapSize)
  const setName = useRoomsEditorStore((s) => s.setName)
  const setTool = useRoomsEditorStore((s) => s.setTool)
  const setSelectedColor = useRoomsEditorStore((s) => s.setSelectedColor)

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
    lastError,
    dismissError: () => setLastError(null),
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
  }
}
