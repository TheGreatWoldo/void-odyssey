import { useEffect, useRef, useState } from 'react';

/**
 * Measures the actual rendered frame rate using requestAnimationFrame.
 * Updates at the given interval (default 500 ms) to avoid thrashing.
 */
export function useFps(updateIntervalMs = 500): number {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastUpdate = useRef(performance.now());
  const rafHandle = useRef(0);

  useEffect(() => {
    function frame() {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastUpdate.current;

      if (elapsed >= updateIntervalMs) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastUpdate.current = now;
      }

      rafHandle.current = requestAnimationFrame(frame);
    }

    rafHandle.current = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(rafHandle.current);
  }, [updateIntervalMs]);

  return fps;
}
