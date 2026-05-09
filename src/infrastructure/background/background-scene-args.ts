import { ColorArgs } from './args/color-args';

export interface SpeedArgs {
  minSpeed: number;
  maxSpeed: number;
}

export interface SizeArgs {
  minSize: number;
  maxSize: number;
}

export interface IBackgroundSceneArgs extends SizeArgs, SpeedArgs {
  actorColor: ColorArgs;
  backgroundColor: ColorArgs;
  angleBase: number;
  angleTolerance: number;
  /** How often a new actor spawns (ms). Lower = more actors on screen. Default: 300. */
  spawnIntervalMs: number;
}

export class BackgroundSceneArgs implements IBackgroundSceneArgs {
  actorColor: ColorArgs;
  backgroundColor: ColorArgs;
  minSpeed: number;
  maxSpeed: number;
  minSize: number;
  maxSize: number;
  angleBase: number;
  angleTolerance: number;
  spawnIntervalMs: number;

  constructor(options: Partial<IBackgroundSceneArgs> = {}) {
    this.actorColor = options.actorColor ?? new ColorArgs();
    this.backgroundColor = options.backgroundColor ?? new ColorArgs();
    this.minSpeed = options.minSpeed ?? 0;
    this.maxSpeed = options.maxSpeed ?? 0;
    this.minSize = options.minSize ?? 0;
    this.maxSize = options.maxSize ?? 0;
    this.angleBase = options.angleBase ?? 0;
    this.angleTolerance = options.angleTolerance ?? 0;
    this.spawnIntervalMs = options.spawnIntervalMs ?? 300;
  }
}
