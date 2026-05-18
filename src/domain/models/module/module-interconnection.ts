import type { ModuleId } from '@/domain/models/module/production-module-id';
import { ModuleId as ModuleType } from '@/domain/models/module/production-module-id';
import type { Result } from '@/shared/result';
import { err, ok } from '@/shared/result';

export const ModuleInterconnectionErrorType = {
  MissingDependency: 'missing-dependency',
  UniqueConstraint: 'unique-constraint',
  Conflict: 'conflict',
} as const;

export type ModuleInterconnectionErrorType =
  (typeof ModuleInterconnectionErrorType)[keyof typeof ModuleInterconnectionErrorType];

export type ModuleInterconnectionError =
  | {
    readonly type: typeof ModuleInterconnectionErrorType.MissingDependency;
    readonly moduleType: ModuleId;
    readonly missingDependency: ModuleId;
  }
  | {
    readonly type: typeof ModuleInterconnectionErrorType.UniqueConstraint;
    readonly moduleType: ModuleId;
  }
  | {
    readonly type: typeof ModuleInterconnectionErrorType.Conflict;
    readonly moduleType: ModuleId;
    readonly conflictingWith: ModuleId;
  };

const ModuleDependencies: Partial<Record<ModuleId, readonly ModuleId[]>> = {
  [ModuleType.IonEngines]: [ModuleType.ReactorCore],
  [ModuleType.ShieldGenerator]: [ModuleType.ReactorCore],
  [ModuleType.PlasmaCannon]: [ModuleType.ReactorCore],
  [ModuleType.JumpDrive]: [ModuleType.ReactorCore, ModuleType.NavComputer],
  [ModuleType.SensorArray]: [ModuleType.ReactorCore],
};

const UniqueModuleTypes = new Set<ModuleId>([
  ModuleType.ReactorCore,
  ModuleType.ShieldGenerator,
  ModuleType.JumpDrive,
  ModuleType.NavComputer,
]);

const ModuleConflicts: Partial<Record<ModuleId, readonly ModuleId[]>> = {
  [ModuleType.ArmorPlating]: [ModuleType.FuelScoop],
  [ModuleType.FuelScoop]: [ModuleType.ArmorPlating],
};

const ModulePriority: Record<ModuleId, number> = {
  [ModuleType.ReactorCore]: 10,
  [ModuleType.LifeSupport]: 20,
  [ModuleType.WaterReclaimer]: 20,
  [ModuleType.CrewQuarters]: 20,
  [ModuleType.Medbay]: 25,
  [ModuleType.NavComputer]: 30,
  [ModuleType.SensorArray]: 30,
  [ModuleType.CommsArray]: 30,
  [ModuleType.RepairDrones]: 30,
  [ModuleType.ShieldGenerator]: 40,
  [ModuleType.ArmorPlating]: 40,
  [ModuleType.IonEngines]: 50,
  [ModuleType.FuelScoop]: 50,
  [ModuleType.JumpDrive]: 50,
  [ModuleType.PlasmaCannon]: 60,
};

export function getModulePriority(type: ModuleId): number {
  return ModulePriority[type];
}

export function validateModuleInterconnection(
  moduleType: ModuleId,
  installedTypes: readonly ModuleId[]
): Result<void, ModuleInterconnectionError> {
  if (UniqueModuleTypes.has(moduleType) && installedTypes.includes(moduleType)) {
    return err({
      type: ModuleInterconnectionErrorType.UniqueConstraint,
      moduleType,
    });
  }

  const dependencies = ModuleDependencies[moduleType] ?? [];
  for (const dependency of dependencies) {
    if (!installedTypes.includes(dependency)) {
      return err({
        type: ModuleInterconnectionErrorType.MissingDependency,
        moduleType,
        missingDependency: dependency,
      });
    }
  }

  const conflicts = ModuleConflicts[moduleType] ?? [];
  for (const conflictingType of conflicts) {
    if (installedTypes.includes(conflictingType)) {
      return err({
        type: ModuleInterconnectionErrorType.Conflict,
        moduleType,
        conflictingWith: conflictingType,
      });
    }
  }

  return ok(undefined);
}
