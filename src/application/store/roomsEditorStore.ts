import type { Doors, Room, RoomsLayout, Section } from '@/domain/models/ship/rooms-layout'
import type { EditorTool } from '@/shared/rooms-editor'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type { EditorTool }

const ROOM_COLORS = [
  '#fadea5', // warm tan
  '#ba0502', // red
  '#fa6b4b', // orange
  '#4ade80', // green
  '#60a5fa', // blue
  '#c084fc', // purple
  '#f472b6', // pink
  '#34d399', // teal
  '#fbbf24', // amber
  '#a78bfa', // violet
  '#f87171', // light red
  '#86efac', // light green
  '#93c5fd', // light blue
  '#fcd34d', // yellow
  '#6ee7b7', // mint
  '#fb923c', // orange-400
]

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
  selectedRoomIndex: number

  loadLayout: (layout: RoomsLayout) => void
  newLayout: (name: string, width: number, height: number) => void
  paintSection: (x: number, y: number) => void
  eraseSection: (x: number, y: number) => void
  toggleDoor: (x: number, y: number, side: keyof Doors) => void
  addRoom: () => void
  removeRoom: (index: number) => void
  setRoomColor: (index: number, color: string) => void
  setMapSize: (width: number, height: number) => void
  setName: (name: string) => void
  setTool: (tool: EditorTool) => void
  setSelectedRoom: (index: number) => void
}

export const useRoomsEditorStore = create<RoomsEditorState>()(
  immer((set) => ({
    data: null,
    tool: 'paint',
    selectedRoomIndex: 0,

    loadLayout: (layout) =>
      set((state) => {
        state.data = layout
        state.selectedRoomIndex = layout.rooms.length > 0 ? layout.rooms[0].index : 0
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
        state.selectedRoomIndex = 0
      }),

    paintSection: (x, y) =>
      set((state) => {
        if (!state.data) return

        const already = sectionAt(state.data, x, y)
        if (already) return

        const room = state.data.rooms.find((r) => r.index === state.selectedRoomIndex)
        if (!room) return

        const section: Section = {
          room: room.index,
          index: nextSectionIndex(room),
          position: { x, y },
          doors: { left: false, right: false, top: false, bottom: false },
        }

        room.sections.push(section)
        recalcRoomBounds(room)
      }),

    eraseSection: (x, y) =>
      set((state) => {
        if (!state.data) return

        for (const room of state.data.rooms) {
          const idx = room.sections.findIndex((s) => s.position.x === x && s.position.y === y)

          if (idx !== -1) {
            room.sections.splice(idx, 1)
            recalcRoomBounds(room)
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

    addRoom: () =>
      set((state) => {
        if (!state.data) return

        const nextIndex =
          state.data.rooms.length === 0
            ? 0
            : Math.max(...state.data.rooms.map((r) => r.index)) + 1

        const color = ROOM_COLORS[nextIndex % ROOM_COLORS.length]

        const room: Room = {
          index: nextIndex,
          color,
          position: { x: 0, y: 0 },
          size: { width: 0, height: 0 },
          sections: [],
        }

        state.data.rooms.push(room)
        state.selectedRoomIndex = nextIndex
      }),

    removeRoom: (index) =>
      set((state) => {
        if (!state.data) return

        const roomIdx = state.data.rooms.findIndex((r) => r.index === index)
        if (roomIdx === -1) return

        state.data.rooms.splice(roomIdx, 1)

        if (state.selectedRoomIndex === index) {
          state.selectedRoomIndex =
            state.data.rooms.length > 0 ? state.data.rooms[0].index : 0
        }
      }),

    setRoomColor: (index, color) =>
      set((state) => {
        if (!state.data) return

        const room = state.data.rooms.find((r) => r.index === index)
        if (room) room.color = color
      }),

    setMapSize: (width, height) =>
      set((state) => {
        if (!state.data) return
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

    setSelectedRoom: (index) =>
      set((state) => {
        state.selectedRoomIndex = index
      }),
  }))
)
