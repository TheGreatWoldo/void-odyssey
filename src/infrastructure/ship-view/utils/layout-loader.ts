import { SectionSide, type RoomsLayout, type Section } from '@/domain/models/ship/rooms-layout'
import { ShipDoorActor, type DoorOrientation } from '@/infrastructure/ship-view/actors/ShipDoorActor'
import { ShipFloorActor } from '@/infrastructure/ship-view/actors/ShipFloorActor'
import { ShipOuterHullActor } from '@/infrastructure/ship-view/actors/ShipOuterHullActor'
import { SHIP_SECTION_CELL, SHIP_SECTION_GAP, ShipSectionActor } from '@/infrastructure/ship-view/actors/ShipSectionActor'
import { Scene, vec } from 'excalibur'

const NEIGHBOR_DELTAS = [
  { dx: -1, dy:  0 },
  { dx:  1, dy:  0 },
  { dx:  0, dy: -1 },
  { dx:  0, dy:  1 },
]

const DIAGONAL_DELTAS = [
  { dx: -1, dy: -1 },
  { dx:  1, dy: -1 },
  { dx: -1, dy:  1 },
  { dx:  1, dy:  1 },
]

function deriveOuterHullPositions(allSections: Map<string, Section>): { x: number; y: number }[] {
  const outerPositions = new Map<string, { x: number; y: number }>()

  for (const section of allSections.values()) {
    const { x, y } = section.position

    // Edge-adjacent outer hull cells
    for (const { dx, dy } of NEIGHBOR_DELTAS) {
      const key = `${x + dx},${y + dy}`
      if (!allSections.has(key) && !outerPositions.has(key)) {
        outerPositions.set(key, { x: x + dx, y: y + dy })
      }
    }

    // Diagonal corner ghost cells — needed so the corner-fill logic in
    // ShipOuterHullActor has an actor to draw into at convex outer corners.
    for (const { dx, dy } of DIAGONAL_DELTAS) {
      const key = `${x + dx},${y + dy}`
      if (!allSections.has(key) && !outerPositions.has(key)) {
        outerPositions.set(key, { x: x + dx, y: y + dy })
      }
    }
  }

  return [...outerPositions.values()]
}

export function loadLayoutIntoShipViewScene(scene: Scene, layout: RoomsLayout): void {
  for (const actor of [...scene.actors]) {
    if (
      actor instanceof ShipFloorActor ||
      actor instanceof ShipSectionActor ||
      actor instanceof ShipOuterHullActor ||
      actor instanceof ShipDoorActor
    ) {
      actor.kill()
    }
  }

  const { width, height } = layout.mapSize
  const gridPixelWidth = width * (SHIP_SECTION_CELL + SHIP_SECTION_GAP) - SHIP_SECTION_GAP
  const gridPixelHeight = height * (SHIP_SECTION_CELL + SHIP_SECTION_GAP) - SHIP_SECTION_GAP

  const cx = scene.engine.drawWidth / 2
  const cy = scene.engine.drawHeight / 2

  const offsetX = cx - gridPixelWidth / 2
  const offsetY = cy - gridPixelHeight / 2

  const allSections = new Map<string, Section>()
  for (const room of layout.rooms) {
    for (const section of room.sections) {
      allSections.set(`${section.position.x},${section.position.y}`, section)
    }
  }

  const floorActor = new ShipFloorActor({ layout })
  floorActor.pos = vec(cx, cy)
  scene.add(floorActor)

  for (const position of deriveOuterHullPositions(allSections)) {
    const actor = new ShipOuterHullActor({ position, allSections })

    actor.pos = vec(
      offsetX + position.x * (SHIP_SECTION_CELL + SHIP_SECTION_GAP) + SHIP_SECTION_CELL / 2,
      offsetY + position.y * (SHIP_SECTION_CELL + SHIP_SECTION_GAP) + SHIP_SECTION_CELL / 2,
    )

    scene.add(actor)
  }

  for (const room of layout.rooms) {
    for (const section of room.sections) {
      const actor = new ShipSectionActor({ section, layout })

      actor.pos = vec(
        offsetX + section.position.x * (SHIP_SECTION_CELL + SHIP_SECTION_GAP) + SHIP_SECTION_CELL / 2,
        offsetY + section.position.y * (SHIP_SECTION_CELL + SHIP_SECTION_GAP) + SHIP_SECTION_CELL / 2,
      )

      scene.add(actor)
    }
  }

  // Deduplicated door actors — one per wall boundary, keyed by the lower-coordinate section.
  // v|x|y  = vertical wall between column x and x+1 at row y  (Right side of section x,y)
  // h|x|y  = horizontal wall between row y and y+1 at column x (Bottom side of section x,y)
  const seenDoors = new Set<string>()

  for (const room of layout.rooms) {
    for (const section of room.sections) {
      const { x, y } = section.position

      for (const door of section.doors) {
        let key: string
        let worldX: number
        let worldY: number
        let orientation: DoorOrientation

        if (door.side === SectionSide.Right) {
          key         = `v|${x}|${y}`
          worldX      = offsetX + (x + 1) * (SHIP_SECTION_CELL + SHIP_SECTION_GAP)
          worldY      = offsetY + y * (SHIP_SECTION_CELL + SHIP_SECTION_GAP) + SHIP_SECTION_CELL / 2
          orientation = 'vertical'
        } else if (door.side === SectionSide.Left) {
          key         = `v|${x - 1}|${y}`
          worldX      = offsetX + x * (SHIP_SECTION_CELL + SHIP_SECTION_GAP)
          worldY      = offsetY + y * (SHIP_SECTION_CELL + SHIP_SECTION_GAP) + SHIP_SECTION_CELL / 2
          orientation = 'vertical'
        } else if (door.side === SectionSide.Bottom) {
          key         = `h|${x}|${y}`
          worldX      = offsetX + x * (SHIP_SECTION_CELL + SHIP_SECTION_GAP) + SHIP_SECTION_CELL / 2
          worldY      = offsetY + (y + 1) * (SHIP_SECTION_CELL + SHIP_SECTION_GAP)
          orientation = 'horizontal'
        } else {
          key         = `h|${x}|${y - 1}`
          worldX      = offsetX + x * (SHIP_SECTION_CELL + SHIP_SECTION_GAP) + SHIP_SECTION_CELL / 2
          worldY      = offsetY + y * (SHIP_SECTION_CELL + SHIP_SECTION_GAP)
          orientation = 'horizontal'
        }

        if (seenDoors.has(key)) continue
        seenDoors.add(key)

        const doorActor = new ShipDoorActor({ orientation, initialState: door.state })
        doorActor.pos = vec(worldX, worldY)
        scene.add(doorActor)
      }
    }
  }

  scene.camera.pos = vec(cx, cy)
}
