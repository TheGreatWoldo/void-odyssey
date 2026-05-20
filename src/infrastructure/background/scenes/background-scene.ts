import { BackgroundActor } from '@/infrastructure/background/actors/background-actor';
import { defaultBackgroundActorArgs } from '@/infrastructure/background/actors/background-actor-args';
import { BackgroundSceneArgs } from '@/infrastructure/background/background-scene-args';
import type { BackgroundStrategies } from '@/infrastructure/background/strategies/background-strategies';
import {
    blendFactorForSize,
    blendWithBackground,
} from '@/infrastructure/graphics/color-utils';
import { createSeededRandom, hashStringToSeed, type RandomNumberGenerator } from '@/shared/random';
import { BoundingBox, Color, Engine, Scene } from 'excalibur';

const PRESEED_MIN_WINDOW_MS = 4_000;
const PRESEED_MAX_WINDOW_MS = 20_000;
const MAX_PRESEED_SPAWNS = 180;
const PRESEED_VIEWPORT_MARGIN_PX = 256;
const MIN_EFFECTIVE_SPEED_PX_PER_S = 24;
const DEFAULT_VIEWPORT = new BoundingBox(0, 0, 1920, 1080);

export class BackgroundScene extends Scene {
  private elapsed = 0;
  private spawnIntervalMs: number;
  private rng: RandomNumberGenerator = Math.random;
  private currentViewport: BoundingBox = DEFAULT_VIEWPORT;
  sceneArgs: BackgroundSceneArgs;
  protected readonly strategies: BackgroundStrategies;

  constructor(sceneArgs: BackgroundSceneArgs, strategies: BackgroundStrategies) {
    super();
    this.sceneArgs = sceneArgs;
    this.strategies = strategies;
    this.spawnIntervalMs = sceneArgs.spawnIntervalMs;
  }

  override onInitialize(): void {
    this.currentViewport = this.engine?.getWorldBounds() ?? DEFAULT_VIEWPORT;
    this.backgroundColor = this.strategies.backgroundColorStrategy(
      this.sceneArgs.backgroundColor,
      this.sceneArgs,
      defaultBackgroundActorArgs(),
      this.rng,
    );
    this.resetRandom();
    this.preSeed();
  }

  override onPreUpdate(engine: Engine, delta: number): void {
    this.currentViewport = engine.getWorldBounds();
    this.elapsed += delta;

    if (this.spawnIntervalMs > 0) {
      const spawnsDue = Math.floor(this.elapsed / this.spawnIntervalMs);

      if (spawnsDue > 0) {
        const remainder = this.elapsed - (spawnsDue * this.spawnIntervalMs);

        this.elapsed = remainder;

        if (spawnsDue === 1) {
          // Keep normal cadence spawns just outside the viewport edge.
          this.spawnActor();
        } else {
          // For catch-up, spawn oldest first so each actor gets proper age offset.
          for (let i = spawnsDue; i >= 1; i--) {
            const elapsedSinceSpawnMs = remainder + ((i - 1) * this.spawnIntervalMs);

            this.spawnActor(elapsedSinceSpawnMs);
          }
        }
      }
    }

  }

  setSceneArgs(sceneArgs: BackgroundSceneArgs): void {
    this.actors
      .filter((a) => a instanceof BackgroundActor)
      .forEach((a) => a.kill());
    this.sceneArgs = sceneArgs;
    this.spawnIntervalMs = sceneArgs.spawnIntervalMs;
    this.backgroundColor = this.strategies.backgroundColorStrategy(
      this.sceneArgs.backgroundColor,
      this.sceneArgs,
      defaultBackgroundActorArgs(),
      this.rng,
    );
    if (this.isInitialized) {
      this.resetRandom();
      this.preSeed();
    }
  }

  private resetRandom(): void {
    this.rng = createSeededRandom(hashStringToSeed(JSON.stringify(this.sceneArgs)));
  }

  private preSeed(): void {
    if (this.spawnIntervalMs <= 0) {
      return;
    }

    const preSeedWindowMs = this.getPreSeedWindowMs();
    const steps = Math.min(
      Math.floor(preSeedWindowMs / this.spawnIntervalMs),
      MAX_PRESEED_SPAWNS,
    );
    for (let i = 1; i <= steps; i++) {
      this.spawnActor(i * this.spawnIntervalMs);
    }
  }

  private getPreSeedWindowMs(): number {
    const viewportWidth = this.currentViewport.width;
    const viewportHeight = this.currentViewport.height;
    const viewportDiagonal = Math.hypot(viewportWidth, viewportHeight);
    const traversalDistancePx = viewportDiagonal + (this.sceneArgs.maxSize * 2) + PRESEED_VIEWPORT_MARGIN_PX;
    const speedPxPerSecond = Math.max(
      this.sceneArgs.minSpeed * 2,
      MIN_EFFECTIVE_SPEED_PX_PER_S,
    );
    const windowMs = (traversalDistancePx / speedPxPerSecond) * 1000;

    return Math.max(
      PRESEED_MIN_WINDOW_MS,
      Math.min(PRESEED_MAX_WINDOW_MS, windowMs),
    );
  }

  private spawnActor(timeAlreadyElapsedMs = 0): void {
    const args = defaultBackgroundActorArgs();

    args.viewport = this.currentViewport;
    args.getViewport = () => this.currentViewport;
    args.size = this.strategies.sizeStrategy(this.sceneArgs, args, this.rng);
    args.color = this.strategies.actorColorStrategy(
      this.sceneArgs.actorColor,
      this.sceneArgs,
      args,
      this.rng,
    );
    args.velocity = this.strategies.velocityStrategy(this.sceneArgs, args, this.rng);

    const blendFactor = blendFactorForSize(
      args.size,
      this.sceneArgs.minSize,
      this.sceneArgs.maxSize
    );
    const bg = this.backgroundColor ?? Color.Black;

    args.color = blendWithBackground(args.color, bg, blendFactor);

    const placement = this.strategies.positionStrategy(this.sceneArgs, args, this.rng);
    const direction = args.velocity.normalize();
    const speed = args.velocity.magnitude;
    const offset =
      timeAlreadyElapsedMs > 0
        ? (speed / 1000) * timeAlreadyElapsedMs
        : -args.size;

    args.position = placement.startingPosition.add(direction.scale(offset));
    this.add(new BackgroundActor(args));
  }

}
