import { Actor, Circle } from 'excalibur';
import type { BackgroundActorArgs } from './background-actor-args';

export class BackgroundActor extends Actor {
  private readonly options: BackgroundActorArgs;
  private readonly circle: Circle;
  private hasBeenSeen = false;

  public get size(): number {
    return this.options.size;
  }

  constructor(options: BackgroundActorArgs) {
    super({
      pos: options.position,
      radius: options.size,
    });
    this.options = options;
    this.vel = options.velocity;
    this.z = options.size;
    const color = options.color[0];

    this.circle = new Circle({ radius: options.size, color });
    this.graphics.use(this.circle);
  }

  public override onInitialize(): void {
    this.circle.quality = this.scene!.engine.pixelRatio;
    this.circle.flagDirty();
  }

  public override onPreUpdate(): void {
    const engine = this.scene!.engine;
    const viewport = engine.getWorldBounds();
    const r = this.width / 2;
    const inView =
      this.pos.x + r >= viewport.left &&
      this.pos.x - r <= viewport.right &&
      this.pos.y + r >= viewport.top &&
      this.pos.y - r <= viewport.bottom;

    const cam = this.scene!.camera.pos;

    if (inView) {
      this.hasBeenSeen = true;

      return;
    }

    if (this.hasBeenSeen) {
      this.kill();

      return;
    }

    const toCx = cam.x - this.pos.x;
    const toCy = cam.y - this.pos.y;

    if (this.vel.x * toCx + this.vel.y * toCy < 0) {
      this.kill();
    }
  }
}
