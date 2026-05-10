import type { ResourceType } from '@/domain/models/resources/resource';
import type { Storable } from '@/domain/models/storage/storable';

export interface ModuleUpgrade extends Storable {
  readonly id: string;
  readonly name: string;
  readonly costFactor: number;
  readonly targetResourceType: ResourceType;
  /** Player-controlled toggle. When false, upgrade is installed but not active. */
  readonly enabled: boolean;
}
