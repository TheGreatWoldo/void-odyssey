import { createFraction } from './fraction';

/**
 * Value Object — represents module condition state in [0, 1].
 * 0 = destroyed/non-functional; 1 = pristine condition.
 *
 * Condition is typically reduced by combat damage, wear, and age.
 * Modules with condition <= 0 are disabled and do not produce.
 *
 * Condition is immutable. To change it, create a new Condition via createCondition().
 *
 * Example:
 *   const condition = createCondition(0.8);
 *   if (condition.isOk) {
 *     const damaged = condition.value.degrade(0.2); // new Condition at 0.6
 *   }
 */
export interface Condition {
  /** The condition value in [0, 1]. */
  readonly value: number;

  /**
   * Returns true if this condition is greater than 0 (module is functional).
   */
  isOperational(): boolean;

  /**
   * Returns a new Condition with this value reduced by the given amount.
   * Never goes below 0.
   */
  degrade(amount: number): Condition;

  /**
   * Returns a new Condition with this value increased by the given amount.
   * Never exceeds 1.
   */
  repair(amount: number): Condition;
}

/**
 * Creates a Condition from a number.
 * Returns an error if the input is NaN, Infinity, or outside [0, 1].
 *
 * @param value — the initial condition value in [0, 1]
 * @returns Ok(Condition) if valid, Err(message) otherwise
 */
export function createCondition(value: number): ReturnType<typeof createFraction> & { value?: Condition } {
  const fraction = createFraction(value);
  if (!fraction.isOk) {
    return fraction as any;
  }

  const frozen: Condition = Object.freeze({
    value,
    isOperational(): boolean {
      return value > 0;
    },
    degrade(amount: number): Condition {
      if (!isFinite(amount) || amount < 0) {
        return frozen;
      }
      const degraded = Math.max(0, value - amount);
      return unsafeCondition(degraded);
    },
    repair(amount: number): Condition {
      if (!isFinite(amount) || amount < 0) {
        return frozen;
      }
      const repaired = Math.min(1, value + amount);
      return unsafeCondition(repaired);
    },
  });

  return { isOk: true, value: frozen } as any;
}

/**
 * Unsafe factory — creates a Condition without validation.
 * ONLY use when the value is known to be valid (e.g., from internal calculations).
 * Prefer createCondition() for all public APIs.
 *
 * @param value — must be in [0, 1]; no validation performed
 * @returns Condition wrapping the value
 */
export function unsafeCondition(value: number): Condition {
  const frozen: Condition = Object.freeze({
    value,
    isOperational(): boolean {
      return value > 0;
    },
    degrade(amount: number): Condition {
      if (!isFinite(amount) || amount < 0) {
        return frozen;
      }
      const degraded = Math.max(0, value - amount);
      return unsafeCondition(degraded);
    },
    repair(amount: number): Condition {
      if (!isFinite(amount) || amount < 0) {
        return frozen;
      }
      const repaired = Math.min(1, value + amount);
      return unsafeCondition(repaired);
    },
  });

  return frozen;
}
