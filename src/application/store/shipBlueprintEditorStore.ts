import type { Room, RoomsLayout, SectionSide } from '@/domain/models/ship/rooms-layout'
import { DoorState } from '@/domain/models/ship/rooms-layout'
import {
    createSection,
    findAdjacentSameColorRooms,
    inheritDoorsFromNeighbors,
    mergeAdjacentRoomsIntoCheapest,
    NEIGHBOR_OFFSET,
    nextSectionIndex,
    OPPOSING,
    recalcRoomBounds,
    sectionAt,
} from '@/domain/services/rooms-layout-operations'
import { AUTO_COLORS, EditorTool } from '@/shared/ship-blueprint-editor'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type { EditorTool }

interface ShipBlueprintEditorState {
  data: RoomsLayout | null
  tool: EditorTool
  selectedColor: string

  loadLayout: (layout: RoomsLayout) => void
  newLayout: (name: string, width: number, height: number) => void
  paintSection: (x: number, y: number) => void
  eraseSection: (x: number, y: number) => void
  toggleDoor: (x: number, y: number, side: SectionSide) => void
  removeDoor: (x: number, y: number, side: SectionSide) => void
  removeRoom: (index: number) => void
  autoRecenter: boolean

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

        const already = sectionAt(state.data, x, y)
        if (already) return

        const adjacentIndices = findAdjacentSameColorRooms(state.data, x, y, state.selectedColor)

        let targetRoom: Room

        if (adjacentIndices.size === 0) {
          const nextIndex =
            state.data.rooms.length === 0
              ? 0
              : Math.max(...state.data.rooms.map((r) => r.index)) + 1

          const newRoom: Room = {
            index: nextIndex,
            color: state.selectedColor,
            position: { x, y },
            size: { width: 1, height: 1 },
            sections: [],
          }
          state.data.rooms.push(newRoom)
          targetRoom = newRoom
        } else {
          const adjacentRooms = state.data.rooms
            .filter((r) => adjacentIndices.has(r.index))
            .sort((a, b) => a.index - b.index)

          targetRoom = mergeAdjacentRoomsIntoCheapest(adjacentRooms, state.data)
        }

        const doors = inheritDoorsFromNeighbors(state.data, x, y)
        const section = createSection({ x, y }, doors, targetRoom.index, nextSectionIndex(targetRoom))

        targetRoom.sections.push(section)
        recalcRoomBounds(targetRoom)
      }),

    eraseSection: (x, y) =>
      set((state) => {
        if (!state.data) return

        for (const room of state.data.rooms) {
          const idx = room.sections.findIndex((s) => s.position.x === x && s.position.y === y)

          if (idx !== -1) {
            room.sections.splice(idx, 1)
            if (room.sections.length === 0) {
              const roomIdx = state.data.rooms.indexOf(room)
              state.data.rooms.splice(roomIdx, 1)
            } else {
              recalcRoomBounds(room)
            }
            return
          }
        }
      }),

    toggleDoor: (x, y, side) =>
      set((state) => {
        if (!state.data) return

        const hit = sectionAt(state.data, x, y)
        if (!hit) return

        const { section } = hit
        const existingIdx = section.doors.findIndex((d) => d.side === side)

        if (existingIdx === -1) {
          section.doors.push({ side, state: DoorState.Closed })
        } else {
          section.doors.splice(existingIdx, 1)
        }

        const doorNowPresent = existingIdx === -1
        const offset = NEIGHBOR_OFFSET[side]
        const neighbor = sectionAt(state.data, x + offset.dx, y + offset.dy)

        if (neighbor) {
          const opposingSide = OPPOSING[side]
          const neighborIdx = neighbor.section.doors.findIndex((d) => d.side === opposingSide)

          if (doorNowPresent && neighborIdx === -1) {
            neighbor.section.doors.push({ side: opposingSide, state: DoorState.Closed })
          } else if (!doorNowPresent && neighborIdx !== -1) {
            neighbor.section.doors.splice(neighborIdx, 1)
          }
        }
      }),

    removeDoor: (x, y, side) =>
      set((state) => {
        if (!state.data) return

        const hit = sectionAt(state.data, x, y)
        if (!hit) return

        const { section } = hit
        const idx = section.doors.findIndex((d) => d.side === side)
        if (idx !== -1) section.doors.splice(idx, 1)

        const offset = NEIGHBOR_OFFSET[side]
        const neighbor = sectionAt(state.data, x + offset.dx, y + offset.dy)

        if (neighbor) {
          const opposingSide = OPPOSING[side]
          const neighborIdx = neighbor.section.doors.findIndex((d) => d.side === opposingSide)
          if (neighborIdx !== -1) neighbor.section.doors.splice(neighborIdx, 1)
        }
      }),

    removeRoom: (index) =>
      set((state) => {
        if (!state.data) return

        const roomIdx = state.data.rooms.findIndex((r) => r.index === index)
        if (roomIdx === -1) return

        state.data.rooms.splice(roomIdx, 1)
      }),

    nudgeLayout: (dx, dy) =>
      set((state) => {
        if (!state.data) return

        for (const room of state.data.rooms) {
          for (const section of room.sections) {
            section.position.x += dx
            section.position.y += dy
          }
          recalcRoomBounds(room)
        }
      }),

    setMapSize: (width, height) =>
      set((state) => {
        if (!state.data) return

        const allSections = state.data.rooms.flatMap((r) => r.sections)

        if (state.autoRecenter && allSections.length > 0) {
          const minX = Math.min(...allSections.map((s) => s.position.x))
          const minY = Math.min(...allSections.map((s) => s.position.y))
          const maxX = Math.max(...allSections.map((s) => s.position.x))
          const maxY = Math.max(...allSections.map((s) => s.position.y))

          const layoutW = maxX - minX + 1
          const layoutH = maxY - minY + 1

          const widthChanged = width !== state.data.mapSize.width
          const heightChanged = height !== state.data.mapSize.height

          const targetOriginX = Math.floor((width - layoutW) / 2)
          const targetOriginY = Math.floor((height - layoutH) / 2)

          const dx = widthChanged ? targetOriginX - minX : 0
          const dy = heightChanged ? targetOriginY - minY : 0

          if (dx !== 0 || dy !== 0) {
            for (const room of state.data.rooms) {
              for (const section of room.sections) {
                section.position.x += dx
                section.position.y += dy
              }
              recalcRoomBounds(room)
            }
          }
        }

        state.data.mapSize = { width, height }
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
