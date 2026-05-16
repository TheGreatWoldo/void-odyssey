import { NodeType } from '@/domain/models/navigation/node-type';
import type {
    GraphBoundingBox,
    RouteConnection,
    RouteNode,
} from '@/domain/models/navigation/route/route-node';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface RouteNavigationState {
  /** Number of intermediate layers between start and end. */
  routeSteps: number;
  /** Minimum nodes in an intermediate layer. */
  minBranches: number;
  /** Maximum nodes in an intermediate layer. */
  maxBranches: number;
  /** Read-only topology — set by RouteSlotActor.rebuild(); do not mutate directly. */
  nodes: RouteNode[];
  connections: RouteConnection[];
  totalLayers: number;
  boundingBox: GraphBoundingBox;
  /** The node currently under the pointer, for the React info panel. */
  hoveredNode: RouteNode | null;
  /** True when the hovered node's type/label has been revealed by scanners. */
  hoveredNodeRevealed: boolean;
  sectorName: string;
  drawDebug: boolean;
  /** When true, all node types are revealed regardless of scanner range. */
  revealAllNodes: boolean;
  /**
   * Number of layers ahead that the scanner can reveal.
   * 0 = no auto-scan, 1 = adjacent only, 2 = two layers ahead, etc.
   */
  defaultScannerRange: number;
  /** The id of the node the ship is currently orbiting. Null = start node. */
  currentNodeId: string | null;
  /** Node ids whose type has been revealed (persists across scene transitions). */
  scannedNodeIds: string[];
  /** Node ids the ship has visited (persists across scene transitions). */
  visitedNodeIds: string[];
  /** Set when the ship arrives at a node — consumed by the React layer. */
  pendingSystemEntry: { nodeId: string; nodeType: NodeType } | null;
}

export interface RouteNavigationStateActions {
  setRouteSteps: (n: number) => void;
  setMinBranches: (n: number) => void;
  setMaxBranches: (n: number) => void;
  setHovered: (node: RouteNode | null, revealed?: boolean) => void;
  setDrawDebug: (value: boolean) => void;
  setRevealAllNodes: (value: boolean) => void;
  setCurrentNode: (id: string | null) => void;
  markNodeScanned: (id: string) => void;
  markNodeVisited: (id: string) => void;
  setPendingSystemEntry: (
    entry: { nodeId: string; nodeType: NodeType } | null
  ) => void;
}

export function createRouteNavigationStore() {
  return create<RouteNavigationState & { actions: RouteNavigationStateActions }>()(
    subscribeWithSelector(
      immer((set) => ({
        routeSteps: 10,
        minBranches: 2,
        maxBranches: 3,
        nodes: [],
        connections: [],
        totalLayers: 0,
        boundingBox: {
          minWx: -960,
          minWy: -540,
          maxWx: 960,
          maxWy: 540,
          width: 1920,
          height: 1080,
        },
        hoveredNode: null,
        hoveredNodeRevealed: false,
        sectorName: 'Unknown Sector',
        drawDebug: false,
        revealAllNodes: true,
        defaultScannerRange: 2,
        currentNodeId: null,
        scannedNodeIds: [],
        visitedNodeIds: [],
        pendingSystemEntry: null,

        actions: {
          setRouteSteps: (n: number) =>
            set((state) => {
              state.routeSteps = n;
            }),

          setMinBranches: (n: number) =>
            set((state) => {
              state.minBranches = n;
            }),

          setMaxBranches: (n: number) =>
            set((state) => {
              state.maxBranches = n;
            }),

          setHovered: (node: RouteNode | null, revealed = false) =>
            set((state) => {
              state.hoveredNode = node;
              state.hoveredNodeRevealed = revealed;
            }),

          setDrawDebug: (value: boolean) =>
            set((state) => {
              state.drawDebug = value;
            }),

          setRevealAllNodes: (value: boolean) =>
            set((state) => {
              state.revealAllNodes = value;
            }),

          setCurrentNode: (id: string | null) =>
            set((state) => {
              state.currentNodeId = id;
            }),

          markNodeScanned: (id: string) =>
            set((state) => {
              if (!state.scannedNodeIds.includes(id)) {
                state.scannedNodeIds.push(id);
              }
            }),

          markNodeVisited: (id: string) =>
            set((state) => {
              if (!state.visitedNodeIds.includes(id)) {
                state.visitedNodeIds.push(id);
              }
            }),

          setPendingSystemEntry: (entry) =>
            set((state) => {
              state.pendingSystemEntry = entry;
            }),
        },
      }))
    )
  );
}

export type RouteNavigationStore = ReturnType<typeof createRouteNavigationStore>;

export const useRouteNavigationStore = createRouteNavigationStore();
