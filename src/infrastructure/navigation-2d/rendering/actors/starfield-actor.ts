import { ParallaxStarfield } from '@/infrastructure/navigation-2d/rendering/parallax-starfield';
import { Actor, Camera, Canvas, CoordPlane, Engine } from 'excalibur';

/**
 * Screen-space actor that renders the parallax starfield.
 *
 * Because it uses CoordPlane.Screen it is completely unaffected by camera
 * zoom or position — it always covers the full canvas.
 *
 * The canvas uses cache:true and is only marked dirty when the camera
 * position or zoom actually changes, so no drawing work happens on frames
 * where the camera is still.
 */
export class StarfieldActor extends Actor {
  private readonly starfield = new ParallaxStarfield();
  private camera: Camera | null = null;
  private canvas: Canvas | null = null;

  private _lastCamX = NaN;
  private _lastCamY = NaN;
  private _lastCamZoom = NaN;

  constructor() {
    super({ coordPlane: CoordPlane.Screen, z: -1 });
  }

  override onInitialize(engine: Engine): void {
    const w = engine.drawWidth;
    const h = engine.drawHeight;

    this.pos.setTo(w / 2, h / 2);

    this.canvas = new Canvas({
      width: w,
      height: h,
      cache: true,
      quality: engine.pixelRatio,
      draw: (ctx) => this.drawStars(ctx, w, h),
    });

    this.graphics.use(this.canvas);
    this.camera = engine.currentScene.camera;
  }

  override onPreUpdate(): void {
    if (!this.camera || !this.canvas) return;

    const { x, y } = this.camera.pos;
    const { zoom } = this.camera;

    if (x !== this._lastCamX || y !== this._lastCamY || zoom !== this._lastCamZoom) {
      this._lastCamX = x;
      this._lastCamY = y;
      this._lastCamZoom = zoom;
      this.canvas.flagDirty();
    }
  }

  generate(seed = 42): void {
    this.starfield.generate(seed);
    this._lastCamX = NaN;
    this.canvas?.flagDirty();
  }

  private drawStars(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.camera) return;
    const cam = this.camera;

    this.starfield.drawToCanvas(ctx, cam.pos.x * cam.zoom, cam.pos.y * cam.zoom, w, h);
  }
}
