import { describe, expect, it } from 'vitest';

import type { Room, RoomsLayout, Section } from '@/domain/models/ship/rooms-layout';
import { DoorState, SectionSide } from '@/domain/models/ship/rooms-layout';
import {
    createSection,
    findAdjacentSameColorRooms,
    inheritDoorsFromNeighbors,
    mergeAdjacentRoomsIntoCheapest,
    nextSectionIndex,
    recalcRoomBounds,
    sectionAt,
} from '@/domain/services/rooms-layout-operations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSection(x: number, y: number, roomIndex: number, sectionIndex: number): Section {
  return { room: roomIndex, index: sectionIndex, position: { x, y }, doors: [] };
}

function makeRoom(index: number, color: string, sections: Section[]): Room {
  return {
    index,
    color,
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    sections,
  };
}

function makeLayout(rooms: Room[]): RoomsLayout {
  return {
    version: '1',
    name: 'test',
    layoutSectionSize: 1,
    mapSectionSize: 1,
    mapSize: { width: 10, height: 10 },
    rooms,
  };
}

// ---------------------------------------------------------------------------
// recalcRoomBounds
// ---------------------------------------------------------------------------

describe('recalcRoomBounds', () => {

  it('sets zero position and size for an empty room', () => {
    const room = makeRoom(0, 'red', []);

    recalcRoomBounds(room);

    expect(room.position).toEqual({ x: 0, y: 0 });
    expect(room.size).toEqual({ width: 0, height: 0 });
  });

  it('sets correct bounds for a single section', () => {
    const room = makeRoom(0, 'red', [makeSection(3, 4, 0, 0)]);

    recalcRoomBounds(room);

    expect(room.position).toEqual({ x: 3, y: 4 });
    expect(room.size).toEqual({ width: 1, height: 1 });
  });

  it('calculates bounding box for multiple sections', () => {
    const room = makeRoom(0, 'red', [
      makeSection(1, 2, 0, 0),
      makeSection(3, 5, 0, 1),
    ]);

    recalcRoomBounds(room);

    expect(room.position).toEqual({ x: 1, y: 2 });
    expect(room.size).toEqual({ width: 3, height: 4 });
  });

});

// ---------------------------------------------------------------------------
// nextSectionIndex
// ---------------------------------------------------------------------------

describe('nextSectionIndex', () => {

  it('returns 0 for an empty room', () => {
    expect(nextSectionIndex(makeRoom(0, 'red', []))).toBe(0);
  });

  it('returns max(index) + 1', () => {
    const room = makeRoom(0, 'red', [
      makeSection(0, 0, 0, 2),
      makeSection(1, 0, 0, 5),
    ]);

    expect(nextSectionIndex(room)).toBe(6);
  });

});

// ---------------------------------------------------------------------------
// sectionAt
// ---------------------------------------------------------------------------

describe('sectionAt', () => {

  it('returns null when no section is at the requested position', () => {
    const layout = makeLayout([makeRoom(0, 'red', [makeSection(0, 0, 0, 0)])]);

    expect(sectionAt(layout, 9, 9)).toBeNull();
  });

  it('returns the matching room and section', () => {
    const section = makeSection(2, 3, 0, 0);
    const room = makeRoom(0, 'red', [section]);
    const layout = makeLayout([room]);

    const result = sectionAt(layout, 2, 3);

    expect(result).not.toBeNull();
    expect(result?.room).toBe(room);
    expect(result?.section).toBe(section);
  });

});

// ---------------------------------------------------------------------------
// findAdjacentSameColorRooms
// ---------------------------------------------------------------------------

