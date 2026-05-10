import type { ModuleId } from '@/domain/models/module/production-module-id';
import type { DomainEvent } from '@/shared/domain-event';

export interface ModuleInstalledEvent extends DomainEvent {
  readonly type: 'ModuleInstalled';
  readonly systemId: string;
  readonly moduleId: string;
  readonly moduleType: ModuleId;
}

export interface ModuleRemovedEvent extends DomainEvent {
  readonly type: 'ModuleRemoved';
  readonly systemId: string;
  readonly moduleId: string;
  readonly moduleType: ModuleId;
}

/**
 * Emitted at the end of a tick when the shared resource container has no
 * remaining free space — production is backing up.
 */
export interface ResourceContainerFullEvent extends DomainEvent {
  readonly type: 'ResourceContainerFull';
  readonly systemId: string;
}

export type ProductionSystemEvent =
  | ModuleInstalledEvent
  | ModuleRemovedEvent
  | ResourceContainerFullEvent;
