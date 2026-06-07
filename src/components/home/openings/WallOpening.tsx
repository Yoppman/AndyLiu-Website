import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { cldSquare, cldSquareSet, type Photo } from '../../gallery/shared/cloudinaryUtils';
import { useScrollProgress } from '../useScrollProgress';
import { wallCoversAndFrames, londonCenterPhoto } from '../heroImages';

/**
 * Opening · "The Wall"
 * --------------------
 * A living wall of curated photographs — every gallery's cover plus the
 * Selected Frames (never random). It parallaxes with scroll and leans toward
 * the cursor; individual tiles gently crossfade to other frames over time, so
 * the wall quietly evolves. One tile is pinned and never swaps: the London
 * mirror-selfie, placed in the middle of the middle column.
 *
 * Performance: transforms only + occasional opacity crossfades (no continuous
 * animation, no per-image CSS filters, no full-screen blends). No WebGL.
 */

const GRAIN =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>";

const SLOTS_PER_COL = 5;
const MID_SLOT = Math.floor(SLOTS_PER_COL / 2);
const SWAP_MS = 2600; // how often one tile crossfades to a fresh frame

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useColumns() {
  const [cols, setCols] = useState(5);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCols(w < 640 ? 3 : w < 1024 ? 4 : 5);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return cols;
}

/** Deterministic shuffle so the first paint is stable across reloads. */
function seededShuffle<T>(arr: T[], seed = 11): T[] {
  const a = arr.slice();
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lay the pool out into cols × SLOTS_PER_COL, pinning the centerpiece to the
 *  middle slot of the middle column. */
function buildGrid(cols: number, pool: Photo[], center?: Photo): Photo[][] {
  const deck = seededShuffle(pool.filter((p) => p.src !== center?.src));
  const grid: Photo[][] = Array.from({ length: cols }, () => []);
  if (deck.length === 0) return grid;
  const midCol = Math.floor(cols / 2);
  let k = 0;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < SLOTS_PER_COL; r++) {
      if (c === midCol && r === MID_SLOT && center) grid[c].push(center);
      else grid[c].push(deck[k++ % deck.length]);
    }
  }
  return grid;
}

/** One column: scroll + cursor parallax; tiles crossfade when their slot swaps.
 *  Slots are duplicated so the column is tall enough that parallax never reveals
 *  an edge. */
