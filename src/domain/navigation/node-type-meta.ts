import { NodeType } from '@/domain/navigation/node-type';

export interface NodeTypeMeta {
  label: string;
  description: string;
  /** Single character rendered inside the star glyph */
  icon: string;
}

export const NODE_TYPE_META: Record<NodeType, NodeTypeMeta> = {
  [NodeType.Start]: {
    label: 'Departure',
    description: 'Beginning of your route.',
    icon: '▶',
  },
  [NodeType.End]: {
    label: 'Destination',
    description: 'End of the line.',
    icon: '◎',
  },
  [NodeType.Shipyard]: {
    label: 'Shipyard',
    description: 'A safe place to rest.',
    icon: '⚙',
  },
  [NodeType.Store]: {
    label: 'Store',
    description: 'Trade goods and supplies.',
    icon: '€',
  },
  [NodeType.Event]: {
    label: 'Anomaly',
    description: 'Something unusual detected.',
    icon: '!',
  },
  [NodeType.Combat]: {
    label: 'Hostile Zone',
    description: 'Enemy forces patrol this area.',
    icon: '⚔',
  },
  [NodeType.Empty]: {
    label: 'Empty Space',
    description: 'Nothing of note here.',
    icon: '·',
  },
  [NodeType.Relic]: {
    label: 'Relic Site',
    description: 'Ancient artefacts await.',
    icon: '✦',
  },
  [NodeType.HiddenCache]: {
    label: 'Hidden Cache',
    description: 'Concealed supplies or loot.',
    icon: '?',
  },
};
