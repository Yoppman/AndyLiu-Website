import React, { useMemo } from 'react';
import { motion, type Variants } from 'motion/react';
import { galleries } from '../data/galleries';
import { cldFull, cldSet, aspectOf } from '../components/gallery/shared/cloudinaryUtils';
import PageTransition from '../components/PageTransition';

/**
 * "The Darkroom" — watch each frame surface the slow way.
 *
 * Under a red safelight, every photograph begins as a near-black sheet and
 * develops as it enters the tray (the viewport): the wash clears, the image
 * brightens out of the shadows, the warm chemistry cools to true color, and
 * the grain — always the last to settle — resolves into focus. One frame from
 * every gallery, the whole archive coming up in the developer.
 */

// Mono film grain as an inline SVG turbulence tile — strong while developing,
// then settling to a faint, permanent tooth in the print.
const GRAIN =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E` +
  `%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E` +
  `%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E` +
  `%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`;

interface Frame {
  src: string;
  title: string;
  region?: string;
  aspect: number;
}

// The "latent → developed" choreography, orchestrated from the frame wrapper.
const DEV_EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const imageVariants: Variants = {
  latent: {
    opacity: 0,
    scale: 1.06,
    filter: 'brightness(0.08) contrast(0.55) saturate(0.2) sepia(0.7) blur(7px)',
  },
  developed: {
    opacity: [0, 0.55, 1],
    scale: [1.06, 1.02, 1],
    filter: [
      'brightness(0.08) contrast(0.55) saturate(0.2) sepia(0.7) blur(7px)',
      'brightness(0.55) contrast(0.88) saturate(0.7) sepia(0.35) blur(2.4px)',
      'brightness(1) contrast(1) saturate(1) sepia(0) blur(0px)',
    ],
    transition: { duration: 2.6, ease: DEV_EASE, times: [0, 0.55, 1] },
  },
};

const washVariants: Variants = {
  latent: { opacity: 1 },
  developed: { opacity: 0, transition: { duration: 2.1, ease: 'easeIn' } },
};

const grainVariants: Variants = {
  latent: { opacity: 0.85 },
  developed: { opacity: 0.12, transition: { duration: 2.6, ease: 'easeOut' } },
};

const captionVariants: Variants = {
  latent: { opacity: 0, y: 10 },
  developed: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut', delay: 1.7 } },
};

const Darkroom: React.FC = () => {
  // One frame per gallery — its cover is the gallery's strongest sheet.
  const frames = useMemo<Frame[]>(
    () =>
      galleries
        .filter((g) => g.hero || g.photos[0])
        .map((g) => {
          const p = (g.hero || g.photos[0])!;
          return {
            src: p.src,
            title: g.title,
            region: g.location?.region,
            aspect: aspectOf(p),
          };
        }),
    [],
  );

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-[#070605] text-[#efeae1]">
        {/* The safelight — a deep red wash bleeding from above, fixed behind it all. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              'radial-gradient(120% 75% at 50% -8%, rgba(176,30,22,0.13) 0%, rgba(120,18,14,0.05) 32%, transparent 62%)',
          }}
        />
        {/* A quiet vignette to seat the prints in the dark. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{ boxShadow: 'inset 0 0 220px 60px rgba(0,0,0,0.75)' }}
        />

        <div className="relative z-10">
          {/* ── Title plate ── */}
          <section className="flex min-h-[88vh] flex-col items-center justify-center px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: DEV_EASE }}
            >
              <div className="mb-6 flex items-center justify-center gap-4">
                <span className="h-px w-10 bg-[#d9483b]/70" />
                <span className="font-cormorant text-xs uppercase tracking-[0.45em] text-[#e9a59c]/80">
                  Under the safelight
                </span>
                <span className="h-px w-10 bg-[#d9483b]/70" />
              </div>
              <h1 className="font-cormorant text-6xl font-light leading-[0.95] md:text-8xl">
                The Darkroom
              </h1>
              <p className="mx-auto mt-7 max-w-xl font-cormorant text-lg italic text-[#efeae1]/60 [text-wrap:balance] md:text-xl">
                Nothing arrives all at once. Scroll, and let each frame come up the slow way &mdash;
                shadow first, color after, the grain last of all.
              </p>
            </motion.div>

            <motion.div
              className="mt-16 flex flex-col items-center gap-2 text-[#efeae1]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              <span className="font-cormorant text-[0.65rem] uppercase tracking-[0.35em]">
                Develop
              </span>
              <span className="block h-12 w-px bg-gradient-to-b from-[#efeae1]/40 to-transparent" />
            </motion.div>
          </section>

          {/* ── The tray ── */}
          <div className="flex flex-col items-center gap-[15vh] px-6 pb-[20vh]">
            {frames.map((f, i) => {
              const maxW = f.aspect < 1 ? 560 : 940; // verticals sit narrower
              return (
                <motion.figure
                  key={f.src + i}
                  className="relative w-full"
                  style={{ maxWidth: maxW }}
                  variants={{ latent: {}, developed: {} }}
                  initial="latent"
                  whileInView="developed"
                  viewport={{ once: true, amount: 0.32 }}
                >
                  <div className="relative overflow-hidden rounded-[2px] shadow-[0_45px_90px_-30px_rgba(0,0,0,0.85)]">
                    <motion.img
                      src={cldFull(f.src, 1200)}
                      srcSet={cldSet(f.src, [700, 1100, 1500])}
                      sizes="(max-width: 768px) 92vw, 940px"
                      alt={f.title}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="block w-full"
                      style={{ willChange: 'filter, transform, opacity' }}
                      variants={imageVariants}
                    />

                    {/* the developer wash — clears from the centre outward */}
                    <motion.div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(125% 120% at 50% 42%, #0c0a08 0%, #060504 100%)',
                      }}
                      variants={washVariants}
                    />

                    {/* grain, resolving last */}
                    <motion.div
                      aria-hidden
                      className="absolute inset-0 mix-blend-soft-light"
                      style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
                      variants={grainVariants}
                    />

                    <span className="pointer-events-none absolute inset-0 rounded-[2px] ring-1 ring-inset ring-white/[0.06]" />
                  </div>

                  <motion.figcaption
                    className="mt-4 flex items-baseline justify-between gap-4"
                    variants={captionVariants}
                  >
                    <span className="font-cormorant text-lg text-[#efeae1]/85 md:text-xl">
                      {f.title}
                    </span>
                    <span className="font-cormorant text-[0.7rem] uppercase tracking-[0.3em] text-[#efeae1]/35">
                      {f.region ? `${f.region} · ` : ''}
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </motion.figcaption>
                </motion.figure>
              );
            })}
          </div>

          {/* ── Sign-off ── */}
          <section className="border-t border-white/[0.07] py-20 text-center">
            <p className="font-cormorant text-xl italic text-[#efeae1]/55 md:text-2xl">
              Fixed, washed, and hung to dry.
            </p>
            <p className="mt-4 font-cormorant text-xs uppercase tracking-[0.4em] text-[#efeae1]/30">
              {frames.length} frames · developed by hand
            </p>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default Darkroom;
