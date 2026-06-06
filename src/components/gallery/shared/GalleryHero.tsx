import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { PLACEHOLDER_ONLY, cldFull, cldSet, cldPlaceholder, Photo } from './cloudinaryUtils';

interface Props {
  photo: Photo;
  title: string;
  isMorphing: boolean;
  description?: string;
  region?: string;
}

/**
 * The gallery hero — one confident system for every gallery. A full-bleed
 * parallax photograph; a region eyebrow, the title, and the description set
 * over a vivid gradient (the photo stays alive; the title reads via shadow);
 * a scroll cue. All of it eases away as you scroll into the work.
 */
const GalleryHero: React.FC<Props> = ({ photo, title, isMorphing, description, region }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.4], [0, 40]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <div
      ref={ref}
      className="relative h-screen w-full overflow-hidden"
      style={{ opacity: isMorphing ? 0 : 1 }}
    >
      <motion.div className="absolute inset-0" style={{ scale, y }}>
        {PLACEHOLDER_ONLY ? (
          <img
            src={cldPlaceholder(photo.src)}
            alt={title}
            className="h-full w-full scale-105 object-cover blur-xl"
            style={{ backgroundColor: photo.dominantColor }}
          />
        ) : (
          <img
            src={cldFull(photo.src, 2000)}
            srcSet={cldSet(photo.src, [900, 1600, 2400])}
            sizes="100vw"
            alt={title}
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
            style={{ backgroundColor: photo.dominantColor }}
          />
        )}
      </motion.div>

      {/* Vivid gradient — vignette + top/bottom anchor; the center stays alive. */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: overlayOpacity,
          background:
            'radial-gradient(120% 80% at 50% 50%, transparent 28%, rgba(0,0,0,0.5) 100%), linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 26%, transparent 62%, rgba(0,0,0,0.5))',
        }}
      />

      {/* Title block — eases in just after the morph lands (or on direct load) */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {region && (
            <span className="mb-5 font-cormorant text-xs uppercase tracking-[0.5em] text-white/75 md:text-sm">
              {region}
            </span>
          )}
          <h1 className="font-cormorant text-5xl font-light leading-[0.95] tracking-wide drop-shadow-[0_2px_30px_rgba(0,0,0,0.55)] md:text-7xl lg:text-8xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-xl font-cormorant text-lg italic text-white/85 drop-shadow-[0_1px_14px_rgba(0,0,0,0.5)] md:text-xl">
              {description}
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/70"
        style={{ opacity: cueOpacity }}
      >
        <span className="font-cormorant text-[0.65rem] uppercase tracking-[0.3em]">Scroll</span>
        <span className="block h-10 w-px bg-gradient-to-b from-white/70 to-transparent" />
      </motion.div>
    </div>
  );
};

export default GalleryHero;
