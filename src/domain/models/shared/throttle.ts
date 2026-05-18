import { createFraction } from './fraction';

/**
 * Value Object — represents module throttle level in [0, 1].
 * 0 = idle; 1 = maximum power.
 *
 * Throttle controls production rate, damage output, and other performance metrics.
 * It can be ramped over time via rampRate.
 *
 * Throttle is immutable. To change it, create a new Throttle via createThrottle().
 *
 * Example:
 *   const throttle = createThrottle(0.5);
 *   if (throttle.isOk) {
 *     const value = throttle.value.value; // 0.5
 *     const ramped = throttle.value.ramp(0.1, 1); // increase by 0.1 per second
 *   }
 */
export interface Throttle {
  /** The throttle level in [0, 1]. */
  readonly value: number;

  /**
   * Returns a new Throttle gradually moving from this value toward target,
   * constrained by rampRate per second.
   *
   * @param targetThrottle — desired throttle level in [0, 1]
   * @param rampRate       — maximum change per second in [0, 1]
   * @param deltaTime      — elapsed time in seconds
   * @returns Throttle at most rampRate * deltaTime steps closer to target
   */
  ramp(targetThrottle: number, rampRate: number, deltaTime: number): Throttle;

  /**
   * Returns a new Throttle scaled by the given factor.
   * Result is clamped to [0, 1].
   */
  scale(scaleFactor: number): Throttle;
}

/**
 * Creates a Throttle from a number.
 * Returns an error if the input is NaN, Infinity, or outside [0, 1].
 *
 * @param value — the throttle level in [0, 1]
 * @returns Ok(Throttle) if valid, Err(message) otherwise
 */
export function createThrottle(value: number): ReturnType<typeof createFraction> & { value?: Throttle } {
  const fraction = createFraction(value);
  if (!fraction.isOk) {
    return fraction as any;
  }

  const frozen: Throttle = Object.freeze({
    value,
    ramp(targetThrottle: number, rampRate: number, deltaTime: number): Throttle {
      if (
        !isFinite(targetThrottle) ||
        !isFinite(rampRate) ||
        !isFinite(deltaTime) ||
        targetThrottle < 0 ||
        targetThrottle > 1 ||
        rampRate < 0 ||
        rampRate > 1 ||
        deltaTime < 0
      ) {
        return frozen;
      }

      const maxChange = rampRate * deltaTime;
      let newValue = value;

      if (value < targetThrottle) {
        newValue = Math.min(targetThrottle, value + maxChange);
      } else if (value > targetThrottle) {
        newValue = Math.max(targetThrottle, value - maxChange);
      }

      return unsafeThrottle(newValue);
    },
    scale(scaleFactor: number): Throttle {
      if (!isFinite(scaleFactor)) {
        return frozen;
      }
      const scaled = Math.max(0, Math.min(1, value * scaleFactor));
      return unsafeThrottle(scaled);
    },
  });

  return { isOk: true, value: frozen } as any;
}

/**
 * Unsafe factory — creates a Throttle without validation.
 * ONLY use when the value is known to be valid (e.g., from internal calculations).
 * Prefer createThrottle() for all public APIs.
 *
 * @param value — must be in [0, 1]; no validation performed
 * @returns Throttle wrapping the value
 */
export function unsafeThrottle(value: number): Throttle {
  const frozen: Throttle = Object.freeze({
    value,
    ramp(targetThrottle: number, rampRate: number, deltaTime: number): Throttle {
      if (
        !isFinite(targetThrottle) ||
        !isFinite(rampRate) ||
        !isFinite(deltaTime) ||
        targetThrottle < 0 ||
        targetThrottle > 1 ||
        rampRate < 0 ||
        rampRate > 1 ||
        deltaTime < 0
      ) {
        return frozen;
      }

      const maxChange = rampRate * deltaTime;
      let newValue = value;

      if (value < targetThrottle) {
        newValue = Math.min(targetThrottle, value + maxChange);
      } else if (value > targetThrottle) {
        newValue = Math.max(targetThrottle, value - maxChange);
      }

      return unsafeThrottle(newValue);
    },
    scale(scaleFactor: number): Throttle {
      if (!isFinite(scaleFactor)) {
        return frozen;
      }
      const scaled = Math.max(0, Math.min(1, value * scaleFactor));
      return unsafeThrottle(scaled);
    },
  });

  return frozen;
}
