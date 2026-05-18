import type { PowerSystem } from '@/domain/models/systems/power-system';

/**
 * Repository for persisting PowerSystem state.
 *
 * Power systems are typically owned by Ships or other entities.
 * Use this to save/load the power configuration (batteries, capacity constraints, etc.).
 *
 * Individual power stored in batteries flows through the production tick;
 * only the structural configuration (batteries, capacity) needs persistence.
 */
export interface IPowerSystemRepository {
  /**
   * Saves a power system.
   * Returns Ok(void) on success or Err(message) on failure.
   */
  save(powerSystem: PowerSystem): Promise<void>;

  /**
   * Retrieves a power system by id.
   * Returns the PowerSystem or undefined if not found.
   */
  getById(id: string): Promise<PowerSystem | undefined>;

  /**
   * Deletes a power system.
   */
  delete(id: string): Promise<void>;
}
