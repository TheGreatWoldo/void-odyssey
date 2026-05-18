import type { Result } from '@/shared/result';
import { err, ok } from '@/shared/result';

/**
 * Value Object — represents a bounded real number in the range [0, 1].
 * Used for throttle levels, condition states, and other fractional game values.
 *
 * Fractions are immutable. To change a value, create a new Fraction via createFraction().
 *
 * Example:
 *   const throttle = createFraction(0.75);
 *   if (throttle.isOk) {
 *     const value = throttle.value.value; // 0.75
 *   }
 */
export interface Fraction {
  /** The bounded value in [0, 1]. */
  readonly value: number;

  /**
   * Returns a new Fraction representing this * scale.
   * If the result would exceed [0, 1], it is clamped.
   * Always succeeds — clamping is automatic.
   */
  scale(scaleFactor: number): Fraction;

  /**
   * Returns a new Fraction with value clamped to [0, 1].
   * Succeeds unless the input is NaN or Infinity.
   */
  clamp(): Fraction;
}

/**
 * Creates a Fraction from a number.
 * Returns an error if the input is NaN, Infinity, or outside [0, 1].
 *
 * @param value — the input value to validate and wrap
 * @returns Ok(Fraction) if value is in [0, 1], Err(message) otherwise
 */
export function createFraction(value: number): Result<Fraction, string> {
  if (!isFinite(value)) {
    return err(`Fraction value must be finite, got ${value}`);
  }

  if (value < 0 || value > 1) {
    return err(`Fraction value must be in [0, 1], got ${value}`);
  }

  const frozen: Fraction = Object.freeze({
    value,
    scale(scaleFactor: number): Fraction {
      if (!isFinite(scaleFactor)) {
        return frozen;
      }
      const scaled = Math.max(0, Math.min(1, value * scaleFactor));
      return Object.freeze({
        value: scaled,
        scale: this.scale.bind(this),
        clamp: this.clamp.bind(this),
      });
    },
    clamp(): Fraction {
      const clamped = Math.max(0, Math.min(1, value));
      if (clamped === value) return frozen;
      return Object.freeze({
        value: clamped,
        scale: this.scale.bind(this),
        clamp: this.clamp.bind(this),
      });
    },
  });

  return ok(frozen);
}

/**
 * Unsafe factory — creates a Fraction without validation.
 * ONLY use when the value is known to be valid (e.g., from internal calculations).
 * Prefer createFraction() for all public APIs.
 *
 * @param value — must be in [0, 1]; no validation performed
 * @returns Fraction wrapping the value
 */
export function unsafeFraction(value: number): Fraction {
  const frozen: Fraction = Object.freeze({
    value,
    scale(scaleFactor: number): Fraction {
      if (!isFinite(scaleFactor)) {
        return frozen;
      }
      const scaled = Math.max(0, Math.min(1, value * scaleFactor));
      return Object.freeze({
        value: scaled,
        scale: this.scale.bind(this),
        clamp: this.clamp.bind(this),
      });
    },
    clamp(): Fraction {
      const clamped = Math.max(0, Math.min(1, value));
      if (clamped === value) return frozen;
      return Object.freeze({
        value: clamped,
        scale: this.scale.bind(this),
        clamp: this.clamp.bind(this),
      });
    },
  });

  return frozen;
}
