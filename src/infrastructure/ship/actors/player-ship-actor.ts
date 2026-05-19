import { Actor, Canvas, CollisionType, Engine, vec, Vector } from 'excalibur';

const SIZE = 24;
const HALF = SIZE / 2;

/** Orbit radius in world pixels around the hex centre. */
const ORBIT_RADIUS = 18;
/** Orbit angular speed in radians per second. */
const ORBIT_SPEED = 0.9;
/** Travel speed in world pixels per second. */
const TRAVEL_SPEED = 160;

function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

const ShipMode = {
  Orbiting: 'orbiting',
  Traveling: 'traveling',
} as const;
type ShipMode = typeof ShipMode[keyof typeof ShipMode];

const SHIP_FILL = 'rgba(255, 230, 100, 1)';
const GLOW_COLOR = 'rgba(255, 200, 60, 0.5)';

function buildShipCanvas(): Canvas {
  return new Canvas({
    width: SIZE,
    height: SIZE,
    cache: true,
    quality: 4,
    draw(ctx: CanvasRenderingContext2D) {
      ctx.clearRect(0, 0, SIZE, SIZE);

      const glow = ctx.createRadialGradient(HALF, HALF, 0, HALF, HALF, HALF);

      glow.addColorStop(0, GLOW_COLOR);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.save();
      ctx.translate(HALF, HALF);
      ctx.fillStyle = SHIP_FILL;
      ctx.shadowColor = 'rgba(255, 220, 80, 0.9)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, 5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, -5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  });
}

/**
 * Renders the player's ship icon on the current route node.
 * Orbits the current node and travels smoothly to a new one when moveTo() is called.
 */
export class PlayerShipActor extends Actor {
  private readonly shipCanvas: Canvas;
  private orbitCenter: Vector;
  private orbitAngle = 0;

  private mode: ShipMode = ShipMode.Orbiting;
  private travelFrom: Vector = Vector.Zero;
  private travelArrival: Vector = Vector.Zero;
  private travelOrbitCenter: Vector = Vector.Zero;
  private travelProgress = 0;

  /** Called once when the ship enters orbit after a travel. Cleared automatically. */
  public onArrived: (() => void) | null = null;

  constructor(worldPos: Vector) {
    super({
      x: worldPos.x,
      y: worldPos.y,
      collisionType: CollisionType.PreventCollision,
      width: SIZE,
      height: SIZE,
      z: 2,
      anchor: vec(0.5, 0.5),
    });
    this.orbitCenter = worldPos;
    this.shipCanvas = buildShipCanvas();
  }

  override onInitialize(): void {
    this.graphics.use(this.shipCanvas);
  }

  override onPreUpdate(_engine: Engine, delta: number): void {
    if (this.mode === ShipMode.Traveling) {
      this.updateTravel(delta);
    } else {
      this.updateOrbit(delta);
    }
  }

  private updateOrbit(delta: number): void {
    this.orbitAngle += ORBIT_SPEED * (delta / 1000);
    this.pos = new Vector(
      this.orbitCenter.x + ORBIT_RADIUS * Math.cos(this.orbitAngle),
      this.orbitCenter.y + ORBIT_RADIUS * Math.sin(this.orbitAngle)
    );
    this.rotation = this.orbitAngle + Math.PI / 2;
  }

  private updateTravel(delta: number): void {
    const dist = this.travelFrom.distance(this.travelArrival);

    if (dist < 0.1) {
      this.enterOrbit();

      return;
    }

    this.travelProgress = Math.min(
      1,
      this.travelProgress + (TRAVEL_SPEED * (delta / 1000)) / dist
    );
    const t = smoothStep(this.travelProgress);

    this.pos = this.travelFrom.lerp(this.travelArrival, t);

    const dir = this.travelArrival.sub(this.travelFrom);

    this.rotation = Math.atan2(dir.y, dir.x);

    if (this.travelProgress >= 1) {
      this.enterOrbit();
    }
  }

  private enterOrbit(): void {
    this.orbitCenter = this.travelOrbitCenter;
    this.pos = this.travelArrival;
    this.orbitAngle = Math.atan2(
      this.travelArrival.y - this.travelOrbitCenter.y,
      this.travelArrival.x - this.travelOrbitCenter.x
    );
    this.mode = ShipMode.Orbiting;
    const cb = this.onArrived;

    this.onArrived = null;
    cb?.();
  }

  /** Begin smooth travel to orbit a new node centre. */
  moveTo(worldPos: Vector): void {
    const dist = this.pos.distance(worldPos);
    const dir =
      dist > 0 ? this.pos.sub(worldPos).normalize() : new Vector(1, 0);
    const arrivalPoint = worldPos.add(dir.scale(ORBIT_RADIUS));

    this.travelFrom = this.pos;
    this.travelArrival = arrivalPoint;
    this.travelOrbitCenter = worldPos;
    this.travelProgress = 0;
    this.mode = ShipMode.Traveling;
  }
}
