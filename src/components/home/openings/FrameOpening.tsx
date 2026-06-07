import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cldFull, cldSet } from '../../gallery/shared/cloudinaryUtils';

/**
 * Opening · "The Frame"
 * ---------------------
 * Gallery-wall restraint. One full-bleed photograph at a time, a slow
 * cross-dissolve between them, immense negative space. The literary line is
 * set like a museum placard; the place + coordinates beneath it change with
 * each frame — a quiet thread to the atlas of where the work was made.
 *
 * No WebGL — images + transforms only.
 */

interface Frame {
  src: string;
  place: string;
  coords: string;
}

// A hand-curated overture of wide frames (coords are the gallery locations).
const FRAMES: Frame[] = [
  {
    src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1748512319/joshuatree/dsc04025.jpg',
    place: 'Joshua Tree',
    coords: "33.87°N 115.90°W",
  },
  {
    src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751191521/pachecopass/dsc05989.jpg',
    place: 'Pacheco Pass',
    coords: "37.05°N 121.23°W",
  },
  {
    src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751189805/sanfrancisco/dsc06577.jpg',
    place: 'San Francisco',
    coords: "37.77°N 122.42°W",
  },
  {
    src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751190522/halfmoonbay/dsc06220.jpg',
    place: 'Half Moon Bay',
    coords: "37.46°N 122.43°W",
  },
  {
    src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747703401/LagunaBeach/dsc03805.jpg',
    place: 'Laguna Beach',
    coords: "33.54°N 117.78°W",
  },
];

const GRAIN =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>";

const DWELL = 6200; // ms each frame holds before the dissolve

const FrameOpening: React.FC = () => {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [i, setI] = useState(0);

  // Auto-advance (paused for reduced motion).
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setI((p) => (p + 1) % FRAMES.length), DWELL);
    return () => window.clearInterval(id);
  }, [reduce]);

  // Warm every frame so the dissolve never waits on a download.
  useEffect(() => {
    const imgs = FRAMES.map((f) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = cldFull(f.src, 2200);
      return img;
    });
    return () => imgs.forEach((img) => (img.src = ''));
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0a0a0b]">
      {/* Stacked frames; only the active one is opaque */}
      {FRAMES.map((f, idx) => (
        <motion.div
          key={f.src}
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: idx === i ? 1 : 0 }}
          transition={{ duration: 1.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.img
            src={cldFull(f.src, 2200)}
            srcSet={cldSet(f.src, [1280, 2200, 2800])}
            sizes="100vw"
            alt=""
            draggable={false}
            className="w-full h-full object-cover select-none"
            initial={false}
            animate={{ scale: idx === i && !reduce ? 1.06 : 1 }}
            transition={{ duration: (DWELL + 1700) / 1000, ease: 'linear' }}
          />
        </motion.div>
      ))}

      {/* Legibility scrims */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 38%, transparent 62%), linear-gradient(to bottom, rgba(0,0,0,0.40), transparent 22%)',
        }}
      />

      {/* Scoped film grain */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.10]"
        style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: '170px 170px' }}
      />

      {/* Eyebrow (clears the fixed header) */}
      <div className="absolute left-0 top-0 px-8 md:px-14 pt-28">
        <span className="font-cormorant tracking-[0.5em] uppercase text-[#efeae1]/55 text-[0.65rem] md:text-xs pl-[0.5em]">
          Photographer &middot; Travel &amp; Street
        </span>
      </div>

      {/* The placard */}
      <div className="absolute left-0 bottom-0 px-8 md:px-14 pb-12 md:pb-16 max-w-2xl">
        <p className="font-cormorant italic font-light text-[#efeae1]/75 text-base md:text-xl mb-3">
          In every hidden corner of the earth&thinsp;&mdash;
        </p>
        <h1 className="font-cormorant font-light text-[#efeae1] text-4xl md:text-6xl leading-[1.05]">
          I honor the story <span className="italic font-extralight">behind the scene.</span>
        </h1>
        <div className="mt-6 flex items-center gap-4">
          <span className="h-px w-10 bg-[#efeae1]/30" />
          <AnimatePresence mode="wait">
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5 }}
              className="font-cormorant tracking-[0.32em] uppercase text-[#efeae1]/65 text-[0.65rem] md:text-xs"
            >
              {FRAMES[i].place}&nbsp;&middot;&nbsp;{FRAMES[i].coords}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Frame indicators — the current one fills like a timer */}
      <div className="absolute right-8 md:right-14 bottom-14 flex items-center gap-2.5">
        {FRAMES.map((f, idx) => (
          <button
            key={f.src}
            onClick={() => setI(idx)}
            aria-label={`View ${f.place}`}
            className="relative h-px w-8 bg-[#efeae1]/25"
          >
            {idx < i && <span className="absolute inset-0 bg-[#efeae1]/80" />}
            {idx === i && (
              <motion.span
                key={i}
                className="absolute inset-0 origin-left bg-[#efeae1]"
                initial={{ scaleX: reduce ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduce ? 0 : DWELL / 1000, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#efeae1]/55">
        <span className="font-cormorant tracking-[0.3em] text-[0.65rem] uppercase">Scroll</span>
        <span className="block h-10 w-px bg-gradient-to-b from-[#efeae1]/55 to-transparent" />
      </div>
    </section>
  );
};

export default FrameOpening;
