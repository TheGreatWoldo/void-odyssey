import {
    useRouteDrawDebug,
    useRouteGraphParams,
    useRouteNavigationActions,
} from '@/application/hooks/useRouteNavigation';

export default function GraphConfigPanel() {
  const { routeSteps, minBranches, maxBranches } = useRouteGraphParams();
  const drawDebug = useRouteDrawDebug();
  const {
    generate,
    setRouteSteps,
    setMinBranches,
    setMaxBranches,
    setDrawDebug,
  } = useRouteNavigationActions();

  const handleStepsChange = (value: number) => {
    setRouteSteps(value);
    generate();
  };

  const handleMinBranchesChange = (value: number) => {
    const clamped = Math.min(value, maxBranches);

    setMinBranches(clamped);
    generate();
  };

  const handleMaxBranchesChange = (value: number) => {
    const clamped = Math.max(value, minBranches);

    setMaxBranches(clamped);
    generate();
  };

  return (
    <div className="fixed bottom-4 left-4 z-30 flex flex-col gap-3 bg-black/50 backdrop-blur-sm border border-slate-700 rounded px-4 py-3 min-w-50">
      <div className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
        Graph Config
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Route steps</span>
          <span className="text-white font-mono">{routeSteps}</span>
        </div>
        <input
          type="range"
          min={0}
          max={16}
          step={1}
          value={routeSteps}
          onChange={(e) => handleStepsChange(Number(e.target.value))}
          className="w-full accent-blue-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Min nodes/layer</span>
          <span className="text-white font-mono">{minBranches}</span>
        </div>
        <input
          type="range"
          min={1}
          max={12}
          step={1}
          value={minBranches}
          onChange={(e) => handleMinBranchesChange(Number(e.target.value))}
          className="w-full accent-green-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Max nodes/layer</span>
          <span className="text-white font-mono">{maxBranches}</span>
        </div>
        <input
          type="range"
          min={1}
          max={12}
          step={1}
          value={maxBranches}
          onChange={(e) => handleMaxBranchesChange(Number(e.target.value))}
          className="w-full accent-orange-400"
        />
      </div>

      <button
        onClick={() => generate()}
        className="mt-1 text-slate-300 hover:text-white text-xs border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded bg-black/40 transition-colors"
      >
        Regenerate
      </button>

      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
        <input
          type="checkbox"
          checked={drawDebug}
          onChange={(e) => setDrawDebug(e.target.checked)}
          className="accent-purple-400"
        />
        Draw debug
      </label>
    </div>
  );
}
