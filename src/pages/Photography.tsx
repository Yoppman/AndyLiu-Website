import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutGrid, Rows3, Aperture } from 'lucide-react';
import { galleries } from '../data/galleries';
import PageTransition from '../components/PageTransition';
import MasonryGrid from '../components/MasonryGrid';
import { useTransition } from '../context/TransitionContext';
import { cldFull, cldSet, cldPlaceholder } from '../components/gallery/shared/cloudinaryUtils';

// Vite env flag — render tiny blurred placeholders only (perf testing).
const PLACEHOLDER_ONLY = String(import.meta.env.VITE_PLACEHOLDER_ONLY) === '1';

const totalFrames = galleries.reduce((n, g) => n + g.photos.length, 0);

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

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('photography-view') as ViewMode) || 'grid',
  );

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
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-24 md:pt-28">
        {/* Editorial header */}
        <header className="mb-12 md:mb-16">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="mb-4 flex items-center gap-4">
                <span className="h-px w-10 bg-amber-500/70" />
                <span className="font-cormorant text-xs uppercase tracking-[0.35em] text-neutral-400">
                  {galleries.length} galleries · {totalFrames.toLocaleString()} frames
                </span>
              </div>
              <h1 className="font-cormorant text-5xl text-neutral-900 md:text-6xl">Photography</h1>
            </div>

            <div className="flex shrink-0 items-center gap-4 pt-2">
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
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700">
                  beta
                </span>
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
          </div>
        </header>

        {viewMode === 'grid' ? (
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-7 lg:grid-cols-3"
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
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        alt={gallery.title}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] ${
                          PLACEHOLDER_ONLY ? 'scale-105 blur-xl' : ''
                        }`}
                        style={{ backgroundColor: preview.dominantColor }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
                      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                        <h3 className="font-cormorant text-xl leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-1 md:text-2xl">
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
    </PageTransition>
  );
};

export default Photography;
