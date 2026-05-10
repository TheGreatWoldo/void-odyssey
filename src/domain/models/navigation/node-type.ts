export const NodeType = {
  Start:       'start',
  End:         'end',
  Shipyard:    'shipyard',
  Store:       'store',
  Event:       'event',
  Combat:      'combat',
  Empty:       'empty',
  Relic:       'relic',
  HiddenCache: 'hidden-cache',
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];
