import { describe, expect, it } from 'vitest';

import { ModuleId } from '@/domain/models/module/production-module-id';
import { UpgradeType } from '@/domain/models/module/production-module-upgrade';
import { ResourceType } from '@/domain/models/resources/resource';
import { validateModuleUpgradeInstall } from '@/domain/services/module-upgrade-validation';

describe('validateModuleUpgradeInstall', () => {

  const baseContext = {
    moduleId: 'reactor-1',
    moduleType: ModuleId.ReactorCore,
    producedResourceTypes: [ResourceType.Power],
    existingUpgrades: [],
  } as const;

  it('accepts upgrade targeting a produced resource', () => {
    const result = validateModuleUpgradeInstall(baseContext, {
      id: 'u1',
      name: 'Efficient Coils',
      type: UpgradeType.Efficiency,
      targetResourceType: ResourceType.Power,
      costFactor: 0.8,
      enabled: false,
      storableType: 'upgrade',
      slotCost: 1,
    });

    expect(result.ok).toBe(true);
  });

  it('rejects duplicate upgrade id on the same module', () => {
    const result = validateModuleUpgradeInstall(
      {
        ...baseContext,
        existingUpgrades: [{
          id: 'u1',
          type: UpgradeType.Efficiency,
          targetResourceType: ResourceType.Power,
        }],
      },
      {
        id: 'u1',
        name: 'Duplicate',
        type: UpgradeType.Power,
        targetResourceType: ResourceType.Power,
        costFactor: 1,
        enabled: false,
        storableType: 'upgrade',
        slotCost: 1,
      }
    );

    expect(result.ok).toBe(false);
  });

  it('rejects upgrade targeting a resource the module does not produce', () => {
    const result = validateModuleUpgradeInstall(baseContext, {
      id: 'u2',
      name: 'Wrong Target',
      type: UpgradeType.Power,
      targetResourceType: ResourceType.Food,
      costFactor: 1,
      enabled: false,
      storableType: 'upgrade',
      slotCost: 1,
    });

    expect(result.ok).toBe(false);
  });

  it('can skip target-resource validation for module families without direct resource outputs', () => {
    const result = validateModuleUpgradeInstall(
      {
        ...baseContext,
        validateTargetResourceType: false,
      },
      {
        id: 'u3',
        name: 'Weapon Scope',
        type: UpgradeType.Capacity,
        targetResourceType: ResourceType.Food,
        costFactor: 1,
        enabled: false,
        storableType: 'upgrade',
        slotCost: 1,
      }
    );

    expect(result.ok).toBe(true);
  });

});
