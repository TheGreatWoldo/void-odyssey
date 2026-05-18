import type { ResourceType } from '@/domain/models/resources/resource';
import type { Storable } from '@/domain/models/storage/storable';

/**
 * Discriminator for upgrade categories.
 * Defines what kind of upgrade this is for consistency with module type patterns.
 */
export const UpgradeType = {
  Efficiency: 'efficiency',
  Power: 'power',
  Capacity: 'capacity',
  Cooling: 'cooling',
} as const;

export type UpgradeType = (typeof UpgradeType)[keyof typeof UpgradeType];

export const UpgradeLifecycleState = {
  Installing: 'installing',
  Installed: 'installed',
  Active: 'active',
  Disabled: 'disabled',
} as const;

export type UpgradeLifecycleState =
  (typeof UpgradeLifecycleState)[keyof typeof UpgradeLifecycleState];

export interface ModuleUpgrade extends Storable {
  readonly id: string;
  readonly name: string;
  /** Upgrade category — identifies what kind of upgrade this is. */
  readonly type: UpgradeType;
  /**
   * Upgrade lifecycle state machine:
   * installing -> installed -> active/disabled
   */
  readonly lifecycleState?: UpgradeLifecycleState;
  readonly costFactor: number;
  readonly targetResourceType: ResourceType;
  /** Player-controlled toggle. When false, upgrade is installed but not active. */
  readonly enabled: boolean;
}
