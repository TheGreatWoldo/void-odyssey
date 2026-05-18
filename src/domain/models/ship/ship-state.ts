/**
 * Represents the operational state of a ship.
 * Reflects what the ship is currently doing and constrains available actions.
 */
export const ShipState = {
  Docked: 'docked',
  Traveling: 'traveling',
  InCombat: 'inCombat',
  Damaged: 'damaged',
  Destroyed: 'destroyed',
} as const;

export type ShipState = typeof ShipState[keyof typeof ShipState];
