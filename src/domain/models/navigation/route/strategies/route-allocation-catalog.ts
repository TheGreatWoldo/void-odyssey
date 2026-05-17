import { NodeType } from '@/domain/models/navigation/node-type';
import {
    combatEligibleStopIndex,
    eventEligibleStopIndex,
    hiddenCacheEligibleStopIndex,
    relicEligibleStopIndex,
    shipyardEligibleStopIndex,
    storeEligibleStopIndex,
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
        eligibleStopIndex: shipyardEligibleStopIndex,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Store,
        min: 1,
        max: 3,
        minLayerSpacing: 4,
        eligibleStopIndex: storeEligibleStopIndex,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Relic,
        min: 1,
        max: 2,
        minLayerSpacing: 3,
        eligibleStopIndex: relicEligibleStopIndex,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.HiddenCache,
        min: 1,
        max: 3,
        minLayerSpacing: 2,
        eligibleStopIndex: hiddenCacheEligibleStopIndex,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Combat,
        chance: 0.7,
        eligibleStopIndex: combatEligibleStopIndex,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Event,
        chance: 0.7,
        eligibleStopIndex: eventEligibleStopIndex,
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
        eligibleStopIndex: shipyardEligibleStopIndex,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Relic,
        min: 0,
        max: 2,
        minLayerSpacing: 3,
        eligibleStopIndex: relicEligibleStopIndex,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.HiddenCache,
        min: 1,
        max: 2,
        minLayerSpacing: 2,
        eligibleStopIndex: hiddenCacheEligibleStopIndex,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Store,
        min: 0,
        max: 2,
        minLayerSpacing: 3,
        eligibleStopIndex: storeEligibleStopIndex,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Event,
        chance: 0.25,
        eligibleStopIndex: eventEligibleStopIndex,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Combat,
        chance: 0.55,
        eligibleStopIndex: combatEligibleStopIndex,
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
        eligibleStopIndex: shipyardEligibleStopIndex,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Store,
        min: 0,
        max: 2,
        minLayerSpacing: 3,
        eligibleStopIndex: storeEligibleStopIndex,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Combat,
        chance: 0.25,
        eligibleStopIndex: combatEligibleStopIndex,
      }),
      new ProbabilisticTypeAllocation({
        type: NodeType.Event,
        chance: 0.25,
        eligibleStopIndex: eventEligibleStopIndex,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.HiddenCache,
        min: 2,
        max: 4,
        minLayerSpacing: 2,
        eligibleStopIndex: hiddenCacheEligibleStopIndex,
      }),
      new AbsoluteTypeAllocation({
        type: NodeType.Relic,
        min: 3,
        max: 6,
        minLayerSpacing: 1,
        eligibleStopIndex: relicEligibleStopIndex,
      }),
    ]),
  },
} satisfies Record<string, RouteAllocationPreset>;
