import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import { loadRoomsLayoutIntoScene } from '@/infrastructure/ship-blueprint-editor/utils/layout-loader'
import { Color, Scene } from 'excalibur'

export class ShipBlueprintEditorScene extends Scene {
  override onInitialize(): void {
    this.backgroundColor = Color.fromHex('#111827')
  }

  loadLayout(layout: RoomsLayout): void {
    loadRoomsLayoutIntoScene(this, layout)
  }
}
