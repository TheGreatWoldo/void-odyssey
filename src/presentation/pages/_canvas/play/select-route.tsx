import { useGameService } from '@/application/hooks/useGameService';
import {
    useCanRerollRoute,
    useHoveredNodeMeta,
    useHoveredRouteNode,
    useHoveredRouteNodeRevealed,
    usePendingSystemEntry,
    useRouteGraphParams,
    useRouteNavigationActions,
    useSelectedRouteIndex,
} from '@/application/hooks/useRouteNavigation';
import { ROUTE_SCROLL_TWEEN_DURATION_MS } from '@/shared/route-navigation';
import { SceneKey } from '@/shared/scene-key';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronRight, Copy, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const ROUTE_INFO_FADE_OUT_MS = Math.round(ROUTE_SCROLL_TWEEN_DURATION_MS * 0.35);
const ROUTE_INFO_FADE_IN_MS = Math.round(ROUTE_SCROLL_TWEEN_DURATION_MS * 0.7);

export const Route = createFileRoute('/_canvas/play/select-route')({
  component: RouteNavigationPage,
});

function RouteNavigationPage() {
  const game = useGameService();
  const navigate = useNavigate();

  const hoveredNode = useHoveredRouteNode();
  const hoveredNodeRevealed = useHoveredRouteNodeRevealed();
  const hoveredNodeMeta = useHoveredNodeMeta();
  const pendingSystemEntry = usePendingSystemEntry();
  const selectedRouteIndex = useSelectedRouteIndex();
  const { routeSeed } = useRouteGraphParams();
  const canRerollSelectedRoute = useCanRerollRoute(selectedRouteIndex);
  const { setPendingSystemEntry, setRouteSelectionLocked, requestRouteReroll } = useRouteNavigationActions();

  const [displayMeta, setDisplayMeta] = useState(hoveredNodeMeta);
  const [displayRevealed, setDisplayRevealed] = useState(hoveredNodeRevealed);
  const [visible, setVisible] = useState(false);
  const [displayRouteIndex, setDisplayRouteIndex] = useState(selectedRouteIndex);
  const [routeInfoVisible, setRouteInfoVisible] = useState(true);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeInfoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);

    if (hoveredNode) {
      setDisplayMeta(hoveredNodeMeta);
      setDisplayRevealed(hoveredNodeRevealed);
      setVisible(true);
    } else {
      setVisible(false);
      fadeTimer.current = setTimeout(() => setDisplayMeta(null), 150);
    }

    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [hoveredNode, hoveredNodeRevealed, hoveredNodeMeta]);

  useEffect(() => {
    setRouteSelectionLocked(false);

    game.setCanvasInteractive(true);
    game.goToScene(SceneKey.RouteNavigation);

    return () => {
      game.setCanvasInteractive(false);
      game.goToScene(SceneKey.OrangeOnBlack);
    };
  }, [game, setRouteSelectionLocked]);

  useEffect(() => {
    if (!pendingSystemEntry) return;

    setPendingSystemEntry(null);
  }, [pendingSystemEntry, setPendingSystemEntry]);

  useEffect(() => {
    if (selectedRouteIndex === displayRouteIndex) {
      setRouteInfoVisible(true);
      return;
    }

    if (routeInfoTimer.current) clearTimeout(routeInfoTimer.current);

    setRouteInfoVisible(false);
    routeInfoTimer.current = setTimeout(() => {
      setDisplayRouteIndex(selectedRouteIndex);
      setRouteInfoVisible(true);
      routeInfoTimer.current = null;
    }, ROUTE_SCROLL_TWEEN_DURATION_MS);

    return () => {
      if (routeInfoTimer.current) clearTimeout(routeInfoTimer.current);
    };
  }, [selectedRouteIndex, displayRouteIndex]);

  return (
    <div className="pointer-events-none absolute inset-0 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-center text-[2.5rem] font-bold tracking-widest uppercase text-white/80 leading-none">
            Select route
          </h1>

          <div className="mt-1 flex items-center gap-2 text-xs tracking-widest uppercase text-white/50">
            <span>Seed: {routeSeed || 'auto'}</span>
            <button
              type="button"
              onClick={() => {
                const seedToCopy = routeSeed || 'auto';

                navigator.clipboard.writeText(seedToCopy).catch(() => {});
              }}
              className="pointer-events-auto text-white/50 hover:text-white transition-colors"
              aria-label="Copy seed"
              title="Copy seed"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">

        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 text-white select-none transition-opacity flex flex-col items-center text-center"
          style={{
            opacity: routeInfoVisible ? 1 : 0,
            transitionDuration: `${routeInfoVisible ? ROUTE_INFO_FADE_IN_MS : ROUTE_INFO_FADE_OUT_MS}ms`,
          }}
        >
          <div className="text-[2.5rem] font-bold tracking-widest uppercase text-white/80 leading-none">
            Route {displayRouteIndex + 1}
          </div>

          <button
            type="button"
            onClick={() => requestRouteReroll(selectedRouteIndex)}
            disabled={!canRerollSelectedRoute}
            className="pointer-events-auto mt-3 flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3 disabled:text-white/20 disabled:hover:text-white/20 disabled:cursor-not-allowed"
            aria-disabled={!canRerollSelectedRoute}
          >
            <RotateCcw size={20} />
            Reroll
          </button>
        </div>

        {/* Hover tooltip — top centre */}
        {displayMeta && (
          <div
            className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-black/75 backdrop-blur-sm border border-slate-500 rounded px-4 py-2 text-white pointer-events-none select-none transition-opacity duration-150"
            style={{ opacity: visible ? 1 : 0 }}
          >
            <div className="text-sm font-semibold text-center">
              {displayRevealed ? displayMeta.label : '???'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 text-center">
              {displayRevealed ? displayMeta.description : 'Unknown system'}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-8 border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <button
          type="button"
          onClick={() => navigate({ to: '/play/select-ship' }).catch(() => {})}
          className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={() => {
            navigate({ to: '/play/confirm-route' }).catch(() => {});
          }}
          className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
          aria-label={`Next with route ${selectedRouteIndex + 1}`}
        >
          Next <ChevronRight size={20} />
        </button>
      </div>

    </div>
  );
}
