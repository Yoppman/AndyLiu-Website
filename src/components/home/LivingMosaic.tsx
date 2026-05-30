import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useTransform,
  useSpring,
  useMotionValue,
  type MotionValue,
} from 'framer-motion';
import { cldFull, cldSet, type Photo } from '../gallery/shared/cloudinaryUtils';
import { useScrollProgress } from './useScrollProgress';

interface Props {
  photos: Photo[];
}

/** One drifting column of the mosaic. Lives as its own component so its hooks
 *  are stable even when the column count changes on resize. */
const MosaicColumn: React.FC<{
  col: Photo[];
  index: number;
  progress: MotionValue<number>;
  pointerY: MotionValue<number>;
  eager: boolean;
}> = ({ col, index, progress, pointerY, eager }) => {
  const dir = index % 2 === 0 ? 1 : -1;
  const colScroll = useTransform(progress, [0, 1], [-6 * dir - 8, 6 * dir]);
  const colMouse = useTransform(pointerY, [-1, 1], [-3 * dir, 3 * dir]);
  const y = useTransform([colScroll, colMouse], ([a, b]: number[]) => `${a + b}%`);
  return (
    <motion.div className="flex-1 flex flex-col gap-2 md:gap-3" style={{ y }}>
      {[...col, ...col].map((p, i) => (
        <div
          key={p.src + i}
          className="relative w-full overflow-hidden rounded-[2px]"
          style={{ height: '23vh', backgroundColor: p.dominantColor }}
        >
          <img
            src={cldFull(p.src, 400)}
            srcSet={cldSet(p.src, [300, 500])}
            sizes="20vw"
            alt=""
            loading={eager && i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-full object-cover opacity-90"
          />
        </div>
      ))}
    </motion.div>
  );
};

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

/**
 * Act I — a living wall of real gallery photographs. The columns drift at
 * different speeds with scroll and lean toward the cursor; as you descend, the
 * wall settles and the title surfaces over it.
 */
const LivingMosaic: React.FC<Props> = ({ photos }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cols = useColumns();

  const scrollYProgress = useScrollProgress(sectionRef);

  // Cursor parallax (subtle, spring-smoothed).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 60, damping: 20 });
  const py = useSpring(my, { stiffness: 60, damping: 20 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  const wallX = useTransform(px, [-1, 1], [18, -18]);
  const wallScale = useTransform(scrollYProgress, [0, 1], [1.18, 1.04]);
  const wallBlur = useTransform(scrollYProgress, [0, 0.7, 1], [0, 0, 3]);
  const blurFilter = useTransform(wallBlur, (b) => `blur(${b}px)`);

  // Title surfaces in the second half of the act.
  const titleOpacity = useTransform(scrollYProgress, [0.28, 0.62], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0.28, 0.62], [40, 0]);
  const titleScale = useTransform(scrollYProgress, [0.28, 1], [1.06, 1]);
  const scrimOpacity = useTransform(scrollYProgress, [0, 0.6], [0.25, 0.62]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  // Split photos into columns (round-robin).
  const columns: Photo[][] = Array.from({ length: cols }, () => []);
  photos.forEach((p, i) => columns[i % cols].push(p));

  return (
    <section ref={sectionRef} className="relative" style={{ height: '230vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-[#0a0a0b]">
        {/* The drifting wall */}
        <motion.div
          className="absolute inset-0 flex gap-2 md:gap-3 px-2 md:px-3"
          style={{ x: wallX, scale: wallScale, filter: blurFilter, transformOrigin: 'center' }}
          aria-hidden
        >
          {columns.map((col, ci) => (
            <MosaicColumn
              key={ci}
              col={col}
              index={ci}
              progress={scrollYProgress}
              pointerY={py}
              eager={ci < 3}
            />
          ))}
        </motion.div>

        {/* Filmic darkening so the title reads and the wall feels like one image */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: scrimOpacity,
            background:
              'radial-gradient(120% 90% at 50% 45%, transparent 30%, rgba(0,0,0,0.55) 100%), linear-gradient(to bottom, rgba(0,0,0,0.4), transparent 30%, transparent 70%, rgba(0,0,0,0.55))',
          }}
        />

        {/* Title */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 mix-blend-difference"
          style={{ opacity: titleOpacity, y: titleY, scale: titleScale }}
        >
          <span className="font-cormorant tracking-[0.5em] text-[0.7rem] md:text-sm text-white/90 uppercase mb-5 md:mb-7 pl-[0.5em]">
            Photographer · Software Engineer
          </span>
          <h1 className="font-cormorant text-white leading-[0.92] text-[15vw] md:text-[10vw] lg:text-[8.5rem]">
            Welcome to
            <span className="block italic font-light">my Journey</span>
          </h1>
          <span className="font-cormorant tracking-[0.42em] text-xs md:text-sm text-white/80 uppercase mt-6 pl-[0.42em]">
            Andy Liu
          </span>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70"
          style={{ opacity: cueOpacity }}
          aria-hidden
        >
          <span className="font-cormorant tracking-[0.3em] text-[0.65rem] uppercase">Scroll</span>
          <span className="block h-10 w-px bg-gradient-to-b from-white/70 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};

export default LivingMosaic;
