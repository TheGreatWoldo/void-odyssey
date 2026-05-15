import { NodeType } from '@/domain/models/navigation/node-type';
import { NODE_TYPE_META } from '@/domain/models/navigation/node-type-meta';
import { Canvas } from 'excalibur';

import {
    CURRENT_RGB,
    ENDPOINT_RGB,
    NODE_TYPE_SIZE_FACTOR,
    NORMAL_RGB,
    REACHABLE_RGB,
    REVEALED_RGB_BY_TYPE,
} from './node-colors';
import { type NodeDrawingStrategy, NodeVisualState } from './node-drawing-strategy';

const GLOW_SIZE = 48;

interface NodeVisuals {
  glowStrength: number;
  coreRadius: number;
  r: number;
  g: number;
  b: number;
  iconAlpha: number;
}

function resolveVisuals(
  type: NodeType,
  state: NodeVisualState,
  scanned: boolean
): NodeVisuals {
  const isEndpoint = type === NodeType.Start || type === NodeType.End;
  const revealedRgb = REVEALED_RGB_BY_TYPE[type];
  const sizeFactor = scanned ? NODE_TYPE_SIZE_FACTOR[type] : 1.0;

  if (state === NodeVisualState.Current) {
    const [r, g, b] = CURRENT_RGB;

    return {
      glowStrength: 1.0,
      coreRadius: 7 * sizeFactor,
      r,
      g,
      b,
      iconAlpha: 1.0,
    };
  }

  if (state === NodeVisualState.Past) {
    const [r, g, b] = revealedRgb;
    const mute = 0.2,
      grey = 40;

    return {
      glowStrength: 0.2,
      coreRadius: 3.0 * sizeFactor,
      r: Math.round(r * mute + grey * (1 - mute)),
      g: Math.round(g * mute + grey * (1 - mute)),
      b: Math.round(b * mute + grey * (1 - mute)),
      iconAlpha: 0.5,
    };
  }

  if (state === NodeVisualState.Reachable) {
    const [r, g, b] = scanned ? revealedRgb : REACHABLE_RGB;

    return {
      glowStrength: 0.85,
      coreRadius: 5.5 * sizeFactor,
      r,
      g,
      b,
      iconAlpha: scanned ? 0.95 : 0,
    };
  }

  if (state === NodeVisualState.Known) {
    const [r, g, b] = scanned ? revealedRgb : REACHABLE_RGB;

    return {
      glowStrength: 0.7,
      coreRadius: 5.0 * sizeFactor,
      r,
      g,
      b,
      iconAlpha: scanned ? 0.6 : 0,
    };
  }

  // Unknown
  const [r, g, b] = scanned
    ? revealedRgb
    : isEndpoint
      ? ENDPOINT_RGB
      : NORMAL_RGB;

  return {
    glowStrength: scanned ? 0.45 : 0.35,
    coreRadius: scanned ? 4.0 * sizeFactor : 3.5,
    r,
    g,
    b,
    iconAlpha: scanned ? 0.6 : 0,
  };
}

export class StarGlowNodeDrawingStrategy implements NodeDrawingStrategy {
  private readonly cache = new Map<string, Canvas>();

  getGraphic(type: NodeType, state: NodeVisualState, scanned: boolean): Canvas {
    const key = `${type}-${state}-${scanned ? 1 : 0}`;
    const cached = this.cache.get(key);

    if (cached) return cached;

    const meta = NODE_TYPE_META[type];
    const { glowStrength, coreRadius, r: gr, g: gg, b: gb, iconAlpha } =
      resolveVisuals(type, state, scanned);

    const gfx = new Canvas({
      width: GLOW_SIZE,
      height: GLOW_SIZE,
      cache: true,
      draw: (ctx) => {
        const cx = GLOW_SIZE / 2;
        const cy = GLOW_SIZE / 2;

        const outerGrad = ctx.createRadialGradient(
          cx, cy, 0, cx, cy, GLOW_SIZE / 2
        );

        outerGrad.addColorStop(
          0,
          `rgba(${gr}, ${gg}, ${gb}, ${glowStrength * 0.7})`
        );
        outerGrad.addColorStop(
          0.45,
          `rgba(${gr}, ${gg}, ${gb}, ${glowStrength * 0.25})`
        );
        outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = outerGrad;
        ctx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);

        const coreGrad = ctx.createRadialGradient(
          cx, cy, 0, cx, cy, coreRadius * 1.5
        );

        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        coreGrad.addColorStop(0.5, `rgba(${gr}, ${gg}, ${gb}, 0.6)`);
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${iconAlpha})`;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.icon, cx, cy + 1);
      },
    });

    this.cache.set(key, gfx);

    return gfx;
  }
}
