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
const BACKGROUND_PROFILE_ENABLED = import.meta.env.DEV;
const BACKGROUND_PROFILE_LOG_INTERVAL_MS = 2_000;

type BackgroundProfilerStats = {
  updateSamples: number;
  updateTimeMs: number;
  spawnCalls: number;
  spawnedFromCatchup: number;
  spawnTimeMs: number;
  preseedSteps: number;
  preseedTimeMs: number;
  elapsedSinceLastLogMs: number;
};

function createBackgroundProfilerStats(): BackgroundProfilerStats {
  return {
    updateSamples: 0,
    updateTimeMs: 0,
    spawnCalls: 0,
    spawnedFromCatchup: 0,
    spawnTimeMs: 0,
    preseedSteps: 0,
    preseedTimeMs: 0,
    elapsedSinceLastLogMs: 0,
  };
}

export class BackgroundScene extends Scene {
  private elapsed = 0;
  private spawnIntervalMs: number;
  private rng: RandomNumberGenerator = Math.random;
  private currentViewport: BoundingBox = DEFAULT_VIEWPORT;
  private readonly profilerStats = createBackgroundProfilerStats();
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
    const updateStartMs = BACKGROUND_PROFILE_ENABLED ? performance.now() : 0;
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

    if (BACKGROUND_PROFILE_ENABLED) {
      this.profilerStats.updateSamples += 1;
      this.profilerStats.updateTimeMs += performance.now() - updateStartMs;
      this.profilerStats.elapsedSinceLastLogMs += delta;
      this.flushProfilerLogIfNeeded();
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
    const preseedStartMs = BACKGROUND_PROFILE_ENABLED ? performance.now() : 0;

    for (let i = 1; i <= steps; i++) {
      this.spawnActor(i * this.spawnIntervalMs);
    }

    if (BACKGROUND_PROFILE_ENABLED) {
      this.profilerStats.preseedSteps += steps;
      this.profilerStats.preseedTimeMs += performance.now() - preseedStartMs;
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
    const spawnStartMs = BACKGROUND_PROFILE_ENABLED ? performance.now() : 0;
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

    if (BACKGROUND_PROFILE_ENABLED) {
      this.profilerStats.spawnCalls += 1;
      if (timeAlreadyElapsedMs > 0) {
        this.profilerStats.spawnedFromCatchup += 1;
      }
      this.profilerStats.spawnTimeMs += performance.now() - spawnStartMs;
    }
  }

  private flushProfilerLogIfNeeded(): void {
    if (this.profilerStats.elapsedSinceLastLogMs < BACKGROUND_PROFILE_LOG_INTERVAL_MS) {
      return;
    }

    const updateAvgMs = this.profilerStats.updateSamples > 0
      ? this.profilerStats.updateTimeMs / this.profilerStats.updateSamples
      : 0;
    const spawnAvgMs = this.profilerStats.spawnCalls > 0
      ? this.profilerStats.spawnTimeMs / this.profilerStats.spawnCalls
      : 0;
    const activeActors = this.actors.filter((actor) => actor instanceof BackgroundActor).length;

    console.debug('[BackgroundScene:perf]', {
      scene: this.sceneArgs,
      activeActors,
      updateAvgMs: Number(updateAvgMs.toFixed(4)),
      spawnAvgMs: Number(spawnAvgMs.toFixed(4)),
      spawnCalls: this.profilerStats.spawnCalls,
      spawnedFromCatchup: this.profilerStats.spawnedFromCatchup,
      preseedSteps: this.profilerStats.preseedSteps,
      preseedTimeMs: Number(this.profilerStats.preseedTimeMs.toFixed(4)),
      viewport: {
        width: Math.round(this.currentViewport.width),
        height: Math.round(this.currentViewport.height),
      },
    });

    this.profilerStats.updateSamples = 0;
    this.profilerStats.updateTimeMs = 0;
    this.profilerStats.spawnCalls = 0;
    this.profilerStats.spawnedFromCatchup = 0;
    this.profilerStats.spawnTimeMs = 0;
    this.profilerStats.preseedSteps = 0;
    this.profilerStats.preseedTimeMs = 0;
    this.profilerStats.elapsedSinceLastLogMs = 0;
  }
}
