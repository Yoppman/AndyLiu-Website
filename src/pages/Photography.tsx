import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutGrid, Rows3, Aperture, Palette, FlaskConical, Route, Frame } from 'lucide-react';
import { galleries } from '../data/galleries';
import PageTransition from '../components/PageTransition';
import MasonryGrid from '../components/MasonryGrid';
import { useTransition } from '../context/TransitionContext';
import { cldFull, cldSet, cldPlaceholder } from '../components/gallery/shared/cloudinaryUtils';
import { webglAvailable } from '../components/webgl/webglAvailable';

// The camera-intro ritual (lazy so the three.js chunk loads behind the intro's
// opening darkness). It should greet a fresh arrival at Photography, but not
// replay every time you bounce back here from a collection. This module-level
// flag is the trick: it survives in-app (SPA) navigation, so a return visit
// skips the intro — but a real browser reload re-evaluates the module and
// resets it to false, so reloading the site plays the ritual again.
const CameraIntro = lazy(() => import('../components/photography/CameraIntro'));

let introHasPlayed = false;

function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (introHasPlayed) return false; // already shown this page-load; skip on SPA returns
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return webglAvailable();
}

// Vite env flag — render tiny blurred placeholders only (perf testing).
const PLACEHOLDER_ONLY = String(import.meta.env.VITE_PLACEHOLDER_ONLY) === '1';

const totalFrames = galleries.reduce((n, g) => n + g.photos.length, 0);

// The experimental / curated sub-pages linked from the header. Desktop keeps its
// bespoke icon row (below); on mobile these render as wrapping text chips so they
// never overflow into a sideways scroll.
const SUBPAGES: { to: string; label: string }[] = [
  { to: '/photography/portraits', label: 'Portraits' },
  { to: '/photography/spectrum', label: 'Spectrum' },
  { to: '/photography/darkroom', label: 'Darkroom' },
  { to: '/photography/journey', label: 'Journey' },
  { to: '/photography/room', label: 'Room' },
];

const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 28 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

type ViewMode = 'grid' | 'masonry';