const Column: React.FC<{
  slots: Photo[];
  index: number;
  scroll: MotionValue<number>;
  pointerY: MotionValue<number>;
  eager: boolean;
}> = ({ slots, index, scroll, pointerY, eager }) => {
  const dir = index % 2 === 0 ? 1 : -1;
  const colScroll = useTransform(scroll, [0, 1], [-7 * dir - 6, 7 * dir]);
  const colMouse = useTransform(pointerY, [-1, 1], [-2.5 * dir, 2.5 * dir]);
  const y = useTransform([colScroll, colMouse], ([a, b]: number[]) => `${a + b}%`);

  return (
    <motion.div className="flex-1 flex flex-col gap-3 md:gap-4" style={{ y }}>
      {[...slots, ...slots].map((p, i) => (
        <div
          key={`${index}-${i}`}
          className="relative w-full shrink-0 overflow-hidden rounded-[2px]"
          style={{ paddingBottom: '100%', backgroundColor: p.dominantColor }}
        >
          <AnimatePresence>
            <motion.img
              key={p.src}
              src={cldSquare(p.src, 720)}
              srcSet={cldSquareSet(p.src, [420, 720, 1080])}
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
              alt=""
              loading={eager && i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover select-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
            />
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
};

const WallOpening: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cols = useColumns();
  const reduce = reduceMotion();
  const scroll = useScrollProgress(sectionRef);

  const pool = useMemo(() => wallCoversAndFrames(), []);
  const center = useMemo(() => londonCenterPhoto(), []);

  // Cursor parallax (subtle, spring-smoothed).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 50, damping: 22 });
  const py = useSpring(my, { stiffness: 50, damping: 22 });
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my, reduce]);

  const wallX = useTransform(px, [-1, 1], [16, -16]);
  const wallScale = useTransform(scroll, [0, 1], [1.16, 1.04]);
  const titleOpacity = useTransform(scroll, [0.16, 0.46], [0, 1]);
  const titleY = useTransform(scroll, [0.16, 0.46], [34, 0]);
  const scrimOpacity = useTransform(scroll, [0, 0.5], [0.18, 0.78]);
  const cueOpacity = useTransform(scroll, [0, 0.1], [1, 0]);

  // The drifting grid, seeded once and re-laid when the column count changes.
  const [grid, setGrid] = useState<Photo[][]>(() => buildGrid(5, pool, center));
  useEffect(() => {
    setGrid(buildGrid(cols, pool, center));
  }, [cols, pool, center]);

  // Quietly evolve: every SWAP_MS, crossfade one (non-pinned) slot to a frame
  // not currently on the wall.
  useEffect(() => {
    if (reduce) return;
    const centerSrc = center?.src;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setGrid((prev) => {
        if (prev.length === 0) return prev;
        const midCol = Math.floor(prev.length / 2);
        const shown = new Set<string>();
        prev.forEach((col) => col.forEach((p) => shown.add(p.src)));
        const spare = pool.filter((p) => p.src !== centerSrc && !shown.has(p.src));
        if (spare.length === 0) return prev;
        const c = Math.floor(Math.random() * prev.length);
        const r = Math.floor(Math.random() * prev[c].length);
        if (c === midCol && r === MID_SLOT) return prev; // never swap the pinned tile
        const next = prev.map((col) => col.slice());
        next[c][r] = spare[Math.floor(Math.random() * spare.length)];
        return next;
      });
    }, SWAP_MS);
    return () => window.clearInterval(id);
  }, [reduce, pool, center]);

  return (
    <section ref={sectionRef} className="relative" style={{ height: '230vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-[#0a0a0b]">
        {/* The drifting, evolving wall */}
        <motion.div
          className="absolute inset-0 flex gap-3 md:gap-4 px-3 md:px-4"
          style={{ x: wallX, scale: wallScale, transformOrigin: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          {grid.map((slots, ci) => (
            <Column key={ci} slots={slots} index={ci} scroll={scroll} pointerY={py} eager={ci < 2} />
          ))}
        </motion.div>

        {/* Static filmic veil */}
        <div className="absolute inset-0 pointer-events-none bg-black/[0.12]" aria-hidden />

        {/* Scoped film grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: '170px 170px' }}
          aria-hidden
        />

        {/* Filmic pool so the line reads over the wall */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: scrimOpacity,
            background:
              'radial-gradient(115% 80% at 50% 50%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 42%, transparent 74%), linear-gradient(to bottom, rgba(0,0,0,0.45), transparent 24%, transparent 72%, rgba(0,0,0,0.55))',
          }}
        />

        {/* The line */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          <span className="font-cormorant tracking-[0.5em] text-[0.65rem] md:text-xs text-[#efeae1]/55 uppercase mb-6 md:mb-8 pl-[0.5em] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]">
            Photographer &middot; Travel &amp; Street
          </span>
          <p className="font-cormorant italic font-light text-[#efeae1]/75 text-lg md:text-2xl mb-3 md:mb-4 drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]">
            In every hidden corner of the earth&thinsp;&mdash;
          </p>
          <h1 className="font-cormorant font-light text-[#efeae1] leading-[1.04] text-[12vw] md:text-7xl lg:text-[5.5rem] max-w-[18ch] drop-shadow-[0_2px_28px_rgba(0,0,0,0.65)]">
            I honor the story
            <span className="block italic font-extralight">behind the scene.</span>
          </h1>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#efeae1]/60"
          style={{ opacity: cueOpacity }}
          aria-hidden
        >
          <span className="font-cormorant tracking-[0.3em] text-[0.65rem] uppercase">Scroll</span>
          <span className="block h-10 w-px bg-gradient-to-b from-[#efeae1]/60 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};

export default WallOpening;
