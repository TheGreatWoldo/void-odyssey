import { NodeType } from '@/domain/models/navigation/node-type';
import { Canvas } from 'excalibur';
import {
    ENDPOINT_RGB,
    NORMAL_RGB,
    REACHABLE_RGB,
    REVEALED_RGB_BY_TYPE,
} from './node-colors';
import { type NodeDrawingStrategy, NodeVisualState } from './node-drawing-strategy';

/** Logical display size in world pixels. */
const HEX_SIZE = 96;

/** Outer radius (center to vertex) of the hexagon, in logical pixels. */
const HEX_RADIUS = 28;

/**
 * Oversampling factor passed to Excalibur's `quality` option.
 * The backing bitmap is rendered at this multiple of the logical size,
 * so the graphic stays sharp when the camera zooms in.
 */
const QUALITY = 4;

interface NodeVisuals {
  fillAlpha: number;
  strokeAlpha: number;
  strokeWidth: number;
  r: number;
  g: number;
  b: number;
  iconAlpha: number;
  glowAlpha: number;
  /** Outer radius of the radial glow as a multiple of HEX_RADIUS. Default 1.8. */
  glowRadius: number;
  /** Canvas size in logical pixels. Larger for states with wide glows. */
  canvasSize: number;
}

function resolveVisuals(
  type: NodeType,
  state: NodeVisualState,
  scanned: boolean
): NodeVisuals {
  const isEndpoint = type === NodeType.Start || type === NodeType.End;
  const revealedRgb = REVEALED_RGB_BY_TYPE[type];

  if (state === NodeVisualState.Past) {
    const [r, g, b] = revealedRgb;
    const mute = 0.2;
    const grey = 40;
    const mr = Math.round(r * mute + grey * (1 - mute));
    const mg = Math.round(g * mute + grey * (1 - mute));
    const mb = Math.round(b * mute + grey * (1 - mute));

    return {
      fillAlpha: 1.0,
      strokeAlpha: 1.0,
      strokeWidth: 1.0,
      r: mr,
      g: mg,
      b: mb,
      iconAlpha: 1.0,
      glowAlpha: 0,
      glowRadius: 1.8,
      canvasSize: HEX_SIZE,
    };
  }

  if (state === NodeVisualState.Current) {
    const [r, g, b] = revealedRgb;

    return {
      fillAlpha: 1.0,
      strokeAlpha: 1.0,
      strokeWidth: 2.5,
      r,
      g,
      b,
      iconAlpha: 1.0,
      glowAlpha: 0.9,
      glowRadius: 3.2,
      canvasSize: HEX_SIZE * 3,
    };
  }

  if (state === NodeVisualState.Reachable) {
    const [r, g, b] = scanned ? revealedRgb : REACHABLE_RGB;

    return {
      fillAlpha: 1.0,
      strokeAlpha: 1.0,
      strokeWidth: 2.0,
      r,
      g,
      b,
      iconAlpha: scanned ? 1.0 : 0,
      glowAlpha: 0.25,
      glowRadius: 1.8,
      canvasSize: HEX_SIZE,
    };
  }

  if (state === NodeVisualState.Known) {
    const [r, g, b] = scanned ? revealedRgb : REACHABLE_RGB;

    return {
      fillAlpha: 1.0,
      strokeAlpha: 1.0,
      strokeWidth: 1.5,
      r,
      g,
      b,
      iconAlpha: scanned ? 1.0 : 0,
      glowAlpha: 0.2,
      glowRadius: 1.8,
      canvasSize: HEX_SIZE,
    };
  }

  // Normal
  const [r, g, b] = scanned
    ? revealedRgb
    : isEndpoint
      ? ENDPOINT_RGB
      : NORMAL_RGB;

  return {
    fillAlpha: 1.0,
    strokeAlpha: 1.0,
    strokeWidth: scanned ? 1.2 : 1.0,
    r,
    g,
    b,
    iconAlpha: scanned ? 1.0 : 0,
    glowAlpha: scanned ? 0.15 : 0.08,
    glowRadius: 1.8,
    canvasSize: HEX_SIZE,
  };
}

/** Builds the 6 pointy-top hexagon vertex points around (cx, cy). */
function hexPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.beginPath();

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
}

export class HexagonNodeDrawingStrategy implements NodeDrawingStrategy {
  private readonly cache = new Map<string, Canvas>();
  private readonly svgImages = new Map<NodeType, HTMLImageElement>();

  async preload(): Promise<void> {
    await Promise.all(
      Object.values(NodeType).map((type) => this.loadSvgImage(type))
    );
  }

  private loadSvgImage(type: NodeType): Promise<void> {
    const src = `/images/icons/${type}.svg`;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.svgImages.set(type, img);
        resolve();
      };

      img.onerror = () => reject(new Error(`Failed to load node icon: ${src}`));
      img.src = src;
    });
  }

  getGraphic(type: NodeType, state: NodeVisualState, scanned: boolean): Canvas {
    const key = `${type}-${state}-${scanned ? 1 : 0}`;
    const cached = this.cache.get(key);

    if (cached) return cached;

    const {
      fillAlpha,
      strokeAlpha,
      strokeWidth,
      r,
      g,
      b,
      iconAlpha,
      glowAlpha,
      glowRadius,
      canvasSize,
    } = resolveVisuals(type, state, scanned);

    const gfx = new Canvas({
      width: canvasSize,
      height: canvasSize,
      quality: QUALITY,
      cache: true,
      draw: (ctx) => {
        const cx = canvasSize / 2;
        const cy = canvasSize / 2;

        // Soft radial glow behind the hexagon
        const glow = ctx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          HEX_RADIUS * glowRadius
        );

        glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowAlpha})`);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Filled hexagon face
        hexPath(ctx, cx, cy, HEX_RADIUS);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${fillAlpha})`;
        ctx.fill();

        // Hexagon border
        hexPath(ctx, cx, cy, HEX_RADIUS);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${strokeAlpha})`;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();

        // Icon
        const icon = this.svgImages.get(type);

        if (icon && iconAlpha > 0) {
          const iconSize = HEX_RADIUS * 1.2;

          ctx.globalAlpha = iconAlpha;
          ctx.drawImage(
            icon,
            cx - iconSize / 2,
            cy - iconSize / 2,
            iconSize,
            iconSize
          );
          ctx.globalAlpha = 1;
        }
      },
    });

    this.cache.set(key, gfx);

    return gfx;
  }
}