const Photography: React.FC = () => {
  const { setMorphSource } = useTransition();
  const navigate = useNavigate();

  // introActive keeps the black overlay mounted; revealed gates the page
  // content so its stagger entrance plays underneath the overlay's fade-out.
  const [introActive, setIntroActive] = useState(shouldPlayIntro);
  const [revealed, setRevealed] = useState(() => !introActive);

  // index.html pre-paints <html> black for this route so a reload never
  // flashes white before the void; hand the background back once the intro
  // no longer needs it.
  useEffect(() => {
    if (!introActive) document.documentElement.style.background = '';
  }, [introActive]);

  // Preload the first frame of the collection while the camera turns, so the
  // handoff from dissolution to photographs is instant.
  useEffect(() => {
    if (!introActive) return;
    const preview = galleries[0]?.hero || galleries[0]?.photos[0];
    if (!preview) return;
    const img = new Image();
    img.src = cldFull(preview.src, 1400);
  }, [introActive]);

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('photography-view') as ViewMode) || 'grid',
  );

  // Phones get a single, tightened layout (2-up grid); the grid/masonry toggle
  // is desktop-only, so force the grid view on small screens regardless of the
  // stored preference.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const effectiveView: ViewMode = isMobile ? 'grid' : viewMode;

  const switchView = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('photography-view', mode);
  }, []);

  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, gallery: typeof galleries[0], imageUrl: string) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      setMorphSource({ rect, imageUrl, slug: gallery.slug });
      navigate(`/photography/${gallery.slug}`);
    },
    [setMorphSource, navigate],
  );

  return (
    <PageTransition>
      {introActive && (
        <Suspense fallback={<div className="fixed inset-0 z-[200] bg-black" aria-hidden />}>
          <CameraIntro
            onRevealed={() => {
              introHasPlayed = true; // mark for this page-load so SPA returns skip it
              setRevealed(true);
            }}
            onFinished={() => setIntroActive(false)}
          />
        </Suspense>
      )}
      {revealed && (
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-6 md:pt-28">
        {/* Editorial header */}
        <header className="mb-10 md:mb-16">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-6">
            <div>
              <div className="mb-4 flex items-center gap-4">
                <span className="h-px w-10 bg-amber-500/70" />
                <span className="font-cormorant text-xs uppercase tracking-[0.35em] text-neutral-400">
                  {galleries.length} galleries · {totalFrames.toLocaleString()} frames
                </span>
              </div>
              <h1 className="font-cormorant text-4xl text-neutral-900 sm:text-5xl md:text-6xl">
                Photography
              </h1>
            </div>

            {/* Desktop controls — unchanged: icon links + view toggle */}
            <div className="hidden shrink-0 items-center gap-4 pt-2 md:flex">
              <Link
                to="/photography/portraits"
                className="group inline-flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-900"
              >
                <Aperture
                  size={16}
                  strokeWidth={1.5}
                  className="opacity-70 transition-transform duration-500 group-hover:rotate-90"
                />
                <span className="hidden font-cormorant text-base sm:inline">Portraits</span>
              </Link>
              <Link
                to="/photography/spectrum"
                className="group inline-flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-900"
              >
                <Palette
                  size={16}
                  strokeWidth={1.5}
                  className="opacity-70 transition-transform duration-500 group-hover:rotate-12"
                />
                <span className="hidden font-cormorant text-base sm:inline">Spectrum</span>
              </Link>
              <Link
                to="/photography/darkroom"
                className="group inline-flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-900"
              >
                <FlaskConical
                  size={16}
                  strokeWidth={1.5}
                  className="opacity-70 transition-transform duration-500 group-hover:-rotate-12"
                />
                <span className="hidden font-cormorant text-base sm:inline">Darkroom</span>
              </Link>
              <Link
                to="/photography/journey"
                className="group inline-flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-900"
              >
                <Route
                  size={16}
                  strokeWidth={1.5}
                  className="opacity-70 transition-transform duration-500 group-hover:translate-x-0.5"
                />
                <span className="hidden font-cormorant text-base sm:inline">Journey</span>
              </Link>
              <Link
                to="/photography/room"
                className="group inline-flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-900"
              >
                <Frame
                  size={16}
                  strokeWidth={1.5}
                  className="opacity-70 transition-transform duration-500 group-hover:scale-110"
                />
                <span className="hidden font-cormorant text-base sm:inline">Room</span>
              </Link>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => switchView('grid')}
                  className={`rounded-md p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-neutral-200/60 text-neutral-900'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => switchView('masonry')}
                  className={`rounded-md p-2 transition-colors ${
                    viewMode === 'masonry'
                      ? 'bg-neutral-200/60 text-neutral-900'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                  aria-label="Masonry view"
                  title="Masonry view"
                >
                  <Rows3 size={18} />
                </button>
              </div>
            </div>

            {/* Mobile controls — wrapping text chips, no sideways scroll, no toggle */}
            <nav className="flex flex-wrap gap-2 md:hidden">
              {SUBPAGES.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white/70 px-3 py-1.5 font-cormorant text-sm text-neutral-700 active:bg-neutral-100"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {effectiveView === 'grid' ? (
          <motion.div
            className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 md:gap-7 lg:grid-cols-3"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {galleries.map((gallery) => {
              const preview = gallery.hero || gallery.photos[0];
              const imageUrl = PLACEHOLDER_ONLY
                ? cldPlaceholder(preview.src)
                : cldFull(preview.src, 1400);
              return (
                <motion.div key={gallery.slug} variants={itemVariants}>
                  <Link
                    to={`/photography/${gallery.slug}`}
                    className="block"
                    onClick={(e) => handleCardClick(e, gallery, imageUrl)}
                  >
                    <article className="group relative aspect-[4/3] overflow-hidden rounded-[3px] shadow-md transition-shadow duration-500 hover:shadow-2xl">
                      <img
                        src={imageUrl}
                        srcSet={PLACEHOLDER_ONLY ? undefined : cldSet(preview.src, [700, 1100, 1500])}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                        alt={gallery.title}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04] ${
                          PLACEHOLDER_ONLY ? 'scale-105 blur-xl' : ''
                        }`}
                        style={{ backgroundColor: preview.dominantColor }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
                      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 md:p-6">
                        <h3 className="font-cormorant text-base leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-1 sm:text-xl md:text-2xl">
                          {gallery.title}
                        </h3>
                        <p className="mt-1 translate-y-1 font-cormorant text-xs uppercase tracking-[0.25em] text-white/70 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                          {gallery.location?.region ? `${gallery.location.region} · ` : ''}
                          {gallery.photos.length} frames
                        </p>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <MasonryGrid galleries={galleries} onCardClick={handleCardClick} />
        )}
      </div>
      )}
    </PageTransition>
  );
};

export default Photography;
