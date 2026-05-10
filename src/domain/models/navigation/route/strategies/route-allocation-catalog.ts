import { NodeType } from '@/domain/models/navigation/node-type';
import {
    combatEligibleLayer,
    eventEligibleLayer,
    hiddenCacheEligibleLayer,
    relicEligibleLayer,
    shipyardEligibleLayer,
    storeEligibleLayer,
} from '@/domain/models/navigation/route/strategies/eligible-layer-rules';
import { LayeredAllocationStrategy } from '@/domain/models/navigation/route/strategies/layered-allocation-strategy';
import {
    AbsoluteTypeAllocation,
    ProbabilisticTypeAllocation,
} from '@/domain/models/navigation/route/strategies/type-allocation-strategy';

export interface RouteAllocationPreset {
  label: string;
  strategy: LayeredAllocationStrategy;
}

export const ROUTE_ALLOCATION_CATALOG = {
  standard: {
    label: 'Standard',
    strategy: new LayeredAllocationStrategy([
      new AbsoluteTypeAllocation({
        type: NodeType.Shipyard,
        min: 1,
        max: 2,
        minLayerSpacing: 5,
        eligibleLayer: shipyardEligibleLayer,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Store,
        min: 1,
        max: 3,
        minLayerSpacing: 4,
        eligibleLayer: storeEligibleLayer,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Relic,
        min: 1,
        max: 2,
        minLayerSpacing: 3,
        eligibleLayer: relicEligibleLayer,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.HiddenCache,
        min: 1,
        max: 3,
        minLayerSpacing: 2,
        eligibleLayer: hiddenCacheEligibleLayer,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Combat,
        chance: 0.7,
        eligibleLayer: combatEligibleLayer,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Event,
        chance: 0.7,
        eligibleLayer: eventEligibleLayer,
      }),
    ]),
  },
  hostile: {
    label: 'Hostile Space',
    strategy: new LayeredAllocationStrategy([
      new AbsoluteTypeAllocation({
        type: NodeType.Shipyard,
        min: 1,
        max: 1,
        eligibleLayer: shipyardEligibleLayer,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Relic,
        min: 0,
        max: 2,
        minLayerSpacing: 3,
        eligibleLayer: relicEligibleLayer,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.HiddenCache,
        min: 1,
        max: 2,
        minLayerSpacing: 2,
        eligibleLayer: hiddenCacheEligibleLayer,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Store,
        min: 0,
        max: 2,
        minLayerSpacing: 3,
        eligibleLayer: storeEligibleLayer,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Event,
        chance: 0.25,
        eligibleLayer: eventEligibleLayer,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Combat,
        chance: 0.55,
        eligibleLayer: combatEligibleLayer,
      }),
    ]),
  },
  relic: {
    label: 'Relic Field',
    strategy: new LayeredAllocationStrategy([
      new AbsoluteTypeAllocation({
        type: NodeType.Shipyard,
        min: 1,
        max: 1,
        eligibleLayer: shipyardEligibleLayer,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Store,
        min: 0,
        max: 2,
        minLayerSpacing: 3,
        eligibleLayer: storeEligibleLayer,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Combat,
        chance: 0.25,
        eligibleLayer: combatEligibleLayer,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Event,
        chance: 0.25,
        eligibleLayer: eventEligibleLayer,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.HiddenCache,
        min: 2,
        max: 4,
        minLayerSpacing: 2,
        eligibleLayer: hiddenCacheEligibleLayer,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Relic,
        min: 3,
        max: 6,
        minLayerSpacing: 1,
        eligibleLayer: relicEligibleLayer,
      }),
    ]),
  },
} satisfies Record<string, RouteAllocationPreset>;
