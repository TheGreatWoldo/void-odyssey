import { ParallaxStarfield } from '@/infrastructure/navigation-2d/rendering/parallax-starfield';
import { Actor, Camera, Canvas, CoordPlane, Engine } from 'excalibur';

/**
 * Screen-space actor that renders the parallax starfield.
 *
 * Because it uses CoordPlane.Screen it is completely unaffected by camera
 * zoom or position — it always covers the full canvas.
 */
export class StarfieldActor extends Actor {
  private readonly starfield = new ParallaxStarfield();
  private camera: Camera | null = null;
  private canvas: Canvas | null = null;

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
      cache: false,
      draw: (ctx) => this.drawStars(ctx, w, h),
    });

    this.graphics.use(this.canvas);
    this.camera = engine.currentScene.camera;
  }

  generate(seed = 42): void {
    this.starfield.generate(seed);
  }

  private drawStars(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.camera) return;
    const cam = this.camera;

    this.starfield.drawToCanvas(ctx, cam.pos.x * cam.zoom, cam.pos.y * cam.zoom, w, h);
  }
}