describe('findAdjacentSameColorRooms', () => {

  it('returns an empty set when there are no neighbours', () => {
    const layout = makeLayout([makeRoom(0, 'blue', [makeSection(5, 5, 0, 0)])]);

    const result = findAdjacentSameColorRooms(layout, 5, 5, 'blue');

    expect(result.size).toBe(0);
  });

  it('finds same-color neighbours in all four directions', () => {
    const center = makeRoom(0, 'red', [makeSection(1, 1, 0, 0)]);
    const top    = makeRoom(1, 'red', [makeSection(1, 0, 1, 0)]);
    const right  = makeRoom(2, 'red', [makeSection(2, 1, 2, 0)]);
    const layout = makeLayout([center, top, right]);

    const result = findAdjacentSameColorRooms(layout, 1, 1, 'red');

    expect(result).toContain(1);
    expect(result).toContain(2);
  });

  it('ignores neighbours with a different color', () => {
    const center = makeRoom(0, 'red', [makeSection(1, 1, 0, 0)]);
    const right  = makeRoom(1, 'blue', [makeSection(2, 1, 1, 0)]);
    const layout = makeLayout([center, right]);

    const result = findAdjacentSameColorRooms(layout, 1, 1, 'red');

    expect(result.size).toBe(0);
  });

});

// ---------------------------------------------------------------------------
// mergeAdjacentRoomsIntoCheapest
// ---------------------------------------------------------------------------

describe('mergeAdjacentRoomsIntoCheapest', () => {

  it('returns the first room and moves sections from subsequent rooms into it', () => {
    const s0 = makeSection(0, 0, 0, 0);
    const s1 = makeSection(1, 0, 1, 0);
    const roomA = makeRoom(0, 'red', [s0]);
    const roomB = makeRoom(1, 'red', [s1]);
    const layout = makeLayout([roomA, roomB]);

    const merged = mergeAdjacentRoomsIntoCheapest([roomA, roomB], layout);

    expect(merged).toBe(roomA);
    expect(roomA.sections).toHaveLength(2);
    expect(layout.rooms).not.toContain(roomB);
  });

  it('reassigns the room reference of moved sections', () => {
    const s1 = makeSection(1, 0, 1, 0);
    const roomA = makeRoom(0, 'red', [makeSection(0, 0, 0, 0)]);
    const roomB = makeRoom(1, 'red', [s1]);
    const layout = makeLayout([roomA, roomB]);

    mergeAdjacentRoomsIntoCheapest([roomA, roomB], layout);

    expect(s1.room).toBe(0);
  });

});

// ---------------------------------------------------------------------------
// inheritDoorsFromNeighbors
// ---------------------------------------------------------------------------

describe('inheritDoorsFromNeighbors', () => {

  it('returns no doors when neighbours have no matching doors', () => {
    const room = makeRoom(0, 'red', [makeSection(1, 1, 0, 0)]);
    const right = makeRoom(1, 'blue', [makeSection(2, 1, 1, 0)]);
    const layout = makeLayout([room, right]);

    const doors = inheritDoorsFromNeighbors(layout, 1, 1);

    expect(doors).toHaveLength(0);
  });

  it('inherits a door when a neighbour has a door on the opposing side', () => {
    // Neighbour to the right has a door on its Left side → we should get a Right door.
    const rightSection = makeSection(2, 1, 1, 0);
    rightSection.doors.push({ side: SectionSide.Left, state: DoorState.Closed });

    const room = makeRoom(0, 'red', [makeSection(1, 1, 0, 0)]);
    const right = makeRoom(1, 'blue', [rightSection]);
    const layout = makeLayout([room, right]);

    const doors = inheritDoorsFromNeighbors(layout, 1, 1);

    expect(doors).toHaveLength(1);
    expect(doors[0].side).toBe(SectionSide.Right);
  });

});

// ---------------------------------------------------------------------------
// createSection
// ---------------------------------------------------------------------------

describe('createSection', () => {

  it('creates a section with the correct fields', () => {
    const doors = [{ side: SectionSide.Left, state: DoorState.Open }];
    const section = createSection({ x: 3, y: 4 }, doors, 1, 2);

    expect(section.position).toEqual({ x: 3, y: 4 });
    expect(section.doors).toBe(doors);
    expect(section.room).toBe(1);
    expect(section.index).toBe(2);
  });

});
