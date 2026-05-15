import { useFps } from '@/application/hooks/useFps';
import { useGameService } from '@/application/hooks/useGameService';
import {
    useHoveredNodeMeta,
    useHoveredRouteNode,
    useHoveredRouteNodeRevealed,
    usePendingSystemEntry,
    useRouteNavigationActions,
} from '@/application/hooks/useRouteNavigation';
import { SceneKey } from '@/shared/scene-key';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/_canvas/play/select-route')({
  component: RouteNavigationPage,
});

function RouteNavigationPage() {
  const game = useGameService();
  const fps = useFps();
  const navigate = useNavigate();

  const hoveredNode = useHoveredRouteNode();
  const hoveredNodeRevealed = useHoveredRouteNodeRevealed();
  const hoveredNodeMeta = useHoveredNodeMeta();
  const pendingSystemEntry = usePendingSystemEntry();
  const { setPendingSystemEntry } = useRouteNavigationActions();

  const [displayMeta, setDisplayMeta] = useState(hoveredNodeMeta);
  const [displayRevealed, setDisplayRevealed] = useState(hoveredNodeRevealed);
  const [visible, setVisible] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    game.goToScene(SceneKey.RouteNavigation);

    return () => {
      game.goToScene(SceneKey.OrangeOnBlack);
    };
  }, [game]);

  useEffect(() => {
    if (!pendingSystemEntry) return;

    setPendingSystemEntry(null);
    // Navigate to the system scene when implemented:
    // navigate({ to: '/system/$type', params: { type: pendingSystemEntry.nodeType } });
    console.log('System entry:', pendingSystemEntry);
  }, [pendingSystemEntry, setPendingSystemEntry]);

  return (
    <div className="pointer-events-none absolute inset-0 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <h1 className="flex-1 text-center text-[2.5rem] font-bold tracking-widest uppercase text-white/80">
          Select route
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 relative">

        {/* FPS counter — top-left corner */}
        <div className="absolute top-2 left-2 z-50 text-xs text-slate-400 font-mono pointer-events-none select-none">
          {fps} fps
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
      <div className="flex items-center justify-center border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <button
          type="button"
          onClick={() => navigate({ to: '/play/select-ship' }).catch(() => {})}
          className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
        >
          ← Back
        </button>
      </div>

    </div>
  );
}
