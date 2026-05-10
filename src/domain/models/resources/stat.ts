/** Abstract ship-capability values — tracked on the ship, not stored in containers. */
export const StatType = {
  Hull: 'Hull',
  Thrust: 'Thrust',
  Shield: 'Shield',
  ScanRange: 'ScanRange',
  Firepower: 'Firepower',
  JumpRange: 'JumpRange',
  Comms: 'Comms',
  CrewCapacity: 'CrewCapacity',
} as const;

export type StatType = (typeof StatType)[keyof typeof StatType];

/**
 * Stat types that are instantaneous rates — reset to zero each tick before
 * producers run. Hull is excluded: it accumulates (structural damage persists).
 */
export type InstantStatType = Exclude<StatType, typeof StatType.Hull>;

export const INSTANT_STAT_TYPES: readonly InstantStatType[] = [
  StatType.Thrust,
  StatType.Shield,
  StatType.ScanRange,
  StatType.Firepower,
  StatType.JumpRange,
  StatType.Comms,
  StatType.CrewCapacity,
];
