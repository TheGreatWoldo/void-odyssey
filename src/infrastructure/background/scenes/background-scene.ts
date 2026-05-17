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

const PRESEED_WINDOW_MS = 60_000;

export class BackgroundScene extends Scene {
  private elapsed = 0;
  private spawnIntervalMs: number;
  private rng: RandomNumberGenerator = Math.random;
  sceneArgs: BackgroundSceneArgs;
  protected readonly strategies: BackgroundStrategies;

  constructor(sceneArgs: BackgroundSceneArgs, strategies: BackgroundStrategies) {
    super();
    this.sceneArgs = sceneArgs;
    this.strategies = strategies;
    this.spawnIntervalMs = sceneArgs.spawnIntervalMs;
  }

  override onInitialize(): void {
    this.backgroundColor = this.strategies.backgroundColorStrategy(
      this.sceneArgs.backgroundColor,
      this.sceneArgs,
      defaultBackgroundActorArgs(),
      this.rng,
    );
    this.resetRandom();
    this.preSeed();
  }

  override onPreUpdate(_engine: Engine, delta: number): void {
    this.elapsed += delta;

    if (this.elapsed >= this.spawnIntervalMs) {
      this.elapsed = 0;
      this.spawnActor();
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
    const steps = Math.floor(PRESEED_WINDOW_MS / this.spawnIntervalMs);

    for (let i = 1; i <= steps; i++) {
      this.spawnActor(i * this.spawnIntervalMs);
    }
  }

  private spawnActor(timeAlreadyElapsedMs = 0): void {
    const args = defaultBackgroundActorArgs();
    const cameraViewport = this.engine
      ? this.engine.getWorldBounds()
      : new BoundingBox(0, 0, 1920, 1080);

    args.viewport = cameraViewport;
    args.size = this.strategies.sizeStrategy(this.sceneArgs, args, this.rng);
    args.color = [
      this.strategies.actorColorStrategy(
        this.sceneArgs.actorColor,
        this.sceneArgs,
        args,
        this.rng,
      ),
    ];
    args.velocity = this.strategies.velocityStrategy(this.sceneArgs, args, this.rng);

    const blendFactor = blendFactorForSize(
      args.size,
      this.sceneArgs.minSize,
      this.sceneArgs.maxSize
    );
    const bg = this.backgroundColor ?? Color.Black;

    args.color = args.color.map((c) => blendWithBackground(c, bg, blendFactor));

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
