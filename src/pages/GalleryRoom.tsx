import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { galleries } from '../data/galleries';
import { cldFull, aspectOf } from '../components/gallery/shared/cloudinaryUtils';
import { useScrollProgress } from '../components/home/useScrollProgress';
import { useNearViewport } from '../components/home/useNearViewport';
import SceneErrorBoundary from '../components/webgl/SceneErrorBoundary';
import PageTransition from '../components/PageTransition';
import BackButton from '../components/BackButton';
import type { Artwork } from '../components/gallery-room/GalleryRoomScene';

const GalleryRoomScene = React.lazy(() => import('../components/gallery-room/GalleryRoomScene'));

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * "The Gallery Room" — walk a 3D hall hung with one frame from every gallery.
 *
 * The heavy WebGL scene mounts only when the section nears the viewport and
 * then stays mounted, merely pausing its render loop when scrolled away (the
 * `active` prop drives frameloop) — tearing the canvas down on every scroll
 * leaks contexts faster than the browser frees them. A 2D caption tracks the
 * piece the camera is passing; clicking any frame steps into that gallery.
 */
const GalleryRoom: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);
  const active = useNearViewport(sectionRef, '600px');
  const navigate = useNavigate();

  const [ok, setOk] = useState(true);
  const [spawned, setSpawned] = useState(false);
  const [focused, setFocused] = useState(0);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const artworks = useMemo<Artwork[]>(
    () =>
      galleries
        .filter((g) => g.hero || g.photos[0])
        .map((g) => {
          const p = (g.hero || g.photos[0])!;
          return {
            src: p.src,
            slug: g.slug,
            title: g.title,
            region: g.location?.region,
            aspect: aspectOf(p),
          };
        }),
    [],
  );

  useEffect(() => setOk(webglAvailable()), []);
  useEffect(() => {
    if (active) setSpawned(true);
  }, [active]);

  // Warm the print textures from page mount so the first walk shows real photos.
  useEffect(() => {
    const warm = artworks.map((a) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.src = cldFull(a.src, 820);
      img.decode?.().catch(() => {});
      return img;
    });
    return () => warm.forEach((img) => (img.src = ''));
  }, [artworks]);

  const onFocus = useCallback((i: number) => setFocused(i), []);
  const onSelect = useCallback(
    (i: number) => navigate(`/photography/${artworks[i].slug}`),
    [artworks, navigate],
  );

  const introOpacity = useTransform(progress, [0, 0.05], [1, 0]);
  const introY = useTransform(progress, [0, 0.05], [0, -28]);
  const captionOpacity = useTransform(progress, [0.035, 0.075], [0, 1]);

  // The hall now switchbacks, so give the walk a little more scroll to breathe.
  const pageVh = Math.min(1000, Math.max(420, artworks.length * 24));
  const current = artworks[focused];

  const poster = (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#08080a]">
      {artworks[0] && (
        <img
          src={cldFull(artworks[0].src, 1600)}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative text-center">
        <h1 className="font-cormorant text-5xl font-light text-white md:text-7xl">The Gallery Room</h1>
        <p className="mt-4 font-cormorant text-lg italic text-white/60">
          A hall best walked with WebGL &mdash; explore the work in the{' '}
          <Link to="/photography" className="underline decoration-amber-400/50 hover:text-amber-300">
            galleries
          </Link>
          .
        </p>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <BackButton variant="pill" placement="bottom-center" />
      <section ref={sectionRef} className="relative" style={{ height: `${pageVh}vh` }}>
        <div
          className="sticky top-0 h-screen w-full overflow-hidden"
          style={{ background: 'radial-gradient(120% 100% at 50% 40%, #101014 0%, #08080a 72%)' }}
        >
          {ok && spawned ? (
            <SceneErrorBoundary fallback={poster}>
              <Suspense fallback={null}>
                <GalleryRoomScene
                  artworks={artworks}
                  progress={progress}
                  active={active}
                  reduce={reduce}
                  onFocus={onFocus}
                  onSelect={onSelect}
                />
              </Suspense>
            </SceneErrorBoundary>
          ) : (
            !ok && poster
          )}

          {/* cinematic edge framing */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 95% at 50% 50%, transparent 52%, rgba(0,0,0,0.6) 100%)',
            }}
          />

          {/* persistent corner label */}
          <div className="pointer-events-none absolute left-6 top-24 z-20 md:left-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-amber-500/70" />
              <span className="font-cormorant text-xs uppercase tracking-[0.4em] text-white/55">
                The Gallery Room
              </span>
            </div>
          </div>

          {/* opening title */}
          <motion.div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{ opacity: introOpacity, y: introY }}
          >
            <span className="mb-4 pl-[0.5em] font-cormorant text-[0.7rem] uppercase tracking-[0.5em] text-white/70 md:text-sm">
              An exhibition of one
            </span>
            <h1 className="font-cormorant text-5xl font-light leading-[0.95] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)] md:text-7xl lg:text-8xl">
              The Gallery
              <span className="block italic font-light">Room</span>
            </h1>
            <p className="mt-6 max-w-md font-cormorant text-base italic text-white/60 md:text-lg">
              Scroll to walk the hall. Click any frame to step inside its gallery.
            </p>
          </motion.div>

          {/* focused-piece caption */}
          <motion.div
            className="absolute inset-x-0 bottom-0 z-20 px-6 pb-10 md:px-12 md:pb-12"
            style={{ opacity: captionOpacity }}
          >
            <div className="mx-auto flex max-w-5xl items-end justify-between gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={focused}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="h-px w-7 bg-amber-500" />
                    <span className="font-cormorant text-[0.7rem] uppercase tracking-[0.32em] text-amber-300/85">
                      {String(focused + 1).padStart(2, '0')} / {String(artworks.length).padStart(2, '0')}
                      {current?.region ? ` · ${current.region}` : ''}
                    </span>
                  </div>
                  {current && (
                    <>
                      <h2 className="font-cormorant text-3xl leading-none text-white md:text-5xl">
                        {current.title}
                      </h2>
                      <Link
                        to={`/photography/${current.slug}`}
                        className="group mt-3 inline-flex items-center gap-2 font-cormorant text-sm uppercase tracking-[0.25em] text-white/70 transition-colors hover:text-amber-300"
                      >
                        Enter gallery
                        <ArrowRight
                          size={15}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </Link>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <span className="hidden shrink-0 font-cormorant text-xs uppercase tracking-[0.3em] text-white/35 md:block">
                Scroll to walk &middot; click to enter
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
};

export default GalleryRoom;
