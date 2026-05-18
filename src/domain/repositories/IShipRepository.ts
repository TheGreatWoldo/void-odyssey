import type { Ship } from '@/domain/models/ship/ship';

/**
 * Repository interface for Ship aggregates.
 *
 * Responsible for persisting and retrieving Ship aggregates.
 * Implementations live in the infrastructure layer (e.g., backed by local storage, database, etc.).
 *
 * Following DDD, this interface defines the contract for Ship storage
 * without tying the domain to a specific persistence mechanism.
 */
export interface IShipRepository {
  /**
   * Persists a ship aggregate.
   * Creates or updates depending on whether the ship already exists.
   *
   * @param ship The ship to save.
   * @returns A promise that resolves when the save is complete.
   */
  save(ship: Ship): Promise<void>;

  /**
   * Retrieves a ship by its ID.
   *
   * @param id The ship ID.
   * @returns The ship if found, or null/undefined if not found.
   */
  getById(id: string): Promise<Ship | null>;

  /**
   * Retrieves the player's current active ship.
   *
   * @returns The active ship, or null if none is set.
   */
  getActiveShip(): Promise<Ship | null>;

  /**
   * Sets the active ship for the player session.
   *
   * @param shipId The ID of the ship to make active.
   * @returns A promise that resolves when the active ship is set.
   */
  setActiveShip(shipId: string): Promise<void>;

  /**
   * Lists all available ships for the player.
   *
   * @returns Array of all ships.
   */
  listShips(): Promise<readonly Ship[]>;

  /**
   * Deletes a ship by its ID.
   *
   * @param id The ship ID.
   * @returns A promise that resolves when the delete is complete.
   */
  delete(id: string): Promise<void>;
}
