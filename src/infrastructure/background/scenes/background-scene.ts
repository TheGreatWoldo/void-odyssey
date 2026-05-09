import {
    blendFactorForSize,
    blendWithBackground,
} from '@/infrastructure/graphics/color-utils';
import { BoundingBox, Color, Engine, Scene, Vector } from 'excalibur';
import { BackgroundActor } from '../actors/background-actor';
import { defaultBackgroundActorArgs } from '../actors/background-actor-args';
import { BackgroundSceneArgs } from '../background-scene-args';
import type { BackgroundStrategies } from '../strategies/background-strategies';

const PRESEED_WINDOW_MS = 60_000;

export class BackgroundScene extends Scene {
  private elapsed = 0;
  private spawnIntervalMs: number;
  protected sceneArgs: BackgroundSceneArgs;
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
      defaultBackgroundActorArgs()
    );
    this.camera.pos = new Vector(
      this.engine.drawWidth / 2,
      this.engine.drawHeight / 2
    );
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
      defaultBackgroundActorArgs()
    );
    if (this.isInitialized) {
      this.preSeed();
    }
  }

  private preSeed(): void {
    const steps = Math.floor(PRESEED_WINDOW_MS / this.spawnIntervalMs);

    for (let i = 1; i <= steps; i++) {
      this.spawnActor(i * this.spawnIntervalMs);
    }
  }

  private spawnActor(timeAlreadyElapsedMs = 0): void {
    const args = defaultBackgroundActorArgs();
    const w = this.engine?.drawWidth ?? 1920;
    const h = this.engine?.drawHeight ?? 1080;
    const cameraViewport = this.engine
      ? this.camera.viewport
      : new BoundingBox(0, 0, w, h);

    args.viewport = cameraViewport;
    args.size = this.strategies.sizeStrategy(this.sceneArgs, args);
    args.color = [
      this.strategies.actorColorStrategy(
        this.sceneArgs.actorColor,
        this.sceneArgs,
        args
      ),
    ];
    args.velocity = this.strategies.velocityStrategy(this.sceneArgs, args);

    const blendFactor = blendFactorForSize(
      args.size,
      this.sceneArgs.minSize,
      this.sceneArgs.maxSize
    );
    const bg = this.backgroundColor ?? Color.Black;

    args.color = args.color.map((c) => blendWithBackground(c, bg, blendFactor));

    const placement = this.strategies.positionStrategy(this.sceneArgs, args);
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
