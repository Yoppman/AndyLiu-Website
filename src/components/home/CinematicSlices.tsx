import React from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { cldFull } from '../gallery/shared/cloudinaryUtils';
import { useScrollProgress } from './useScrollProgress';

const SLICES = 8; // vertical slivers per image

/** One vertical sliver of an image. It owns its own transform so the parent
 *  can map over a constant number of slices without breaking hook rules. */
const Slice: React.FC<{ img: string; i: number; part: MotionValue<number> }> = ({ img, i, part }) => {
  const dir = i % 2 === 0 ? -1 : 1; // alternate up / down
  const stagger = (i / (SLICES - 1)) * 0.18; // cascade across the image
  const y = useTransform(part, [stagger, 1], ['0vh', `${dir * 120}vh`], { clamp: true });
  const left = (i * 100) / SLICES;
  return (
    <motion.div
      className="absolute top-0 h-screen overflow-hidden"
      style={{ left: `${left}vw`, width: `${100 / SLICES}vw`, y, willChange: 'transform' }}
      aria-hidden
    >
      <img
        src={cldFull(img, 1600)}
        alt=""
        draggable={false}
        className="absolute top-0 object-cover select-none pointer-events-none"
        style={{ width: '100vw', height: '100vh', left: `-${left}vw`, maxWidth: 'none' }}
      />
    </motion.div>
  );
};

/** A full image rendered as parting slivers, revealing whatever sits beneath. */
const SliceLayer: React.FC<{
  img: string;
  index: number;
  transitions: number;
  progress: MotionValue<number>;
}> = ({ img, index, transitions, progress }) => {
  const start = index / transitions;
  const end = (index + 0.85) / transitions;
  const part = useTransform(progress, [start, end], [0, 1], { clamp: true });
  return (
    <div className="absolute inset-0" style={{ zIndex: transitions - index }}>
      {Array.from({ length: SLICES }, (_, i) => (
        <Slice key={i} img={img} i={i} part={part} />
      ))}
    </div>
  );
};

/**
 * Act II — cinematic slice reveal. Each photograph is cut into vertical
 * slivers that slide apart on scroll, uncovering the next image beneath, like
 * the title cards of a film dissolving one into the next.
 */
const CinematicSlices: React.FC<{ images: string[] }> = ({ images }) => {
  const sectionRef = React.useRef<HTMLElement>(null);
  const scrollYProgress = useScrollProgress(sectionRef);

  const transitions = Math.max(1, images.length - 1);
  const base = images[images.length - 1];

  // Slow drift on the base image for depth.
  const baseScale = useTransform(scrollYProgress, [0, 1], [1.12, 1.0]);

  return (
    <section ref={sectionRef} className="relative" style={{ height: `${images.length * 95}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {/* base image (last in the set) sits beneath everything */}
        <motion.img
          src={cldFull(base, 1800)}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ scale: baseScale, zIndex: 0 }}
        />

        {/* parting layers, top of stack first */}
        {images.slice(0, transitions).map((img, k) => (
          <SliceLayer key={img + k} img={img} index={k} transitions={transitions} progress={scrollYProgress} />
        ))}

        {/* thin seams between slivers + filmic vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 50,
            background:
              'radial-gradient(130% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.12]"
          style={{
            zIndex: 51,
            backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent calc(100vw/${SLICES} - 1px), rgba(0,0,0,0.6) calc(100vw/${SLICES} - 1px), rgba(0,0,0,0.6) calc(100vw/${SLICES}))`,
          }}
        />
      </div>
    </section>
  );
};

export default CinematicSlices;
