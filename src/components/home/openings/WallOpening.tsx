import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { cldSquare, cldSquareSet, type Photo } from '../../gallery/shared/cloudinaryUtils';
import { useScrollProgress } from '../useScrollProgress';

/**
 * Opening · "The Wall"
 * --------------------
 * A living wall of real photographs that parallaxes with scroll and leans
 * toward the cursor; as you descend it sinks into a pool and a single literary
 * line surfaces. Density, then resolution.
 *
 * Tiles are uniform squares (content-aware Cloudinary crop — gravity auto, so a
 * subject is never chopped). Full compositions live, uncropped, in the gallery.
 *
 * Performance: matches the original Living Mosaic's cost — transforms only
 * (scroll + cursor), no continuous animation, no per-image CSS filters, no
 * full-screen blend modes (the filmic darkening is one static solid veil). No
 * WebGL, so nothing touches the context budget.
 */

const GRAIN =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>";

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

/** One column: scroll + cursor parallax via a single transform. Images are
 *  duplicated so the column is tall enough that parallax never reveals an edge.
 *  Square height is set with padding-bottom (a % of width) so flexbox can't
 *  squish it. */
const Column: React.FC<{
  col: Photo[];
  index: number;
  scroll: MotionValue<number>;
  pointerY: MotionValue<number>;
  eager: boolean;
}> = ({ col, index, scroll, pointerY, eager }) => {
  const dir = index % 2 === 0 ? 1 : -1;
  const colScroll = useTransform(scroll, [0, 1], [-7 * dir - 6, 7 * dir]);
  const colMouse = useTransform(pointerY, [-1, 1], [-2.5 * dir, 2.5 * dir]);
  const y = useTransform([colScroll, colMouse], ([a, b]: number[]) => `${a + b}%`);

  return (
    <motion.div className="flex-1 flex flex-col gap-3 md:gap-4" style={{ y }}>
      {[...col, ...col].map((p, i) => (
        <div
          key={p.src + i}
          className="relative w-full shrink-0 overflow-hidden rounded-[2px]"
          style={{ paddingBottom: '100%', backgroundColor: p.dominantColor }}
        >
          <img
            src={cldSquare(p.src, 700)}
            srcSet={cldSquareSet(p.src, [500, 800])}
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
            alt=""
            loading={eager && i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none opacity-90"
          />
        </div>
      ))}
    </motion.div>
  );
};

const WallOpening: React.FC<{ photos: Photo[] }> = ({ photos }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cols = useColumns();
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scroll = useScrollProgress(sectionRef);

  // Cursor parallax (subtle, spring-smoothed) — same as the original mosaic.
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

  // The title surfaces in the middle of the act.
  const titleOpacity = useTransform(scroll, [0.16, 0.46], [0, 1]);
  const titleY = useTransform(scroll, [0.16, 0.46], [34, 0]);
  const scrimOpacity = useTransform(scroll, [0, 0.5], [0.18, 0.74]);
  const cueOpacity = useTransform(scroll, [0, 0.1], [1, 0]);

  // Split photos into columns (round-robin).
  const columns: Photo[][] = Array.from({ length: cols }, () => []);
  photos.forEach((p, i) => columns[i % cols].push(p));

  return (
    <section ref={sectionRef} className="relative" style={{ height: '230vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-[#0a0a0b]">
        {/* The wall */}
        <motion.div
          className="absolute inset-0 flex gap-3 md:gap-4 px-3 md:px-4"
          style={{ x: wallX, scale: wallScale, transformOrigin: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          {columns.map((col, ci) => (
            <Column key={ci} col={col} index={ci} scroll={scroll} pointerY={py} eager={ci < 2} />
          ))}
        </motion.div>

        {/* Static filmic veil — a single solid layer that darkens the wall for
            cohesion (replaces per-image brightness filters; no per-frame cost) */}
        <div className="absolute inset-0 pointer-events-none bg-black/[0.12]" aria-hidden />

        {/* Scoped film grain (no blend mode → cheap over the moving wall) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: '170px 170px' }}
          aria-hidden
        />

        {/* Filmic pool so the line reads and the wall feels like one image */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: scrimOpacity,
            background:
              'radial-gradient(115% 80% at 50% 50%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 42%, transparent 72%), linear-gradient(to bottom, rgba(0,0,0,0.45), transparent 24%, transparent 72%, rgba(0,0,0,0.55))',
          }}
        />

        {/* The line */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          <span className="font-cormorant tracking-[0.5em] text-[0.65rem] md:text-xs text-[#efeae1]/55 uppercase mb-6 md:mb-8 pl-[0.5em]">
            Photographer &middot; Travel &amp; Street
          </span>
          <p className="font-cormorant italic font-light text-[#efeae1]/70 text-lg md:text-2xl mb-3 md:mb-4">
            In every hidden corner of the earth&thinsp;&mdash;
          </p>
          <h1 className="font-cormorant font-light text-[#efeae1] leading-[1.04] text-[12vw] md:text-7xl lg:text-[5.5rem] max-w-[18ch]">
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
