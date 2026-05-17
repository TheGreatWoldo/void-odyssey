import type { RandomNumberGenerator } from '@/shared/random';
import type { BezierCurveProvider } from './bezier-curve-provider';

const PADDING_X = 0.1;

/** Number of uniform-parameter samples used to build the arc-length lookup table. */
const ARC_SAMPLES = 300;

/**
 * Vertical deviation expressed as a fraction of canvas height.
 * Resolution-independent: does not depend on actual pixel dimensions.
 */
const DEFAULT_MAX_AMPLITUDE = 0.12;

function evalCubic1D(
  t: number,
  p0: number,
  cp1: number,
  cp2: number,
  p3: number
): number {
  const mt = 1 - t;

  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * cp1 +
    3 * mt * t * t * cp2 +
    t * t * t * p3
  );
}

/**
 * Generates a randomised N-segment C1-continuous cubic Bézier curve.
 *
 * `sampleAt(t)` converts an arc-length fraction t ∈ [0,1] to normalised
 * {nx, ny} using a pre-built lookup table — no canvas dimensions needed.
 */
export class RandomBezierCurveProvider implements BezierCurveProvider {
  readonly paddingX = PADDING_X;
  readonly segmentCount: number;
  private readonly maxAmplitude: number;

  private _controlPoints: number[];
  private _arcTable: { param: number; s: number }[] = [];
  private _totalLength = 0;

  constructor(segments = 3, maxAmplitude = DEFAULT_MAX_AMPLITUDE) {
    this.segmentCount = Math.max(1, Math.floor(segments));
    this.maxAmplitude = maxAmplitude;
    this._controlPoints = new Array(4 * this.segmentCount).fill(0.5);
  }

  get controlPoints(): Readonly<number[]> {
    return this._controlPoints;
  }

  generate(rng: RandomNumberGenerator = Math.random): void {
    const N = this.segmentCount;
    const r = rng;
    const x0 = PADDING_X;
    const x3 = 1 - PADDING_X;
    const span = x3 - x0;
    const dev = () => (r() * 2 - 1) * this.maxAmplitude;

    const slotW = span / (2 * N + 1);
    const xs: number[] = [];

    for (let k = 0; k < 2 * N; k++) {
      xs.push(x0 + slotW * (k + 0.15 + r() * 0.7));
    }

    const controlPoints = new Array<number>(4 * N);

    controlPoints[0] = xs[0];
    controlPoints[1] = 0.5 + dev();

    for (let i = 0; i < N; i++) {
      controlPoints[2 + 2 * i] = xs[2 * i + 1];
      controlPoints[3 + 2 * i] = 0.5 + dev();
    }

    for (let j = 0; j < N - 1; j++) {
      controlPoints[2 + 2 * N + 2 * j] = xs[2 * j + 2];
      controlPoints[3 + 2 * N + 2 * j] = 0.5 + dev();
    }

    this._controlPoints = controlPoints;
    this._buildArcTable();
  }

  sampleAt(t: number): { nx: number; ny: number } {
    if (this._arcTable.length === 0) return { nx: t, ny: 0.5 };

    const target = Math.max(0, Math.min(1, t)) * this._totalLength;

    let lo = 0,
      hi = this._arcTable.length - 1;

    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;

      if (this._arcTable[mid].s < target) lo = mid;
      else hi = mid;
    }

    const a = this._arcTable[lo];
    const b = this._arcTable[hi];
    const alpha = b.s > a.s ? (target - a.s) / (b.s - a.s) : 0;

    return this._evalAtParam(a.param + alpha * (b.param - a.param));
  }

  private _evalAtParam(param: number): { nx: number; ny: number } {
    const N = this.segmentCount;
    const controlPoints = this._controlPoints;

    const wp = (j: number) => {
      if (j === 0) return { x: PADDING_X, y: 0.5 };

      if (j === N) return { x: 1 - PADDING_X, y: 0.5 };
      const idx = 2 + 2 * N + 2 * (j - 1);

      return { x: controlPoints[idx], y: controlPoints[idx + 1] };
    };

    const cpb = (i: number) => {
      const idx = 2 + 2 * (i - 1);

      return { x: controlPoints[idx], y: controlPoints[idx + 1] };
    };

    const cpa = (i: number) => {
      if (i === 1) return { x: controlPoints[0], y: controlPoints[1] };
      const p = wp(i - 1);
      const b = cpb(i - 1);

      return { x: 2 * p.x - b.x, y: 2 * p.y - b.y };
    };

    const seg = Math.min(Math.floor(param), N - 1);
    const t = param - seg;
    const i = seg + 1;

    const from = wp(i - 1),
      to = wp(i);
    const a = cpa(i),
      b = cpb(i);

    return {
      nx: evalCubic1D(t, from.x, a.x, b.x, to.x),
      ny: evalCubic1D(t, from.y, a.y, b.y, to.y),
    };
  }

  private _buildArcTable(): void {
    const N = this.segmentCount;

    this._arcTable = [];
    let totalS = 0;
    let prev = this._evalAtParam(0);

    this._arcTable.push({ param: 0, s: 0 });

    for (let i = 1; i <= ARC_SAMPLES; i++) {
      const param = (i / ARC_SAMPLES) * N;
      const curr = this._evalAtParam(param);
      const dx = curr.nx - prev.nx;
      const dy = curr.ny - prev.ny;

      totalS += Math.sqrt(dx * dx + dy * dy);
      this._arcTable.push({ param, s: totalS });
      prev = curr;
    }

    this._totalLength = totalS;
  }
}
