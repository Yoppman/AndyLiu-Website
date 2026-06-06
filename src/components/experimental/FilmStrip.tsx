import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react';
import { galleries } from '../../data/galleries';
import { galleryDimensions } from '../../data/galleryDimensions';
import type { Gallery } from '../../data/types/galleries';

/* ── Cloudinary ── */
const isCloudinary = (url: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//.test(url);

const withTx = (src: string, tx: string) =>
  isCloudinary(src)
    ? src.replace(/(\/image\/(?:upload|fetch)\/)/, `$1${tx}/`)
    : src;

const buildSrc = (src: string, width: number) => {
  if (!isCloudinary(src)) return src;
  const dims = galleryDimensions[src];
  const anglePart = dims?.rotate ? `,a_${dims.rotate}` : '';
  return withTx(src, `c_fill,g_auto,w_${width},q_auto,f_auto${anglePart}`);
};

/* ── Pick 1 "best" photo per gallery for the strip ── */
function pickShowcase(gallery: Gallery) {
  return gallery.hero || gallery.photos[0];
}

/* ── Constants ── */
const FRAME_H = 420;        // px — the strip height
const FRAME_GAP = 14;       // gap between frames
const DRAG_FACTOR = 1.2;    // amplifies drag distance

const FilmStrip: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(0);

  /* Build frames from all galleries */
  const frames = useMemo(() => {
    return galleries.map((gallery) => {
      const photo = pickShowcase(gallery);
      const dims = galleryDimensions[photo.src];
      const aspect = dims ? dims.w / dims.h : photo.orientation === 'vertical' ? 2 / 3 : 3 / 2;
      // If rotated, swap
      const effectiveAspect =
        dims?.rotate === 90 || dims?.rotate === 270 ? dims.h / dims.w : aspect;
      const frameW = Math.round(FRAME_H * effectiveAspect);
      return {
        gallery,
        photo,
        src: buildSrc(photo.src, Math.min(frameW * 2, 1400)),
        width: frameW,
        dominantColor: photo.dominantColor,
      };
    });
  }, []);

  /* Total content width */
  const totalW = useMemo(
    () => frames.reduce((acc, f) => acc + f.width + FRAME_GAP, 0) - FRAME_GAP,
    [frames],
  );

  /* Measure how far we can drag */
  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      const viewW = container.clientWidth;
      setMaxDrag(Math.max(0, totalW - viewW));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [totalW]);

  /* Motion values for smooth drag */
  const x = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 40 });

  /* Per-frame parallax: slight y-offset based on scroll position */
  const progress = useTransform(springX, [0, -maxDrag || -1], [0, 1]);

  /* Wheel → horizontal scroll */
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const current = x.get();
      const next = Math.max(-maxDrag, Math.min(0, current - delta * DRAG_FACTOR));
      x.set(next);
    },
    [x, maxDrag],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <section className="relative w-full overflow-hidden bg-neutral-950">
      {/* Subtle film-strip perforations */}
      <div className="absolute top-0 left-0 right-0 h-6 flex items-center gap-3 px-4 opacity-[0.07] pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} className="w-3 h-2 rounded-[1px] bg-white flex-shrink-0" />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-6 flex items-center gap-3 px-4 opacity-[0.07] pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} className="w-3 h-2 rounded-[1px] bg-white flex-shrink-0" />
        ))}
      </div>

      {/* Scrollable strip */}
      <div
        ref={containerRef}
        className="relative cursor-grab active:cursor-grabbing py-10"
        style={{ height: FRAME_H + 80 }}
      >
        <motion.div
          ref={innerRef}
          drag="x"
          dragConstraints={{ left: -maxDrag, right: 0 }}
          dragElastic={0.08}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
          style={{ x: springX }}
          className="flex items-center absolute left-0 top-1/2 -translate-y-1/2 pl-[8vw]"
        >
          {frames.map(({ gallery, src, width, dominantColor }, i) => (
            <FilmFrame
              key={gallery.slug}
              gallery={gallery}
              src={src}
              width={width}
              dominantColor={dominantColor}
              index={i}
              progress={progress}
              totalFrames={frames.length}
            />
          ))}
        </motion.div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-white/25 font-light pointer-events-none">
        <motion.span
          animate={{ x: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          ←
        </motion.span>
        drag or scroll
        <motion.span
          animate={{ x: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          →
        </motion.span>
      </div>
    </section>
  );
};

/* ── Individual frame ── */
interface FilmFrameProps {
  gallery: Gallery;
  src: string;
  width: number;
  dominantColor: string;
  index: number;
  progress: MotionValue<number>;
  totalFrames: number;
}

const FilmFrame: React.FC<FilmFrameProps> = React.memo(
  ({ gallery, src, width, dominantColor, index }) => {
    const [loaded, setLoaded] = useState(false);

    return (
      <div
        className="relative flex-shrink-0 group"
        style={{
          width,
          height: FRAME_H,
          marginRight: FRAME_GAP,
        }}
      >
        {/* Image */}
        <div className="relative w-full h-full overflow-hidden rounded-sm">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: dominantColor }}
          />
          <img
            src={src}
            alt={gallery.title}
            loading={index < 4 ? 'eager' : 'lazy'}
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
              loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
            } group-hover:scale-[1.03]`}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
        </div>

        {/* Label beneath frame */}
        <div className="absolute -bottom-7 left-0 right-0 text-center">
          <span className="font-cormorant text-[13px] text-white/35 tracking-wide font-light">
            {gallery.title}
          </span>
        </div>
      </div>
    );
  },
);
FilmFrame.displayName = 'FilmFrame';

export default FilmStrip;
