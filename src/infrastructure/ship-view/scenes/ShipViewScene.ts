import type { RoomsLayout } from '@/domain/models/ship/rooms-layout'
import { StarfieldActor } from '@/infrastructure/navigation-2d/rendering/actors/starfield-actor'
import { loadLayoutIntoShipViewScene } from '@/infrastructure/ship-view/utils/layout-loader'
import { Color, Scene } from 'excalibur'

export class ShipViewScene extends Scene {
  private _pendingLayout: RoomsLayout | null = null
  private readonly starfieldActor = new StarfieldActor()

  override onInitialize(): void {
    this.backgroundColor = Color.fromHex('#111827')
    this.add(this.starfieldActor)
    this.starfieldActor.generate()
  }

  override onActivate(): void {
    if (this._pendingLayout) {
      loadLayoutIntoShipViewScene(this, this._pendingLayout)
      this._pendingLayout = null
    }
  }

  loadLayout(layout: RoomsLayout): void {
    if (this.isInitialized) {
      loadLayoutIntoShipViewScene(this, layout)
    } else {
      this._pendingLayout = layout
    }
  }
}
