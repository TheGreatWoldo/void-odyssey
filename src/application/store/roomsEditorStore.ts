import type { Doors, Room, RoomsLayout, Section } from '@/domain/models/ship/rooms-layout'
import type { EditorTool } from '@/shared/rooms-editor'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type { EditorTool }

const AUTO_COLORS = ['#f59e0b', '#3b82f6', '#ef4444', '#10b981']
export { AUTO_COLORS }

const OPPOSING: Record<keyof Doors, keyof Doors> = {
  left: 'right',
  right: 'left',
  top: 'bottom',
  bottom: 'top',
}

const NEIGHBOR_OFFSET: Record<keyof Doors, { dx: number; dy: number }> = {
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  top: { dx: 0, dy: -1 },
  bottom: { dx: 0, dy: 1 },
}

function recalcRoomBounds(room: Room): void {
  if (room.sections.length === 0) {
    room.position = { x: 0, y: 0 }
    room.size = { width: 0, height: 0 }
    return
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const s of room.sections) {
    if (s.position.x < minX) minX = s.position.x
    if (s.position.y < minY) minY = s.position.y
    if (s.position.x > maxX) maxX = s.position.x
    if (s.position.y > maxY) maxY = s.position.y
  }

  room.position = { x: minX, y: minY }
  room.size = { width: maxX - minX + 1, height: maxY - minY + 1 }
}

function nextSectionIndex(room: Room): number {
  if (room.sections.length === 0) return 0
  return Math.max(...room.sections.map((s) => s.index)) + 1
}

function sectionAt(
  data: RoomsLayout,
  x: number,
  y: number,
): { room: Room; section: Section } | null {
  for (const room of data.rooms) {
    const section = room.sections.find((s) => s.position.x === x && s.position.y === y)

    if (section) return { room, section }
  }

  return null
}

interface RoomsEditorState {
  data: RoomsLayout | null
  tool: EditorTool
  selectedColor: string

  loadLayout: (layout: RoomsLayout) => void
  newLayout: (name: string, width: number, height: number) => void
  paintSection: (x: number, y: number) => void
  eraseSection: (x: number, y: number) => void
  toggleDoor: (x: number, y: number, side: keyof Doors) => void
  removeDoor: (x: number, y: number, side: keyof Doors) => void
  removeRoom: (index: number) => void
  setMapSize: (width: number, height: number) => void
  setName: (name: string) => void
  setTool: (tool: EditorTool) => void
  setSelectedColor: (color: string) => void
}

export const useRoomsEditorStore = create<RoomsEditorState>()(
  immer((set) => ({
    data: null,
    tool: 'room',
    selectedColor: AUTO_COLORS[0],

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

        // Find an adjacent room that shares the selected color
        let targetRoom: Room | undefined
        for (const { dx, dy } of Object.values(NEIGHBOR_OFFSET)) {
          const hit = sectionAt(state.data, x + dx, y + dy)
          if (hit && hit.room.color === state.selectedColor) {
            targetRoom = hit.room
            break
          }
        }

        // No adjacent same-color room — create one
        if (!targetRoom) {
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
        }

        const section: Section = {
          room: targetRoom.index,
          index: nextSectionIndex(targetRoom),
          position: { x, y },
          doors: { left: false, right: false, top: false, bottom: false },
        }

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
        section.doors[side] = !section.doors[side]

        const offset = NEIGHBOR_OFFSET[side]
        const neighbor = sectionAt(state.data, x + offset.dx, y + offset.dy)

        if (neighbor) {
          neighbor.section.doors[OPPOSING[side]] = section.doors[side]
        }
      }),

    removeDoor: (x, y, side) =>
      set((state) => {
        if (!state.data) return

        const hit = sectionAt(state.data, x, y)
        if (!hit) return

        const { section } = hit
        section.doors[side] = false

        const offset = NEIGHBOR_OFFSET[side]
        const neighbor = sectionAt(state.data, x + offset.dx, y + offset.dy)

        if (neighbor) {
          neighbor.section.doors[OPPOSING[side]] = false
        }
      }),

    removeRoom: (index) =>
      set((state) => {
        if (!state.data) return

        const roomIdx = state.data.rooms.findIndex((r) => r.index === index)
        if (roomIdx === -1) return

        state.data.rooms.splice(roomIdx, 1)
      }),

    setMapSize: (width, height) =>
      set((state) => {
        if (!state.data) return

        const allSections = state.data.rooms.flatMap((r) => r.sections)

        if (allSections.length > 0) {
          const minX = Math.min(...allSections.map((s) => s.position.x))
          const minY = Math.min(...allSections.map((s) => s.position.y))
          const maxX = Math.max(...allSections.map((s) => s.position.x))
          const maxY = Math.max(...allSections.map((s) => s.position.y))

          const layoutW = maxX - minX + 1
          const layoutH = maxY - minY + 1

          const targetOriginX = Math.floor((width - layoutW) / 2)
          const targetOriginY = Math.floor((height - layoutH) / 2)

          const dx = targetOriginX - minX
          const dy = targetOriginY - minY

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
