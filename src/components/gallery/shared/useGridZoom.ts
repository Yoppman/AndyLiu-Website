import { useCallback, useEffect, useMemo, useState } from 'react';

// Row-height ladders for Compact mode, ordered tallest → shortest (zoomed-in →
// zoomed-out). Taller rows fit fewer, bigger photos per row; shorter rows fit
// more, smaller ones. Buttons/keyboard step the ladder; pinch scales freely then
// snaps to the nearest rung on release.
const LADDERS = {
  phone: [380, 260, 170, 110, 78, 56],
  tablet: [480, 340, 230, 150, 105, 75],
  desktop: [560, 400, 270, 180, 125, 90],
} as const;

function ladderFor(width: number): readonly number[] {
  if (width < 640) return LADDERS.phone;
  if (width < 1024) return LADDERS.tablet;
  return LADDERS.desktop;
}

const STORAGE_KEY = 'compact-zoom';
const DEFAULT_LEVEL = 1; // second-from-tallest — a comfortable medium

export interface GridZoom {
  /** Target row height in px for the packer. */
  targetH: number;
  level: number;
  levels: number;
  /** Smallest / largest ladder heights (pinch clamps here). */
  minHeight: number;
  maxHeight: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Nearest ladder height to an arbitrary (mid-pinch) value, clamped to range. */
  nearestHeight: (h: number) => number;
  /** Commit to the ladder rung nearest a height (used on pinch release). */
  setHeight: (h: number) => void;
}

/** Owns the row-height ladder and the current zoom level (persisted). */
export function useGridZoom(): GridZoom {
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const ladder = useMemo(() => ladderFor(vw), [vw]);

  const [level, setLevel] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_LEVEL;
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(stored) && stored >= 0 ? stored : DEFAULT_LEVEL;
  });

  // The stored level may be out of range for the current breakpoint's ladder.
  const clamped = Math.min(level, ladder.length - 1);

  const setStored = useCallback(
    (next: number) => {
      const n = Math.max(0, Math.min(ladder.length - 1, next));
      setLevel(n);
      try {
        window.localStorage.setItem(STORAGE_KEY, String(n));
      } catch {
        /* ignore quota / privacy-mode failures */
      }
    },
    [ladder.length],
  );

  const minHeight = ladder[ladder.length - 1];
  const maxHeight = ladder[0];

  const nearestHeight = useCallback(
    (h: number) => {
      const c = Math.max(minHeight, Math.min(maxHeight, h));
      let best = ladder[0];
      let bestD = Infinity;
      for (const v of ladder) {
        const d = Math.abs(v - c);
        if (d < bestD) {
          bestD = d;
          best = v;
        }
      }
      return best;
    },
    [ladder, minHeight, maxHeight],
  );

  const setHeight = useCallback(
    (h: number) => {
      const idx = ladder.indexOf(nearestHeight(h));
      if (idx >= 0) setStored(idx);
    },
    [ladder, nearestHeight, setStored],
  );

  // "Zoom in" = bigger photos = taller rows = a lower ladder index.
  const zoomIn = useCallback(() => setStored(clamped - 1), [clamped, setStored]);
  const zoomOut = useCallback(() => setStored(clamped + 1), [clamped, setStored]);

  return {
    targetH: ladder[clamped],
    level: clamped,
    levels: ladder.length,
    minHeight,
    maxHeight,
    canZoomIn: clamped > 0,
    canZoomOut: clamped < ladder.length - 1,
    zoomIn,
    zoomOut,
    nearestHeight,
    setHeight,
  };
}
