import { BoundingBox, Color, vec, Vector } from 'excalibur';

export type BackgroundActorArgs = {
  size: number;
  position: Vector;
  color: Color[];
  velocity: Vector;
  viewport: BoundingBox;
};

export function defaultBackgroundActorArgs(): BackgroundActorArgs {
  return {
    size: 0,
    position: vec(0, 0),
    color: [Color.White],
    velocity: vec(0, 0),
    viewport: new BoundingBox(0, 0, 0, 0),
  };
}


