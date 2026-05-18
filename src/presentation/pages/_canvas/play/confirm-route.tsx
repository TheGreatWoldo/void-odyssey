import { useGameService } from '@/application/hooks/useGameService';
import {
    useHoveredNodeMeta,
    useHoveredRouteNode,
    useHoveredRouteNodeRevealed,
    useRouteGraphParams,
    useRouteNavigationActions,
    useSelectedRouteIndex,
} from '@/application/hooks/useRouteNavigation';
import { SceneKey } from '@/shared/scene-key';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/_canvas/play/confirm-route')({
  component: ConfirmRoutePage,
});

function ConfirmRoutePage() {
  const game = useGameService();
  const navigate = useNavigate();

  const selectedRouteIndex = useSelectedRouteIndex();
  const { routeSeed } = useRouteGraphParams();
  const hoveredNode = useHoveredRouteNode();
  const hoveredNodeRevealed = useHoveredRouteNodeRevealed();
  const hoveredNodeMeta = useHoveredNodeMeta();
  const { setRouteSelectionLocked } = useRouteNavigationActions();

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
    setRouteSelectionLocked(true);
    game.setCanvasInteractive(true);
    game.goToScene(SceneKey.RouteNavigation);

    return () => {
      setRouteSelectionLocked(false);
      game.setCanvasInteractive(false);
      game.goToScene(SceneKey.OrangeOnBlack);
    };
  }, [game, setRouteSelectionLocked]);

  return (
    <div className="pointer-events-none absolute inset-0 text-white flex flex-col">

      <div className="flex items-center border-b border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-center text-[2.5rem] font-bold tracking-widest uppercase text-white/80 leading-none">
            Void Odyssey
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

      <div className="flex-1 relative">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-black/75 backdrop-blur-sm border border-slate-500 rounded px-4 py-2 text-white pointer-events-none select-none">
          <div className="text-xs uppercase tracking-widest text-slate-300 text-center">Chosen route</div>
          <div className="text-base font-semibold text-center">Route {selectedRouteIndex + 1}</div>
        </div>

        {displayMeta && (
          <div
            className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-black/75 backdrop-blur-sm border border-slate-500 rounded px-4 py-2 text-white pointer-events-none select-none transition-opacity duration-150"
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

      <div className="flex items-center justify-center gap-8 border-t border-white/20 bg-black/30 px-6 py-3 backdrop-blur-[2px]">
        <button
          type="button"
          onClick={() => navigate({ to: '/play/select-route' }).catch(() => {})}
          className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: '/', search: { menu: 'play' } }).catch(() => {})}
          className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-xl -m-3 p-3"
        >
          Start
        </button>
      </div>

    </div>
  );
}
