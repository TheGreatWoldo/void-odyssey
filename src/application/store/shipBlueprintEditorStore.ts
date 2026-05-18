import { current } from 'immer'
import type { RoomsLayout, SectionSide } from '@/domain/models/ship/rooms-layout'
import { eraseSection } from '@/application/useCases/EraseSectionUseCase'
import { nudgeLayout } from '@/application/useCases/NudgeLayoutUseCase'
import { paintSection } from '@/application/useCases/PaintSectionUseCase'
import { removeDoor } from '@/application/useCases/RemoveDoorUseCase'
import { removeRoom } from '@/application/useCases/RemoveRoomUseCase'
import { resizeLayout } from '@/application/useCases/ResizeLayoutUseCase'
import { toggleDoor } from '@/application/useCases/ToggleDoorUseCase'
import { AUTO_COLORS, EditorTool } from '@/shared/ship-blueprint-editor'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'


interface ShipBlueprintEditorState {
  data: RoomsLayout | null
  tool: EditorTool
  selectedColor: string
  autoRecenter: boolean

  loadLayout: (layout: RoomsLayout) => void
  newLayout: (name: string, width: number, height: number) => void
  paintSection: (x: number, y: number) => void
  eraseSection: (x: number, y: number) => void
  toggleDoor: (x: number, y: number, side: SectionSide) => void
  removeDoor: (x: number, y: number, side: SectionSide) => void
  removeRoom: (index: number) => void

  nudgeLayout: (dx: number, dy: number) => void
  setMapSize: (width: number, height: number) => void
  setAutoRecenter: (value: boolean) => void
  setName: (name: string) => void
  setTool: (tool: EditorTool) => void
  setSelectedColor: (color: string) => void
}

export const useShipBlueprintEditorStore = create<ShipBlueprintEditorState>()(
  immer((set) => ({
    data: null,
    tool: EditorTool.Room,
    selectedColor: AUTO_COLORS[0],
    autoRecenter: false,

    loadLayout: (layout) =>
      set((state) => {
        state.data = layout
        state.selectedColor = AUTO_COLORS[0]
      }),

    newLayout: (name, width, height) =>
      set((state) => {
        state.data = {
          version: '1.0',
          name,
          layoutSectionSize: 4,
          mapSectionSize: 40,
          mapSize: { width, height },
          rooms: [],
        }
      }),

    paintSection: (x, y) =>
      set((state) => {
        if (!state.data) return
        state.data = paintSection(current(state.data), x, y, state.selectedColor)
      }),

    eraseSection: (x, y) =>
      set((state) => {
        if (!state.data) return
        state.data = eraseSection(current(state.data), x, y)
      }),

    toggleDoor: (x, y, side) =>
      set((state) => {
        if (!state.data) return
        state.data = toggleDoor(current(state.data), x, y, side)
      }),

    removeDoor: (x, y, side) =>
      set((state) => {
        if (!state.data) return
        state.data = removeDoor(current(state.data), x, y, side)
      }),

    removeRoom: (index) =>
      set((state) => {
        if (!state.data) return
        state.data = removeRoom(current(state.data), index)
      }),

    nudgeLayout: (dx, dy) =>
      set((state) => {
        if (!state.data) return
        state.data = nudgeLayout(current(state.data), dx, dy)
      }),

    setMapSize: (width, height) =>
      set((state) => {
        if (!state.data) return
        state.data = resizeLayout(current(state.data), width, height, state.autoRecenter)
      }),

    setAutoRecenter: (value) =>
      set((state) => {
        state.autoRecenter = value
      }),

    setName: (name) =>
      set((state) => {
        if (!state.data) return
        state.data.name = name
      }),

    setTool: (tool) =>
      set((state) => {
        state.tool = tool
      }),

    setSelectedColor: (color) =>
      set((state) => {
        state.selectedColor = color
      }),
  }))
)
