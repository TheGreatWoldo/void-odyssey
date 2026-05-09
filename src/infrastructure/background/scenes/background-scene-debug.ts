import { Color, type ExcaliburGraphicsContext, vec } from 'excalibur';
import { defaultBackgroundActorArgs } from '../actors/background-actor-args';
import { getPositionDebugInfoForArgs } from '../strategies/position-strategy';
import { BackgroundScene } from './background-scene';

export class BackgroundSceneDebug extends BackgroundScene {
  private deltaTime: number = 0;
  private angleOffset: number = 0;

  private static readonly DEBUG_INTERVAL_MS = 100;

  override onPreDraw(ctx: ExcaliburGraphicsContext, delta: number): void {
    this.deltaTime += delta;
    this.angleOffset += delta / 1000;

    if (this.actors.length > 120) return;
    if (this.deltaTime < BackgroundSceneDebug.DEBUG_INTERVAL_MS) return;

    this.deltaTime = 0;

    const debugArgs = {
      ...this.sceneArgs,
      angleBase: this.sceneArgs.angleBase + this.angleOffset,
    };

    const actorArgs = defaultBackgroundActorArgs();

    actorArgs.viewport = this.engine
      .getWorldBounds()
      .scale(vec(0.4, 0.4))
      .translate(
        vec(0.3 * this.engine.drawWidth, 0.3 * this.engine.drawHeight)
      );
    actorArgs.size = this.strategies.sizeStrategy(debugArgs, actorArgs);
    actorArgs.color = [
      this.strategies.actorColorStrategy(debugArgs.actorColor, debugArgs, actorArgs),
    ];
    actorArgs.velocity = this.strategies.velocityStrategy(debugArgs, actorArgs);

    const positionResult = getPositionDebugInfoForArgs(debugArgs, actorArgs);

    ctx.save();

    ctx.drawRectangle(
      actorArgs.viewport.topLeft,
      actorArgs.viewport.width,
      actorArgs.viewport.height,
      Color.Yellow,
      Color.Yellow,
      12
    );

    ctx.drawLine(
      positionResult.startOfLineOne,
      positionResult.endOfLineOne,
      Color.Green,
      12
    );

    ctx.drawLine(
      positionResult.startOfLineTwo,
      positionResult.endOfLineTwo,
      Color.Orange,
      12
    );

    ctx.drawLine(
      positionResult.perpendicularStart,
      positionResult.perpendicularEnd,
      Color.Purple,
      12
    );

    if (positionResult.intersection1) {
      ctx.drawCircle(positionResult.intersection1, 50, Color.Red, Color.Red);
    }

    if (positionResult.intersection2) {
      ctx.drawCircle(positionResult.intersection2, 50, Color.Red, Color.Red);
    }

    ctx.restore();
  }
}
