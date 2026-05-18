import type { ModuleId } from '@/domain/models/module/production-module-id';
import type { ModuleUpgrade } from '@/domain/models/module/production-module-upgrade';
import type { ResourceType } from '@/domain/models/resources/resource';
import { err, ok, type Result } from '@/shared/result';

export interface ModuleUpgradeValidationContext {
  readonly moduleId: string;
  readonly moduleType: ModuleId;
  readonly producedResourceTypes: readonly ResourceType[];
  readonly existingUpgrades: readonly Pick<ModuleUpgrade, 'id' | 'type' | 'targetResourceType'>[];
  readonly validateTargetResourceType?: boolean;
}

/**
 * Cross-entity domain validation for installing an upgrade on a module.
 * Keeps module/upgrade compatibility and duplicate checks centralized.
 */
export function validateModuleUpgradeInstall(
  context: ModuleUpgradeValidationContext,
  upgrade: ModuleUpgrade
): Result<void, string> {
  const duplicate = context.existingUpgrades.some(existing => existing.id === upgrade.id);
  if (duplicate) {
    return err(`Upgrade '${upgrade.id}' is already installed on module '${context.moduleId}'`);
  }

  const validateTargetResourceType = context.validateTargetResourceType ?? true;

  if (validateTargetResourceType && !context.producedResourceTypes.includes(upgrade.targetResourceType)) {
    return err(
      `Upgrade '${upgrade.id}' targets '${upgrade.targetResourceType}' but module '${context.moduleId}' does not produce it`
    );
  }

  return ok(undefined);
}
