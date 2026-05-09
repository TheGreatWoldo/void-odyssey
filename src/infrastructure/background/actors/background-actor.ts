import { Actor, Circle } from 'excalibur';
import { BackgroundActorArgs } from './background-actor-args';

export class BackgroundActor extends Actor {
  public get size(): number {
    return this.options.size;
  }
  private hasBeenSeen = false;

  constructor(private options: BackgroundActorArgs) {
    super({
      pos: options.position,
      radius: options.size,
    });
    this.vel = options.velocity;
    this.z = options.size;
    const color =
      options.color[Math.floor(Math.random() * options.color.length)];

    this.graphics.use(new Circle({ radius: options.size, color }));
  }

  public override onPreUpdate(): void {
    const engine = this.scene!.engine;
    const cam = this.scene!.camera.pos;
    const hw = engine.drawWidth / 2;
    const hh = engine.drawHeight / 2;
    const r = this.width / 2;
    const inView =
      this.pos.x + r >= cam.x - hw &&
      this.pos.x - r <= cam.x + hw &&
      this.pos.y + r >= cam.y - hh &&
      this.pos.y - r <= cam.y + hh;

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
