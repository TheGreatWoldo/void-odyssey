import type { ResourceType } from '@/domain/models/resources/resource';

export interface ModuleUpgrade {
  readonly id: string;
  readonly name: string;
  readonly costFactor: number;
  readonly targetResourceType: ResourceType;
  /** Player-controlled toggle. When false, upgrade is installed but not active. */
  readonly enabled: boolean;
}
