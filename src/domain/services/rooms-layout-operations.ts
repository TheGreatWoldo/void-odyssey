import type { Door, Room, RoomsLayout, Section } from '@/domain/models/ship/rooms-layout';
import { DoorState, SectionSide } from '@/domain/models/ship/rooms-layout';

export const OPPOSING: Record<SectionSide, SectionSide> = {
  [SectionSide.Left]: SectionSide.Right,
  [SectionSide.Right]: SectionSide.Left,
  [SectionSide.Top]: SectionSide.Bottom,
  [SectionSide.Bottom]: SectionSide.Top,
}

export const NEIGHBOR_OFFSET: Record<SectionSide, { dx: number; dy: number }> = {
  [SectionSide.Left]: { dx: -1, dy: 0 },
  [SectionSide.Right]: { dx: 1, dy: 0 },
  [SectionSide.Top]: { dx: 0, dy: -1 },
  [SectionSide.Bottom]: { dx: 0, dy: 1 },
}

export function recalcRoomBounds(room: Room): void {
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

export function nextSectionIndex(room: Room): number {
  if (room.sections.length === 0) return 0
  return Math.max(...room.sections.map((s) => s.index)) + 1
}

export function sectionAt(
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

export function findAdjacentSameColorRooms(
  data: RoomsLayout,
  x: number,
  y: number,
  color: string,
): Set<number> {
  const adjacentIndices = new Set<number>()
  for (const { dx, dy } of Object.values(NEIGHBOR_OFFSET)) {
    const hit = sectionAt(data, x + dx, y + dy)
    if (hit && hit.room.color === color) {
      adjacentIndices.add(hit.room.index)
    }
  }
  return adjacentIndices
}

export function mergeAdjacentRoomsIntoCheapest(
  adjacentRooms: Room[],
  data: RoomsLayout,
): Room {
  const targetRoom = adjacentRooms[0]

  for (let i = 1; i < adjacentRooms.length; i++) {
    const toMerge = adjacentRooms[i]

    for (const s of toMerge.sections) {
      s.room = targetRoom.index
      s.index = nextSectionIndex(targetRoom)
      targetRoom.sections.push(s)
    }

    const roomIdx = data.rooms.indexOf(toMerge)
    data.rooms.splice(roomIdx, 1)
  }

  return targetRoom
}

export function inheritDoorsFromNeighbors(
  data: RoomsLayout,
  x: number,
  y: number,
): Door[] {
  const doors: Door[] = []

  for (const [side, { dx, dy }] of Object.entries(NEIGHBOR_OFFSET) as [
    SectionSide,
    { dx: number; dy: number },
  ][]) {
    const neighbor = sectionAt(data, x + dx, y + dy)
    const opposingSide = OPPOSING[side]

    if (neighbor && neighbor.section.doors.some((d) => d.side === opposingSide)) {
      doors.push({ side, state: DoorState.Closed })
    }
  }

  return doors
}

export function createSection(
  position: { x: number; y: number },
  doors: Door[],
  roomIndex: number,
  sectionIndex: number,
): Section {
  return {
    room: roomIndex,
    index: sectionIndex,
    position,
    doors,
  }
}
