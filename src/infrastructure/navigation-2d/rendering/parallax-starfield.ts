import { STAR_COLORS, getStarWithRng } from '@/shared/star-colors';
import { Color } from 'excalibur';

export interface StarfieldLayer {
  /** Number of stars in this layer. */
  count: number;
  /** Fraction of camera movement applied to this layer (0 = fixed, 1 = moves with scene). */
  parallax: number;
  /** Star core radius in screen pixels. */
  size: number;
  /** Glow halo radius as a multiple of size. */
  glowRadius: number;
  /** Base star colour (alpha is per-layer). */
  color: Color;
}

interface Star {
  /** Normalised position in [0, 1] — mapped to screen dimensions at draw time. */
  nx: number;
  ny: number;
  /** Spectral colour assigned at generation time. */
  color: Color;
  /** Pre-baked offscreen canvas with a radial gradient glow + core. */
  sprite: HTMLCanvasElement;
}

const DEFAULT_LAYERS: StarfieldLayer[] = [
  { count: 300, parallax: 0.02, size: 0.3, glowRadius: 2.0, color: Color.fromRGB(140, 155, 195, 0.25) },
  { count: 220, parallax: 0.04, size: 0.5, glowRadius: 2.5, color: Color.fromRGB(155, 168, 205, 0.32) },
  { count: 160, parallax: 0.08, size: 0.7, glowRadius: 2.8, color: Color.fromRGB(170, 182, 215, 0.42) },
  { count: 100, parallax: 0.13, size: 0.9, glowRadius: 3.0, color: Color.fromRGB(185, 198, 228, 0.52) },
  { count: 65,  parallax: 0.2,  size: 1.1, glowRadius: 3.3, color: Color.fromRGB(200, 210, 238, 0.62) },
  { count: 35,  parallax: 0.28, size: 1.4, glowRadius: 3.8, color: Color.fromRGB(212, 220, 248, 0.72) },
  { count: 15,  parallax: 0.38, size: 1.8, glowRadius: 4.5, color: Color.fromRGB(225, 230, 255, 0.85) },
];

/**
 * Modular parallax starfield renderer.
 *
 * Stars in each layer scroll at a fraction of the camera pan speed, creating
 * a depth illusion. Positions tile seamlessly using modular arithmetic so the
 * field is infinite in all directions.
 *
 * Usage:
 *   const sf = new ParallaxStarfield();
 *   sf.generate(seed);               // call once (or on reset)
 *   // inside a Screen-space Canvas draw callback:
 *   sf.drawToCanvas(ctx, cam.pos.x * cam.zoom, cam.pos.y * cam.zoom, w, h);
 */
export class ParallaxStarfield {
  private readonly layers: StarfieldLayer[];
  private stars: Star[][] = [];

  /** Shared cache across all instances, keyed by "r,g,b,a,coreSize,glowRadius". */
  private static readonly glowCache = new Map<string, HTMLCanvasElement>();

  constructor(layers: StarfieldLayer[] = DEFAULT_LAYERS) {
    this.layers = layers;
  }

  /**
   * Pre-bake all possible spectral colour × layer combinations into the shared cache.
   * Call once at startup so the first scene activation has no canvas-allocation cost.
   */
  static warmCache(layers: StarfieldLayer[] = DEFAULT_LAYERS): void {
    const instance = new ParallaxStarfield(layers);

    for (const color of Object.values(STAR_COLORS)) {
      for (const layer of layers) {
        const starColor = color.clone();

        starColor.a = layer.color.a;
        instance.bakeGlowSprite(
          starColor,
          layer.size,
          layer.glowRadius > 0 ? layer.glowRadius : 1
        );
      }
    }
  }

  private bakeGlowSprite(
    color: Color,
    coreSize: number,
    glowRadius: number
  ): HTMLCanvasElement {
    const key = `${color.r},${color.g},${color.b},${color.a.toFixed(3)},${coreSize},${glowRadius}`;
    const cached = ParallaxStarfield.glowCache.get(key);

    if (cached) return cached;

    const outerR = coreSize * glowRadius;
    const dim = Math.ceil(outerR * 2);
    const cx = dim / 2;

    const canvas = document.createElement('canvas');

    canvas.width = dim;
    canvas.height = dim;
    const c2d = canvas.getContext('2d')!;

    const rgb = `${color.r},${color.g},${color.b}`;
    const gradient = c2d.createRadialGradient(cx, cx, 0, cx, cx, outerR);

    gradient.addColorStop(0, `rgba(${rgb},${color.a})`);
    gradient.addColorStop(coreSize / outerR, `rgba(${rgb},${color.a})`);
    gradient.addColorStop(
      Math.min((coreSize * 2) / outerR, 1),
      `rgba(${rgb},${color.a * 0.6})`
    );
    gradient.addColorStop(1, `rgba(${rgb},0)`);
    c2d.fillStyle = gradient;
    c2d.beginPath();
    c2d.arc(cx, cx, outerR, 0, Math.PI * 2);
    c2d.fill();

    ParallaxStarfield.glowCache.set(key, canvas);

    return canvas;
  }

  /** Seed-based deterministic star generation. Call once per scene activation. */
  generate(seed = 42): void {
    let s = seed | 0;
    const rand = () => {
      s = Math.imul(s ^ (s >>> 15), s | 1);
      s ^= s + Math.imul(s ^ (s >>> 7), s | 61);

      return ((s ^ (s >>> 14)) >>> 0) / 0x100000000;
    };

    this.stars = this.layers.map((layer) =>
      Array.from({ length: layer.count }, () => {
        const { color } = getStarWithRng(rand);
        const starColor = color.clone();

        starColor.a = layer.color.a;
        const sprite = this.bakeGlowSprite(
          starColor,
          layer.size,
          layer.glowRadius > 0 ? layer.glowRadius : 1
        );

        return { nx: rand(), ny: rand(), color: starColor, sprite };
      })
    );
  }

  /**
   * Draw the starfield using a native CanvasRenderingContext2D.
   * Call from a CoordPlane.Screen Canvas actor's draw callback.
   */
  drawToCanvas(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    screenWidth: number,
    screenHeight: number
  ): void {
    if (this.stars.length === 0) return;
    this.renderStars(ctx, cameraX, cameraY, screenWidth, screenHeight);
  }

  private renderStars(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    screenWidth: number,
    screenHeight: number
  ): void {
    for (let li = 0; li < this.layers.length; li++) {
      const layer = this.layers[li];
      const starList = this.stars[li];
      const offsetX = cameraX * layer.parallax;
      const offsetY = cameraY * layer.parallax;

      for (const star of starList) {
        const sx =
          (((star.nx * screenWidth - offsetX) % screenWidth) + screenWidth) %
          screenWidth;
        const sy =
          (((star.ny * screenHeight - offsetY) % screenHeight) + screenHeight) %
          screenHeight;
        const hw = star.sprite.width / 2;
        const hh = star.sprite.height / 2;

        ctx.drawImage(star.sprite, sx - hw, sy - hh);
      }
    }
  }
}
