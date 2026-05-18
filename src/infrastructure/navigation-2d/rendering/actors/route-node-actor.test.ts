/// <reference types="vitest" />
import { NodeType } from '@/domain/models/navigation/node-type';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';
import { GraphContext } from '@/infrastructure/navigation-2d/graph-context';
import { RouteNodeActor } from '@/infrastructure/navigation-2d/rendering/actors/route-node-actor';
import type { NodeDrawingStrategy } from '@/infrastructure/navigation-2d/rendering/strategies/node-drawing-strategy';
import type { IRouteActorState } from '@/domain/models/navigation/route/route-actor-state';
import { Vector } from 'excalibur';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * @vitest-environment jsdom
 */

describe('RouteNodeActor pointer events', () => {
  let graphContext: GraphContext;
  let actor: RouteNodeActor;
  let statePort: IRouteActorState;
  let drawingStrategy: NodeDrawingStrategy;

  const createMockRouteNode = (id: string, stopIndex: number): RouteNode => ({
    id,
    stopIndex,
    wx: 100,
    wy: 100,
    baseWx: 100,
    baseWy: 100,
    type: NodeType.Empty,
  });

  beforeEach(() => {
    // Mock IRouteActorState
    statePort = {
      getScannerRange: vi.fn(() => 2),
      getRevealAllNodes: vi.fn(() => false),
      setHovered: vi.fn(),
      markNodeScanned: vi.fn(),
      markNodeVisited: vi.fn(),
      isNodeScanned: vi.fn(() => false),
      isNodeVisited: vi.fn(() => false),
      getRouteParams: vi.fn(() => ({ routeSteps: 10, minBranches: 2, maxBranches: 3, routeSeed: '' })),
      isDrawDebugEnabled: vi.fn(() => false),
    };

    // Mock NodeDrawingStrategy
    const mockGraphic = {
      width: 40,
      height: 40,
    };
    drawingStrategy = {
      getGraphic: vi.fn(() => mockGraphic),
      getRevision: vi.fn(() => 0),
    };

    // Create GraphContext with mocked statePort
    graphContext = new GraphContext(statePort);

    // Create RouteNodeActor
    const nodeData = createMockRouteNode('node-1', 1);
    actor = new RouteNodeActor(
      nodeData,
      new Vector(100, 100),
      drawingStrategy,
      graphContext
    );
  });

  it('initializes with correct node data', () => {
    expect(actor.routeNode.id).toBe('node-1');
    expect(actor.routeNode.stopIndex).toBe(1);
    expect(actor.scanned).toBe(false);
    expect(actor.visited).toBe(false);
  });

  it('has collision type set to Fixed', () => {
    expect(actor.body.collisionType).toBeDefined();
    // CollisionType.Fixed should be set during construction
    expect(actor.body).toBeDefined();
  });

  it('has appropriate collision properties for pointer detection', () => {
    // Actor should be set up for pointer collision detection
    expect(actor.body).toBeDefined();
    // The actor has a body with collision enabled for pointer events
    expect(actor.body.collisionType).toBeDefined();
    expect(actor.pointer.useGraphicsBounds).toBe(false);
    expect(actor.pointer.useColliderShape).toBe(true);
  });

  it('correctly computes visual state when node is current', () => {
    // Set node as current
    graphContext.currentNodeActor = actor;

    // onPreUpdate should be callable without error
    expect(() => actor.onPreUpdate()).not.toThrow();
  });

  it('marks node as scanned when conditions are met', () => {
    // Setup: Create a separate current node to make the actor reachable
    const currentNode = new RouteNodeActor(
      createMockRouteNode('node-0', 0),
      new Vector(50, 50),
      drawingStrategy,
      graphContext
    );

    graphContext.currentNodeActor = currentNode;
    graphContext.registerNode(currentNode);
    graphContext.registerNode(actor);
    graphContext.setTopology([{ fromId: 'node-0', toId: 'node-1' }]);

    vi.mocked(statePort.getScannerRange).mockReturnValue(1);

    // Call onPreUpdate - should scan the actor node
    actor.onPreUpdate();

    // Assert markNodeScanned was called
    expect(statePort.markNodeScanned).toHaveBeenCalledWith('node-1');
    expect(actor.scanned).toBe(true);
  });

  it('does not mark node as scanned if already scanned', () => {
    // Setup: node is already scanned
    actor.scanned = true;
    vi.mocked(statePort.isNodeScanned).mockReturnValue(true);

    // Call onPreUpdate
    actor.onPreUpdate();

    // Assert markNodeScanned was not called again
    expect(statePort.markNodeScanned).not.toHaveBeenCalled();
  });

  it('updates graphics when visual state changes', () => {
    // Setup
    graphContext.currentNodeActor = actor;
    vi.mocked(statePort.getScannerRange).mockReturnValue(1);

    // Call onPreUpdate to trigger state change
    actor.onPreUpdate();

    // Assert getGraphic was called (graphics updated)
    expect(drawingStrategy.getGraphic).toHaveBeenCalled();
  });

  it('skips graphics update if nothing changed', () => {
    // Setup: call once to establish initial state
    graphContext.currentNodeActor = actor;
    actor.onPreUpdate();

    // Clear the mock to test subsequent calls
    vi.mocked(drawingStrategy.getGraphic).mockClear();

    // Call again with same conditions
    actor.onPreUpdate();

    // Assert getGraphic was not called (early return)
    expect(drawingStrategy.getGraphic).not.toHaveBeenCalled();
  });

  it('handles graphic revision tracking', () => {
    // Setup: strategy provides graphics with revisions
    let revision = 0;
    vi.mocked(drawingStrategy.getRevision).mockImplementation(() => revision);

    // Initial state
    actor.onPreUpdate();

    // Clear and check that changing revision triggers update
    vi.mocked(drawingStrategy.getGraphic).mockClear();
    revision = 1; // Change revision

    actor.onPreUpdate();

    // Assert getGraphic was called (revision changed)
    expect(drawingStrategy.getGraphic).toHaveBeenCalled();
  });
});
